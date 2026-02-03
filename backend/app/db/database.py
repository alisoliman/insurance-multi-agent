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

-- Vehicles table for auto claims (Feature 005)
CREATE TABLE IF NOT EXISTS vehicles (
    vin TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    license_plate TEXT NOT NULL,
    color TEXT,
    vehicle_type TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (scenario_id) REFERENCES saved_scenarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vehicles_policy_number ON vehicles(policy_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_scenario_id ON vehicles(scenario_id);

-- Policies table for workflow lookups (Feature 005)
CREATE TABLE IF NOT EXISTS policies (
    policy_number TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    policy_type TEXT NOT NULL,
    coverage_types TEXT NOT NULL,
    coverage_limits TEXT NOT NULL,
    deductible REAL NOT NULL,
    premium REAL NOT NULL,
    effective_date TEXT NOT NULL,
    expiration_date TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    vin TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (scenario_id) REFERENCES saved_scenarios(id) ON DELETE CASCADE,
    FOREIGN KEY (vin) REFERENCES vehicles(vin) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_policies_scenario_id ON policies(scenario_id);
CREATE INDEX IF NOT EXISTS idx_policies_customer ON policies(customer_name);

-- Handlers table (Feature 005)
CREATE TABLE IF NOT EXISTS handlers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

-- Claims table (Feature 005)
CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    claimant_name TEXT NOT NULL,
    claimant_id TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    claim_type TEXT NOT NULL,
    description TEXT NOT NULL,
    incident_date TEXT NOT NULL,
    estimated_damage REAL,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    priority TEXT NOT NULL DEFAULT 'medium',
    assigned_handler_id TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (assigned_handler_id) REFERENCES handlers(id)
);

CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_assigned_handler ON claims(assigned_handler_id);
CREATE INDEX IF NOT EXISTS idx_claims_priority_status ON claims(priority DESC, status);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC);

-- AI Assessments table (Feature 005)
CREATE TABLE IF NOT EXISTS ai_assessments (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    agent_outputs TEXT,
    final_recommendation TEXT,
    confidence_scores TEXT,
    processing_started_at TEXT,
    processing_completed_at TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (claim_id) REFERENCES claims(id)
);

CREATE INDEX IF NOT EXISTS idx_assessments_claim ON ai_assessments(claim_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON ai_assessments(status);

-- Decisions table (Feature 005)
CREATE TABLE IF NOT EXISTS claim_decisions (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL,
    handler_id TEXT NOT NULL,
    decision_type TEXT NOT NULL,
    notes TEXT,
    ai_assessment_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (claim_id) REFERENCES claims(id),
    FOREIGN KEY (handler_id) REFERENCES handlers(id),
    FOREIGN KEY (ai_assessment_id) REFERENCES ai_assessments(id)
);

CREATE INDEX IF NOT EXISTS idx_decisions_claim ON claim_decisions(claim_id);
CREATE INDEX IF NOT EXISTS idx_decisions_handler ON claim_decisions(handler_id);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON claim_decisions(created_at DESC);

-- Audit Log table (Feature 005)
CREATE TABLE IF NOT EXISTS claim_audit_log (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL,
    handler_id TEXT,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (claim_id) REFERENCES claims(id),
    FOREIGN KEY (handler_id) REFERENCES handlers(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_claim ON claim_audit_log(claim_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON claim_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_handler ON claim_audit_log(handler_id);

-- Seed demo handlers
INSERT OR IGNORE INTO handlers (id, name, email, is_active, created_at) VALUES
    ('handler-001', 'Alice Johnson', 'alice@contoso.com', 1, datetime('now')),
    ('handler-002', 'Bob Smith', 'bob@contoso.com', 1, datetime('now')),
    ('handler-003', 'Carol Williams', 'carol@contoso.com', 1, datetime('now'));
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
