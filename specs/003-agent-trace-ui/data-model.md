# Data Model: Agent Trace UI Enhancement

**Feature**: 003-agent-trace-ui  
**Date**: January 17, 2026

## Overview

This document defines the data models for displaying structured agent outputs and tool calls in the frontend.

---

## TypeScript Types (Frontend)

### Enums

```typescript
// frontend/types/agent-outputs.ts

// Validity status for Claim Assessor
export enum ValidityStatus {
  VALID = "VALID",
  QUESTIONABLE = "QUESTIONABLE",
  INVALID = "INVALID",
}

// Coverage status for Policy Checker
export enum CoverageStatus {
  COVERED = "COVERED",
  NOT_COVERED = "NOT_COVERED",
  PARTIALLY_COVERED = "PARTIALLY_COVERED",
  INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE",
}

// Risk level for Risk Analyst
export enum RiskLevel {
  LOW_RISK = "LOW_RISK",
  MEDIUM_RISK = "MEDIUM_RISK",
  HIGH_RISK = "HIGH_RISK",
}

// Recommendation for Synthesizer
export enum Recommendation {
  APPROVE = "APPROVE",
  DENY = "DENY",
  INVESTIGATE = "INVESTIGATE",
}

// Confidence level
export enum Confidence {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}
```

### Structured Output Models

```typescript
// Claim Assessor output
export interface ClaimAssessment {
  validity_status: ValidityStatus;
  cost_assessment: string;
  red_flags: string[];
  reasoning: string;
}

// Policy Checker output
export interface CoverageVerification {
  coverage_status: CoverageStatus;
  cited_sections: string[];
  coverage_details: string;
}

// Risk Analyst output
export interface RiskAssessment {
  risk_level: RiskLevel;
  risk_score: number; // 0-100
  fraud_indicators: string[];
  analysis: string;
}

// Communication Agent output
export interface CustomerCommunication {
  subject: string;
  body: string;
  requested_items: string[];
}

// Synthesizer output (Final Assessment)
export interface FinalAssessment {
  recommendation: Recommendation;
  confidence: Confidence;
  summary: string;
  key_findings: string[];
  next_steps: string[];
}

// Union type for all structured outputs
export type StructuredAgentOutput =
  | ClaimAssessment
  | CoverageVerification
  | RiskAssessment
  | CustomerCommunication
  | FinalAssessment;
```

### Tool Call Models

```typescript
// Tool call record
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
  duration_ms?: number;
}

// Agent with tool calls
export interface AgentOutput {
  agent_name: string;
  structured_output?: StructuredAgentOutput;
  tool_calls?: ToolCall[];
  raw_text?: string; // Fallback when structured output unavailable
}
```

### API Response Models

```typescript
// Conversation entry (existing, extended)
export interface ConversationEntry {
  role: "user" | "assistant" | "tool";
  content: string;
  node: string;
  tool_calls?: ToolCall[]; // Added: structured tool call data
}

// Workflow result (existing, extended)
export interface WorkflowResult {
  success: boolean;
  final_decision: string | null;
  conversation_chronological: ConversationEntry[];
  agent_outputs?: Record<string, AgentOutput>; // Added: structured outputs per agent
}
```

---

## Backend Model Updates

### ClaimOut (Pydantic)

```python
# backend/app/models/claim.py - Updated

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ToolCallOut(BaseModel):
    """Serialized tool call for API response."""
    id: str
    name: str
    arguments: Dict[str, Any]
    result: Optional[Any] = None
    error: Optional[str] = None
    duration_ms: Optional[int] = None


class AgentOutputOut(BaseModel):
    """Serialized agent output for API response."""
    agent_name: str
    structured_output: Optional[Dict[str, Any]] = None
    tool_calls: Optional[List[ToolCallOut]] = None
    raw_text: Optional[str] = None


class ClaimOut(BaseModel):
    """Response model for workflow execution."""
    success: bool = True
    final_decision: Optional[str] = None
    conversation_chronological: Optional[List[Dict[str, str]]] = None
    agent_outputs: Optional[Dict[str, AgentOutputOut]] = None  # NEW
```

---

## Entity Relationships

```
WorkflowResult
├── conversation_chronological: ConversationEntry[]
│   ├── role
│   ├── content
│   ├── node (agent name)
│   └── tool_calls?: ToolCall[]
│
└── agent_outputs: Record<string, AgentOutput>
    ├── claim_assessor: AgentOutput
    │   └── structured_output: ClaimAssessment
    ├── policy_checker: AgentOutput
    │   └── structured_output: CoverageVerification
    ├── risk_analyst: AgentOutput
    │   └── structured_output: RiskAssessment
    ├── communication_agent: AgentOutput
    │   └── structured_output: CustomerCommunication
    └── synthesizer: AgentOutput
        └── structured_output: FinalAssessment
```

---

## Validation Rules

| Field | Validation |
|-------|------------|
| `risk_score` | Must be integer 0-100 |
| `validity_status` | Must be one of VALID, QUESTIONABLE, INVALID |
| `coverage_status` | Must be one of COVERED, NOT_COVERED, PARTIALLY_COVERED, INSUFFICIENT_EVIDENCE |
| `risk_level` | Must be one of LOW_RISK, MEDIUM_RISK, HIGH_RISK |
| `recommendation` | Must be one of APPROVE, DENY, INVESTIGATE |
| `confidence` | Must be one of HIGH, MEDIUM, LOW |
| `red_flags`, `fraud_indicators`, etc. | Arrays of non-empty strings |

---

## State Transitions

Not applicable - these are output models, not stateful entities.
