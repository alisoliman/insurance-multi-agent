"""Supervisor orchestration for the insurance claim workflow.

This module creates the specialized agents using Microsoft Agent Framework,
builds a sequential workflow, and exposes a `process_claim_with_supervisor` 
helper used by the service layer.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, AsyncIterator, Optional, Type, Union

from dotenv import load_dotenv
from pydantic import BaseModel

from app.core.logging_config import configure_logging
from app.models.agent_outputs import (
    ClaimAssessment,
    CoverageVerification,
    RiskAssessment,
    CustomerCommunication,
    FinalAssessment,
)

from .client import get_chat_client
from .agents.claim_assessor import create_claim_assessor_agent
from .agents.policy_checker import create_policy_checker_agent
from .agents.risk_analyst import create_risk_analyst_agent
from .agents.communication_agent import create_communication_agent
from .agents.synthesizer import create_synthesizer_agent

load_dotenv()

# ---------------------------------------------------------------------------
# Configure logging (pretty icons + single-line formatter)
# ---------------------------------------------------------------------------

configure_logging()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Workflow context dataclass
# ---------------------------------------------------------------------------


@dataclass
class WorkflowContext:
    """Context maintained across workflow execution."""
    claim_data: Dict[str, Any]
    agent_outputs: Dict[str, Union[BaseModel, str]] = field(default_factory=dict)
    structured_outputs: Dict[str, BaseModel] = field(default_factory=dict)  # Typed Pydantic models
    conversation_history: List[Dict[str, Any]] = field(default_factory=list)
    start_time: datetime = field(default_factory=datetime.now)


# ---------------------------------------------------------------------------
# Shared chat client and agents
# ---------------------------------------------------------------------------


def _initialize_agents():
    """Initialize all agents with the shared chat client."""
    chat_client = get_chat_client()
    
    logger.info("✅ Configuration loaded successfully")
    logger.info("✅ Building agents with Microsoft Agent Framework")
    
    agents = {
        "claim_assessor": create_claim_assessor_agent(chat_client),
        "policy_checker": create_policy_checker_agent(chat_client),
        "risk_analyst": create_risk_analyst_agent(chat_client),
        "communication_agent": create_communication_agent(chat_client),
        "synthesizer": create_synthesizer_agent(chat_client),
    }
    
    logger.info("✅ Specialized agents created successfully:")
    logger.info("- 🔍 Claim Assessor: Damage evaluation and cost assessment")
    logger.info("- 📋 Policy Checker: Coverage verification and policy validation")
    logger.info("- ⚠️ Risk Analyst: Fraud detection and risk scoring")
    logger.info("- 📧 Communication Agent: Customer outreach for missing information")
    logger.info("- 📊 Synthesizer: Final assessment generation")
    
    return agents


# Initialize agents at module load
_AGENTS = None


def get_agents():
    """Get or initialize the agent instances."""
    global _AGENTS
    if _AGENTS is None:
        _AGENTS = _initialize_agents()
    return _AGENTS


# ---------------------------------------------------------------------------
# Workflow execution
# ---------------------------------------------------------------------------


def create_insurance_supervisor():
    """Create the workflow coordinator.
    
    Returns the agents dict for use in workflow processing.
    """
    agents = get_agents()
    
    logger.info("✅ Insurance supervisor created successfully")
    logger.info("📊 Workflow: Sequential Agent Execution → Synthesized Decision")
    logger.info("%s", "=" * 80)
    logger.info("🚀 MULTI-AGENT INSURANCE CLAIM PROCESSING SYSTEM")
    logger.info("%s", "=" * 80)
    
    return agents


async def _run_agent(
    agent, 
    agent_name: str, 
    messages: List[Dict[str, Any]], 
    context: WorkflowContext,
    response_format: Optional[Type[BaseModel]] = None
) -> Union[BaseModel, str]:
    """Run a single agent and return its response.
    
    Args:
        agent: The ChatAgent instance to run.
        agent_name: Name of the agent for logging.
        messages: Current conversation history.
        context: Workflow context for tracking.
        response_format: Optional Pydantic model class for structured output.
    
    Returns:
        The agent's response - either a Pydantic model instance (if response_format 
        was provided and successful) or a string.
    """
    logger.info("🔄 Running agent: %s", agent_name)
    
    try:
        # Build the task for the agent including conversation context
        task = "\n\n".join([
            f"[{m['role'].upper()}]: {m['content']}" 
            for m in messages
        ])
        
        # Run the agent with optional structured output format via options
        if response_format:
            # Pass response_format through options parameter per Microsoft Agent Framework docs
            options = {"response_format": response_format}
            result = await agent.run(task, options=options)
        else:
            result = await agent.run(task)
        
        # Extract structured data via response.value if available
        if response_format and hasattr(result, 'value') and result.value is not None:
            # Structured output - response.value is already a Pydantic model instance
            structured_output = result.value
            context.structured_outputs[agent_name] = structured_output
            # Also store string representation for conversation history
            response_text = structured_output.model_dump_json(indent=2)
            context.agent_outputs[agent_name] = response_text
            logger.info("✅ Agent %s completed with structured output: %s", agent_name, type(structured_output).__name__)
            return structured_output
        elif response_format and (not hasattr(result, 'value') or result.value is None):
            # Structured output was requested but response.value is None - log error
            logger.error("❌ Agent %s: structured output requested but response.value is None", agent_name)
            # Fall back to string representation
            response_text = str(result) if result else ""
            context.agent_outputs[agent_name] = response_text
            return response_text
        else:
            # No structured output requested - use string response
            response_text = str(result) if result else ""
            context.agent_outputs[agent_name] = response_text
            logger.info("✅ Agent %s completed", agent_name)
            return response_text
        
    except Exception as e:
        logger.error("❌ Agent %s failed: %s", agent_name, e, exc_info=True)
        error_msg = f"Agent {agent_name} encountered an error: {str(e)}"
        context.agent_outputs[agent_name] = error_msg
        return error_msg


def _build_conversation_message(role: str, content: str) -> Dict[str, Any]:
    """Build a conversation message dict."""
    return {"role": role, "content": content}


async def _execute_workflow_async(claim_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Execute the sequential workflow asynchronously.
    
    Args:
        claim_data: The claim data to process.
    
    Returns:
        List of chunk dicts compatible with the previous API format.
    """
    agents = get_agents()
    context = WorkflowContext(claim_data=claim_data)
    chunks: List[Dict[str, Any]] = []
    
    # Initial user message
    initial_message = _build_conversation_message(
        "user",
        f"Please process this insurance claim:\n\n{json.dumps(claim_data, indent=2)}"
    )
    context.conversation_history.append(initial_message)
    
    # Define the sequential workflow order with response formats
    workflow_order = [
        ("claim_assessor", "Evaluating damage and documentation...", ClaimAssessment),
        ("policy_checker", "Verifying coverage and policy terms...", CoverageVerification),
        ("risk_analyst", "Analyzing fraud risk and claimant history...", RiskAssessment),
    ]
    
    # Run each specialist agent in sequence
    for agent_name, status_msg, response_format in workflow_order:
        logger.info("📍 %s", status_msg)
        
        agent = agents[agent_name]
        response = await _run_agent(
            agent, 
            agent_name, 
            context.conversation_history, 
            context,
            response_format=response_format
        )
        
        # Add agent response to conversation history (serialize if structured)
        if isinstance(response, BaseModel):
            response_text = response.model_dump_json(indent=2)
        else:
            response_text = str(response)
        agent_message = _build_conversation_message("assistant", response_text)
        context.conversation_history.append(agent_message)
        
        # Build chunk in the expected format with structured output
        chunk = {
            agent_name: {
                "messages": [
                    {"role": "user", "content": context.conversation_history[0]["content"]},
                    {"role": "assistant", "content": response_text}
                ],
                "structured_output": response.model_dump() if isinstance(response, BaseModel) else None
            }
        }
        chunks.append(chunk)
    
    # Check if communication agent is needed (based on information gaps in structured outputs)
    def _check_for_missing_info(output) -> bool:
        """Check if an output mentions missing information."""
        if isinstance(output, BaseModel):
            # Check structured output fields for missing info keywords
            output_text = output.model_dump_json().lower()
        else:
            output_text = str(output).lower()
        return any(
            keyword in output_text 
            for keyword in ["missing", "incomplete", "need more", "additional information"]
        )
    
    needs_communication = any(
        _check_for_missing_info(output) 
        for output in context.agent_outputs.values()
    )
    
    if needs_communication:
        logger.info("📍 Drafting customer communication for missing information...")
        agent = agents["communication_agent"]
        response = await _run_agent(
            agent,
            "communication_agent",
            context.conversation_history,
            context,
            response_format=CustomerCommunication  # T024: Pass CustomerCommunication model
        )
        
        # Serialize response for conversation history (T025)
        if isinstance(response, BaseModel):
            response_text = response.model_dump_json(indent=2)
        else:
            response_text = str(response)
        
        agent_message = _build_conversation_message("assistant", response_text)
        context.conversation_history.append(agent_message)
        
        chunk = {
            "communication_agent": {
                "messages": [
                    {"role": "user", "content": context.conversation_history[0]["content"]},
                    {"role": "assistant", "content": response_text}
                ],
                "structured_output": response.model_dump() if isinstance(response, BaseModel) else None
            }
        }
        chunks.append(chunk)
    
    # Run synthesizer to produce final assessment
    logger.info("📍 Synthesizing final assessment...")
    
    # Build synthesis prompt with structured agent outputs (T020)
    synthesis_context = "Based on the following specialist assessments, provide your final synthesis:\n\n"
    for agent_name, output in context.agent_outputs.items():
        if agent_name != "synthesizer":
            # Format structured outputs nicely for synthesis
            if isinstance(output, BaseModel):
                output_text = output.model_dump_json(indent=2)
            else:
                output_text = str(output)
            synthesis_context += f"=== {agent_name.upper()} ASSESSMENT ===\n{output_text}\n\n"
    
    synthesis_message = _build_conversation_message("user", synthesis_context)
    synthesis_history = [synthesis_message]
    
    synthesizer = agents["synthesizer"]
    final_response = await _run_agent(
        synthesizer,
        "synthesizer", 
        synthesis_history,
        context,
        response_format=FinalAssessment  # T021: Pass FinalAssessment model
    )
    
    # Add synthesizer output to chunks with structured output (T022)
    if isinstance(final_response, BaseModel):
        final_response_text = final_response.model_dump_json(indent=2)
    else:
        final_response_text = str(final_response)
    
    chunk = {
        "synthesizer": {
            "messages": [
                {"role": "user", "content": synthesis_context},
                {"role": "assistant", "content": final_response_text}
            ],
            "structured_output": final_response.model_dump() if isinstance(final_response, BaseModel) else None
        }
    }
    chunks.append(chunk)
    
    return chunks


async def process_claim_with_supervisor(claim_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Run the claim through the workflow and return detailed trace information.

    Returns comprehensive trace data including:
    - Agent interactions and handoffs
    - Tool calls and results
    - Message history per agent
    - Workflow state transitions
    
    This is an async function that runs the workflow directly.
    """
    logger.info("")
    logger.info("🚀 Starting supervisor-based claim processing…")
    logger.info("📋 Processing Claim ID: %s", claim_data.get("claim_id", "Unknown"))
    logger.info("%s", "=" * 60)
    
    try:
        # Run the async workflow directly
        chunks = await _execute_workflow_async(claim_data)
        
        logger.info("✅ Workflow completed with %d agent responses", len(chunks))
        return chunks
        
    except Exception as e:
        logger.error("Error in workflow processing: %s", e, exc_info=True)
        raise


# ---------------------------------------------------------------------------
# Streaming support for real-time updates
# ---------------------------------------------------------------------------


async def process_claim_with_supervisor_stream(
    claim_data: Dict[str, Any]
) -> AsyncIterator[Dict[str, Any]]:
    """Stream workflow events for real-time frontend updates.
    
    Yields events as agents start and complete their work.
    
    Args:
        claim_data: The claim data to process.
    
    Yields:
        Event dicts with agent status and outputs.
    """
    agents = get_agents()
    context = WorkflowContext(claim_data=claim_data)
    
    # Initial user message
    initial_message = _build_conversation_message(
        "user",
        f"Please process this insurance claim:\n\n{json.dumps(claim_data, indent=2)}"
    )
    context.conversation_history.append(initial_message)
    
    # Define the sequential workflow order with response formats
    workflow_order = [
        ("claim_assessor", "Evaluating damage and documentation...", ClaimAssessment),
        ("policy_checker", "Verifying coverage and policy terms...", CoverageVerification),
        ("risk_analyst", "Analyzing fraud risk and claimant history...", RiskAssessment),
    ]
    
    # Run each specialist agent in sequence, yielding events
    for agent_name, status_msg, response_format in workflow_order:
        # Yield agent start event
        yield {
            "event_type": "agent_start",
            "agent_name": agent_name,
            "status": status_msg,
            "timestamp": datetime.now().isoformat()
        }
        
        agent = agents[agent_name]
        response = await _run_agent(
            agent, 
            agent_name, 
            context.conversation_history, 
            context,
            response_format=response_format
        )
        
        # Serialize response for conversation history
        if isinstance(response, BaseModel):
            response_text = response.model_dump_json(indent=2)
        else:
            response_text = str(response)
        
        # Add agent response to conversation history
        agent_message = _build_conversation_message("assistant", response_text)
        context.conversation_history.append(agent_message)
        
        # Yield agent complete event with output
        yield {
            "event_type": "agent_complete",
            "agent_name": agent_name,
            "content": response_text,
            "timestamp": datetime.now().isoformat(),
            "structured_output": response.model_dump() if isinstance(response, BaseModel) else None,
            agent_name: {
                "messages": [
                    {"role": "user", "content": context.conversation_history[0]["content"]},
                    {"role": "assistant", "content": response_text}
                ],
                "structured_output": response.model_dump() if isinstance(response, BaseModel) else None
            }
        }
    
    # Check if communication agent is needed (using helper function for structured outputs)
    def _check_for_missing_info_stream(output) -> bool:
        """Check if an output mentions missing information."""
        if isinstance(output, BaseModel):
            output_text = output.model_dump_json().lower()
        else:
            output_text = str(output).lower()
        return any(
            keyword in output_text 
            for keyword in ["missing", "incomplete", "need more", "additional information"]
        )
    
    needs_communication = any(
        _check_for_missing_info_stream(output) 
        for output in context.agent_outputs.values()
    )
    
    if needs_communication:
        yield {
            "event_type": "agent_start",
            "agent_name": "communication_agent",
            "status": "Drafting customer communication...",
            "timestamp": datetime.now().isoformat()
        }
        
        agent = agents["communication_agent"]
        response = await _run_agent(
            agent,
            "communication_agent",
            context.conversation_history,
            context,
            response_format=CustomerCommunication
        )
        
        # Serialize response
        if isinstance(response, BaseModel):
            response_text = response.model_dump_json(indent=2)
        else:
            response_text = str(response)
        
        agent_message = _build_conversation_message("assistant", response_text)
        context.conversation_history.append(agent_message)
        
        yield {
            "event_type": "agent_complete",
            "agent_name": "communication_agent",
            "content": response_text,
            "timestamp": datetime.now().isoformat(),
            "structured_output": response.model_dump() if isinstance(response, BaseModel) else None,
            "communication_agent": {
                "messages": [
                    {"role": "user", "content": context.conversation_history[0]["content"]},
                    {"role": "assistant", "content": response_text}
                ],
                "structured_output": response.model_dump() if isinstance(response, BaseModel) else None
            }
        }
    
    # Run synthesizer
    yield {
        "event_type": "agent_start",
        "agent_name": "synthesizer",
        "status": "Synthesizing final assessment...",
        "timestamp": datetime.now().isoformat()
    }
    
    # Build synthesis prompt with structured outputs
    synthesis_context = "Based on the following specialist assessments, provide your final synthesis:\n\n"
    for agent_name, output in context.agent_outputs.items():
        if agent_name != "synthesizer":
            if isinstance(output, BaseModel):
                output_text = output.model_dump_json(indent=2)
            else:
                output_text = str(output)
            synthesis_context += f"=== {agent_name.upper()} ASSESSMENT ===\n{output_text}\n\n"
    
    synthesis_message = _build_conversation_message("user", synthesis_context)
    synthesis_history = [synthesis_message]
    
    synthesizer = agents["synthesizer"]
    final_response = await _run_agent(
        synthesizer,
        "synthesizer", 
        synthesis_history,
        context,
        response_format=FinalAssessment
    )
    
    # Serialize final response
    if isinstance(final_response, BaseModel):
        final_response_text = final_response.model_dump_json(indent=2)
    else:
        final_response_text = str(final_response)
    
    yield {
        "event_type": "agent_complete",
        "agent_name": "synthesizer",
        "content": final_response_text,
        "timestamp": datetime.now().isoformat(),
        "structured_output": final_response.model_dump() if isinstance(final_response, BaseModel) else None,
        "synthesizer": {
            "messages": [
                {"role": "user", "content": synthesis_context},
                {"role": "assistant", "content": final_response_text}
            ],
            "structured_output": final_response.model_dump() if isinstance(final_response, BaseModel) else None
        }
    }
    
    # Final workflow complete event
    yield {
        "event_type": "workflow_complete",
        "agent_name": None,
        "timestamp": datetime.now().isoformat()
    }


# Lazy initialization of the supervisor (maintains compatibility)
# The supervisor is now initialized on first use rather than at module import
# This allows the module to be imported even when Azure credentials aren't available
_insurance_supervisor = None


def get_insurance_supervisor():
    """Get or create the insurance supervisor singleton.
    
    This function provides lazy initialization of the supervisor,
    allowing the module to be imported without requiring Azure credentials.
    """
    global _insurance_supervisor
    if _insurance_supervisor is None:
        _insurance_supervisor = create_insurance_supervisor()
    return _insurance_supervisor
