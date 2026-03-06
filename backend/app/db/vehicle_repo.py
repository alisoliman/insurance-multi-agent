"""Vehicle repository for CRUD operations on the vehicles table."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel
from sqlalchemy import text

from app.db.database import fetch_one, get_db_connection

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


def _row_to_vehicle_record(row) -> VehicleRecord:
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
        created_at=row["created_at"].isoformat(),
    )


async def create_vehicle(vehicle: VehicleCreate) -> VehicleRecord:
    """Create a new vehicle record in the database."""
    created_at = datetime.now(timezone.utc)

    async with get_db_connection() as db:
        await db.execute(
            text(
                """
                INSERT INTO vehicles (
                    vin, scenario_id, policy_number, make, model,
                    year, license_plate, color, vehicle_type, created_at
                ) VALUES (
                    :vin, :scenario_id, :policy_number, :make, :model,
                    :year, :license_plate, :color, :vehicle_type, :created_at
                )
                """
            ),
            {
                "vin": vehicle.vin,
                "scenario_id": vehicle.scenario_id,
                "policy_number": vehicle.policy_number,
                "make": vehicle.make,
                "model": vehicle.model,
                "year": vehicle.year,
                "license_plate": vehicle.license_plate,
                "color": vehicle.color,
                "vehicle_type": vehicle.vehicle_type,
                "created_at": created_at,
            },
        )
        await db.commit()

    logger.info(
        "Created vehicle record: VIN=%s, policy=%s",
        vehicle.vin,
        vehicle.policy_number,
    )

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
        created_at=created_at.isoformat(),
    )


async def get_vehicle_by_vin(vin: str) -> Optional[VehicleRecord]:
    """Get a vehicle by VIN."""
    async with get_db_connection() as db:
        row = await fetch_one(
            db,
            "SELECT * FROM vehicles WHERE vin = :vin",
            {"vin": vin},
        )
    return _row_to_vehicle_record(row) if row else None


async def get_vehicle_by_policy_number(policy_number: str) -> Optional[VehicleRecord]:
    """Get a vehicle by policy number."""
    async with get_db_connection() as db:
        row = await fetch_one(
            db,
            "SELECT * FROM vehicles WHERE policy_number = :policy_number",
            {"policy_number": policy_number},
        )
    return _row_to_vehicle_record(row) if row else None


async def get_vehicle_by_scenario_id(scenario_id: str) -> Optional[VehicleRecord]:
    """Get a vehicle by scenario ID."""
    async with get_db_connection() as db:
        row = await fetch_one(
            db,
            "SELECT * FROM vehicles WHERE scenario_id = :scenario_id",
            {"scenario_id": scenario_id},
        )
    return _row_to_vehicle_record(row) if row else None


async def delete_vehicle_by_scenario_id(scenario_id: str) -> bool:
    """Delete vehicle(s) associated with a scenario."""
    async with get_db_connection() as db:
        result = await db.execute(
            text("DELETE FROM vehicles WHERE scenario_id = :scenario_id"),
            {"scenario_id": scenario_id},
        )
        await db.commit()
    deleted = result.rowcount > 0
    if deleted:
        logger.info("Deleted vehicle(s) for scenario: %s", scenario_id)
    return deleted
