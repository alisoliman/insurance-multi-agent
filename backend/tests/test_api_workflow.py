import os
from pathlib import Path

import pytest
from dotenv import load_dotenv


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
        pytest.skip("API test requires AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY in .env")


@pytest.mark.asyncio
async def test_workflow_run_endpoint_returns_structured_outputs(async_client):
    _load_env()
    _ensure_credentials()

    payload = {
        "claim_id": "API-TEST-001",
        "claimant_name": "Test Customer",
        "policy_number": "POL-TEST-001",
        "claim_type": "auto",
        "description": "Minor scrape in a parking lot. Photos attached.",
        "incident_date": "2025-01-01T00:00:00Z",
        "estimated_damage": 1400.0,
        "location": "Seattle, WA",
        "priority": "low",
    }

    response = await async_client.post("/api/v1/workflow/run", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["agent_outputs"]
    assert "claim_assessor" in data["agent_outputs"]
    structured = data["agent_outputs"]["claim_assessor"]["structured_output"]
    assert structured is not None
    assert "validity_status" in structured
