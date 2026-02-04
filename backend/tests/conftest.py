import aiosqlite
import pathlib
import sys

import pytest_asyncio
from httpx import AsyncClient, ASGITransport

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from app.db.database import SCHEMA
from app.main import app


@pytest_asyncio.fixture
async def db():
    db = await aiosqlite.connect(":memory:")
    db.row_factory = aiosqlite.Row
    await db.executescript(SCHEMA)
    await db.commit()
    try:
        yield db
    finally:
        await db.close()


@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
