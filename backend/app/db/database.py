"""PostgreSQL connection management, migrations, and query helpers."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncGenerator, Mapping

from alembic import command
from alembic.config import Config as AlembicConfig
from sqlalchemy import text
from sqlalchemy.engine import RowMapping
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine, create_async_engine

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_engine: AsyncEngine | None = None
_init_lock = asyncio.Lock()
_is_initialized = False

BOOTSTRAP_LOCK_ID = 941_205
APP_TABLES = [
    "claim_audit_log",
    "claim_decisions",
    "ai_assessments",
    "claims",
    "handlers",
    "policies",
    "vehicles",
    "saved_scenarios",
]

DEMO_HANDLERS = [
    {
        "id": "handler-001",
        "name": "Alice Johnson",
        "email": "alice@contoso.com",
        "is_active": True,
    },
    {
        "id": "handler-002",
        "name": "Bob Smith",
        "email": "bob@contoso.com",
        "is_active": True,
    },
    {
        "id": "handler-003",
        "name": "Carol Williams",
        "email": "carol@contoso.com",
        "is_active": True,
    },
    {
        "id": "system",
        "name": "Auto Approver",
        "email": "system@contoso.com",
        "is_active": False,
    },
]


def get_engine() -> AsyncEngine:
    """Return the shared async SQLAlchemy engine."""
    global _engine

    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(
            settings.database_url,
            pool_pre_ping=True,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
        )

    return _engine


def _get_alembic_config() -> AlembicConfig:
    backend_root = Path(__file__).resolve().parents[2]
    config = AlembicConfig(str(backend_root / "alembic.ini"))
    config.set_main_option("script_location", str(backend_root / "migrations"))
    config.set_main_option("sqlalchemy.url", get_settings().database_url)
    return config


def _run_alembic_upgrade() -> None:
    command.upgrade(_get_alembic_config(), "head")


async def seed_demo_handlers(connection: AsyncConnection) -> None:
    """Ensure demo handlers exist for workbench flows."""
    payload = [
        {
            **handler,
            "created_at": datetime.now(timezone.utc),
        }
        for handler in DEMO_HANDLERS
    ]
    await connection.execute(
        text(
            """
            INSERT INTO handlers (id, name, email, is_active, created_at)
            VALUES (:id, :name, :email, :is_active, :created_at)
            ON CONFLICT (id) DO NOTHING
            """
        ),
        payload,
    )
    await connection.commit()


async def init_db() -> None:
    """Run migrations and seed baseline data exactly once per process."""
    global _is_initialized

    if _is_initialized:
        return

    async with _init_lock:
        if _is_initialized:
            return

        engine = get_engine()
        logger.info("Initializing PostgreSQL database")
        async with engine.connect() as connection:
            await connection.execute(
                text("SELECT pg_advisory_lock(:lock_id)"),
                {"lock_id": BOOTSTRAP_LOCK_ID},
            )
            try:
                await asyncio.to_thread(_run_alembic_upgrade)
                await seed_demo_handlers(connection)
            finally:
                await connection.execute(
                    text("SELECT pg_advisory_unlock(:lock_id)"),
                    {"lock_id": BOOTSTRAP_LOCK_ID},
                )
                await connection.commit()

        _is_initialized = True
        logger.info("Database initialized successfully")


async def get_db() -> AsyncGenerator[AsyncConnection, None]:
    """Yield a PostgreSQL connection for request-scoped work."""
    await init_db()
    async with get_engine().connect() as connection:
        yield connection


@asynccontextmanager
async def get_db_connection() -> AsyncGenerator[AsyncConnection, None]:
    """Context manager around a PostgreSQL connection."""
    await init_db()
    async with get_engine().connect() as connection:
        yield connection


async def fetch_one(
    connection: AsyncConnection,
    query: str,
    params: Mapping[str, Any] | None = None,
) -> RowMapping | None:
    """Execute a text query and return a single row mapping."""
    result = await connection.execute(text(query), params or {})
    return result.mappings().one_or_none()


async def fetch_all(
    connection: AsyncConnection,
    query: str,
    params: Mapping[str, Any] | None = None,
) -> list[RowMapping]:
    """Execute a text query and return all rows as mappings."""
    result = await connection.execute(text(query), params or {})
    return list(result.mappings().all())


async def truncate_all_tables(connection: AsyncConnection) -> None:
    """Reset application tables between integration tests."""
    await connection.execute(
        text(
            "TRUNCATE TABLE "
            + ", ".join(APP_TABLES)
            + " RESTART IDENTITY CASCADE"
        )
    )
    await connection.commit()
    await seed_demo_handlers(connection)


async def close_db() -> None:
    """Dispose the shared SQLAlchemy engine."""
    global _engine, _is_initialized

    if _engine is not None:
        await _engine.dispose()
        _engine = None

    _is_initialized = False
    logger.info("Database connection closed")
