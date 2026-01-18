"""
Policy repository for CRUD operations on the policies table.

Based on data-model.md from specs/005-complete-demo-pipeline/
"""

import json
import logging
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.db.database import get_db_connection

logger = logging.getLogger(__name__)


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
        """Check if policy covers a specific type."""
        return coverage_type.lower() in [c.lower() for c in self.coverage_types]
    
    def get_limit(self, coverage_type: str) -> Optional[float]:
        """Get coverage limit for a specific type."""
        # Try exact match first
        if coverage_type in self.coverage_limits:
            return self.coverage_limits[coverage_type]
        # Try case-insensitive match
        for key, value in self.coverage_limits.items():
            if key.lower() == coverage_type.lower():
                return value
        return None


async def create_policy(policy: PolicyCreate) -> PolicyRecord:
    """
    Create a new policy record in the database.
    
    Args:
        policy: Policy data to insert
        
    Returns:
        The created PolicyRecord
    """
    created_at = datetime.utcnow().isoformat()
    
    # Serialize list and dict fields to JSON
    coverage_types_json = json.dumps(policy.coverage_types)
    coverage_limits_json = json.dumps(policy.coverage_limits)
    
    async with get_db_connection() as db:
        await db.execute(
            """
            INSERT INTO policies (
                policy_number, scenario_id, policy_type, coverage_types,
                coverage_limits, deductible, premium, effective_date,
                expiration_date, customer_name, customer_email, customer_phone,
                vin, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                policy.policy_number,
                policy.scenario_id,
                policy.policy_type,
                coverage_types_json,
                coverage_limits_json,
                policy.deductible,
                policy.premium,
                policy.effective_date,
                policy.expiration_date,
                policy.customer_name,
                policy.customer_email,
                policy.customer_phone,
                policy.vin,
                created_at,
            ),
        )
        await db.commit()
    
    logger.info(f"Created policy record: {policy.policy_number}")
    
    return PolicyRecord(
        policy_number=policy.policy_number,
        scenario_id=policy.scenario_id,
        policy_type=policy.policy_type,
        coverage_types=policy.coverage_types,
        coverage_limits=policy.coverage_limits,
        deductible=policy.deductible,
        premium=policy.premium,
        effective_date=policy.effective_date,
        expiration_date=policy.expiration_date,
        customer_name=policy.customer_name,
        customer_email=policy.customer_email,
        customer_phone=policy.customer_phone,
        vin=policy.vin,
        created_at=created_at,
    )


async def get_policy_by_policy_number(policy_number: str) -> Optional[PolicyRecord]:
    """
    Get a policy by policy number.
    
    Args:
        policy_number: The policy number
        
    Returns:
        PolicyRecord if found, None otherwise
    """
    async with get_db_connection() as db:
        cursor = await db.execute(
            "SELECT * FROM policies WHERE policy_number = ?",
            (policy_number,),
        )
        row = await cursor.fetchone()
        
        if row is None:
            return None
        
        return PolicyRecord(
            policy_number=row["policy_number"],
            scenario_id=row["scenario_id"],
            policy_type=row["policy_type"],
            coverage_types=json.loads(row["coverage_types"]),
            coverage_limits=json.loads(row["coverage_limits"]),
            deductible=row["deductible"],
            premium=row["premium"],
            effective_date=row["effective_date"],
            expiration_date=row["expiration_date"],
            customer_name=row["customer_name"],
            customer_email=row["customer_email"],
            customer_phone=row["customer_phone"],
            vin=row["vin"],
            created_at=row["created_at"],
        )


async def get_policy_by_scenario_id(scenario_id: str) -> Optional[PolicyRecord]:
    """
    Get a policy by scenario ID.
    
    Args:
        scenario_id: The scenario ID
        
    Returns:
        PolicyRecord if found, None otherwise
    """
    async with get_db_connection() as db:
        cursor = await db.execute(
            "SELECT * FROM policies WHERE scenario_id = ?",
            (scenario_id,),
        )
        row = await cursor.fetchone()
        
        if row is None:
            return None
        
        return PolicyRecord(
            policy_number=row["policy_number"],
            scenario_id=row["scenario_id"],
            policy_type=row["policy_type"],
            coverage_types=json.loads(row["coverage_types"]),
            coverage_limits=json.loads(row["coverage_limits"]),
            deductible=row["deductible"],
            premium=row["premium"],
            effective_date=row["effective_date"],
            expiration_date=row["expiration_date"],
            customer_name=row["customer_name"],
            customer_email=row["customer_email"],
            customer_phone=row["customer_phone"],
            vin=row["vin"],
            created_at=row["created_at"],
        )


async def list_all_policies() -> list[PolicyRecord]:
    """
    List all policies in the database.
    
    Returns:
        List of all PolicyRecords
    """
    async with get_db_connection() as db:
        cursor = await db.execute("SELECT * FROM policies ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        
        return [
            PolicyRecord(
                policy_number=row["policy_number"],
                scenario_id=row["scenario_id"],
                policy_type=row["policy_type"],
                coverage_types=json.loads(row["coverage_types"]),
                coverage_limits=json.loads(row["coverage_limits"]),
                deductible=row["deductible"],
                premium=row["premium"],
                effective_date=row["effective_date"],
                expiration_date=row["expiration_date"],
                customer_name=row["customer_name"],
                customer_email=row["customer_email"],
                customer_phone=row["customer_phone"],
                vin=row["vin"],
                created_at=row["created_at"],
            )
            for row in rows
        ]


async def delete_policy_by_scenario_id(scenario_id: str) -> bool:
    """
    Delete policy associated with a scenario.
    
    Args:
        scenario_id: The scenario ID
        
    Returns:
        True if policy was deleted, False otherwise
    """
    async with get_db_connection() as db:
        cursor = await db.execute(
            "DELETE FROM policies WHERE scenario_id = ?",
            (scenario_id,),
        )
        await db.commit()
        
        deleted = cursor.rowcount > 0
        if deleted:
            logger.info(f"Deleted policy for scenario: {scenario_id}")
        
        return deleted


async def check_coverage(policy_number: str, coverage_type: str) -> dict:
    """
    Quick check for coverage type and limit - used by Policy Checker agent.
    
    Args:
        policy_number: The policy number
        coverage_type: Coverage type to check (e.g., "collision", "comprehensive")
        
    Returns:
        Dict with has_coverage, coverage_limit, and deductible
    """
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
