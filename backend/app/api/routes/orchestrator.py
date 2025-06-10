"""
API routes for Orchestrator agent functionality.
"""

from fastapi import APIRouter, HTTPException, File, UploadFile, Form
import logging
import json
from typing import Any

from app.agents.orchestrator import OrchestratorAgent
from app.agents.enums import WorkflowStage, ClaimComplexity
from app.schemas.claims import ClaimData, WorkflowRequest
from app.core.exceptions import (
    handle_agent_error,
    safe_serialize_response,
    WorkflowError,
    AgentInitializationError,
    ImageProcessingError,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/process-workflow")
async def process_claim_workflow(request: WorkflowRequest) -> dict[str, Any]:
    """
    Process a claim through the orchestrator workflow.

    Args:
        request: Workflow request with claim data and options

    Returns:
        Workflow processing result
    """
    try:
        logger.info(
            f"Starting workflow processing for claim: {request.claim_data.claim_id}")

        # Initialize orchestrator with error handling
        try:
            orchestrator = OrchestratorAgent()
            await orchestrator.initialize_agents()
        except Exception as e:
            logger.error(f"Failed to initialize OrchestratorAgent: {e}")
            raise AgentInitializationError("OrchestratorAgent", str(e))

        # Convert Pydantic model to dict
        claim_dict = request.claim_data.model_dump()

        try:
            if request.use_graphflow:
                # Use GraphFlow workflow
                logger.info(
                    f"Using GraphFlow workflow for claim {request.claim_data.claim_id}")
                result = await orchestrator.run_graphflow_workflow(claim_dict)

                # Safely serialize the result
                serialized_result = safe_serialize_response(result)

                return serialized_result.get("data", result)
            else:
                # Use standard workflow
                logger.info(
                    f"Using standard workflow for claim {request.claim_data.claim_id}")
                workflow_state = await orchestrator.process_claim_workflow(claim_dict)

                # Safely serialize the workflow state
                workflow_data = safe_serialize_response(workflow_state)

                result = {
                    "success": True,
                    "workflow_state": workflow_data.get("data", workflow_state),
                    "workflow_completed": workflow_state.current_stage == WorkflowStage.COMPLETED,
                }

                logger.info(
                    f"Workflow processing completed for claim: {request.claim_data.claim_id}")
                return result

        except Exception as e:
            logger.error(
                f"Workflow processing failed for claim {request.claim_data.claim_id}: {e}")
            raise WorkflowError(str(e), request.claim_data.claim_id)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in workflow processing: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "claim_id": request.claim_data.claim_id,
        }


@router.post("/process-workflow-with-images")
async def process_claim_workflow_with_images(
    policy_number: str = Form(...),
    incident_date: str = Form(...),
    description: str = Form(...),
    amount: str | None = Form(None),
    claim_id: str | None = Form(None),
    documentation: str | None = Form(None),
    policy_data: str | None = Form(None),
    use_graphflow: bool = Form(False),
    image_files: list[UploadFile] = File(default=[])
):
    """
    Process a claim workflow with image files.

    Args:
        policy_number: Insurance policy number
        incident_date: Date of the incident
        description: Description of the claim
        amount: Claim amount (optional)
        claim_id: Unique claim identifier (optional)
        documentation: Additional documentation (optional)
        policy_data: Policy information as JSON string (optional)
        use_graphflow: Whether to use GraphFlow workflow
        image_files: List of uploaded image files

    Returns:
        Workflow processing result with image analysis
    """
    try:
        orchestrator = OrchestratorAgent()
        await orchestrator.initialize_agents()

        # Prepare claim data
        claim_data = {
            "policy_number": policy_number,
            "incident_date": incident_date,
            "description": description,
            "claim_id": claim_id or f"claim_{policy_number}_{incident_date}",
        }

        if amount:
            try:
                claim_data["amount"] = float(amount)
            except ValueError:
                claim_data["amount"] = amount  # Keep as string if not numeric

        if documentation:
            claim_data["documentation"] = documentation

        # Parse policy data if provided
        if policy_data:
            try:
                import json
                claim_data["policy_data"] = json.loads(policy_data)
            except json.JSONDecodeError:
                claim_data["policy_data"] = {"raw": policy_data}

        # Validate image files
        if image_files:
            valid_files = []
            for file in image_files:
                if file.filename and file.size > 0:
                    valid_files.append(file)

            if valid_files:
                # Process with images
                workflow_state = await orchestrator.process_claim_workflow(
                    claim_data, valid_files
                )
            else:
                # Process without images
                workflow_state = await orchestrator.process_claim_workflow(claim_data)
        else:
            # Process without images
            workflow_state = await orchestrator.process_claim_workflow(claim_data)

        return {
            "success": True,
            "workflow_state": workflow_state.to_dict(),
            "workflow_completed": workflow_state.current_stage == WorkflowStage.COMPLETED,
            "has_images": workflow_state.has_images,
            "image_analysis_available": workflow_state.image_analysis_result is not None,
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "claim_id": claim_data.get("claim_id") if 'claim_data' in locals() else None,
        }


@router.get("/workflow-status/{claim_id}")
async def get_workflow_status(claim_id: str) -> dict[str, Any]:
    """
    Get the current status of a workflow.

    Args:
        claim_id: The ID of the claim to check

    Returns:
        Current workflow status
    """
    try:
        orchestrator = OrchestratorAgent()
        status = orchestrator.get_workflow_status(claim_id)

        if status:
            return {"success": True, "workflow_status": status}
        else:
            return {
                "success": False,
                "error": f"No workflow found for claim ID: {claim_id}",
            }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/active-workflows")
async def get_active_workflows() -> dict[str, Any]:
    """
    Get all active workflows.

    Returns:
        List of all active workflows
    """
    try:
        orchestrator = OrchestratorAgent()
        workflows = orchestrator.get_all_active_workflows()

        return {"success": True, "active_workflows": workflows}

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/assess-complexity")
async def assess_claim_complexity(claim_data: ClaimData) -> dict[str, Any]:
    """
    Assess the complexity of a claim.

    Args:
        claim_data: Claim information

    Returns:
        Complexity assessment result
    """
    try:
        orchestrator = OrchestratorAgent()

        # Convert Pydantic model to dict
        claim_dict = claim_data.model_dump()

        complexity = orchestrator.assess_claim_complexity(claim_dict)

        return {
            "success": True,
            "complexity": complexity.value,
            "claim_id": claim_data.claim_id,
        }

    except Exception as e:
        return {"success": False, "error": str(e), "claim_id": claim_data.claim_id}


@router.get("/info")
async def get_orchestrator_info() -> dict[str, Any]:
    """
    Get information about the orchestrator's capabilities.

    Returns:
        Orchestrator information and capabilities
    """
    try:
        orchestrator = OrchestratorAgent()

        return {
            "success": True,
            "orchestrator_info": {
                "name": orchestrator.name,
                "supported_stages": [stage.value for stage in WorkflowStage],
                "complexity_levels": [level.value for level in ClaimComplexity],
                "escalation_criteria": orchestrator.escalation_criteria,
                "autogen_available": True,  # Since we can instantiate it
            },
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
