import os
import pathlib
import sys

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@127.0.0.1:5433/claims_app_test",
)
os.environ["TEST_DATABASE_URL"] = TEST_DATABASE_URL
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from app.db.database import close_db, get_engine, init_db, truncate_all_tables
from app.main import app


@pytest_asyncio.fixture(autouse=True)
async def prepared_database():
    await close_db()
    await init_db()
    async with get_engine().connect() as connection:
        await truncate_all_tables(connection)
    yield
    await close_db()


@pytest_asyncio.fixture
async def db(prepared_database):
    async with get_engine().connect() as connection:
        yield connection


@pytest_asyncio.fixture
async def async_client(prepared_database):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
