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
async def test_agent_run_endpoint_returns_structured_output(async_client):
    _load_env()
    _ensure_credentials()

    payload = {
        "claim_id": "API-TEST-002",
        "claimant_name": "Test Customer",
        "policy_number": "POL-TEST-002",
        "claim_type": "auto",
        "description": "Minor scrape with photos attached.",
        "incident_date": "2025-01-01T00:00:00Z",
        "estimated_damage": 900.0,
        "location": "Portland, OR",
    }

    response = await async_client.post("/api/v1/agent/claim_assessor/run", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["structured_output"]
    assert "validity_status" in data["structured_output"]["structured_output"]
