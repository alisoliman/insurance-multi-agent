from datetime import datetime, timezone

import pytest

from app.services.claim_service import ClaimService


@pytest.mark.asyncio
async def test_claims_api_create_list_and_metrics(async_client, monkeypatch):
    async def _noop_ai_processing(self, claim_id: str) -> None:
        return None

    monkeypatch.setattr(ClaimService, "_run_ai_processing", _noop_ai_processing)

    payload = {
        "claimant_name": "Taylor Smith",
        "policy_number": "POL-2026-001",
        "claim_type": "auto",
        "description": "Rear bumper scrape in a parking garage.",
        "incident_date": datetime.now(timezone.utc).isoformat(),
        "estimated_damage": 1800,
        "location": "Seattle, WA",
        "priority": "medium",
    }

    create_response = await async_client.post("/api/v1/claims/", json=payload)
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"]
    assert created["status"] == "new"

    list_response = await async_client.get("/api/v1/claims/")
    assert list_response.status_code == 200
    claims = list_response.json()
    assert any(claim["id"] == created["id"] for claim in claims)

    handlers_response = await async_client.get("/api/v1/claims/handlers")
    assert handlers_response.status_code == 200
    handlers = handlers_response.json()
    assert {handler["id"] for handler in handlers} == {
        "handler-001",
        "handler-002",
        "handler-003",
    }

    metrics_response = await async_client.get("/api/v1/metrics?handler_id=handler-001")
    assert metrics_response.status_code == 200
    metrics = metrics_response.json()
    assert metrics["my_caseload"] == 0
    assert "queue_depth" in metrics
