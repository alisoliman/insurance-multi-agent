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
    """Generate a new demo scenario using AI.
    
    This endpoint handles complete E2E synthetic data generation:
    1. Generate scenario via Azure OpenAI
    2. Create vehicle record in database (for get_vehicle_details tool)
    3. Create policy record in database (for get_policy_details tool)
    4. Index policy in FAISS (for semantic search)
    
    After generation, the scenario is immediately usable in agent demos
    without needing to be saved first.
    """
    logger.info(
        f"Generating scenario: locale={request.locale.value}, "
        f"claim_type={request.claim_type.value}, complexity={request.complexity.value}, "
        f"custom_description={'yes' if request.custom_description else 'no'}"
    )
    
    try:
        generator = get_scenario_generator()
        scenario = await generator.generate(request)
        
        logger.info(f"Generated scenario: {scenario.id} - {scenario.name}")
        
        # =====================================================================
        # Feature 005: Create vehicle record for immediate agent tool access
        # =====================================================================
        if scenario.claim.vehicle_info:
            try:
                from app.db.vehicle_repo import create_vehicle, get_vehicle_by_vin, VehicleCreate
                
                vi = scenario.claim.vehicle_info
                existing = await get_vehicle_by_vin(vi.vin)
                if not existing:
                    vehicle_create = VehicleCreate(
                        vin=vi.vin,
                        scenario_id=scenario.id,
                        policy_number=scenario.claim.policy_number,
                        make=vi.make,
                        model=vi.model,
                        year=vi.year,
                        license_plate=vi.license_plate,
                        color=getattr(vi, 'color', None),
                        vehicle_type=getattr(vi, 'vehicle_type', None),
                    )
                    await create_vehicle(vehicle_create)
                    logger.info(f"Created vehicle record: {vi.vin}")
            except Exception as e:
                logger.warning(f"Could not create vehicle record: {e}")
        
        # =====================================================================
        # Feature 005: Create policy record for immediate agent tool access
        # =====================================================================
        try:
            from app.db.policy_repo import create_policy, get_policy_by_policy_number, PolicyCreate
            
            existing = await get_policy_by_policy_number(scenario.policy.policy_number)
            if not existing:
                # Extract coverage info from generated policy
                policy = scenario.policy
                customer_info = scenario.claim.customer_info
                vehicle_info = scenario.claim.vehicle_info
                
                policy_create = PolicyCreate(
                    policy_number=policy.policy_number,
                    scenario_id=scenario.id,
                    policy_type=policy.policy_type,
                    coverage_types=policy.coverage_types,
                    coverage_limits={
                        "collision": policy.coverage_limits.collision,
                        "comprehensive": policy.coverage_limits.comprehensive,
                        "liability": policy.coverage_limits.liability_per_accident,
                    },
                    deductible=policy.deductibles.collision,
                    premium=policy.premium_amount,
                    effective_date=policy.effective_date,
                    expiration_date=policy.expiration_date,
                    customer_name=customer_info.name if customer_info else scenario.claim.claimant_name,
                    customer_email=customer_info.email if customer_info else None,
                    customer_phone=customer_info.phone if customer_info else None,
                    vin=vehicle_info.vin if vehicle_info else None,
                )
                await create_policy(policy_create)
                logger.info(f"Created policy record: {policy.policy_number}")
        except Exception as e:
            logger.warning(f"Could not create policy record: {e}")
        
        # =====================================================================
        # Add generated policy to FAISS index for policy checker agent
        # This enables semantic search for coverage information
        # =====================================================================
        try:
            policy_search = get_policy_search()
            policy_number = scenario.policy.policy_number
            # claim_type is a string (not enum), so use it directly
            policy_type = scenario.claim.claim_type.replace("_", " ").title()
            success = policy_search.add_policy_from_text(
                policy_number=policy_number,
                policy_type=policy_type,
                markdown_content=scenario.policy.markdown_content,
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
    """Save a generated scenario to the database.
    
    Also creates vehicle and policy records for workflow agent lookups.
    """
    from app.db.vehicle_repo import VehicleCreate, create_vehicle
    from app.db.policy_repo import PolicyCreate, create_policy
    
    logger.info(f"Saving scenario: {request.name}")
    
    async with get_db_connection() as db:
        repo = ScenarioRepository(db)
        
        # Check if scenario already exists
        if await repo.exists(request.scenario.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "already_exists", "message": "Scenario with this ID already exists"},
            )
        
        result = await repo.create(request.scenario, request.name)
    
    # Create vehicle record if this is an auto claim with vehicle info (T011)
    scenario = request.scenario
    if scenario.claim.vehicle_info:
        try:
            vi = scenario.claim.vehicle_info
            vehicle_create = VehicleCreate(
                vin=vi.vin,
                scenario_id=scenario.id,
                policy_number=scenario.policy.policy_number,
                make=vi.make,
                model=vi.model,
                year=vi.year,
                license_plate=vi.license_plate,
            )
            await create_vehicle(vehicle_create)
            logger.info(f"Created vehicle record: VIN={vi.vin}")
        except Exception as e:
            # Don't fail the save if vehicle creation fails
            logger.warning(f"Failed to create vehicle record: {e}")
    
    # Create policy record for workflow lookups (T012)
    try:
        policy = scenario.policy
        limits = policy.coverage_limits
        coverage_limits_dict = {
            "collision": limits.collision,
            "comprehensive": limits.comprehensive,
            "liability_per_person": limits.liability_per_person,
            "liability_per_accident": limits.liability_per_accident,
            "property_damage": limits.property_damage,
            "medical_payments": limits.medical_payments,
        }
        coverage_types = list(coverage_limits_dict.keys())
        
        policy_create = PolicyCreate(
            policy_number=policy.policy_number,
            scenario_id=scenario.id,
            policy_type=policy.policy_type,
            coverage_types=coverage_types,
            coverage_limits=coverage_limits_dict,
            deductible=policy.deductibles.collision,
            premium=1200.0,  # Default premium for demo
            effective_date=policy.effective_date,
            expiration_date=policy.expiration_date,
            customer_name=scenario.claim.claimant_name,
            customer_email=scenario.claim.customer_info.email if scenario.claim.customer_info else None,
            customer_phone=scenario.claim.customer_info.phone if scenario.claim.customer_info else None,
            vin=scenario.claim.vehicle_info.vin if scenario.claim.vehicle_info else None,
        )
        await create_policy(policy_create)
        logger.info(f"Created policy record: {policy.policy_number}")
    except Exception as e:
        # Don't fail the save if policy creation fails
        logger.warning(f"Failed to create policy record: {e}")
    
    return result


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
    from app.db.vehicle_repo import delete_vehicle_by_scenario_id
    from app.db.policy_repo import delete_policy_by_scenario_id
    
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
    
    # Also clean up vehicle and policy records
    await delete_vehicle_by_scenario_id(scenario_id)
    await delete_policy_by_scenario_id(scenario_id)


# =============================================================================
# Feature 005: Vehicle and Policy Lookup Endpoints (T015-T016)
# =============================================================================

@router.get(
    "/vehicles/{vin}",
    response_model=dict,
    responses={
        404: {"model": ErrorResponse, "description": "Vehicle not found"},
    },
    summary="Get vehicle by VIN",
    description="Retrieve vehicle details for a VIN from generated scenarios",
)
async def get_vehicle_by_vin(vin: str) -> dict:
    """Get vehicle details by VIN."""
    from app.db.vehicle_repo import get_vehicle_by_vin as repo_get_vehicle
    
    vehicle = await repo_get_vehicle(vin)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": f"Vehicle with VIN {vin} not found"},
        )
    
    return vehicle.model_dump()


@router.get(
    "/policies/{policy_number}",
    response_model=dict,
    responses={
        404: {"model": ErrorResponse, "description": "Policy not found"},
    },
    summary="Get policy by policy number",
    description="Retrieve policy details from generated scenarios",
)
async def get_policy_by_number(policy_number: str) -> dict:
    """Get policy details by policy number."""
    from app.db.policy_repo import get_policy_by_policy_number
    
    policy = await get_policy_by_policy_number(policy_number)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": f"Policy {policy_number} not found"},
        )
    
    return policy.model_dump()


@router.get(
    "/policies/{policy_number}/coverage/{coverage_type}",
    response_model=dict,
    summary="Check coverage for a policy",
    description="Quick check for coverage type and limit - used by Policy Checker agent",
)
async def check_policy_coverage(policy_number: str, coverage_type: str) -> dict:
    """Quick coverage check for Policy Checker agent."""
    from app.db.policy_repo import check_coverage
    
    result = await check_coverage(policy_number, coverage_type)
    return result
