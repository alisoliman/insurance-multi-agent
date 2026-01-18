"""
SQLite database connection and initialization for scenario persistence.

Based on data-model.md from specs/004-ai-demo-examples/
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

import aiosqlite

logger = logging.getLogger(__name__)

# Database file location - use data directory relative to backend
DB_DIR = Path(__file__).parent.parent / "data"
DB_PATH = DB_DIR / "scenarios.db"

# SQL schema for saved_scenarios table
SCHEMA = """
CREATE TABLE IF NOT EXISTS saved_scenarios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    locale TEXT NOT NULL,
    claim_type TEXT NOT NULL,
    complexity TEXT NOT NULL,
    scenario_data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_scenarios_locale ON saved_scenarios(locale);
CREATE INDEX IF NOT EXISTS idx_scenarios_claim_type ON saved_scenarios(claim_type);
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON saved_scenarios(created_at DESC);
"""


async def init_db() -> None:
    """Initialize the database and create tables if they don't exist."""
    # Ensure data directory exists
    DB_DIR.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Initializing SQLite database at {DB_PATH}")
    
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(SCHEMA)
        await db.commit()
    
    logger.info("Database initialized successfully")


async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    """
    Get an async database connection.
    
    Usage:
        async for db in get_db():
            cursor = await db.execute("SELECT * FROM saved_scenarios")
            rows = await cursor.fetchall()
    """
    if not DB_PATH.exists():
        await init_db()
    
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()


@asynccontextmanager
async def get_db_connection() -> AsyncGenerator[aiosqlite.Connection, None]:
    """
    Context manager for database connections.
    
    Usage:
        async with get_db_connection() as db:
            cursor = await db.execute("SELECT * FROM saved_scenarios")
            rows = await cursor.fetchall()
    """
    if not DB_PATH.exists():
        await init_db()
    
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()


async def close_db() -> None:
    """Close the database connection pool (no-op for SQLite, but useful for testing)."""
    logger.info("Database connection closed")


# Initialize database on module import if DB_PATH doesn't exist
def ensure_db_exists() -> None:
    """Ensure the database file and tables exist (sync wrapper for startup)."""
    import asyncio
    
    if not DB_PATH.exists():
        asyncio.get_event_loop().run_until_complete(init_db())
