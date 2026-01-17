# API Contract: Workflow Run (Enhanced)

**Endpoint**: `POST /api/v1/workflow/run`  
**Feature**: 003-agent-trace-ui  
**Date**: January 17, 2026

## Overview

Enhanced workflow execution endpoint that includes structured agent outputs alongside the conversation trace.

---

## Request

### Headers

```
Content-Type: application/json
```

### Body Schema

```json
{
  "claim_id": "string (optional - use for sample claims)",
  "policy_number": "string (optional)",
  "claimant_name": "string (optional)",
  "claim_type": "string (optional)",
  "estimated_damage": "number (optional)",
  "description": "string (optional)",
  "supporting_images": ["string"] // Optional array of image paths
}
```

### Example Request

```json
{
  "claim_id": "CLM-2024-001"
}
```

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "final_decision": "APPROVED | DENIED | INVESTIGATE | null",
  "conversation_chronological": [
    {
      "role": "user | assistant | tool",
      "content": "string",
      "node": "claim_assessor | policy_checker | risk_analyst | communication_agent | synthesizer | supervisor"
    }
  ],
  "agent_outputs": {
    "claim_assessor": {
      "agent_name": "claim_assessor",
      "structured_output": {
        "validity_status": "VALID | QUESTIONABLE | INVALID",
        "cost_assessment": "string",
        "red_flags": ["string"],
        "reasoning": "string"
      },
      "tool_calls": [
        {
          "id": "string",
          "name": "get_vehicle_details",
          "arguments": { "vin": "string" },
          "result": { ... },
          "duration_ms": 150
        }
      ]
    },
    "policy_checker": {
      "agent_name": "policy_checker",
      "structured_output": {
        "coverage_status": "COVERED | NOT_COVERED | PARTIALLY_COVERED | INSUFFICIENT_EVIDENCE",
        "cited_sections": ["string"],
        "coverage_details": "string"
      },
      "tool_calls": [...]
    },
    "risk_analyst": {
      "agent_name": "risk_analyst",
      "structured_output": {
        "risk_level": "LOW_RISK | MEDIUM_RISK | HIGH_RISK",
        "risk_score": 0-100,
        "fraud_indicators": ["string"],
        "analysis": "string"
      },
      "tool_calls": [...]
    },
    "communication_agent": {
      "agent_name": "communication_agent",
      "structured_output": {
        "subject": "string",
        "body": "string",
        "requested_items": ["string"]
      }
    },
    "synthesizer": {
      "agent_name": "synthesizer",
      "structured_output": {
        "recommendation": "APPROVE | DENY | INVESTIGATE",
        "confidence": "HIGH | MEDIUM | LOW",
        "summary": "string",
        "key_findings": ["string"],
        "next_steps": ["string"]
      }
    }
  }
}
```

### Full Example Response

```json
{
  "success": true,
  "final_decision": "APPROVED",
  "conversation_chronological": [
    {
      "role": "user",
      "content": "Please process this insurance claim...",
      "node": "supervisor"
    },
    {
      "role": "assistant",
      "content": "🔧 Calling tool: get_vehicle_details\n   Arguments: {\"vin\": \"1HGBH41JXMN109186\"}",
      "node": "claim_assessor"
    },
    {
      "role": "tool",
      "content": "🔧 Tool Response (get_vehicle_details):\n{\"make\": \"Honda\", \"model\": \"Accord\", \"year\": 2021}",
      "node": "claim_assessor"
    },
    {
      "role": "assistant",
      "content": "{\"validity_status\": \"VALID\", \"cost_assessment\": \"Reasonable estimate...\", ...}",
      "node": "claim_assessor"
    }
  ],
  "agent_outputs": {
    "claim_assessor": {
      "agent_name": "claim_assessor",
      "structured_output": {
        "validity_status": "VALID",
        "cost_assessment": "The claimed repair costs of $8,500 are reasonable for the described damage to a 2021 Honda Accord.",
        "red_flags": [],
        "reasoning": "Vehicle details confirmed via VIN lookup. Damage description consistent with collision scenario."
      },
      "tool_calls": [
        {
          "id": "tc_001",
          "name": "get_vehicle_details",
          "arguments": { "vin": "1HGBH41JXMN109186" },
          "result": { "make": "Honda", "model": "Accord", "year": 2021, "value": 28000 },
          "duration_ms": 145
        }
      ]
    },
    "policy_checker": {
      "agent_name": "policy_checker",
      "structured_output": {
        "coverage_status": "COVERED",
        "cited_sections": ["Section 4.2 - Collision Coverage", "Section 4.5 - Deductible Terms"],
        "coverage_details": "Claim falls within collision coverage limits. $500 deductible applies."
      },
      "tool_calls": [
        {
          "id": "tc_002",
          "name": "search_policy",
          "arguments": { "policy_number": "POL-2024-001", "query": "collision coverage" },
          "result": { "matches": [...] },
          "duration_ms": 230
        }
      ]
    },
    "risk_analyst": {
      "agent_name": "risk_analyst",
      "structured_output": {
        "risk_level": "LOW_RISK",
        "risk_score": 15,
        "fraud_indicators": [],
        "analysis": "No fraud indicators detected. Claimant has 5-year history with no previous claims."
      }
    },
    "synthesizer": {
      "agent_name": "synthesizer",
      "structured_output": {
        "recommendation": "APPROVE",
        "confidence": "HIGH",
        "summary": "All specialist agents concur: claim is valid, covered, and low risk.",
        "key_findings": [
          "Damage consistent with accident description",
          "Full collision coverage confirmed",
          "No fraud indicators"
        ],
        "next_steps": [
          "Approve claim for $8,000 (after $500 deductible)",
          "Schedule payment processing",
          "Send confirmation to policyholder"
        ]
      }
    }
  }
}
```

### Error Response (500 Internal Server Error)

```json
{
  "detail": "Error message describing the failure"
}
```

### Error Response (404 Not Found)

```json
{
  "detail": "Claim ID 'CLM-INVALID' not found. Available sample claim IDs: [...]"
}
```

---

## Notes

- `agent_outputs` is a new field added to support structured output visualization
- `tool_calls` within agent outputs provide structured data for tool call cards
- The `conversation_chronological` field continues to include text representation for backward compatibility
- If `structured_output` is `null` for any agent, frontend should display `raw_text` fallback with warning badge
