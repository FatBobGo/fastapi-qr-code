import pytest
from fastapi.testclient import TestClient
from src.app.main import app
from src.app.core.database import init_db
import os


@pytest.fixture
def client():
    # Setup: Initialize DB
    init_db()

    with TestClient(app) as c:
        yield c

    # Teardown: Remove DB file
    if os.path.exists("stats.db"):
        os.remove("stats.db")
