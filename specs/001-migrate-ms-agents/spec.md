# Feature Specification: Migrate to Microsoft Agent Framework

**Feature Branch**: `001-migrate-ms-agents`  
**Created**: 2026-01-17  
**Status**: Draft  
**Input**: User description: "Migrate the orchestration layer from LangGraph to the latest Microsoft agent framework in Python, features should stay the same but the underlying orchestration should change"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Process Claims with Migrated Multi-Agent System (Priority: P1)

As a claims processor, I want to submit insurance claims for automated assessment so that I receive comprehensive recommendations from specialized AI agents, with the same quality and speed as before the migration.

**Why this priority**: This is the core value proposition of the platform. Without end-to-end claim processing working, the migration has no value.

**Independent Test**: Can be fully tested by submitting a claim through the `/api/v1/workflow/run` endpoint and verifying that all four specialist agents (Claim Assessor, Policy Checker, Risk Analyst, Communication Agent) are invoked and a comprehensive assessment is returned.

**Acceptance Scenarios**:

1. **Given** a valid claim submission with policy number, incident details, and supporting documentation, **When** the claim is processed through the supervisor, **Then** all specialist agents analyze the claim and a structured assessment is returned with PRIMARY RECOMMENDATION, SUPPORTING FACTORS, RISK FACTORS, INFORMATION GAPS, and RECOMMENDED NEXT STEPS.

2. **Given** a claim that requires image analysis (e.g., damage photos), **When** the Claim Assessor agent processes it, **Then** the agent invokes the `analyze_image` tool and incorporates visual analysis into its assessment.

3. **Given** a claim with a valid policy number, **When** the Policy Checker agent processes it, **Then** the agent searches policy documents using semantic similarity and cites relevant coverage sections.

4. **Given** a claim with potential fraud indicators, **When** the Risk Analyst agent processes it, **Then** the agent provides a risk assessment with specific red flags identified.

5. **Given** a claim missing required documentation, **When** the Communication Agent is invoked, **Then** a personalized customer email requesting the missing information is drafted.

---

### User Story 2 - Invoke Individual Agents Independently (Priority: P2)

As a developer or tester, I want to invoke individual specialist agents (Claim Assessor, Policy Checker, Risk Analyst, Communication Agent) independently so that I can test and debug specific agent behaviors without running the full workflow.

**Why this priority**: Independent agent testing is essential for debugging and development, but the full workflow (US1) provides more business value.

**Independent Test**: Can be tested by calling individual agent endpoints (e.g., `/api/v1/agent/claim_assessor/run`) with appropriate input and verifying the agent's response matches expected behavior.

**Acceptance Scenarios**:

1. **Given** the Claim Assessor agent endpoint, **When** a claim is submitted for assessment, **Then** the agent returns a damage evaluation with cost assessment and a conclusion of VALID, QUESTIONABLE, or INVALID.

2. **Given** the Policy Checker agent endpoint, **When** a policy number and claim details are submitted, **Then** the agent returns coverage analysis with cited policy sections and a FINAL ASSESSMENT of COVERED, NOT_COVERED, PARTIALLY_COVERED, or INSUFFICIENT_EVIDENCE.

3. **Given** the Risk Analyst agent endpoint, **When** claim details are submitted, **Then** the agent returns fraud risk analysis with a risk score and identified red flags.

4. **Given** the Communication Agent endpoint, **When** missing documentation context is provided, **Then** the agent returns a drafted customer email.

---

### User Story 3 - View Real-Time Agent Workflow in Frontend (Priority: P3)

As a claims processor using the frontend, I want to see the real-time progress of agents working on my claim so that I understand what analysis is being performed and can track workflow completion.

**Why this priority**: Real-time visibility enhances user trust but depends on the backend orchestration (US1) working correctly first.

**Independent Test**: Can be tested by monitoring the frontend workflow visualization while a claim is being processed, verifying that agent status updates appear in real-time.

**Acceptance Scenarios**:

1. **Given** a claim is submitted through the frontend, **When** the supervisor orchestrates agents, **Then** the frontend displays which agent is currently active (Claim Assessor → Policy Checker → Risk Analyst → Communication Agent if needed → Supervisor Summary).

2. **Given** an agent completes its analysis, **When** the result is returned to the supervisor, **Then** the frontend updates to show the agent's conclusion and transitions to the next agent.

---

### Edge Cases

- What happens when Azure OpenAI is unavailable? The system should gracefully degrade to mock responses (existing fallback behavior must be preserved).
- How does the system handle a claim where all agents timeout? The supervisor should return a partial assessment with information about which agents failed.
- What happens when the policy search returns no results? The Policy Checker should use the INSUFFICIENT_EVIDENCE assessment.
- How does the system handle malformed or missing image URLs? The Claim Assessor should note the failure but continue assessment with available information.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace LangGraph/LangGraph-Supervisor orchestration with Microsoft Agent Framework without changing external API contracts.
- **FR-002**: System MUST preserve all four specialist agents (Claim Assessor, Policy Checker, Risk Analyst, Communication Agent) with identical prompts and tool bindings.
- **FR-003**: System MUST maintain the supervisor pattern that coordinates agent execution in the established order: Claim Assessor → Policy Checker → Risk Analyst → Communication Agent (conditional).
- **FR-004**: System MUST continue to use Azure OpenAI as the LLM provider with the same configuration (endpoint, deployment, API key).
- **FR-005**: All existing tools (`get_vehicle_details`, `analyze_image`, `get_policy_details`, `search_policy_documents`, `get_claimant_history`) MUST remain functional with the new orchestration layer.
- **FR-006**: System MUST support streaming workflow updates to enable real-time frontend visualization.
- **FR-007**: System MUST maintain backward compatibility with the existing FastAPI endpoints (`/api/v1/workflow/run`, `/api/v1/agent/{agent_name}/run`).
- **FR-008**: System MUST preserve structured logging with the existing logging format (icons, single-line formatter).
- **FR-009**: System MUST return the same assessment format (PRIMARY RECOMMENDATION, SUPPORTING FACTORS, RISK FACTORS, INFORMATION GAPS, RECOMMENDED NEXT STEPS).
- **FR-010**: System MUST support graceful degradation with mock responses when LLM services are unavailable.

### Key Entities *(unchanged from current implementation)*

- **Claim**: Insurance claim submission containing policy number, incident details, damage assessment, and supporting documentation (images, reports).
- **Agent**: Specialized AI processor with a defined role, system prompt, and tool bindings (Claim Assessor, Policy Checker, Risk Analyst, Communication Agent).
- **Supervisor**: Orchestrator that coordinates agent execution order and synthesizes final recommendations.
- **Tool**: Callable function that agents can invoke to retrieve data (policy details, vehicle info, claimant history, image analysis).
- **Assessment**: Structured output from the workflow containing recommendation, supporting factors, risk factors, and next steps.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing integration tests pass without modification to test assertions (only orchestration internals change, not behavior).
- **SC-002**: End-to-end claim processing completes within the same time bounds as the current LangGraph implementation (±10% variance acceptable).
- **SC-003**: 100% of existing API endpoints return responses in the same format as before migration.
- **SC-004**: All four specialist agents are invoked in the correct order for a standard claim submission.
- **SC-005**: Frontend workflow visualization continues to display real-time agent status updates.
- **SC-006**: Mock response fallback activates correctly when Azure OpenAI is unavailable.
- **SC-007**: Zero changes required to frontend code due to backend API contract stability.

## Assumptions

- Microsoft Agent Framework (`pip install agent-framework --pre`) provides equivalent functionality to LangGraph's supervisor pattern and `create_react_agent` capabilities.
- The framework supports tool binding in a manner compatible with the existing `@tool` decorated functions from LangChain.
- Streaming updates from workflows can be consumed by the existing FastAPI streaming response handlers.
- Azure OpenAI integration is supported natively by Microsoft Agent Framework (as indicated in documentation).

## Out of Scope

- Frontend modifications (beyond verifying compatibility).
- Changes to agent prompts or behavior.
- Migration to a different LLM provider.
- Changes to the FAISS vector search for policy documents.
- Performance optimization beyond maintaining parity with current implementation.
- Adding new agents or tools.
