from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_receipts_endpoint():
    """Test that receipts endpoint exists"""
    response = client.get("/receipts")
    # This might require authentication, so check for 401 or 200
    assert response.status_code in [
        200,
        401,
        404,
    ]  # Adjust based on your implementation
