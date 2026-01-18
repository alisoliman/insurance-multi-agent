"""
Repository for CRUD operations on saved scenarios.

Based on data-model.md from specs/004-ai-demo-examples/
"""

import json
import logging
from datetime import datetime
from typing import Optional

import aiosqlite

from app.models.scenario import (
    ClaimType,
    GeneratedScenario,
    Locale,
    SavedScenario,
    SavedScenarioSummary,
    ScenarioListResponse,
)

logger = logging.getLogger(__name__)


class ScenarioRepository:
    """Repository for saved scenario CRUD operations."""

    def __init__(self, db: aiosqlite.Connection):
        self.db = db

    async def create(self, scenario: GeneratedScenario, name: str) -> SavedScenarioSummary:
        """
        Save a generated scenario to the database.
        
        Args:
            scenario: The generated scenario to save
            name: User-provided name for the scenario
            
        Returns:
            Summary of the saved scenario
        """
        now = datetime.utcnow().isoformat()
        
        # Update scenario name if different
        scenario_dict = scenario.model_dump(mode="json")
        scenario_dict["name"] = name
        
        await self.db.execute(
            """
            INSERT INTO saved_scenarios (id, name, locale, claim_type, complexity, scenario_data, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                scenario.id,
                name,
                scenario.locale.value,
                scenario.claim_type.value,
                scenario.complexity.value,
                json.dumps(scenario_dict),
                now,
            ),
        )
        await self.db.commit()
        
        logger.info(f"Saved scenario '{name}' with ID {scenario.id}")
        
        return SavedScenarioSummary(
            id=scenario.id,
            name=name,
            locale=scenario.locale,
            claim_type=scenario.claim_type,
            complexity=scenario.complexity,
            estimated_damage=scenario.claim.estimated_damage,
            created_at=datetime.fromisoformat(now),
        )

    async def get_by_id(self, scenario_id: str) -> Optional[SavedScenario]:
        """
        Retrieve a saved scenario by ID.
        
        Args:
            scenario_id: UUID of the scenario
            
        Returns:
            The saved scenario or None if not found
        """
        cursor = await self.db.execute(
            "SELECT * FROM saved_scenarios WHERE id = ?",
            (scenario_id,),
        )
        row = await cursor.fetchone()
        
        if not row:
            return None
        
        scenario_data = json.loads(row["scenario_data"])
        return SavedScenario(
            **scenario_data,
            updated_at=datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else None,
        )

    async def list(
        self,
        locale: Optional[Locale] = None,
        claim_type: Optional[ClaimType] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> ScenarioListResponse:
        """
        List saved scenarios with optional filtering.
        
        Args:
            locale: Filter by locale
            claim_type: Filter by claim type
            limit: Maximum number of results
            offset: Pagination offset
            
        Returns:
            List of scenario summaries with total count
        """
        # Build query with optional filters
        conditions = []
        params: list = []
        
        if locale:
            conditions.append("locale = ?")
            params.append(locale.value)
        
        if claim_type:
            conditions.append("claim_type = ?")
            params.append(claim_type.value)
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        # Get total count
        count_cursor = await self.db.execute(
            f"SELECT COUNT(*) FROM saved_scenarios WHERE {where_clause}",
            params,
        )
        total_row = await count_cursor.fetchone()
        total = total_row[0] if total_row else 0
        
        # Get scenarios
        cursor = await self.db.execute(
            f"""
            SELECT id, name, locale, claim_type, complexity, scenario_data, created_at
            FROM saved_scenarios
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            params + [limit, offset],
        )
        rows = await cursor.fetchall()
        
        scenarios = []
        for row in rows:
            scenario_data = json.loads(row["scenario_data"])
            scenarios.append(
                SavedScenarioSummary(
                    id=row["id"],
                    name=row["name"],
                    locale=Locale(row["locale"]),
                    claim_type=ClaimType(row["claim_type"]),
                    complexity=scenario_data.get("complexity", "moderate"),
                    estimated_damage=scenario_data.get("claim", {}).get("estimated_damage", 0),
                    created_at=datetime.fromisoformat(row["created_at"]),
                )
            )
        
        return ScenarioListResponse(
            scenarios=scenarios,
            total=total,
            limit=limit,
            offset=offset,
        )

    async def delete(self, scenario_id: str) -> bool:
        """
        Delete a saved scenario by ID.
        
        Args:
            scenario_id: UUID of the scenario to delete
            
        Returns:
            True if deleted, False if not found
        """
        cursor = await self.db.execute(
            "DELETE FROM saved_scenarios WHERE id = ?",
            (scenario_id,),
        )
        await self.db.commit()
        
        deleted = cursor.rowcount > 0
        if deleted:
            logger.info(f"Deleted scenario with ID {scenario_id}")
        
        return deleted

    async def exists(self, scenario_id: str) -> bool:
        """
        Check if a scenario exists.
        
        Args:
            scenario_id: UUID of the scenario
            
        Returns:
            True if exists, False otherwise
        """
        cursor = await self.db.execute(
            "SELECT 1 FROM saved_scenarios WHERE id = ?",
            (scenario_id,),
        )
        row = await cursor.fetchone()
        return row is not None
