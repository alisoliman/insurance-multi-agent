"""Repository for CRUD operations on saved scenarios."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.db.database import fetch_all, fetch_one
from app.models.scenario import (
    ClaimType,
    GeneratedScenario,
    Locale,
    SavedScenario,
    SavedScenarioSummary,
    ScenarioListResponse,
)

logger = logging.getLogger(__name__)


def _coerce_json(value):
    if isinstance(value, str):
        return json.loads(value)
    return value


class ScenarioRepository:
    """Repository for saved scenario CRUD operations."""

    def __init__(self, db: AsyncConnection):
        self.db = db

    async def create(self, scenario: GeneratedScenario, name: str) -> SavedScenarioSummary:
        """Save a generated scenario to the database."""
        now = datetime.now(timezone.utc)
        scenario_dict = scenario.model_dump(mode="json")
        scenario_dict["name"] = name

        await self.db.execute(
            text(
                """
                INSERT INTO saved_scenarios (
                    id, name, locale, claim_type, complexity, scenario_data, created_at
                )
                VALUES (
                    :id, :name, :locale, :claim_type, :complexity, CAST(:scenario_data AS jsonb), :created_at
                )
                """
            ),
            {
                "id": scenario.id,
                "name": name,
                "locale": scenario.locale.value,
                "claim_type": scenario.claim_type.value,
                "complexity": scenario.complexity.value,
                "scenario_data": json.dumps(scenario_dict),
                "created_at": now,
            },
        )
        await self.db.commit()

        logger.info("Saved scenario '%s' with ID %s", name, scenario.id)

        return SavedScenarioSummary(
            id=scenario.id,
            name=name,
            locale=scenario.locale,
            claim_type=scenario.claim_type,
            complexity=scenario.complexity,
            estimated_damage=scenario.claim.estimated_damage,
            created_at=now,
        )

    async def get_by_id(self, scenario_id: str) -> Optional[SavedScenario]:
        """Retrieve a saved scenario by ID."""
        row = await fetch_one(
            self.db,
            "SELECT * FROM saved_scenarios WHERE id = :scenario_id",
            {"scenario_id": scenario_id},
        )
        if not row:
            return None

        scenario_data = _coerce_json(row["scenario_data"])
        return SavedScenario(
            **scenario_data,
            updated_at=row["updated_at"],
        )

    async def list(
        self,
        locale: Optional[Locale] = None,
        claim_type: Optional[ClaimType] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> ScenarioListResponse:
        """List saved scenarios with optional filtering."""
        conditions: list[str] = []
        params: dict[str, object] = {"limit": limit, "offset": offset}

        if locale:
            conditions.append("locale = :locale")
            params["locale"] = locale.value

        if claim_type:
            conditions.append("claim_type = :claim_type")
            params["claim_type"] = claim_type.value

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        total_row = await fetch_one(
            self.db,
            f"SELECT COUNT(*) AS total FROM saved_scenarios WHERE {where_clause}",
            params,
        )
        total = total_row["total"] if total_row else 0

        rows = await fetch_all(
            self.db,
            f"""
            SELECT id, name, locale, claim_type, complexity, scenario_data, created_at
            FROM saved_scenarios
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
            """,
            params,
        )

        scenarios = []
        for row in rows:
            scenario_data = _coerce_json(row["scenario_data"])
            scenarios.append(
                SavedScenarioSummary(
                    id=row["id"],
                    name=row["name"],
                    locale=Locale(row["locale"]),
                    claim_type=ClaimType(row["claim_type"]),
                    complexity=scenario_data.get("complexity", "moderate"),
                    estimated_damage=scenario_data.get("claim", {}).get("estimated_damage", 0),
                    created_at=row["created_at"],
                )
            )

        return ScenarioListResponse(
            scenarios=scenarios,
            total=total,
            limit=limit,
            offset=offset,
        )

    async def delete(self, scenario_id: str) -> bool:
        """Delete a saved scenario by ID."""
        result = await self.db.execute(
            text("DELETE FROM saved_scenarios WHERE id = :scenario_id"),
            {"scenario_id": scenario_id},
        )
        await self.db.commit()

        deleted = result.rowcount > 0
        if deleted:
            logger.info("Deleted scenario with ID %s", scenario_id)

        return deleted

    async def exists(self, scenario_id: str) -> bool:
        """Check if a scenario exists."""
        row = await fetch_one(
            self.db,
            "SELECT 1 AS exists FROM saved_scenarios WHERE id = :scenario_id",
            {"scenario_id": scenario_id},
        )
        return row is not None
