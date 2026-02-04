import asyncio
import os
from pathlib import Path

import pytest
from dotenv import load_dotenv

from app.services.single_agent import run as run_single_agent


def _load_env() -> None:
    root_env = Path(__file__).resolve().parents[2] / ".env"
    backend_env = Path(__file__).resolve().parents[1] / ".env"
    if backend_env.exists():
        load_dotenv(backend_env)
    if root_env.exists():
        load_dotenv(root_env, override=False)


def _ensure_credentials() -> None:
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    if not endpoint or not api_key:
        pytest.skip("Single-agent test requires AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY in .env")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "agent_name, expected_fields",
    [
        (
            "claim_assessor",
            ["validity_status", "cost_assessment", "red_flags", "reasoning"],
        ),
        (
            "policy_checker",
            ["coverage_status", "cited_sections", "coverage_details"],
        ),
        (
            "risk_analyst",
            ["risk_level", "risk_score", "fraud_indicators", "analysis"],
        ),
        (
            "communication_agent",
            ["subject", "body", "requested_items"],
        ),
        (
            "synthesizer",
            ["recommendation", "confidence", "summary", "key_findings", "next_steps"],
        ),
    ],
)
async def test_single_agent_outputs(agent_name: str, expected_fields: list[str]):
    _load_env()
    _ensure_credentials()

    claim_data = {
        "claim_id": "SINGLE-AGENT-001",
        "claimant_name": "Jordan Lee",
        "claimant_id": "CLT-5001",
        "policy_number": "POL-2024-TEST",
        "claim_type": "auto",
        "description": "Parking lot fender bender with minor bumper damage. Photos attached.",
        "incident_date": "2025-10-05T00:00:00Z",
        "estimated_damage": 1800.0,
        "location": "Denver, CO",
        "priority": "low",
        "missing_items": ["Repair estimate", "Additional photos"],
    }

    messages, structured_output = await asyncio.wait_for(
        run_single_agent(agent_name, claim_data),
        timeout=180,
    )

    assert messages
    assert structured_output is not None

    for field in expected_fields:
        assert field in structured_output
