import os
import sys

import pytest
from fastapi.testclient import TestClient

from main import app

# Add the project root to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Mock authentication headers for testing protected endpoints"""
    return {"Authorization": "Bearer test-token"}
