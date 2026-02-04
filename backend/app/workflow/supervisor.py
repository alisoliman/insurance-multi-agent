"""Supervisor orchestration for the insurance claim workflow.

This module now uses Microsoft Agent Framework (MAF) workflow orchestration
(Sequential + Concurrent) to reduce custom glue while preserving structured
outputs and streaming compatibility.
"""
import json
import logging
from dataclasses import dataclass
from typing import Any, Dict, List, AsyncIterator, Optional, Never

from dotenv import load_dotenv

from agent_framework import (
    ChatMessage,
    Role,
    SequentialBuilder,
    ConcurrentBuilder,
    WorkflowExecutor,
    WorkflowOutputEvent,
    Executor,
    handler,
    AgentExecutorResponse,
)
from agent_framework._workflows._workflow_context import WorkflowContext

from app.core.logging_config import configure_logging
from .client import get_chat_client
from .agents.claim_assessor import create_claim_assessor_agent
from .agents.policy_checker import create_policy_checker_agent
from .agents.risk_analyst import create_risk_analyst_agent
from .agents.communication_agent import create_communication_agent
from .agents.synthesizer import create_synthesizer_agent

load_dotenv()

# ---------------------------------------------------------------------------
# Configure logging
# ---------------------------------------------------------------------------

configure_logging()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

AGENT_ORDER = [
    "claim_assessor",
    "policy_checker",
    "risk_analyst",
    "communication_agent",
    "synthesizer",
]

SHARED_OUTPUT_PREFIX = "agent_output:"
SHARED_TEXT_PREFIX = "agent_text:"

# ---------------------------------------------------------------------------
# Helper models
# ---------------------------------------------------------------------------


@dataclass
class WorkflowResult:
    messages: List[ChatMessage]
    structured_outputs: Dict[str, Dict[str, Any]]
    agent_texts: Dict[str, str]
    agent_messages: Dict[str, List[Any]]


@dataclass
class SpecialistBundle:
    messages: List[ChatMessage]
    structured_outputs: Dict[str, Dict[str, Any]]
    agent_texts: Dict[str, str]
    agent_messages: Dict[str, List[Any]]


# ---------------------------------------------------------------------------
# Shared-state helpers (compatible with MAF shared states)
# ---------------------------------------------------------------------------


async def _set_shared_state(ctx: WorkflowContext, key: str, value: Any) -> None:
    if hasattr(ctx, "set_shared_state"):
        await ctx.set_shared_state(key, value)
        return
    if hasattr(ctx, "shared_state"):
        ctx.shared_state[key] = value


async def _get_shared_state(ctx: WorkflowContext, key: str) -> Any:
    if hasattr(ctx, "get_shared_state"):
        return await ctx.get_shared_state(key)
    if hasattr(ctx, "shared_state"):
        return ctx.shared_state.get(key)
    return None


def _build_user_prompt(claim_data: Dict[str, Any]) -> str:
    claim_payload = json.dumps(claim_data, indent=2, ensure_ascii=False)
    return f"Please process this insurance claim:\n\n{claim_payload}"


def _last_assistant_message(messages: Optional[List[ChatMessage]]) -> Optional[ChatMessage]:
    if not messages:
        return None
    return next((m for m in reversed(messages) if m.role == Role.ASSISTANT and m.text), None)


def _strip_leading_context(messages: List[ChatMessage]) -> List[ChatMessage]:
    idx = 0
    while idx < len(messages) and messages[idx].role in {Role.SYSTEM, Role.USER}:
        idx += 1
    return messages[idx:]


def _log_openai_error(context: str, exc: Exception) -> None:
    status = getattr(exc, "status_code", None)
    response = getattr(exc, "response", None)
    body = None
    if response is not None:
        status = status or getattr(response, "status_code", None)
        body = getattr(response, "text", None)
        if callable(body):
            try:
                body = body()
            except Exception:
                body = None

    # Azure/OpenAI errors often include `body` or `message`/`error` fields.
    extra_body = getattr(exc, "body", None)
    message = getattr(exc, "message", None)
    error = getattr(exc, "error", None)
    detail = getattr(exc, "detail", None)

    logger.error(
        "OpenAI request failed in %s status=%s exc=%s body=%s extra_body=%s message=%s error=%s detail=%s",
        context,
        status,
        repr(exc),
        body,
        extra_body,
        message,
        error,
        detail,
    )


async def _persist_agent_response(
    ctx: WorkflowContext,
    agent_name: str,
    response: Any,
    base_messages: List[ChatMessage],
) -> List[ChatMessage]:
    if response.value is not None:
        await _set_shared_state(
            ctx,
            f"{SHARED_OUTPUT_PREFIX}{agent_name}",
            response.value.model_dump(mode="json"),
        )

    last_assistant = _last_assistant_message(getattr(response, "messages", None))
    if last_assistant:
        await _set_shared_state(
            ctx,
            f"{SHARED_TEXT_PREFIX}{agent_name}",
            last_assistant.text,
        )
        full_conversation = list(base_messages) + [last_assistant]
    else:
        full_conversation = list(base_messages)

    response_messages = None
    if hasattr(response, "to_dict"):
        response_dict = response.to_dict()
        response_messages = response_dict.get("messages")
    if not response_messages:
        response_messages = getattr(response, "messages", None)

    if response_messages:
        await _set_shared_state(ctx, f"{SHARED_TEXT_PREFIX}{agent_name}:messages", list(response_messages))
    else:
        await _set_shared_state(ctx, f"{SHARED_TEXT_PREFIX}{agent_name}:messages", full_conversation)

    return full_conversation


# ---------------------------------------------------------------------------
# Executors
# ---------------------------------------------------------------------------


class CommunicationExecutor(Executor):
    def __init__(self, agent, id: str = "communication_executor"):
        super().__init__(id=id)
        self.agent = agent

    @handler
    async def handle(self, messages: List[ChatMessage], ctx: WorkflowContext) -> None:
        outputs = {
            name: await _get_shared_state(ctx, f"{SHARED_OUTPUT_PREFIX}{name}")
            for name in ["claim_assessor", "policy_checker", "risk_analyst"]
        }
        claim_type = ""
        for msg in messages:
            if msg.role == Role.USER and msg.text:
                claim_type = msg.text.lower()
                break
        missing_items = _derive_missing_items(outputs, claim_type)
        if not missing_items:
            await ctx.send_message(messages)
            return

        summary = "MISSING INFORMATION SUMMARY:\n" + "\n".join(
            f"- {item}" for item in missing_items
        ) + "\n\nUse these items to populate requested_items and explain why each is needed."

        next_messages = list(messages) + [
            ChatMessage(role=Role.USER, text=summary)
        ]

        try:
            response = await self.agent.run(next_messages)
        except Exception as exc:
            _log_openai_error("communication_agent", exc)
            raise
        full_conversation = await _persist_agent_response(
            ctx,
            "communication_agent",
            response,
            next_messages,
        )
        await ctx.send_message(full_conversation)


class SynthesizerExecutor(Executor):
    def __init__(self, agent, id: str = "synthesizer_executor"):
        super().__init__(id=id)
        self.agent = agent

    @handler
    async def handle(self, messages: List[ChatMessage], ctx: WorkflowContext) -> None:
        try:
            response = await self.agent.run(messages)
        except Exception as exc:
            _log_openai_error("synthesizer", exc)
            raise
        full_conversation = await _persist_agent_response(
            ctx,
            "synthesizer",
            response,
            messages,
        )
        await ctx.send_message(full_conversation)


class ResultEmitterExecutor(Executor):
    def __init__(self, id: str = "result_emitter"):
        super().__init__(id=id)

    @handler
    async def handle(self, messages: List[ChatMessage], ctx: WorkflowContext) -> None:
        structured_outputs: Dict[str, Dict[str, Any]] = {}
        agent_texts: Dict[str, str] = {}
        agent_messages: Dict[str, List[ChatMessage]] = {}

        for name in AGENT_ORDER:
            output = await _get_shared_state(ctx, f"{SHARED_OUTPUT_PREFIX}{name}")
            if output is not None:
                structured_outputs[name] = output
            text = await _get_shared_state(ctx, f"{SHARED_TEXT_PREFIX}{name}")
            if text:
                agent_texts[name] = text
            messages_for_agent = await _get_shared_state(ctx, f"{SHARED_TEXT_PREFIX}{name}:messages")
            if messages_for_agent:
                agent_messages[name] = messages_for_agent

        await ctx.yield_output(
            WorkflowResult(
                messages=messages,
                structured_outputs=structured_outputs,
                agent_texts=agent_texts,
                agent_messages=agent_messages,
            )
        )


# ---------------------------------------------------------------------------
# Workflow construction
# ---------------------------------------------------------------------------


def _initialize_agents():
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


class SpecialistAggregator(Executor):
    def __init__(self, id: str = "specialist_aggregator"):
        super().__init__(id=id)

    @handler
    async def aggregate(
        self,
        results: List[AgentExecutorResponse],
        ctx: WorkflowContext[Never, SpecialistBundle],
    ) -> None:
        if not results:
            await ctx.yield_output(
                SpecialistBundle(messages=[], structured_outputs={}, agent_texts={}, agent_messages={})
            )
            return

        structured_outputs: Dict[str, Dict[str, Any]] = {}
        agent_texts: Dict[str, str] = {}
        agent_messages: Dict[str, List[Any]] = {}
        conversations: List[List[ChatMessage]] = []
        for result in results:
            agent_name = result.executor_id
            response = result.agent_response

            conversation = result.full_conversation or list(getattr(response, "messages", []) or [])
            conversations.append(conversation)
            response_messages = None
            if hasattr(response, "to_dict"):
                response_dict = response.to_dict()
                response_messages = response_dict.get("messages")
            if response_messages:
                agent_messages[agent_name] = response_messages
            elif conversation:
                agent_messages[agent_name] = conversation

            if response.value is not None:
                structured_outputs[agent_name] = response.value.model_dump(mode="json")

            last_assistant = _last_assistant_message(response.messages)
            if last_assistant:
                agent_texts[agent_name] = last_assistant.text

        combined_messages: List[ChatMessage] = []
        for idx, conversation in enumerate(conversations):
            if not conversation:
                continue
            if idx == 0:
                combined_messages.extend(conversation)
            else:
                combined_messages.extend(_strip_leading_context(conversation))

        await ctx.yield_output(
            SpecialistBundle(
                messages=combined_messages,
                structured_outputs=structured_outputs,
                agent_texts=agent_texts,
                agent_messages=agent_messages,
            )
        )


class SpecialistBundleExtractor(Executor):
    def __init__(self, id: str = "specialist_bundle_extractor"):
        super().__init__(id=id)

    @handler
    async def handle(self, bundle: SpecialistBundle, ctx: WorkflowContext) -> None:
        for name, output in bundle.structured_outputs.items():
            await _set_shared_state(ctx, f"{SHARED_OUTPUT_PREFIX}{name}", output)
        for name, text in bundle.agent_texts.items():
            await _set_shared_state(ctx, f"{SHARED_TEXT_PREFIX}{name}", text)
        for name, messages in bundle.agent_messages.items():
            await _set_shared_state(ctx, f"{SHARED_TEXT_PREFIX}{name}:messages", messages)
        await ctx.send_message(bundle.messages)


def _build_specialists_workflow(agents) -> Any:
    specialists_workflow = (
        ConcurrentBuilder()
        .participants([
            agents["claim_assessor"],
            agents["policy_checker"],
            agents["risk_analyst"],
        ])
        .with_aggregator(SpecialistAggregator())
        .build()
    )
    return specialists_workflow


def _build_workflow():
    agents = _initialize_agents()

    specialists_workflow = _build_specialists_workflow(agents)
    specialists_executor = WorkflowExecutor(specialists_workflow, id="specialists")

    workflow = (
        SequentialBuilder()
        .participants(
            [
                specialists_executor,
                SpecialistBundleExtractor(),
                CommunicationExecutor(agents["communication_agent"]),
                SynthesizerExecutor(agents["synthesizer"]),
                ResultEmitterExecutor(),
            ]
        )
        .build()
    )

    return workflow


def get_insurance_supervisor():
    return _build_workflow()


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------


def _derive_missing_items(outputs: Dict[str, Any], claim_text: str) -> List[str]:
    items: List[str] = []
    claim_type = "auto" if "\"claim_type\": \"auto\"" in claim_text else ""

    assessor = outputs.get("claim_assessor") or {}
    if isinstance(assessor, dict):
        validity = assessor.get("validity_status")
        red_flags = assessor.get("red_flags") or []
        if validity == "QUESTIONABLE":
            if claim_type == "auto":
                items.append("Photos of vehicle damage (front/back/side angles)")
                items.append("Police report or incident report (if available)")
            else:
                items.append("Photos of damage and affected areas")
                items.append("Repair estimate or contractor invoice")
        if validity == "INVALID":
            items.append("Clarify incident details and provide supporting documentation")
        if red_flags:
            items.extend([f"Clarify: {flag}" for flag in red_flags])

    coverage = outputs.get("policy_checker") or {}
    if isinstance(coverage, dict):
        if coverage.get("coverage_status") == "INSUFFICIENT_EVIDENCE":
            items.append("Policy documentation or confirmation of coverage details")

    risk = outputs.get("risk_analyst") or {}
    if isinstance(risk, dict):
        fraud_indicators = risk.get("fraud_indicators") or []
        risk_level = risk.get("risk_level")
        if fraud_indicators:
            items.append("Proof of ownership and identity verification")
        elif risk_level in {"MEDIUM_RISK", "HIGH_RISK"}:
            items.append("Detailed incident timeline with corroborating evidence")
            if claim_type == "auto":
                items.append("Police report or incident report (if available)")

    deduped: List[str] = []
    seen = set()
    for item in items:
        if item not in seen:
            deduped.append(item)
            seen.add(item)
    return deduped


def _build_initial_messages(claim_data: Dict[str, Any], summary_language: str) -> List[ChatMessage]:
    language_requirement = (
        "LANGUAGE REQUIREMENT: All free-text fields must be in the same language as the claim description. "
        "Keep enum/status fields exactly as specified in the output format."
    )
    user_prompt = _build_user_prompt(claim_data)

    messages: List[ChatMessage] = []
    if summary_language == "original":
        messages.append(ChatMessage(role=Role.SYSTEM, text=language_requirement))
    messages.append(ChatMessage(role=Role.USER, text=user_prompt))
    return messages


# ---------------------------------------------------------------------------
# Workflow entry points
# ---------------------------------------------------------------------------


async def process_claim_with_supervisor(
    claim_data: Dict[str, Any],
    summary_language: str = "english",
) -> List[Dict[str, Any]]:
    """Run the claim through the MAF workflow and return chunked outputs."""
    logger.info("")
    logger.info("🚀 Starting MAF-based claim processing…")
    logger.info("📋 Processing Claim ID: %s", claim_data.get("claim_id", "Unknown"))
    logger.info("🌐 Summary language: %s", summary_language)
    logger.info("%s", "=" * 60)

    workflow = get_insurance_supervisor()
    messages = _build_initial_messages(claim_data, summary_language=summary_language)

    output_evt: Optional[WorkflowOutputEvent] = None
    async for event in workflow.run_stream(messages):
        if isinstance(event, WorkflowOutputEvent):
            output_evt = event
            break

    if output_evt is None:
        raise RuntimeError("Workflow produced no output")

    result = output_evt.data
    if not isinstance(result, WorkflowResult):
        raise RuntimeError("Unexpected workflow output type")

    user_prompt = _build_user_prompt(claim_data)

    chunks: List[Dict[str, Any]] = []
    for agent_name in AGENT_ORDER:
        structured_output = result.structured_outputs.get(agent_name)
        agent_text = result.agent_texts.get(agent_name)
        agent_messages = result.agent_messages.get(agent_name)
        if structured_output is None and not agent_text and not agent_messages:
            continue
        if agent_messages:
            messages_payload = agent_messages
        else:
            assistant_content = agent_text or json.dumps(structured_output, indent=2, ensure_ascii=False)
            messages_payload = [
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": assistant_content},
            ]

        chunk = {
            agent_name: {
                "messages": messages_payload,
                "structured_output": structured_output,
            }
        }
        chunks.append(chunk)

    logger.info("✅ Workflow completed with %d agent responses", len(chunks))
    return chunks


async def process_claim_with_supervisor_stream(
    claim_data: Dict[str, Any],
    summary_language: str = "english",
) -> AsyncIterator[Any]:
    """Stream raw MAF workflow events for real-time consumers."""
    workflow = get_insurance_supervisor()
    messages = _build_initial_messages(claim_data, summary_language=summary_language)

    async for event in workflow.run_stream(messages):
        yield event


__all__ = [
    "process_claim_with_supervisor",
    "process_claim_with_supervisor_stream",
    "get_insurance_supervisor",
]
