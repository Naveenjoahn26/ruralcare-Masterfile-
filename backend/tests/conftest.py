import pytest
import os
import sys
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure backend root is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import app.database.session as db_session_module
from app.database.base import Base
from app.main import app
from fastapi.testclient import TestClient
from seed.import_csv import seed_database

# Create a temporary sqlite file for the test run
test_db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
TEST_DB_URL = f"sqlite:///{test_db_file.name}"

test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    db_session_module.engine = test_engine
    db_session_module.SessionLocal = TestingSessionLocal

    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))

    # Seed data directly into test database
    seed_database(
        target_engine=test_engine,
        target_session_local=TestingSessionLocal,
        data_dir=data_dir,
        reset=True,
    )

    yield

    test_db_file.close()
    # Ensure engine disposes any file handles (Windows can keep temp DB locked)
    try:
        test_engine.dispose()
    except Exception:
        pass
    if os.path.exists(test_db_file.name):
        try:
            os.unlink(test_db_file.name)
        except PermissionError:
            # If still locked on Windows, leave it for OS cleanup
            pass


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[db_session_module.get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
