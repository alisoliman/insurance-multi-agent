"""Supervisor orchestration for the insurance claim workflow.

This module creates the specialized agents, compiles the LangGraph supervisor,
and exposes a `process_claim_with_supervisor` helper used by the service layer.
"""
from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List

from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langgraph_supervisor import create_supervisor

from app.core.logging_config import configure_logging

from .agents.claim_assessor import create_claim_assessor_agent
from .agents.policy_checker import create_policy_checker_agent
from .agents.risk_analyst import create_risk_analyst_agent
from .agents.communication_agent import create_communication_agent

load_dotenv()

# ---------------------------------------------------------------------------
# Configure logging (pretty icons + single-line formatter)
# ---------------------------------------------------------------------------

configure_logging()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Shared LLM configuration (Azure OpenAI)
# ---------------------------------------------------------------------------


def _build_llm() -> AzureChatOpenAI:  # noqa: D401
    """Instantiate AzureChatOpenAI with centralized config; fall back to dummy config."""
    from app.core.config import get_settings

    settings = get_settings()
    endpoint = settings.azure_openai_endpoint
    deployment = settings.azure_openai_deployment_name or "gpt-4o"
    api_key = settings.azure_openai_api_key

    logger.info("✅ Configuration loaded successfully")
    logger.info("Azure OpenAI Endpoint: %s", endpoint or "Not set")
    logger.info("Deployment Name: %s", deployment)
    logger.info("API Key configured: %s", "Yes" if api_key else "No")

    try:
        return AzureChatOpenAI(
            azure_deployment=deployment,
            api_key=api_key,
            azure_endpoint=endpoint,
            api_version="2024-02-15-preview",
            temperature=0.1,
        )
    except Exception as err:  # pragma: no cover – easier local dev without keys
        logger.warning("Falling back to AzureChatOpenAI stub (%s)", err)
        # Minimal stub implementing `.generate` interface to avoid crashes
        from langchain_core.language_models.fake import FakeListLLM

        return FakeListLLM(responses=["stub"])


LLM = _build_llm()

# ---------------------------------------------------------------------------
# Create specialized agents
# ---------------------------------------------------------------------------

claim_assessor = create_claim_assessor_agent(LLM)
policy_checker = create_policy_checker_agent(LLM)
risk_analyst = create_risk_analyst_agent(LLM)
communication_agent = create_communication_agent(LLM)

logger.info("✅ Specialized agents created successfully:")
logger.info("- 🔍 Claim Assessor: Damage evaluation and cost assessment")
logger.info("- 📋 Policy Checker: Coverage verification and policy validation")
logger.info("- ⚠️ Risk Analyst: Fraud detection and risk scoring")
logger.info("- 📧 Communication Agent: Customer outreach for missing information")

# ---------------------------------------------------------------------------
# Compile supervisor
# ---------------------------------------------------------------------------


def create_insurance_supervisor():  # noqa: D401
    """Create and compile the supervisor coordinating all agents."""

    supervisor = create_supervisor(
        agents=[claim_assessor, policy_checker,
                risk_analyst, communication_agent],
        model=LLM,
        prompt="""You are a senior claims manager supervising a team of insurance claim processing specialists.

Your team consists of:
1. Claim Assessor – Evaluates damage validity and cost assessment
2. Policy Checker – Verifies coverage and policy terms
3. Risk Analyst – Analyses fraud risk and claimant history
4. Communication Agent – Drafts customer emails for missing information

Your responsibilities:
- Coordinate the claim-processing workflow in the optimal order
- Ensure each specialist completes their assessment before moving on
- Delegate to the Communication Agent whenever information is missing
- Make a final decision based on all assessments
- Provide clear reasoning for each decision

Process each claim by:
1. First assign the Claim Assessor to evaluate damage and documentation
2. Then assign the Policy Checker to verify coverage
3. Then assign the Risk Analyst to evaluate fraud potential
4. If any specialist reports missing information, assign the Communication Agent to draft a customer email
5. Make a final decision based on team inputs

End with a clear final decision: APPROVED, DENIED, or REQUIRES_INVESTIGATION.""",
    ).compile()

    return supervisor


insurance_supervisor = create_insurance_supervisor()

logger.info("✅ Insurance supervisor created successfully")
logger.info("📊 Workflow: Supervisor → Specialists → Coordinated Decision")
logger.info("%s", "=" * 80)
logger.info("🚀 MULTI-AGENT INSURANCE CLAIM PROCESSING SYSTEM")
logger.info("%s", "=" * 80)

# ---------------------------------------------------------------------------
# Public helper
# ---------------------------------------------------------------------------


def process_claim_with_supervisor(claim_data: Dict[str, Any]) -> List[Dict[str, Any]]:  # noqa: D401,E501
    """Run the claim through the supervisor and return detailed trace information.

    Returns comprehensive trace data including:
    - Agent interactions and handoffs
    - Tool calls and results
    - Message history per agent
    - Workflow state transitions
    - Timing information
    """

    logger.info("")
    logger.info("🚀 Starting supervisor-based claim processing…")
    logger.info("📋 Processing Claim ID: %s",
                claim_data.get("claim_id", "Unknown"))
    logger.info("%s", "=" * 60)

    messages = [
        {
            "role": "user",
            "content": (
                "Please process this insurance claim through your team of specialists:"
                f"\n\n{json.dumps(claim_data, indent=2)}"
            ),
        }
    ]

    chunks: List[Dict[str, Any]] = []
    step_count = 0

    # Enhanced streaming with detailed trace capture
    for chunk in insurance_supervisor.stream(
        {"messages": messages},
        stream_mode="values",  # Get full state values
        debug=True  # Enable debug information
    ):
        step_count += 1

        # Enhanced chunk processing with detailed trace information
        enhanced_chunk = {
            "step": step_count,
            "timestamp": __import__("datetime").datetime.now().isoformat(),
            "raw_chunk": chunk,
            "trace_info": {}
        }

        for node_name, node_data in chunk.items():
            if node_name == "__end__":
                enhanced_chunk["trace_info"]["workflow_complete"] = True
                continue

            if "messages" not in node_data:
                continue

            messages_list = node_data["messages"]
            if not messages_list:
                continue

            last_msg = messages_list[-1]

            # Extract detailed message information
            message_info = {
                "agent": node_name,
                "message_count": len(messages_list),
                "message_type": type(last_msg).__name__,
                "role": getattr(last_msg, "role", "unknown"),
            }

            # Extract content safely
            if hasattr(last_msg, "content"):
                content = last_msg.content
                if isinstance(content, str):
                    message_info["content"] = content
                    message_info["content_preview"] = content  # No truncation
                else:
                    message_info["content"] = str(content)
                    message_info["content_preview"] = str(
                        content)  # No truncation
            else:
                message_info["content"] = str(last_msg)
                message_info["content_preview"] = str(
                    last_msg)  # No truncation

            # Check for tool calls in the message
            if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
                message_info["tool_calls"] = []
                for tool_call in last_msg.tool_calls:
                    tool_info = {
                        "tool_name": getattr(tool_call, "name", "unknown"),
                        "tool_id": getattr(tool_call, "id", "unknown"),
                    }
                    if hasattr(tool_call, "args"):
                        tool_info["args"] = tool_call.args
                    message_info["tool_calls"].append(tool_info)

            # Check for additional message attributes
            if hasattr(last_msg, "additional_kwargs") and last_msg.additional_kwargs:
                message_info["additional_kwargs"] = last_msg.additional_kwargs

            enhanced_chunk["trace_info"][node_name] = message_info

            # Log enhanced information
            preview = message_info.get("content_preview", "No content")
            tool_info = f" [Tools: {len(message_info.get('tool_calls', []))}]" if message_info.get(
                'tool_calls') else ""
            logger.info("Step %d - %s → %s: %s%s",
                        step_count, node_name, message_info["role"],
                        preview, tool_info)  # No truncation or newline replacement

        chunks.append(enhanced_chunk)

    logger.info("✅ Workflow completed in %d steps", step_count)
    return chunks
