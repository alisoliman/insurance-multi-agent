# API Contracts: Workflow Endpoints

**Feature**: 001-migrate-ms-agents  
**Date**: 2026-01-17  
**Status**: UNCHANGED - These contracts are preserved by the migration

---

## POST /api/v1/workflow/run

Process a claim through the multi-agent workflow.

### Request

```json
{
  "claim_id": "CLM-2024-001"
}
```

Or with full claim data:

```json
{
  "claim_id": "CLM-2024-001",
  "policy_number": "POL-2024-001",
  "claimant_name": "John Smith",
  "claimant_id": "CLT-001",
  "claim_type": "auto_collision",
  "incident_date": "2024-01-15",
  "description": "Rear-end collision at intersection",
  "estimated_damage": 5000,
  "supporting_images": ["/images/damage1.jpg"]
}
```

### Response

```json
{
  "success": true,
  "claim_body": {
    "claim_id": "CLM-2024-001",
    "policy_number": "POL-2024-001",
    ...
  },
  "conversation_grouped": {
    "claim_assessor": [
      {"role": "user", "content": "Please process this insurance claim..."},
      {"role": "assistant", "content": "Based on my analysis..."}
    ],
    "policy_checker": [...],
    "risk_analyst": [...],
    "synthesizer": [...]
  },
  "conversation_chronological": [
    {"node": "claim_assessor", "role": "user", "content": "..."},
    {"node": "claim_assessor", "role": "assistant", "content": "..."},
    {"node": "policy_checker", "role": "user", "content": "..."},
    ...
  ],
  "decision": "APPROVED",
  "confidence": "HIGH"
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 404 | Claim ID not found in sample data |
| 500 | Internal processing error |

---

## GET /api/v1/workflow/sample-claims

List available sample claims for testing.

### Response

```json
{
  "available_claims": [
    {
      "claim_id": "CLM-2024-001",
      "claimant_name": "John Smith",
      "claim_type": "auto_collision",
      "estimated_damage": 5000,
      "description": "Rear-end collision at intersection"
    },
    ...
  ],
  "usage": "Use POST /api/v1/workflow/run with {'claim_id': 'CLM-2024-001'} to process a sample claim"
}
```
