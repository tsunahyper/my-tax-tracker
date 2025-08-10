def extract_total(textract_data: dict) -> float:
    # List of possible keys that could represent the total
    possible_keys = [
        "Total to Pay",
        "TOTAL",
        "=TOTAL:",
        "Total",
        "VISA",
        "Net Subtotal",
        "SUBTOTAL",
    ]
    for key in possible_keys:
        for k in textract_data.keys():
            if key.lower().replace(" ", "") in k.lower().replace(" ", ""):
                value = textract_data[k]
                # Remove currency symbols and spaces
                value = value.replace("RM", "").replace("$", "").replace(":", "").replace(" ", "")
                try:
                    return float(value)
                except Exception:
                    continue
    return 0.0


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
