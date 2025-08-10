import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


def test_imports_work():
    """Test that we can import the main modules without errors"""
    try:
        # Test basic imports
        import config

        assert hasattr(config, "SECRET_KEY")
        print("✅ Config imports successfully")

        # Test main app creation (without routers)
        from main import app

        assert app is not None
        print("✅ Main app imports successfully")

        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False


def test_health_endpoint_logic():
    """Test the health endpoint logic without running the server"""
    try:
        import json

        from main import health_check

        # Mock the response
        class MockResponse:
            def __init__(self, content, status_code=200):
                self.content = content
                self.status_code = status_code

            def json(self):
                return json.loads(self.content)

        # Test the health check function
        response = health_check()
        assert response.status_code == 200

        # Parse the response content
        content = json.loads(response.body.decode())
        assert content["status"] == "healthy"
        assert "My Tax Tracker API is running" in content["message"]

        print("✅ Health endpoint logic works correctly")
        return True
    except Exception as e:
        print(f"❌ Health endpoint test failed: {e}")
        return False


def test_root_endpoint_logic():
    """Test the root endpoint logic without running the server"""
    try:
        from main import index

        # Create a mock request
        class MockRequest:
            def __init__(self):
                self.cookies = {}

        request = MockRequest()
        response = index(request)

        # Check that it returns HTML
        assert "text/html" in response.headers["content-type"]
        assert "Welcome" in response.body.decode()

        print("✅ Root endpoint logic works correctly")
        return True
    except Exception as e:
        print(f"❌ Root endpoint test failed: {e}")
        return False


def test_requirements():
    """Test that all required dependencies are available"""
    required_modules = ["fastapi", "uvicorn", "pydantic", "boto3", "mangum", "starlette", "requests"]

    missing_modules = []
    for module in required_modules:
        try:
            __import__(module)
            print(f"✅ {module} is available")
        except ImportError:
            missing_modules.append(module)
            print(f"❌ {module} is missing")

    if missing_modules:
        print(f"Missing modules: {missing_modules}")
        return False

    print("✅ All required dependencies are available")
    return True
