# Data Model: Structured Agent Outputs

**Feature**: 002-structured-agent-outputs  
**Date**: 2026-01-17

## Overview

Pydantic models for each agent's structured output. These models enforce schema at the LLM level via the `response_format` parameter.

## Enums

### ValidityStatus
Used by: Claim Assessor

| Value | Description |
|-------|-------------|
| `VALID` | Claim documentation and details are consistent and valid |
| `QUESTIONABLE` | Some inconsistencies or concerns identified |
| `INVALID` | Significant issues, likely fraudulent or incorrect |

### CoverageStatus
Used by: Policy Checker

| Value | Description |
|-------|-------------|
| `COVERED` | Claim is fully covered under policy |
| `NOT_COVERED` | Claim is not covered |
| `PARTIALLY_COVERED` | Some aspects covered, others excluded |
| `INSUFFICIENT_EVIDENCE` | Cannot determine coverage from available documents |

### RiskLevel
Used by: Risk Analyst

| Value | Description |
|-------|-------------|
| `LOW_RISK` | Minimal fraud indicators, standard claim |
| `MEDIUM_RISK` | Some concerns warrant additional review |
| `HIGH_RISK` | Significant fraud indicators detected |

### Recommendation
Used by: Synthesizer

| Value | Description |
|-------|-------------|
| `APPROVE` | Recommend approval of claim |
| `DENY` | Recommend denial of claim |
| `INVESTIGATE` | Recommend further investigation before decision |

### Confidence
Used by: Synthesizer

| Value | Description |
|-------|-------------|
| `HIGH` | Strong confidence in recommendation |
| `MEDIUM` | Moderate confidence; some uncertainty |
| `LOW` | Low confidence; significant uncertainty |

## Entity Models

### ClaimAssessment
**Agent**: Claim Assessor

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `validity_status` | ValidityStatus | Yes | Overall assessment of claim validity |
| `cost_assessment` | str | Yes | Evaluation of claimed costs and repair estimates |
| `red_flags` | List[str] | Yes (can be empty) | List of identified concerns or inconsistencies |
| `reasoning` | str | Yes | Detailed explanation of the assessment |

### CoverageVerification
**Agent**: Policy Checker

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `coverage_status` | CoverageStatus | Yes | Coverage determination |
| `cited_sections` | List[str] | Yes (can be empty) | Policy sections cited in determination |
| `coverage_details` | str | Yes | Detailed explanation of coverage analysis |

### RiskAssessment
**Agent**: Risk Analyst

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `risk_level` | RiskLevel | Yes | Overall risk classification |
| `risk_score` | int | Yes | Numeric score 0-100 (higher = more risk) |
| `fraud_indicators` | List[str] | Yes (can be empty) | Specific fraud indicators identified |
| `analysis` | str | Yes | Detailed risk analysis explanation |

### CustomerCommunication
**Agent**: Communication Agent

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | str | Yes | Email subject line |
| `body` | str | Yes | Email body content |
| `requested_items` | List[str] | Yes (can be empty) | Specific items/documents requested from customer |

### FinalAssessment
**Agent**: Synthesizer

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recommendation` | Recommendation | Yes | Overall recommendation |
| `confidence` | Confidence | Yes | Confidence level in recommendation |
| `summary` | str | Yes | Executive summary of all findings |
| `key_findings` | List[str] | Yes (can be empty) | Most important findings from all agents |
| `next_steps` | List[str] | Yes (can be empty) | Recommended actions for claims processor |

## Relationships

```
ClaimAssessment ─┐
                 │
CoverageVerification ──> FinalAssessment
                 │
RiskAssessment ──┘
                 │
CustomerCommunication (optional, when information gaps detected)
```

The Synthesizer receives outputs from all specialist agents and produces the FinalAssessment.

## Validation Rules

1. **risk_score**: Must be integer in range [0, 100]
2. **Enum fields**: Must match exactly one of the defined enum values
3. **List fields**: Can be empty but must be present (not null)
4. **Text fields**: Non-empty strings required

## State Transitions

N/A - These are output models, not stateful entities. Each agent produces one output per claim processing run.
