"""
Vehicle repository for CRUD operations on the vehicles table.

Based on data-model.md from specs/005-complete-demo-pipeline/
"""

import json
import logging
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.db.database import get_db_connection

logger = logging.getLogger(__name__)


class VehicleCreate(BaseModel):
    """DTO for creating vehicle database entry."""
    vin: str
    scenario_id: str
    policy_number: str
    make: str
    model: str
    year: int
    license_plate: str
    color: Optional[str] = None
    vehicle_type: Optional[str] = None


class VehicleRecord(BaseModel):
    """Vehicle record from database."""
    vin: str
    scenario_id: str
    policy_number: str
    make: str
    model: str
    year: int
    license_plate: str
    color: Optional[str]
    vehicle_type: Optional[str]
    created_at: str


async def create_vehicle(vehicle: VehicleCreate) -> VehicleRecord:
    """
    Create a new vehicle record in the database.
    
    Args:
        vehicle: Vehicle data to insert
        
    Returns:
        The created VehicleRecord
    """
    created_at = datetime.utcnow().isoformat()
    
    async with get_db_connection() as db:
        await db.execute(
            """
            INSERT INTO vehicles (
                vin, scenario_id, policy_number, make, model,
                year, license_plate, color, vehicle_type, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                vehicle.vin,
                vehicle.scenario_id,
                vehicle.policy_number,
                vehicle.make,
                vehicle.model,
                vehicle.year,
                vehicle.license_plate,
                vehicle.color,
                vehicle.vehicle_type,
                created_at,
            ),
        )
        await db.commit()
    
    logger.info(f"Created vehicle record: VIN={vehicle.vin}, policy={vehicle.policy_number}")
    
    return VehicleRecord(
        vin=vehicle.vin,
        scenario_id=vehicle.scenario_id,
        policy_number=vehicle.policy_number,
        make=vehicle.make,
        model=vehicle.model,
        year=vehicle.year,
        license_plate=vehicle.license_plate,
        color=vehicle.color,
        vehicle_type=vehicle.vehicle_type,
        created_at=created_at,
    )


async def get_vehicle_by_vin(vin: str) -> Optional[VehicleRecord]:
    """
    Get a vehicle by VIN.
    
    Args:
        vin: Vehicle Identification Number
        
    Returns:
        VehicleRecord if found, None otherwise
    """
    async with get_db_connection() as db:
        cursor = await db.execute(
            "SELECT * FROM vehicles WHERE vin = ?",
            (vin,),
        )
        row = await cursor.fetchone()
        
        if row is None:
            return None
            
        return VehicleRecord(
            vin=row["vin"],
            scenario_id=row["scenario_id"],
            policy_number=row["policy_number"],
            make=row["make"],
            model=row["model"],
            year=row["year"],
            license_plate=row["license_plate"],
            color=row["color"],
            vehicle_type=row["vehicle_type"],
            created_at=row["created_at"],
        )


async def get_vehicle_by_policy_number(policy_number: str) -> Optional[VehicleRecord]:
    """
    Get a vehicle by policy number.
    
    Args:
        policy_number: The policy number associated with the vehicle
        
    Returns:
        VehicleRecord if found, None otherwise
    """
    async with get_db_connection() as db:
        cursor = await db.execute(
            "SELECT * FROM vehicles WHERE policy_number = ?",
            (policy_number,),
        )
        row = await cursor.fetchone()
        
        if row is None:
            return None
            
        return VehicleRecord(
            vin=row["vin"],
            scenario_id=row["scenario_id"],
            policy_number=row["policy_number"],
            make=row["make"],
            model=row["model"],
            year=row["year"],
            license_plate=row["license_plate"],
            color=row["color"],
            vehicle_type=row["vehicle_type"],
            created_at=row["created_at"],
        )


async def get_vehicle_by_scenario_id(scenario_id: str) -> Optional[VehicleRecord]:
    """
    Get a vehicle by scenario ID.
    
    Args:
        scenario_id: The scenario ID associated with the vehicle
        
    Returns:
        VehicleRecord if found, None otherwise
    """
    async with get_db_connection() as db:
        cursor = await db.execute(
            "SELECT * FROM vehicles WHERE scenario_id = ?",
            (scenario_id,),
        )
        row = await cursor.fetchone()
        
        if row is None:
            return None
            
        return VehicleRecord(
            vin=row["vin"],
            scenario_id=row["scenario_id"],
            policy_number=row["policy_number"],
            make=row["make"],
            model=row["model"],
            year=row["year"],
            license_plate=row["license_plate"],
            color=row["color"],
            vehicle_type=row["vehicle_type"],
            created_at=row["created_at"],
        )


async def delete_vehicle_by_scenario_id(scenario_id: str) -> bool:
    """
    Delete vehicle(s) associated with a scenario.
    
    Args:
        scenario_id: The scenario ID
        
    Returns:
        True if any vehicles were deleted, False otherwise
    """
    async with get_db_connection() as db:
        cursor = await db.execute(
            "DELETE FROM vehicles WHERE scenario_id = ?",
            (scenario_id,),
        )
        await db.commit()
        
        deleted = cursor.rowcount > 0
        if deleted:
            logger.info(f"Deleted vehicle(s) for scenario: {scenario_id}")
        
        return deleted
