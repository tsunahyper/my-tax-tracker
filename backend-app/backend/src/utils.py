from pathlib import Path as PathLib

from config import receipt_db


def parse_textract_expense(response):
    # This is a basic example. You can extract more fields as needed.
    summary_fields = {}
    try:
        for doc in response.get("ExpenseDocuments", []):
            for field in doc.get("SummaryFields", []):
                label = field.get("LabelDetection", {}).get("Text", "")
                value = field.get("ValueDetection", {}).get("Text", "")
                if label and value:
                    summary_fields[label] = value
    except Exception as e:
        print(f"Error parsing Textract response: {e}")
    return summary_fields


def get_unique_filename(username: str, original_filename: str) -> str:
    """
    Generate a unique filename by checking if it exists in the database.
    If it exists, append (1), (2), etc. until a unique name is found.
    """
    # Get the base name and extension
    path_obj = PathLib(original_filename)
    base_name = path_obj.stem  # filename without extension
    extension = path_obj.suffix  # extension with dot

    # Check if the original filename exists for this user
    response = receipt_db.scan(
        FilterExpression="receipt_username = :username AND receipt_filename = :filename",
        ExpressionAttributeValues={
            ":username": username,
            ":filename": original_filename,
        },
    )

    if not response.get("Items"):
        # Original filename doesn't exist, use it as is
        return original_filename

    # Original filename exists, find the next available number
    counter = 1
    while True:
        new_filename = f"{base_name}({counter}){extension}"

        # Check if this new filename exists
        response = receipt_db.scan(
            FilterExpression="receipt_username = :username AND receipt_filename = :filename",
            ExpressionAttributeValues={
                ":username": username,
                ":filename": new_filename,
            },
        )

        if not response.get("Items"):
            # This filename is available
            return new_filename

        counter += 1
