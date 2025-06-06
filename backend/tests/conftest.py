import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    """
    Create a test client for the FastAPI application.
    """
    with TestClient(app) as client:
        yield client
