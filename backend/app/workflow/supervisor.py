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
from typing import Any, Dict, List, AsyncIterator

from dotenv import load_dotenv

from app.core.logging_config import configure_logging

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
    agent_outputs: Dict[str, str] = field(default_factory=dict)
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


async def _run_agent(agent, agent_name: str, messages: List[Dict[str, Any]], context: WorkflowContext) -> str:
    """Run a single agent and return its response.
    
    Args:
        agent: The ChatAgent instance to run.
        agent_name: Name of the agent for logging.
        messages: Current conversation history.
        context: Workflow context for tracking.
    
    Returns:
        The agent's response text.
    """
    logger.info("🔄 Running agent: %s", agent_name)
    
    try:
        # Build the task for the agent including conversation context
        task = "\n\n".join([
            f"[{m['role'].upper()}]: {m['content']}" 
            for m in messages
        ])
        
        # Run the agent
        result = await agent.run(task)
        
        # Extract the response text
        response_text = str(result) if result else ""
        
        # Store in context
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
    
    # Define the sequential workflow order
    workflow_order = [
        ("claim_assessor", "Evaluating damage and documentation..."),
        ("policy_checker", "Verifying coverage and policy terms..."),
        ("risk_analyst", "Analyzing fraud risk and claimant history..."),
    ]
    
    # Run each specialist agent in sequence
    for agent_name, status_msg in workflow_order:
        logger.info("📍 %s", status_msg)
        
        agent = agents[agent_name]
        response = await _run_agent(
            agent, 
            agent_name, 
            context.conversation_history, 
            context
        )
        
        # Add agent response to conversation history
        agent_message = _build_conversation_message("assistant", response)
        context.conversation_history.append(agent_message)
        
        # Build chunk in the expected format
        chunk = {
            agent_name: {
                "messages": [
                    {"role": "user", "content": context.conversation_history[0]["content"]},
                    {"role": "assistant", "content": response}
                ]
            }
        }
        chunks.append(chunk)
    
    # Check if communication agent is needed (based on information gaps)
    needs_communication = any(
        keyword in output.lower() 
        for output in context.agent_outputs.values()
        for keyword in ["missing", "incomplete", "need more", "additional information"]
    )
    
    if needs_communication:
        logger.info("📍 Drafting customer communication for missing information...")
        agent = agents["communication_agent"]
        response = await _run_agent(
            agent,
            "communication_agent",
            context.conversation_history,
            context
        )
        
        agent_message = _build_conversation_message("assistant", response)
        context.conversation_history.append(agent_message)
        
        chunk = {
            "communication_agent": {
                "messages": [
                    {"role": "user", "content": context.conversation_history[0]["content"]},
                    {"role": "assistant", "content": response}
                ]
            }
        }
        chunks.append(chunk)
    
    # Run synthesizer to produce final assessment
    logger.info("📍 Synthesizing final assessment...")
    
    # Build synthesis prompt with all agent outputs
    synthesis_context = "Based on the following specialist assessments, provide your final synthesis:\n\n"
    for agent_name, output in context.agent_outputs.items():
        if agent_name != "synthesizer":
            synthesis_context += f"=== {agent_name.upper()} ASSESSMENT ===\n{output}\n\n"
    
    synthesis_message = _build_conversation_message("user", synthesis_context)
    synthesis_history = [synthesis_message]
    
    synthesizer = agents["synthesizer"]
    final_response = await _run_agent(
        synthesizer,
        "synthesizer", 
        synthesis_history,
        context
    )
    
    # Add synthesizer output to chunks
    chunk = {
        "synthesizer": {
            "messages": [
                {"role": "user", "content": synthesis_context},
                {"role": "assistant", "content": final_response}
            ]
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
    
    # Define the sequential workflow order
    workflow_order = [
        ("claim_assessor", "Evaluating damage and documentation..."),
        ("policy_checker", "Verifying coverage and policy terms..."),
        ("risk_analyst", "Analyzing fraud risk and claimant history..."),
    ]
    
    # Run each specialist agent in sequence, yielding events
    for agent_name, status_msg in workflow_order:
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
            context
        )
        
        # Add agent response to conversation history
        agent_message = _build_conversation_message("assistant", response)
        context.conversation_history.append(agent_message)
        
        # Yield agent complete event with output
        yield {
            "event_type": "agent_complete",
            "agent_name": agent_name,
            "content": response,
            "timestamp": datetime.now().isoformat(),
            agent_name: {
                "messages": [
                    {"role": "user", "content": context.conversation_history[0]["content"]},
                    {"role": "assistant", "content": response}
                ]
            }
        }
    
    # Check if communication agent is needed
    needs_communication = any(
        keyword in output.lower() 
        for output in context.agent_outputs.values()
        for keyword in ["missing", "incomplete", "need more", "additional information"]
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
            context
        )
        
        agent_message = _build_conversation_message("assistant", response)
        context.conversation_history.append(agent_message)
        
        yield {
            "event_type": "agent_complete",
            "agent_name": "communication_agent",
            "content": response,
            "timestamp": datetime.now().isoformat(),
            "communication_agent": {
                "messages": [
                    {"role": "user", "content": context.conversation_history[0]["content"]},
                    {"role": "assistant", "content": response}
                ]
            }
        }
    
    # Run synthesizer
    yield {
        "event_type": "agent_start",
        "agent_name": "synthesizer",
        "status": "Synthesizing final assessment...",
        "timestamp": datetime.now().isoformat()
    }
    
    # Build synthesis prompt
    synthesis_context = "Based on the following specialist assessments, provide your final synthesis:\n\n"
    for agent_name, output in context.agent_outputs.items():
        if agent_name != "synthesizer":
            synthesis_context += f"=== {agent_name.upper()} ASSESSMENT ===\n{output}\n\n"
    
    synthesis_message = _build_conversation_message("user", synthesis_context)
    synthesis_history = [synthesis_message]
    
    synthesizer = agents["synthesizer"]
    final_response = await _run_agent(
        synthesizer,
        "synthesizer", 
        synthesis_history,
        context
    )
    
    yield {
        "event_type": "agent_complete",
        "agent_name": "synthesizer",
        "content": final_response,
        "timestamp": datetime.now().isoformat(),
        "synthesizer": {
            "messages": [
                {"role": "user", "content": synthesis_context},
                {"role": "assistant", "content": final_response}
            ]
        }
    }
    
    # Final workflow complete event
    yield {
        "event_type": "workflow_complete",
        "agent_name": None,
        "timestamp": datetime.now().isoformat()
    }


# Initialize the supervisor at module load (maintains compatibility)
insurance_supervisor = create_insurance_supervisor()
