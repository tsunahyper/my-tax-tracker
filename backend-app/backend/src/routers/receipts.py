import io
import uuid
from datetime import datetime

from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, Depends, File, HTTPException, Path, Query, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse

from config import get_current_user, receipt_bucket, receipt_db, receipt_textract
from models.receipts import ReceiptStatusUpdate, ReceiptUpdate
from utils import get_unique_filename, parse_textract_expense

receipts_router = APIRouter(prefix="/receipts")


@receipts_router.post("/upload")
async def upload_receipts(file: UploadFile = File(...), user=Depends(get_current_user)):
    # Generate unique filename
    unique_filename = get_unique_filename(user["username"], file.filename)

    # Use the unique filename for S3 key
    s3_key = f"receipts/{user['username']}/{unique_filename}"

    # Calculate file size
    file.file.seek(0, 2)  # Move to end of file
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to start

    receipt_bucket.upload_fileobj(file.file, s3_key)

    # Call Textract to extract text from the uploaded receipt
    response = receipt_textract.analyze_expense(Document={"S3Object": {"Bucket": receipt_bucket.name, "Name": s3_key}})
    extracted_data = parse_textract_expense(response)
    upload_datetime = datetime.now().isoformat()

    item = {
        "receipt_username": user["username"],
        "receipt_id": str(uuid.uuid4()),
        "receipt_s3_path": s3_key,
        "receipt_filename": unique_filename,  # Store the unique filename
        "receipt_status": "pending",
        "receipt_upload_datetime": upload_datetime,
        "receipt_size": file_size,
        "textract_data": extracted_data,
    }
    receipt_db.put_item(Item=item)

    return JSONResponse(
        {
            "message": "File uploaded and processed",
            "s3_key": s3_key,
            "extracted": extracted_data,
            "receipt_size": file_size,
            "original_filename": file.filename,
            "stored_filename": unique_filename,
            "filename_changed": file.filename != unique_filename,
        }
    )


@receipts_router.get("/view")
async def view_receipts(
    user=Depends(get_current_user),
    year: int = Query(None, description="Year to filter receipts (e.g., 2024)"),
    month: int = Query(None, description="Month to filter receipts (1-12)"),
    day: int = Query(None, description="Day to filter receipts (1-31)"),
):
    # Build the date prefix for filtering
    date_prefix = None
    if year and month and day:
        date_prefix = f"{year:04d}-{month:02d}-{day:02d}"
    elif year and month:
        date_prefix = f"{year:04d}-{month:02d}"
    elif year:
        date_prefix = f"{year:04d}"

    key_expr = Key("receipt_username").eq(user["username"])
    if date_prefix:
        key_expr = key_expr & Key("receipt_upload_datetime").begins_with(date_prefix)

    response = receipt_db.query(KeyConditionExpression=key_expr)
    items = response.get("Items", [])
    items.sort(key=lambda x: str(x.get("receipt_upload_datetime", "")), reverse=True)
    return items


@receipts_router.post("/status")
async def update_status(data: ReceiptStatusUpdate, user=Depends(get_current_user)):
    response = receipt_db.update_item(
        Key={"receipt_username": user["username"], "receipt_id": data.receipt_id},
        UpdateExpression="SET receipt_status = :new_status",
        ExpressionAttributeValues={":new_status": data.new_status},
        ReturnValues="UPDATED_NEW",
    )
    return {"message": "Status updated", "attributes": response.get("Attributes", {})}


@receipts_router.get("/total-claims")
async def total_claims(
    user=Depends(get_current_user),
    year: int = Query(..., description="Year to filter receipts (e.g., 2025)"),
):
    # Scan all receipts for the user
    response = receipt_db.scan(
        FilterExpression="receipt_username = :username",
        ExpressionAttributeValues={":username": user["username"]},
    )
    items = response.get("Items", [])

    total = 0.0

    normalized_total_keys = {"TOTAL", "AMOUNT", "GRANDTOTAL", "TOTALTOPAY"}

    chars_to_remove = ["=", ":", "-", "$", ".", ",", " "]

    for item in items:
        # Filter by year
        upload_datetime = item.get("receipt_upload_datetime", "")
        if not upload_datetime.startswith(str(year)):
            continue

        textract_data: dict = item.get("textract_data", {})

        claim_str = None

        for textract_key, value in textract_data.items():
            cleaned_textract_key = str(textract_key).upper()  # Start with uppercase
            for char_to_remove in chars_to_remove:
                cleaned_textract_key = cleaned_textract_key.replace(char_to_remove, "")
            cleaned_textract_key = cleaned_textract_key.strip()

            if cleaned_textract_key in normalized_total_keys:
                claim_str = value

        if claim_str:
            try:
                cleaned_value_str = str(claim_str).replace(",", "").replace("$", "").strip()
                claim_value = float(cleaned_value_str)
                total += claim_value
            except ValueError:
                print(f"Could not convert '{claim_str}' to float for item ID: {item.get('receipt_id', 'N/A')}. Skipping.")
                continue
            except Exception as e:
                print(f"Unexpected error processing claim value '{claim_str}': {e} for item ID: {item.get('receipt_id', 'N/A')}. Skipping.")
                continue

    return {"year": year, "total_claims": total, "num_receipts": len(items)}


@receipts_router.get("/view/{receipt_id}")
async def view_receipt(
    user=Depends(get_current_user),
    receipt_id: str = Path(..., description="The ID of the receipt to view"),
):
    """
    Fetch specific receipt details by receipt ID.
    Returns the complete receipt metadata including extracted textract data.
    """
    try:
        response = receipt_db.get_item(Key={"receipt_username": user["username"], "receipt_id": receipt_id})

        receipt_item = response.get("Item")
        if not receipt_item:
            raise HTTPException(status_code=404, detail="Receipt not found")

        # Return the complete receipt data
        return {
            "receipt_id": receipt_item.get("receipt_id"),
            "receipt_filename": receipt_item.get("receipt_filename"),
            "receipt_status": receipt_item.get("receipt_status"),
            "receipt_upload_datetime": receipt_item.get("receipt_upload_datetime"),
            "receipt_size": receipt_item.get("receipt_size"),
            "textract_data": receipt_item.get("textract_data", {}),
            "image_url": f"/receipts/image/{receipt_id}",  # URL to fetch the actual image
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Error fetching receipt details: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving receipt details")


@receipts_router.put("/update/{receipt_id}")
async def update_receipt(
    receipt_id: str = Path(..., description="The ID of the receipt to update"),
    data: ReceiptUpdate = None,
    user=Depends(get_current_user),
):
    """
    Update receipt details including status and textract data.
    Only the fields provided in the request will be updated.
    """
    if data is None:
        raise HTTPException(status_code=400, detail="No update data provided")

    # First verify the receipt exists and belongs to the user
    try:
        response = receipt_db.get_item(Key={"receipt_username": user["username"], "receipt_id": receipt_id})

        receipt_item = response.get("Item")
        if not receipt_item:
            raise HTTPException(status_code=404, detail="Receipt not found")

        # Build update expression and attribute values
        update_parts = []
        expression_attr_values = {}
        expression_attr_names = {}

        # Handle status update
        if data.receipt_status is not None:
            update_parts.append("#status = :status")
            expression_attr_names["#status"] = "receipt_status"
            expression_attr_values[":status"] = data.receipt_status

        # Handle textract data update
        if data.textract_data is not None:
            update_parts.append("#textract = :textract")
            expression_attr_names["#textract"] = "textract_data"
            expression_attr_values[":textract"] = data.textract_data

        if not update_parts:
            raise HTTPException(status_code=400, detail="No valid fields to update")

        # Construct the update expression
        update_expression = "SET " + ", ".join(update_parts)

        # Perform the update
        response = receipt_db.update_item(
            Key={"receipt_username": user["username"], "receipt_id": receipt_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attr_values,
            ExpressionAttributeNames=expression_attr_names,
            ReturnValues="ALL_NEW",
        )

        updated_item = response.get("Attributes", {})

        return {
            "message": "Receipt updated successfully",
            "receipt_id": receipt_id,
            "updated_fields": {
                "receipt_status": updated_item.get("receipt_status"),
                "textract_data": updated_item.get("textract_data"),
            },
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Error updating receipt: {e}")
        raise HTTPException(status_code=500, detail="Error updating receipt details")


@receipts_router.get("/image/{receipt_id}")
async def get_receipt_image(
    user=Depends(get_current_user),
    receipt_id: str = Path(..., description="The ID of the receipt to view"),
):
    # First, get the receipt metadata to verify ownership and get S3 path
    response = receipt_db.get_item(Key={"receipt_username": user["username"], "receipt_id": receipt_id})

    receipt_item = response.get("Item")
    if not receipt_item:
        raise HTTPException(status_code=404, detail="Receipt not found")

    # Get the S3 path from the receipt
    s3_key = receipt_item.get("receipt_s3_path")
    if not s3_key:
        raise HTTPException(status_code=404, detail="Receipt image not found")

    try:
        # Get the file from S3
        s3_object = receipt_bucket.Object(s3_key)
        file_stream = s3_object.get()["Body"].read()

        # Determine content type based on file extension
        filename = receipt_item.get("receipt_filename", "")
        content_type = "image/jpeg"  # default
        if filename.lower().endswith(".png"):
            content_type = "image/png"
        elif filename.lower().endswith(".gif"):
            content_type = "image/gif"
        elif filename.lower().endswith(".webp"):
            content_type = "image/webp"

        # Return the image as a streaming response
        return StreamingResponse(
            io.BytesIO(file_stream),
            media_type=content_type,
            headers={"Content-Disposition": f"inline; filename={filename}"},
        )

    except Exception as e:
        print(f"Error retrieving image from S3: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving receipt image")


@receipts_router.delete("/delete/{receipt_id}")
async def delete_receipt(
    receipt_id: str = Path(..., description="The ID of the receipt to delete"),
    user=Depends(get_current_user),
):
    """
    Delete a receipt completely - removes from S3 and DynamoDB.
    If S3 path is missing, only deletes the database record.
    """
    try:
        # First, get the receipt metadata to verify ownership and get S3 path
        response = receipt_db.get_item(Key={"receipt_username": user["username"], "receipt_id": receipt_id})

        receipt_item = response.get("Item")
        if not receipt_item:
            raise HTTPException(status_code=404, detail="Receipt not found")

        # Get the S3 path from the receipt
        s3_key = receipt_item.get("receipt_s3_path")
        deleted_s3_key = None

        # Delete from S3 if path exists
        if s3_key:
            try:
                s3_object = receipt_bucket.Object(s3_key)
                s3_object.delete()
                deleted_s3_key = s3_key
                print(f"Successfully deleted S3 object: {s3_key}")
            except Exception as s3_error:
                print(f"Error deleting from S3: {s3_error}")
                # Continue with database deletion even if S3 deletion fails
                # This prevents orphaned database records
        else:
            print(f"No S3 path found for receipt {receipt_id}, skipping S3 deletion")

        # Delete from DynamoDB
        try:
            receipt_db.delete_item(Key={"receipt_username": user["username"], "receipt_id": receipt_id})
            print(f"Successfully deleted receipt from database: {receipt_id}")
        except Exception as db_error:
            print(f"Error deleting from database: {db_error}")
            raise HTTPException(status_code=500, detail="Error deleting receipt from database")

        return {
            "message": "Receipt deleted successfully",
            "receipt_id": receipt_id,
            "deleted_s3_key": deleted_s3_key,
            "deleted_filename": receipt_item.get("receipt_filename"),
            "s3_deletion_status": "completed" if deleted_s3_key else "skipped_no_path",
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Error deleting receipt: {e}")
        raise HTTPException(status_code=500, detail="Error deleting receipt")
