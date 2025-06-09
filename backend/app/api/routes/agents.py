"""
API routes for AutoGen agent testing and interaction.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional, List

from app.agents.base import ClaimAssessmentAgent, CustomerCommunicationAgent
from app.agents.orchestrator import OrchestratorAgent, WorkflowStage, ClaimComplexity
from app.agents.assessment import (
    EnhancedAssessmentAgent,
    AssessmentDecision,
    ConfidenceLevel,
)
from app.agents.communication import (
    EnhancedCommunicationAgent,
    CommunicationType,
    CommunicationContext,
    Language,
)
from app.schemas.agents import AgentTestRequest, AgentTestResponse
from app.schemas.claims import (
    ClaimData,
    CustomerInquiry,
    WorkflowRequest,
    WorkflowStatusResponse,
    EnhancedAssessmentRequest,
    EnhancedAssessmentResponse,
)
from app.schemas.communication import (
    CommunicationRequest,
    AssessmentBasedCommunicationRequest,
)

router = APIRouter()


@router.post("/process", response_model=AgentTestResponse)
async def process_agent_message(request: AgentTestRequest):
    """
    Process a message through a specific AutoGen agent.

    Args:
        request: Contains the message and agent type

    Returns:
        Agent response and metadata
    """
    try:
        # Select the appropriate agent
        if request.agent_type == "assessment":
            agent = ClaimAssessmentAgent()
        elif request.agent_type == "communication":
            agent = CustomerCommunicationAgent()
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid agent type. Use 'assessment' or 'communication'",
            )

        # Process the message
        response = await agent.process_message(request.message)

        return AgentTestResponse(
            success=True,
            agent_name=agent.name,
            message=request.message,
            response=response,
        )

    except Exception as e:
        return AgentTestResponse(
            success=False,
            agent_name="Unknown",
            message=request.message,
            response="",
            error=str(e),
        )


@router.post("/process-claim")
async def process_insurance_claim(claim_data: ClaimData):
    """
    Process a structured insurance claim using the ClaimAssessmentAgent.
    Demonstrates insurance-specific functionality.

    Args:
        claim_data: Structured claim information

    Returns:
        Detailed claim assessment
    """
    try:
        agent = ClaimAssessmentAgent()

        # Convert Pydantic model to dict
        claim_dict = claim_data.model_dump()

        # Use the specialized claim assessment method
        assessment = await agent.assess_claim_validity(claim_dict)

        return {
            "success": True,
            "assessment": assessment,
            "agent_info": agent.get_agent_info(),
        }

    except Exception as e:
        return {"success": False, "error": str(e), "claim_id": claim_data.claim_id}


@router.post("/draft-response")
async def draft_customer_response(inquiry: CustomerInquiry):
    """
    Draft a customer response using the CustomerCommunicationAgent.
    Demonstrates insurance-specific customer communication features.

    Args:
        inquiry: Customer inquiry with optional context

    Returns:
        Drafted response with metadata
    """
    try:
        agent = CustomerCommunicationAgent()

        # Prepare context if provided
        context = None
        if any([inquiry.customer_id, inquiry.claim_status, inquiry.policy_type]):
            context = {
                "customer_id": inquiry.customer_id,
                "claim_status": inquiry.claim_status,
                "policy_type": inquiry.policy_type,
            }

        # Use the specialized customer response method
        response = await agent.draft_customer_response(inquiry.inquiry, context)

        return {
            "success": True,
            "response": response,
            "agent_info": agent.get_agent_info(),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/agent-info/{agent_type}")
async def get_agent_info(agent_type: str):
    """
    Get detailed information about an agent's capabilities.
    Demonstrates the hybrid approach's introspection features.

    Args:
        agent_type: Type of agent ("assessment" or "communication")

    Returns:
        Agent information and capabilities
    """
    try:
        if agent_type == "assessment":
            agent = ClaimAssessmentAgent()
        elif agent_type == "communication":
            agent = CustomerCommunicationAgent()
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid agent type. Use 'assessment' or 'communication'",
            )

        info = agent.get_agent_info()

        # Add AutoGen compatibility demonstration
        autogen_methods = []
        for method_name in dir(agent):
            if not method_name.startswith("_") and hasattr(agent.agent, method_name):
                autogen_methods.append(method_name)

        info["autogen_delegated_methods"] = autogen_methods[:10]  # Show first 10
        info["total_autogen_methods"] = len(autogen_methods)

        return {"success": True, "agent_info": info}

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/validate-context/{message}")
async def validate_insurance_context(message: str):
    """
    Validate if a message contains insurance-related context.
    Demonstrates insurance-specific validation features.

    Args:
        message: Message to validate

    Returns:
        Validation result
    """
    try:
        # Use either agent for context validation
        agent = ClaimAssessmentAgent()
        is_valid = agent.validate_insurance_context(message)

        return {
            "success": True,
            "message": message,
            "is_insurance_related": is_valid,
            "validated_by": agent.name,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/test-autogen-compatibility")
async def test_autogen_compatibility():
    """
    Test AutoGen compatibility by accessing delegated methods.
    Demonstrates the hybrid approach's AutoGen integration.

    Returns:
        Compatibility test results
    """
    try:
        agent = ClaimAssessmentAgent()

        # Test accessing AutoGen properties/methods through delegation
        compatibility_tests = {}

        # Test 1: Access agent name through delegation
        try:
            delegated_name = agent.name  # This should work through our property
            compatibility_tests["name_access"] = {
                "success": True,
                "value": delegated_name,
            }
        except Exception as e:
            compatibility_tests["name_access"] = {"success": False, "error": str(e)}

        # Test 2: Check if we can access model_client
        try:
            model_client_type = type(agent.model_client).__name__
            compatibility_tests["model_client_access"] = {
                "success": True,
                "type": model_client_type,
            }
        except Exception as e:
            compatibility_tests["model_client_access"] = {
                "success": False,
                "error": str(e),
            }

        # Test 3: Check AutoGen agent properties
        try:
            autogen_name = agent.agent.name
            compatibility_tests["autogen_agent_access"] = {
                "success": True,
                "name": autogen_name,
            }
        except Exception as e:
            compatibility_tests["autogen_agent_access"] = {
                "success": False,
                "error": str(e),
            }

        return {
            "success": True,
            "compatibility_tests": compatibility_tests,
            "agent_type": type(agent).__name__,
            "hybrid_approach": "working",
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/test-azure-openai")
async def test_azure_openai_connection():
    """
    Test the Azure OpenAI connection directly.

    Returns:
        Status of the Azure OpenAI connection and configuration
    """
    try:
        from app.agents.base import AutoGenConfig
        from app.core.config import settings

        # Check configuration
        config_status = {
            "azure_openai_api_key_set": bool(settings.AZURE_OPENAI_API_KEY),
            "azure_openai_endpoint_set": bool(settings.AZURE_OPENAI_ENDPOINT),
            "azure_openai_deployment_name": settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            "azure_openai_api_version": settings.AZURE_OPENAI_API_VERSION,
        }

        # Try to create a model client
        model_client = AutoGenConfig.get_model_client()
        if model_client is None:
            return {
                "success": False,
                "error": "Could not create Azure OpenAI model client",
                "config": config_status,
            }

        # Try to create an agent and test a simple interaction
        agent = ClaimAssessmentAgent()
        test_response = await agent.process_message(
            "Please respond with 'Azure OpenAI is working' to confirm the connection."
        )

        return {
            "success": True,
            "config": config_status,
            "model_client_type": str(type(model_client).__name__),
            "test_response": test_response,
            "agent_name": agent.name,
            "hybrid_features": agent.get_agent_info(),
        }

    except Exception as e:
        return {"success": False, "error": str(e), "error_type": type(e).__name__}


@router.get("/health")
async def agent_health_check():
    """
    Health check for the agents module.

    Returns:
        Status of the AutoGen integration and hybrid features
    """
    try:
        # Try to instantiate both agent types
        assessment_agent = ClaimAssessmentAgent()
        communication_agent = CustomerCommunicationAgent()

        return {
            "status": "healthy",
            "autogen_version": "0.6.1",
            "agents_available": ["ClaimAssessmentAgent", "CustomerCommunicationAgent"],
            "model_client": str(type(assessment_agent.model_client).__name__),
            "hybrid_approach": "enabled",
            "insurance_features": {
                "claim_processing": True,
                "context_validation": True,
                "structured_assessment": True,
                "customer_communication": True,
            },
            "autogen_compatibility": True,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Agents module unhealthy: {str(e)}"
        )


# Orchestrator Agent Endpoints

# Workflow models imported from schemas


@router.post("/orchestrator/process-workflow")
async def process_claim_workflow(request: WorkflowRequest):
    """
    Process a claim through the orchestrator agent workflow.

    This endpoint demonstrates the full multi-agent workflow coordination
    using the OrchestratorAgent to manage Assessment and Communication agents.

    Args:
        request: Contains claim data and workflow options

    Returns:
        Complete workflow state and results
    """
    try:
        orchestrator = OrchestratorAgent()

        # Convert claim data to dict
        claim_dict = request.claim_data.model_dump()

        if request.use_graphflow:
            # Use AutoGen GraphFlow for structured workflow
            result = await orchestrator.run_graphflow_workflow(claim_dict)
            return {
                "success": result.get("success", False),
                "workflow_type": "graphflow",
                "result": result,
                "orchestrator_info": orchestrator.get_agent_info(),
            }
        else:
            # Use custom workflow orchestration
            workflow_state = await orchestrator.process_claim_workflow(claim_dict)
            return {
                "success": True,
                "workflow_type": "custom",
                "workflow_state": workflow_state.to_dict(),
                "orchestrator_info": orchestrator.get_agent_info(),
            }

    except Exception as e:
        return {"success": False, "error": str(e), "workflow_type": "failed"}


@router.get("/orchestrator/workflow-status/{claim_id}")
async def get_workflow_status(claim_id: str):
    """
    Get the current status of a workflow by claim ID.

    Args:
        claim_id: The ID of the claim to check

    Returns:
        Current workflow status and stage information
    """
    try:
        orchestrator = OrchestratorAgent()
        workflow_status = orchestrator.get_workflow_status(claim_id)

        if workflow_status:
            return {
                "success": True,
                "claim_id": claim_id,
                "workflow_status": workflow_status,
            }
        else:
            return {
                "success": False,
                "error": f"No workflow found for claim ID: {claim_id}",
            }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/orchestrator/active-workflows")
async def get_active_workflows():
    """
    Get all currently active workflows.

    Returns:
        Dictionary of all active workflows with their current states
    """
    try:
        orchestrator = OrchestratorAgent()
        active_workflows = orchestrator.get_all_active_workflows()

        return {
            "success": True,
            "active_workflows": active_workflows,
            "total_count": len(active_workflows),
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/orchestrator/assess-complexity")
async def assess_claim_complexity(claim_data: ClaimData):
    """
    Assess the complexity of a claim without processing it.

    Args:
        claim_data: Claim information to assess

    Returns:
        Complexity assessment and routing recommendations
    """
    try:
        orchestrator = OrchestratorAgent()
        claim_dict = claim_data.model_dump()

        complexity = orchestrator.assess_claim_complexity(claim_dict)
        should_escalate = orchestrator.should_escalate_to_human(claim_dict, [])

        return {
            "success": True,
            "claim_id": claim_data.claim_id,
            "complexity": complexity.value,
            "should_escalate_to_human": should_escalate,
            "escalation_criteria": orchestrator.escalation_criteria,
            "routing_recommendation": {
                "workflow_path": "human_review" if should_escalate else "automated",
                "estimated_processing_time": "immediate"
                if complexity == ClaimComplexity.LOW
                else "extended",
                "required_agents": ["assessment", "communication"]
                if not should_escalate
                else ["assessment", "human_reviewer"],
            },
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/orchestrator/info")
async def get_orchestrator_info():
    """
    Get information about the orchestrator agent and its capabilities.
    """
    try:
        orchestrator = OrchestratorAgent()

        return {
            "success": True,
            "agent_info": {
                "name": orchestrator.name,
                "type": "OrchestratorAgent",
                "capabilities": [
                    "workflow_coordination",
                    "complexity_assessment",
                    "agent_routing",
                    "human_escalation",
                    "graphflow_support",
                ],
                "workflow_stages": [stage.value for stage in WorkflowStage],
                "complexity_levels": [level.value for level in ClaimComplexity],
                "escalation_criteria": orchestrator.escalation_criteria,
                "active_workflows": len(orchestrator.active_workflows),
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# Enhanced Assessment Agent Endpoints

# Assessment models imported from schemas


@router.post("/enhanced-assessment/assess-claim")
async def enhanced_assess_claim(request: EnhancedAssessmentRequest):
    """
    Perform comprehensive claim assessment using the Enhanced Assessment Agent.

    This endpoint demonstrates the LLM-driven assessment capabilities with
    structured output, risk analysis, and confidence scoring.
    """
    try:
        agent = EnhancedAssessmentAgent()

        # Convert Pydantic model to dict
        claim_dict = request.claim_data.model_dump()

        # Perform enhanced assessment
        result = await agent.assess_claim(claim_dict, request.policy_data)

        return EnhancedAssessmentResponse(
            success=True, assessment_result=result.to_dict()
        )

    except Exception as e:
        return EnhancedAssessmentResponse(success=False, error=str(e))


@router.post("/enhanced-assessment/assess-claim-legacy")
async def enhanced_assess_claim_legacy(request: EnhancedAssessmentRequest):
    """
    Perform claim assessment using the Enhanced Assessment Agent with legacy format.

    This endpoint maintains compatibility with existing orchestrator integration
    while providing enhanced capabilities.
    """
    try:
        agent = EnhancedAssessmentAgent()

        # Convert Pydantic model to dict
        claim_dict = request.claim_data.model_dump()

        # Use legacy compatibility method
        result = await agent.assess_claim_validity(claim_dict, request.policy_data)

        return {
            "success": True,
            "assessment": result,
            "agent_info": {
                "name": agent.name,
                "type": "EnhancedAssessmentAgent",
                "enhanced_features": True,
            },
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/enhanced-assessment/capabilities")
async def get_enhanced_assessment_capabilities():
    """
    Get information about the Enhanced Assessment Agent capabilities.
    """
    try:
        agent = EnhancedAssessmentAgent()
        capabilities = agent.get_assessment_capabilities()

        return {
            "success": True,
            "capabilities": capabilities,
            "decision_types": [d.value for d in AssessmentDecision],
            "confidence_levels": [c.value for c in ConfidenceLevel],
            "confidence_thresholds": agent.confidence_thresholds,
            "risk_weights": agent.risk_weights,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/enhanced-assessment/batch-assess")
async def batch_assess_claims(claims: List[EnhancedAssessmentRequest]):
    """
    Perform batch assessment of multiple claims using the Enhanced Assessment Agent.

    Useful for processing multiple claims efficiently while maintaining
    individual assessment quality.
    """
    try:
        agent = EnhancedAssessmentAgent()
        results = []

        for i, request in enumerate(claims):
            try:
                claim_dict = request.claim_data.model_dump()
                result = await agent.assess_claim(claim_dict, request.policy_data)

                results.append(
                    {
                        "index": i,
                        "claim_id": claim_dict.get("claim_id", f"batch_{i}"),
                        "success": True,
                        "assessment": result.to_dict(),
                    }
                )

            except Exception as e:
                results.append(
                    {
                        "index": i,
                        "claim_id": request.claim_data.claim_id or f"batch_{i}",
                        "success": False,
                        "error": str(e),
                    }
                )

        # Calculate batch statistics
        successful_assessments = [r for r in results if r["success"]]
        success_rate = len(successful_assessments) / len(results) if results else 0

        return {
            "success": True,
            "batch_results": results,
            "batch_statistics": {
                "total_claims": len(results),
                "successful_assessments": len(successful_assessments),
                "success_rate": success_rate,
                "failed_assessments": len(results) - len(successful_assessments),
            },
        }

    except Exception as e:
        return {"success": False, "error": str(e), "batch_results": []}


@router.get("/enhanced-assessment/test-integration")
async def test_enhanced_assessment_integration():
    """
    Test the Enhanced Assessment Agent integration with sample data.

    This endpoint provides a quick way to verify that the enhanced assessment
    system is working correctly with realistic claim scenarios.
    """
    try:
        agent = EnhancedAssessmentAgent()

        # Test scenarios
        test_scenarios = [
            {
                "name": "Simple Auto Claim",
                "claim_data": {
                    "claim_id": "TEST_001",
                    "policy_number": "AUTO_12345",
                    "incident_date": "2024-01-15",
                    "description": "Minor fender bender in parking lot. Small dent on rear bumper.",
                    "amount": 1500,
                    "incident_report": True,
                    "photos": True,
                },
            },
            {
                "name": "High-Value Claim",
                "claim_data": {
                    "claim_id": "TEST_002",
                    "policy_number": "AUTO_67890",
                    "incident_date": "2024-01-10",
                    "description": "Total loss due to collision with commercial vehicle.",
                    "amount": 75000,
                    "incident_report": True,
                    "photos": True,
                    "police_report": True,
                },
            },
            {
                "name": "Suspicious Claim",
                "claim_data": {
                    "claim_id": "TEST_003",
                    "policy_number": "AUTO_11111",
                    "incident_date": "2024-01-20",
                    "description": "Vehicle stolen from secure parking garage with no witnesses or security footage.",
                    "amount": 45000,
                    "incident_report": False,
                    "photos": False,
                    "police_report": True,
                },
            },
        ]

        test_results = []

        for scenario in test_scenarios:
            try:
                result = await agent.assess_claim(scenario["claim_data"])
                test_results.append(
                    {
                        "scenario": scenario["name"],
                        "success": True,
                        "decision": result.decision.value,
                        "confidence": result.confidence_score,
                        "confidence_level": result.confidence_level.value,
                        "processing_time": result.processing_time_seconds,
                        "risk_factors_count": len(result.risk_factors),
                        "reasoning_preview": result.reasoning[:100] + "..."
                        if len(result.reasoning) > 100
                        else result.reasoning,
                    }
                )
            except Exception as e:
                test_results.append(
                    {"scenario": scenario["name"], "success": False, "error": str(e)}
                )

        return {
            "success": True,
            "integration_test_results": test_results,
            "agent_info": agent.get_assessment_capabilities(),
            "test_summary": {
                "total_scenarios": len(test_scenarios),
                "successful_tests": len([r for r in test_results if r["success"]]),
                "average_processing_time": sum(
                    [r.get("processing_time", 0) for r in test_results if r["success"]]
                )
                / len([r for r in test_results if r["success"]])
                if any(r["success"] for r in test_results)
                else 0,
            },
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


# Enhanced Communication Agent Endpoints


@router.get("/enhanced-communication/capabilities")
async def get_enhanced_communication_capabilities():
    """
    Get information about the Enhanced Communication Agent capabilities.
    """
    try:
        agent = EnhancedCommunicationAgent()
        capabilities = agent.get_communication_capabilities()

        return {
            "success": True,
            "capabilities": capabilities,
            "agent_status": "operational",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get capabilities: {str(e)}"
        )


# Communication models imported from schemas


@router.post("/enhanced-communication/generate")
async def generate_communication(request: CommunicationRequest):
    """
    Generate a personalized communication using the Enhanced Communication Agent.
    """
    try:
        agent = EnhancedCommunicationAgent()

        # Create communication context
        context = CommunicationContext(
            customer_name=request.customer_name,
            claim_id=request.claim_id,
            policy_number=request.policy_number,
            communication_type=CommunicationType(request.communication_type),
            assessment_result=request.assessment_result,
            policy_details=request.policy_details,
            preferred_language=Language(request.preferred_language),
            special_instructions=request.special_instructions,
            urgency_level=request.urgency_level,
        )

        # Generate communication
        result = await agent.generate_communication(context)

        return {
            "success": True,
            "communication_result": result.to_dict(),
            "processing_time": result.processing_time_seconds,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid request: {str(e)}")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Communication generation failed: {str(e)}"
        )


# Assessment-based communication models imported from schemas


@router.post("/enhanced-communication/from-assessment")
async def generate_communication_from_assessment(
    request: AssessmentBasedCommunicationRequest,
):
    """
    Generate communication based on assessment result (for orchestrator integration).
    """
    try:
        agent = EnhancedCommunicationAgent()

        result = await agent.generate_communication_from_assessment(
            request.assessment_result, request.customer_data
        )

        return {
            "success": True,
            "communication_result": result.to_dict(),
            "processing_time": result.processing_time_seconds,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Communication generation failed: {str(e)}"
        )


@router.get("/enhanced-communication/test-integration")
async def test_enhanced_communication_integration():
    """
    Test the Enhanced Communication Agent with sample scenarios.
    """
    try:
        agent = EnhancedCommunicationAgent()

        # Test scenarios
        test_scenarios = [
            {
                "name": "Claim Approval",
                "context": CommunicationContext(
                    customer_name="John Smith",
                    claim_id="CLM_001",
                    policy_number="POL_12345",
                    communication_type=CommunicationType.APPROVAL_NOTIFICATION,
                    assessment_result={
                        "decision": "approve",
                        "confidence_score": 0.92,
                        "reasoning": "All documentation provided, clear liability, within policy limits",
                    },
                    policy_details={
                        "policy_type": "Auto Insurance",
                        "coverage_limits": "$50,000",
                        "deductible": "$500",
                    },
                ),
            },
            {
                "name": "Information Request",
                "context": CommunicationContext(
                    customer_name="Maria Garcia",
                    claim_id="CLM_002",
                    policy_number="POL_67890",
                    communication_type=CommunicationType.INFORMATION_REQUEST,
                    preferred_language=Language.SPANISH,
                    special_instructions="Request police report and additional photos",
                ),
            },
        ]

        results = []
        for scenario in test_scenarios:
            result = await agent.generate_communication(scenario["context"])
            results.append(
                {
                    "scenario": scenario["name"],
                    "subject": result.subject,
                    "content_preview": result.content[:200] + "..."
                    if len(result.content) > 200
                    else result.content,
                    "personalization_score": result.personalization_score,
                    "compliance_verified": result.compliance_verified,
                    "processing_time": result.processing_time_seconds,
                    "language": result.language.value,
                    "tone": result.tone.value,
                }
            )

        return {
            "success": True,
            "test_results": results,
            "agent_status": "operational",
            "llm_integration": "verified",
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Integration test failed: {str(e)}"
        )


@router.get("/enhanced-communication/supported-languages")
async def get_supported_languages():
    """
    Get list of supported languages for communication generation.
    """
    try:
        agent = EnhancedCommunicationAgent()

        return {
            "success": True,
            "supported_languages": [
                {"code": lang.value, "name": lang.name.title()}
                for lang in agent.supported_languages
            ],
            "default_language": "en",
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get languages: {str(e)}"
        )


@router.get("/enhanced-communication/communication-types")
async def get_communication_types():
    """
    Get list of available communication types.
    """
    try:
        return {
            "success": True,
            "communication_types": [
                {
                    "type": ct.value,
                    "name": ct.name.replace("_", " ").title(),
                    "description": f"Communication for {ct.value.replace('_', ' ')}",
                }
                for ct in CommunicationType
            ],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get communication types: {str(e)}"
        )
