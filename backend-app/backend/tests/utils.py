from typing import Any, Dict


def create_test_receipt() -> Dict[str, Any]:
    """Create a test receipt data structure"""
    return {
        "amount": 100.50,
        "description": "Test receipt",
        "date": "2024-01-01",
        "category": "food",
    }


def assert_response_structure(response_data: Dict[str, Any], expected_keys: list):
    """Assert that response has expected structure"""
    for key in expected_keys:
        assert key in response_data, f"Missing key: {key}"
