# Feature Specification: Structured Agent Outputs

**Feature Branch**: `002-structured-agent-outputs`  
**Created**: 2026-01-17  
**Status**: Draft  
**Input**: User description: "Use Structured Output for the Agent Outputs to reduce the regex matching and fuzzy stuff"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reliable Agent Response Parsing (Priority: P1)

As a system processing insurance claims, I need agent responses to be returned in a predictable, machine-readable format so that downstream processing can reliably extract assessment results without brittle regex patterns or fuzzy text matching.

**Why this priority**: This is the core value proposition - eliminating unreliable text parsing ensures consistent claim processing and reduces errors caused by LLM response format variations.

**Independent Test**: Can be fully tested by running a claim through the workflow and verifying that each agent's response can be deserialized directly into typed data structures without any text parsing.

**Acceptance Scenarios**:

1. **Given** a claim is submitted for processing, **When** the Claim Assessor agent completes its evaluation, **Then** the response contains a structured object with typed fields (validity status, cost breakdown, red flags list) that can be directly accessed without parsing.

2. **Given** a claim is submitted for processing, **When** the Policy Checker agent completes its verification, **Then** the response contains a structured object with coverage status enum, cited policy sections list, and applicable limits/deductibles as numeric fields.

3. **Given** a claim is submitted for processing, **When** the Risk Analyst agent completes its assessment, **Then** the response contains a structured object with risk level enum, fraud indicators list, and numeric risk score.

---

### User Story 2 - Type-Safe Assessment Aggregation (Priority: P2)

As the Synthesizer agent, I need to receive all specialist assessments in a consistent structured format so that I can reliably aggregate findings and generate the final recommendation without guessing at response formats.

**Why this priority**: The synthesizer depends on consistent input from all agents; structured outputs ensure it can reliably access all assessment fields to produce accurate final recommendations.

**Independent Test**: Can be tested by providing the synthesizer with structured outputs from all specialist agents and verifying it produces a structured final assessment with all required fields populated.

**Acceptance Scenarios**:

1. **Given** all specialist agents have completed their assessments with structured outputs, **When** the Synthesizer generates the final assessment, **Then** it produces a structured response with recommendation enum (APPROVE/DENY/INVESTIGATE), confidence level, and categorized findings lists.

2. **Given** a specialist agent includes risk factors in its structured output, **When** the Synthesizer aggregates findings, **Then** those risk factors appear in the appropriate section of the final structured assessment without loss of information.

---

### User Story 3 - Structured Communication Templates (Priority: P3)

As the Communication Agent, I need to output customer communications in a structured format so that email generation and multi-channel delivery can be automated reliably.

**Why this priority**: Communication automation depends on structured outputs; this enables future integration with email services and customer portals without manual intervention.

**Independent Test**: Can be tested by triggering the communication agent when information gaps are detected, and verifying the output contains structured fields for recipient, subject, body sections, and requested items list.

**Acceptance Scenarios**:

1. **Given** information gaps are detected during claim processing, **When** the Communication Agent generates a customer outreach, **Then** the response contains structured fields for email subject, greeting, body paragraphs, requested information items, and closing.

---

### Edge Cases

- What happens when the LLM fails to produce valid structured output despite schema constraints? → Fail fast with error; structured outputs have strong schema adherence making this rare.
- How does the system handle partial structured responses where some fields are missing? → Handled by schema design: enums required, lists can be empty.
- What happens when an agent needs to include free-form explanatory text alongside structured data? → Schemas include text fields (reasoning, analysis, summary) for explanatory content.

## Clarifications

### Session 2026-01-17

- Q: How should the system handle LLM structured output validation failures? → A: Fail fast; structured outputs have strong adherence, failures are exceptional.
- Q: What range/scale should the risk_score numeric field use? → A: 0-100 integer scale (percentage-based).
- Q: Should all schema fields be required or some optional? → A: Status/enum fields required; list fields can be empty.
- Q: How detailed should nested object schemas (e.g., cost_breakdown) be? → A: Keep flexible; avoid over-rigid nested schemas. Focus structured enforcement on enums/status fields.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST define typed output schemas for each specialist agent (Claim Assessor, Policy Checker, Risk Analyst, Communication Agent, Synthesizer)
- **FR-002**: System MUST enforce structured output format when invoking each agent through the chat client
- **FR-003**: Agent responses MUST be deserializable into their corresponding typed data structures without text parsing or regex matching
- **FR-004**: Each agent output schema MUST include all fields currently extracted via text patterns (e.g., validity status, coverage status, risk level)
- **FR-005**: System MUST handle structured output validation errors gracefully with appropriate logging
- **FR-006**: The Synthesizer agent MUST receive typed inputs from specialist agents and produce a typed final assessment
- **FR-007**: System MUST preserve the ability to include human-readable explanatory text within structured output fields
- **FR-008**: ~~Existing API response format MUST remain backward compatible with current consumers~~ (Removed - not required)

### Key Entities

*Note: Status/enum fields are strictly typed; text and object fields remain flexible for agent discretion.*

- **AgentOutput**: Base structure for all agent responses with common fields (agent_name, timestamp, status)
- **ClaimAssessment**: Claim Assessor output with validity_status (enum: VALID/QUESTIONABLE/INVALID), cost_assessment (text), red_flags (list of strings), reasoning (text)
- **CoverageVerification**: Policy Checker output with coverage_status (enum: COVERED/NOT_COVERED/PARTIALLY_COVERED/INSUFFICIENT_EVIDENCE), cited_sections (list of strings), coverage_details (text)
- **RiskAssessment**: Risk Analyst output with risk_level (enum: LOW_RISK/MEDIUM_RISK/HIGH_RISK), risk_score (integer 0-100), fraud_indicators (list of strings), analysis (text)
- **CustomerCommunication**: Communication Agent output with subject (text), body (text), requested_items (list of strings)
- **FinalAssessment**: Synthesizer output with recommendation (enum: APPROVE/DENY/INVESTIGATE), confidence (enum: HIGH/MEDIUM/LOW), summary (text), key_findings (list of strings), next_steps (list of strings)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of agent responses can be deserialized into typed structures without regex or text parsing
- **SC-002**: Zero claim processing failures caused by unexpected agent response formats
- **SC-003**: Downstream systems can access any agent assessment field directly by property name
- **SC-004**: Agent output validation errors are logged with sufficient detail for debugging
- **SC-005**: System maintains current claim processing throughput with no performance regression

## Assumptions

- The underlying LLM/chat client supports structured output / JSON schema enforcement
- Current agent prompts can be adapted to produce structured responses without degrading assessment quality
- All current text-based extractions (VALID/INVALID, COVERED/NOT_COVERED, LOW_RISK/HIGH_RISK, etc.) can be represented as enum values
- The API response format can accommodate structured agent outputs while maintaining backward compatibility
