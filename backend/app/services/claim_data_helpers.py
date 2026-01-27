"""
Shared helpers for ensuring claim data (vehicle, policy) exists in the database.

These functions create temporary records from claim data so agent tools 
can find them during processing (Feature 005).
"""

import logging
from typing import Optional

from app.db.vehicle_repo import create_vehicle, get_vehicle_by_vin, VehicleCreate
from app.db.policy_repo import create_policy, get_policy_by_policy_number, PolicyCreate

logger = logging.getLogger(__name__)


async def ensure_vehicle_exists(claim_data: dict) -> Optional[str]:
    """Ensure vehicle info from claim is available in the database.
    
    Creates a vehicle record from claim data if it doesn't exist.
    Used by workflow and single-agent endpoints so agent tools
    like get_vehicle_details can find the vehicle.
    
    Args:
        claim_data: Claim dictionary containing vehicle_info
        
    Returns:
        VIN if vehicle exists or was created, None otherwise
    """
    vehicle_info = claim_data.get("vehicle_info")
    if not vehicle_info:
        return None
    
    vin = vehicle_info.get("vin")
    if not vin:
        return None
    
    existing = await get_vehicle_by_vin(vin)
    if existing:
        logger.debug(f"Vehicle {vin} already exists")
        return vin
    
    try:
        vehicle_create = VehicleCreate(
            vin=vin,
            scenario_id=claim_data.get("claim_id", "temp"),
            policy_number=claim_data.get("policy_number", "unknown"),
            make=vehicle_info.get("make", "Unknown"),
            model=vehicle_info.get("model", "Unknown"),
            year=vehicle_info.get("year", 2020),
            license_plate=vehicle_info.get("license_plate", ""),
            color=vehicle_info.get("color"),
            vehicle_type=vehicle_info.get("vehicle_type"),
        )
        await create_vehicle(vehicle_create)
        logger.info(f"Created vehicle record for claim: {vin}")
        return vin
    except Exception as e:
        logger.warning(f"Could not create vehicle record: {e}")
        return None


async def ensure_policy_exists(claim_data: dict) -> Optional[str]:
    """Ensure policy from claim is available in the database.
    
    Creates a policy record from claim data if it doesn't exist.
    Used by workflow and single-agent endpoints so agent tools
    like get_policy_details can find the policy.
    
    Args:
        claim_data: Claim dictionary containing policy_number and related info
        
    Returns:
        Policy number if policy exists or was created, None otherwise
    """
    policy_number = claim_data.get("policy_number")
    if not policy_number:
        return None
    
    existing = await get_policy_by_policy_number(policy_number)
    if existing:
        logger.debug(f"Policy {policy_number} already exists")
        return policy_number
    
    try:
        customer_info = claim_data.get("customer_info", {})
        vehicle_info = claim_data.get("vehicle_info", {})
        
        policy_create = PolicyCreate(
            policy_number=policy_number,
            scenario_id=claim_data.get("claim_id", "temp"),
            policy_type="Auto",
            coverage_types=["collision", "comprehensive", "liability"],
            coverage_limits={
                "collision": 50000.0,
                "comprehensive": 50000.0,
                "liability": 100000.0,
            },
            deductible=500.0,
            premium=1200.0,
            effective_date=claim_data.get("incident_date", "2024-01-01"),
            expiration_date="2025-12-31",
            customer_name=claim_data.get("claimant_name", customer_info.get("name", "Unknown")),
            customer_email=customer_info.get("email"),
            customer_phone=customer_info.get("phone"),
            vin=vehicle_info.get("vin"),
        )
        await create_policy(policy_create)
        logger.info(f"Created policy record for claim: {policy_number}")
        return policy_number
    except Exception as e:
        logger.warning(f"Could not create policy record: {e}")
        return None
