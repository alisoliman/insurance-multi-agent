"""
API endpoints for AI-powered demo scenario generation.

Based on contracts/scenarios-api.yaml from specs/004-ai-demo-examples/
"""

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.db.database import get_db_connection
from app.db.repositories.scenario_repo import ScenarioRepository
from app.models.scenario import (
    ClaimType,
    ErrorResponse,
    GeneratedScenario,
    Locale,
    SavedScenario,
    SavedScenarioSummary,
    SaveScenarioRequest,
    ScenarioGenerationRequest,
    ScenarioListResponse,
    TemplateListResponse,
)
from app.services.scenario_generator import get_scenario_generator
from app.workflow.policy_search import get_policy_search

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.post(
    "/generate",
    response_model=GeneratedScenario,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request parameters"},
        500: {"model": ErrorResponse, "description": "Generation failed"},
    },
    summary="Generate a new demo scenario",
    description="""
    Uses Azure OpenAI to generate a complete insurance claim scenario 
    including claim data and matching policy document. Supports both 
    parameter-based generation (locale + claim type + complexity) and 
    custom natural language descriptions.
    """,
)
async def generate_scenario(
    request: ScenarioGenerationRequest,
) -> GeneratedScenario:
    """Generate a new demo scenario using AI."""
    logger.info(
        f"Generating scenario: locale={request.locale.value}, "
        f"claim_type={request.claim_type.value}, complexity={request.complexity.value}, "
        f"custom_description={'yes' if request.custom_description else 'no'}"
    )
    
    try:
        generator = get_scenario_generator()
        scenario = await generator.generate(request)
        
        logger.info(f"Generated scenario: {scenario.id} - {scenario.name}")
        
        # Add generated policy to FAISS index for policy checker agent
        # This enables the workflow to find coverage information for the generated claim
        try:
            policy_search = get_policy_search()
            policy_number = scenario.policy.policy_number
            # claim_type is a string (not enum), so use it directly
            policy_type = scenario.claim.claim_type.replace("_", " ").title()
            success = policy_search.add_policy_from_text(
                policy_number=policy_number,
                policy_type=policy_type,
                markdown_content=scenario.policy.policy_document_markdown,
            )
            if success:
                logger.info(f"Added generated policy {policy_number} to FAISS index")
            else:
                logger.warning(f"Could not add policy {policy_number} to FAISS index")
        except Exception as e:
            # Don't fail the request if FAISS indexing fails
            logger.warning(f"Failed to add policy to FAISS index: {e}")
        
        return scenario
        
    except ValueError as e:
        logger.error(f"Generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "generation_failed", "message": str(e)},
        )
    except Exception as e:
        logger.exception(f"Unexpected error during generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "internal_error", "message": "An unexpected error occurred"},
        )


@router.get(
    "",
    response_model=ScenarioListResponse,
    summary="List saved scenarios",
    description="Retrieve all saved scenarios, optionally filtered by locale or claim type",
)
async def list_scenarios(
    locale: Optional[Locale] = None,
    claim_type: Optional[ClaimType] = None,
    limit: int = 50,
    offset: int = 0,
) -> ScenarioListResponse:
    """List saved scenarios with optional filtering."""
    if limit > 100:
        limit = 100
    
    async with get_db_connection() as db:
        repo = ScenarioRepository(db)
        return await repo.list(
            locale=locale,
            claim_type=claim_type,
            limit=limit,
            offset=offset,
        )


@router.post(
    "",
    response_model=SavedScenarioSummary,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
    },
    summary="Save a generated scenario",
    description="Persist a generated scenario to the database for later reuse",
)
async def save_scenario(
    request: SaveScenarioRequest,
) -> SavedScenarioSummary:
    """Save a generated scenario to the database."""
    logger.info(f"Saving scenario: {request.name}")
    
    async with get_db_connection() as db:
        repo = ScenarioRepository(db)
        
        # Check if scenario already exists
        if await repo.exists(request.scenario.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "already_exists", "message": "Scenario with this ID already exists"},
            )
        
        return await repo.create(request.scenario, request.name)


@router.get(
    "/templates",
    response_model=TemplateListResponse,
    summary="Get preset scenario templates",
    description="Retrieve list of preset regional templates for quick scenario generation",
)
async def get_templates() -> TemplateListResponse:
    """Get the list of preset templates."""
    generator = get_scenario_generator()
    return TemplateListResponse(templates=generator.get_templates())


@router.get(
    "/{scenario_id}",
    response_model=SavedScenario,
    responses={
        404: {"model": ErrorResponse, "description": "Scenario not found"},
    },
    summary="Get a saved scenario by ID",
    description="Retrieve full details of a saved scenario",
)
async def get_scenario(
    scenario_id: str,
) -> SavedScenario:
    """Get a saved scenario by ID."""
    # Validate UUID format
    try:
        UUID(scenario_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_id", "message": "Invalid scenario ID format"},
        )
    
    async with get_db_connection() as db:
        repo = ScenarioRepository(db)
        scenario = await repo.get_by_id(scenario_id)
        
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "not_found", "message": "Scenario not found"},
            )
        
        return scenario


@router.delete(
    "/{scenario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"model": ErrorResponse, "description": "Scenario not found"},
    },
    summary="Delete a saved scenario",
    description="Remove a saved scenario from the database",
)
async def delete_scenario(
    scenario_id: str,
) -> None:
    """Delete a saved scenario."""
    # Validate UUID format
    try:
        UUID(scenario_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_id", "message": "Invalid scenario ID format"},
        )
    
    async with get_db_connection() as db:
        repo = ScenarioRepository(db)
        deleted = await repo.delete(scenario_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "not_found", "message": "Scenario not found"},
            )
