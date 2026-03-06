import pytest
from sqlalchemy import text

from app.db.database import get_engine, init_db


@pytest.mark.asyncio
async def test_init_db_is_idempotent():
    await init_db()
    await init_db()

    async with get_engine().connect() as connection:
        result = await connection.execute(
            text("SELECT COUNT(*) AS count FROM handlers"),
        )
        handler_count = result.scalar_one()

        result = await connection.execute(
            text("SELECT COUNT(*) AS count FROM policies"),
        )
        policy_count = result.scalar_one()

    assert handler_count == 4
    assert policy_count == 0
