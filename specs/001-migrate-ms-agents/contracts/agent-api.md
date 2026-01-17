# API Contracts: Agent Endpoints

**Feature**: 001-migrate-ms-agents  
**Date**: 2026-01-17  
**Status**: UNCHANGED - These contracts are preserved by the migration

---

## POST /api/v1/agent/{agent_name}/run

Run a single specialist agent and return its conversation trace.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| agent_name | string | One of: `claim_assessor`, `policy_checker`, `risk_analyst`, `communication_agent` |

### Request

```json
{
  "claim_id": "CLM-2024-001"
}
```

### Response

```json
{
  "success": true,
  "agent_name": "claim_assessor",
  "claim_body": {
    "claim_id": "CLM-2024-001",
    "policy_number": "POL-2024-001",
    ...
  },
  "conversation_chronological": [
    {"role": "user", "content": "Please analyze this claim..."},
    {"role": "assistant", "content": "Based on my assessment..."}
  ]
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 404 | Agent name not found or claim ID not found |
| 500 | Internal processing error |

---

## Available Agents

### claim_assessor

Evaluates damage validity and cost assessment.

**Tools available**:
- `get_vehicle_details(vin)` - Retrieve vehicle information
- `analyze_image(image_path)` - Analyze damage photos

**Output format**:
- Damage assessment with cost justification
- Concludes with: `VALID`, `QUESTIONABLE`, or `INVALID`

### policy_checker

Verifies coverage and policy terms.

**Tools available**:
- `get_policy_details(policy_number)` - Retrieve policy information
- `search_policy_documents(query)` - Semantic search of policy documents

**Output format**:
- Coverage analysis with cited policy sections
- Concludes with: `COVERED`, `NOT_COVERED`, `PARTIALLY_COVERED`, or `INSUFFICIENT_EVIDENCE`

### risk_analyst

Analyzes fraud risk and claimant history.

**Tools available**:
- `get_claimant_history(claimant_id)` - Retrieve claim history

**Output format**:
- Risk assessment with evidence
- Concludes with: `LOW_RISK`, `MEDIUM_RISK`, or `HIGH_RISK`

### communication_agent

Drafts customer communications for missing information.

**Tools available**: None (language model only)

**Output format**:
- Complete email with Subject and Body
- Professional tone with specific document requests
