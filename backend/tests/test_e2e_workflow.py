import asyncio
import os
from pathlib import Path

import pytest
from dotenv import load_dotenv

from app.workflow import process_claim_with_supervisor


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
        pytest.skip("E2E test requires AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY in .env")


@pytest.mark.asyncio
async def test_e2e_workflow_with_sample_claims():
    _load_env()
    _ensure_credentials()

    examples = [
        {
            "claim_id": "E2E-001",
            "claimant_name": "Ava Martinez",
            "claimant_id": "CLT-1001",
            "policy_number": "POL-2024-001",
            "claim_type": "auto",
            "description": "Low-speed scrape in a parking lot. Photos and repair estimate attached. No injuries.",
            "incident_date": "2025-11-12T00:00:00Z",
            "estimated_damage": 1200.0,
            "location": "Portland, OR",
            "priority": "low",
        },
        {
            "claim_id": "E2E-002",
            "claimant_name": "Noah Patel",
            "claimant_id": "CLT-1002",
            "policy_number": "POL-2024-002",
            "claim_type": "auto",
            "description": "Rear-end collision at stoplight; police report filed. Repair estimate attached.",
            "incident_date": "2025-11-14T00:00:00Z",
            "estimated_damage": 5800.0,
            "location": "Austin, TX",
            "priority": "medium",
        },
    ]

    for claim_data in examples:
        chunks = await asyncio.wait_for(process_claim_with_supervisor(claim_data), timeout=180)
        structured = {}
        for chunk in chunks:
            for agent_name, payload in chunk.items():
                structured[agent_name] = payload.get("structured_output")

        assert structured.get("claim_assessor") is not None
        assert structured.get("policy_checker") is not None
        assert structured.get("risk_analyst") is not None
        assert structured.get("synthesizer") is not None

        synth = structured["synthesizer"]
        assert synth["recommendation"] in {"APPROVE", "DENY", "INVESTIGATE"}
        assert synth["confidence"] in {"HIGH", "MEDIUM", "LOW"}
