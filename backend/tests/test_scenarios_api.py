from datetime import datetime, timezone

import pytest


def _saved_scenario_payload() -> dict:
    timestamp = datetime.now(timezone.utc).isoformat()
    return {
        "name": "Seattle Fender Bender",
        "scenario": {
            "id": "11111111-1111-1111-1111-111111111111",
            "name": "Generated Scenario",
            "locale": "US",
            "claim_type": "auto",
            "complexity": "moderate",
            "created_at": timestamp,
            "claim": {
                "claim_id": "CLM-2026-001",
                "policy_number": "POL-2026-001",
                "claimant_id": "CLT-2026-001",
                "claimant_name": "Jordan Lee",
                "incident_date": timestamp,
                "claim_type": "auto",
                "description": "Minor parking lot collision with photo evidence.",
                "estimated_damage": 2400,
                "location": "Seattle, WA",
                "police_report": False,
                "photos_provided": True,
                "witness_statements": "none",
                "vehicle_info": {
                    "vin": "1HGCM82633A004352",
                    "make": "Honda",
                    "model": "Accord",
                    "year": 2022,
                    "license_plate": "ABC1234",
                },
                "customer_info": {
                    "name": "Jordan Lee",
                    "email": "jordan@example.com",
                    "phone": "+1-555-0100",
                },
            },
            "policy": {
                "policy_number": "POL-2026-001",
                "policy_type": "Comprehensive Auto",
                "coverage_type": "Auto",
                "coverage_limits": {
                    "collision": 50000,
                    "comprehensive": 50000,
                    "liability_per_person": 100000,
                    "liability_per_accident": 300000,
                    "property_damage": 100000,
                    "medical_payments": 10000,
                },
                "deductibles": {
                    "collision": 500,
                    "comprehensive": 250,
                },
                "exclusions": ["Racing", "Intentional damage"],
                "effective_date": "2026-01-01",
                "expiration_date": "2026-12-31",
                "markdown_content": "# Policy\n\nCoverage details.",
            },
        },
    }


@pytest.mark.asyncio
async def test_scenarios_api_save_lookup_and_delete(async_client):
    payload = _saved_scenario_payload()

    create_response = await async_client.post("/api/v1/scenarios", json=payload)
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"] == payload["scenario"]["id"]

    list_response = await async_client.get("/api/v1/scenarios")
    assert list_response.status_code == 200
    listed = list_response.json()
    assert listed["total"] == 1
    assert listed["scenarios"][0]["id"] == payload["scenario"]["id"]

    get_response = await async_client.get(f"/api/v1/scenarios/{payload['scenario']['id']}")
    assert get_response.status_code == 200
    saved = get_response.json()
    assert saved["name"] == payload["name"]

    vehicle_response = await async_client.get("/api/v1/scenarios/vehicles/1HGCM82633A004352")
    assert vehicle_response.status_code == 200
    vehicle = vehicle_response.json()
    assert vehicle["policy_number"] == "POL-2026-001"

    policy_response = await async_client.get("/api/v1/scenarios/policies/POL-2026-001")
    assert policy_response.status_code == 200
    policy = policy_response.json()
    assert policy["customer_name"] == "Jordan Lee"

    coverage_response = await async_client.get(
        "/api/v1/scenarios/policies/POL-2026-001/coverage/collision"
    )
    assert coverage_response.status_code == 200
    coverage = coverage_response.json()
    assert coverage["has_coverage"] is True
    assert coverage["coverage_limit"] == 50000

    delete_response = await async_client.delete(f"/api/v1/scenarios/{payload['scenario']['id']}")
    assert delete_response.status_code == 204

    missing_response = await async_client.get(f"/api/v1/scenarios/{payload['scenario']['id']}")
    assert missing_response.status_code == 404
