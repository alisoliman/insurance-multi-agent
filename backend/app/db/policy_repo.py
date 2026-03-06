"""Policy repository for CRUD operations on the policies table."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel
from sqlalchemy import text

from app.db.database import fetch_all, fetch_one, get_db_connection

logger = logging.getLogger(__name__)


def _parse_datetime(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _format_policy_date(value: datetime) -> str:
    return value.date().isoformat()


def _coerce_json(value):
    if isinstance(value, str):
        return json.loads(value)
    return value


class PolicyCreate(BaseModel):
    """DTO for creating policy database entry."""

    policy_number: str
    scenario_id: str
    policy_type: str
    coverage_types: list[str]
    coverage_limits: dict[str, float]
    deductible: float
    premium: float
    effective_date: str
    expiration_date: str
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    vin: Optional[str] = None


class PolicyRecord(BaseModel):
    """Policy record from database - used by workflow agents."""

    policy_number: str
    scenario_id: str
    policy_type: str
    coverage_types: list[str]
    coverage_limits: dict[str, float]
    deductible: float
    premium: float
    effective_date: str
    expiration_date: str
    customer_name: str
    customer_email: Optional[str]
    customer_phone: Optional[str]
    vin: Optional[str]
    created_at: str

    def has_coverage(self, coverage_type: str) -> bool:
        return coverage_type.lower() in [coverage.lower() for coverage in self.coverage_types]

    def get_limit(self, coverage_type: str) -> Optional[float]:
        if coverage_type in self.coverage_limits:
            return self.coverage_limits[coverage_type]
        for key, value in self.coverage_limits.items():
            if key.lower() == coverage_type.lower():
                return value
        return None


def _row_to_policy_record(row) -> PolicyRecord:
    coverage_types = _coerce_json(row["coverage_types"])
    coverage_limits = _coerce_json(row["coverage_limits"])
    return PolicyRecord(
        policy_number=row["policy_number"],
        scenario_id=row["scenario_id"],
        policy_type=row["policy_type"],
        coverage_types=coverage_types,
        coverage_limits=coverage_limits,
        deductible=float(row["deductible"]),
        premium=float(row["premium"]),
        effective_date=_format_policy_date(row["effective_date"]),
        expiration_date=_format_policy_date(row["expiration_date"]),
        customer_name=row["customer_name"],
        customer_email=row["customer_email"],
        customer_phone=row["customer_phone"],
        vin=row["vin"],
        created_at=row["created_at"].isoformat(),
    )


async def create_policy(policy: PolicyCreate) -> PolicyRecord:
    """Create a new policy record in the database."""
    created_at = datetime.now(timezone.utc)

    async with get_db_connection() as db:
        await db.execute(
            text(
                """
                INSERT INTO policies (
                    policy_number, scenario_id, policy_type, coverage_types,
                    coverage_limits, deductible, premium, effective_date,
                    expiration_date, customer_name, customer_email, customer_phone,
                    vin, created_at
                ) VALUES (
                    :policy_number, :scenario_id, :policy_type, CAST(:coverage_types AS jsonb),
                    CAST(:coverage_limits AS jsonb), :deductible, :premium, :effective_date,
                    :expiration_date, :customer_name, :customer_email, :customer_phone,
                    :vin, :created_at
                )
                """
            ),
            {
                "policy_number": policy.policy_number,
                "scenario_id": policy.scenario_id,
                "policy_type": policy.policy_type,
                "coverage_types": json.dumps(policy.coverage_types),
                "coverage_limits": json.dumps(policy.coverage_limits),
                "deductible": policy.deductible,
                "premium": policy.premium,
                "effective_date": _parse_datetime(policy.effective_date),
                "expiration_date": _parse_datetime(policy.expiration_date),
                "customer_name": policy.customer_name,
                "customer_email": policy.customer_email,
                "customer_phone": policy.customer_phone,
                "vin": policy.vin,
                "created_at": created_at,
            },
        )
        await db.commit()

    logger.info("Created policy record: %s", policy.policy_number)

    return PolicyRecord(
        policy_number=policy.policy_number,
        scenario_id=policy.scenario_id,
        policy_type=policy.policy_type,
        coverage_types=policy.coverage_types,
        coverage_limits=policy.coverage_limits,
        deductible=policy.deductible,
        premium=policy.premium,
        effective_date=_format_policy_date(_parse_datetime(policy.effective_date)),
        expiration_date=_format_policy_date(_parse_datetime(policy.expiration_date)),
        customer_name=policy.customer_name,
        customer_email=policy.customer_email,
        customer_phone=policy.customer_phone,
        vin=policy.vin,
        created_at=created_at.isoformat(),
    )


async def get_policy_by_policy_number(policy_number: str) -> Optional[PolicyRecord]:
    """Get a policy by policy number."""
    async with get_db_connection() as db:
        row = await fetch_one(
            db,
            "SELECT * FROM policies WHERE policy_number = :policy_number",
            {"policy_number": policy_number},
        )
    return _row_to_policy_record(row) if row else None


async def get_policy_by_scenario_id(scenario_id: str) -> Optional[PolicyRecord]:
    """Get a policy by scenario ID."""
    async with get_db_connection() as db:
        row = await fetch_one(
            db,
            "SELECT * FROM policies WHERE scenario_id = :scenario_id",
            {"scenario_id": scenario_id},
        )
    return _row_to_policy_record(row) if row else None


async def list_all_policies() -> list[PolicyRecord]:
    """List all policies in the database."""
    async with get_db_connection() as db:
        rows = await fetch_all(
            db,
            "SELECT * FROM policies ORDER BY created_at DESC",
        )
    return [_row_to_policy_record(row) for row in rows]


async def delete_policy_by_scenario_id(scenario_id: str) -> bool:
    """Delete the policy associated with a scenario."""
    async with get_db_connection() as db:
        result = await db.execute(
            text("DELETE FROM policies WHERE scenario_id = :scenario_id"),
            {"scenario_id": scenario_id},
        )
        await db.commit()
    deleted = result.rowcount > 0
    if deleted:
        logger.info("Deleted policy for scenario: %s", scenario_id)
    return deleted


async def check_coverage(policy_number: str, coverage_type: str) -> dict:
    """Quick check for coverage type and limit."""
    policy = await get_policy_by_policy_number(policy_number)
    if policy is None:
        return {
            "has_coverage": False,
            "coverage_limit": None,
            "deductible": None,
            "error": "Policy not found",
        }

    return {
        "has_coverage": policy.has_coverage(coverage_type),
        "coverage_limit": policy.get_limit(coverage_type),
        "deductible": policy.deductible,
    }
