from app.workflow.supervisor import _derive_missing_items


def test_missing_items_for_medium_risk_auto_claim():
    outputs = {
        "risk_analyst": {"risk_level": "MEDIUM_RISK", "fraud_indicators": []}
    }
    claim_text = '{"claim_type": "auto", "description": "Minor collision"}'

    items = _derive_missing_items(outputs, claim_text)

    assert "Detailed incident timeline with corroborating evidence" in items
    assert "Police report or incident report (if available)" in items


def test_missing_items_empty_when_no_signals():
    outputs = {
        "claim_assessor": {"validity_status": "VALID", "red_flags": []},
        "policy_checker": {"coverage_status": "COVERED"},
        "risk_analyst": {"risk_level": "LOW_RISK", "fraud_indicators": []},
    }
    claim_text = '{"claim_type": "property", "description": "Minor water leak"}'

    items = _derive_missing_items(outputs, claim_text)

    assert items == []
