# Tasks: Structured Agent Outputs

**Input**: Design documents from `/specs/002-structured-agent-outputs/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not explicitly requested in feature specification - excluded.

**Organization**: Tasks grouped by user story (P1, P2, P3) to enable independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Paths use `backend/` prefix per plan.md structure

---

## Phase 1: Setup

**Purpose**: Create the shared Pydantic models that all agents will use

- [x] T001 Create enums module in backend/app/models/agent_outputs.py with ValidityStatus, CoverageStatus, RiskLevel, Recommendation, Confidence
- [x] T002 [P] Create ClaimAssessment model in backend/app/models/agent_outputs.py
- [x] T003 [P] Create CoverageVerification model in backend/app/models/agent_outputs.py
- [x] T004 [P] Create RiskAssessment model in backend/app/models/agent_outputs.py
- [x] T005 [P] Create CustomerCommunication model in backend/app/models/agent_outputs.py
- [x] T006 [P] Create FinalAssessment model in backend/app/models/agent_outputs.py
- [x] T007 Export all models from backend/app/models/__init__.py

**Checkpoint**: All Pydantic output models defined and importable ✅

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Update supervisor to support structured response handling

**⚠️ CRITICAL**: Agents cannot use structured outputs until supervisor handles `response.value`

- [x] T008 Update `_run_agent()` in backend/app/workflow/supervisor.py to accept output model type parameter
- [x] T009 Update `_run_agent()` in backend/app/workflow/supervisor.py to pass `response_format` to `agent.run()`
- [x] T010 Update `_run_agent()` in backend/app/workflow/supervisor.py to extract `response.value` as structured data
- [x] T011 Update `WorkflowContext.agent_outputs` type in backend/app/workflow/supervisor.py to store structured models (not strings)

**Checkpoint**: Supervisor ready to receive structured outputs from agents ✅

---

## Phase 3: User Story 1 - Reliable Agent Response Parsing (Priority: P1) 🎯 MVP

**Goal**: Specialist agents (Claim Assessor, Policy Checker, Risk Analyst) return structured outputs

**Independent Test**: Run claim through workflow, verify `response.value` contains typed Pydantic model for each specialist agent

### Implementation for User Story 1

- [x] T012 [P] [US1] Update Claim Assessor prompt in backend/app/workflow/agents/claim_assessor.py to describe output schema fields
- [x] T013 [P] [US1] Update Policy Checker prompt in backend/app/workflow/agents/policy_checker.py to describe output schema fields
- [x] T014 [P] [US1] Update Risk Analyst prompt in backend/app/workflow/agents/risk_analyst.py to describe output schema fields
- [x] T015 [US1] Update `_execute_workflow_async()` in backend/app/workflow/supervisor.py to pass ClaimAssessment to claim_assessor run
- [x] T016 [US1] Update `_execute_workflow_async()` in backend/app/workflow/supervisor.py to pass CoverageVerification to policy_checker run
- [x] T017 [US1] Update `_execute_workflow_async()` in backend/app/workflow/supervisor.py to pass RiskAssessment to risk_analyst run
- [x] T018 [US1] Update chunk building in backend/app/workflow/supervisor.py to serialize structured outputs for API response

**Checkpoint**: Claim Assessor, Policy Checker, and Risk Analyst all return structured outputs accessible via `response.value` ✅

---

## Phase 4: User Story 2 - Type-Safe Assessment Aggregation (Priority: P2)

**Goal**: Synthesizer receives structured inputs and produces structured FinalAssessment

**Independent Test**: Run claim through full workflow, verify synthesizer `response.value` is FinalAssessment model with all fields populated

### Implementation for User Story 2

- [x] T019 [US2] Update Synthesizer prompt in backend/app/workflow/agents/synthesizer.py to describe FinalAssessment output schema
- [x] T020 [US2] Update synthesis context building in backend/app/workflow/supervisor.py to format structured agent outputs (not raw text)
- [x] T021 [US2] Update `_execute_workflow_async()` in backend/app/workflow/supervisor.py to pass FinalAssessment to synthesizer run
- [x] T022 [US2] Update final chunk building in backend/app/workflow/supervisor.py to include structured FinalAssessment

**Checkpoint**: Synthesizer produces typed FinalAssessment with recommendation enum, confidence, and categorized findings ✅

---

## Phase 5: User Story 3 - Structured Communication Templates (Priority: P3)

**Goal**: Communication Agent outputs structured CustomerCommunication

**Independent Test**: Trigger communication agent (claim with missing info), verify `response.value` contains CustomerCommunication with subject, body, requested_items

### Implementation for User Story 3

- [x] T023 [US3] Update Communication Agent prompt in backend/app/workflow/agents/communication_agent.py to describe CustomerCommunication schema
- [x] T024 [US3] Update communication agent invocation in backend/app/workflow/supervisor.py to pass CustomerCommunication response_format
- [x] T025 [US3] Update communication chunk building in backend/app/workflow/supervisor.py to serialize structured output

**Checkpoint**: Communication Agent returns structured email template with typed fields ✅

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, logging, and validation

- [x] T026 [P] Add structured output field logging in backend/app/workflow/supervisor.py for observability
- [x] T027 [P] Update backend/app/models/__init__.py exports to include all new models
- [x] T028 [P] Add error logging for structured output validation failures (response.value is None) in backend/app/workflow/supervisor.py
- [x] T029 Run quickstart.md validation: execute sample claim and verify all agents return structured outputs

**Checkpoint**: All validation complete ✅

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ─ BLOCKS ALL USER STORIES
    ↓
┌───────────────────────────────────────┐
│ Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) │  ← Sequential by priority
└───────────────────────────────────────┘
    ↓
Phase 6 (Polish)
```

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only. MVP deliverable.
- **US2 (P2)**: Depends on US1 (synthesizer needs specialist structured outputs)
- **US3 (P3)**: Depends on Phase 2 only. Can parallel with US1/US2 if desired.

### Within Each Phase

- Setup: T001 must complete before T002-T006 (enums first)
- T002-T006 can run in parallel (different models)
- Foundational: T008 → T009 → T010 → T011 (sequential changes to same function)
- US1: T012-T014 parallel (different agent files), then T015-T018 sequential (same file)

### Parallel Opportunities per User Story

**User Story 1**:
```
Parallel: T012, T013, T014 (different agent files)
Sequential: T015 → T016 → T017 → T018 (supervisor.py modifications)
```

**User Story 2**:
```
Sequential: T019 → T020 → T021 → T022 (depends on US1 outputs)
```

**User Story 3**:
```
Sequential: T023 → T024 → T025 (single agent flow)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (models)
2. Complete Phase 2: Foundational (supervisor support)
3. Complete Phase 3: User Story 1 (specialist agents)
4. **VALIDATE**: Run claim, verify structured outputs for all 3 specialist agents
5. Deploy/demo - core value delivered!

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. Add US1 → 3 specialist agents structured → **MVP Done**
3. Add US2 → Synthesizer structured → Full pipeline structured
4. Add US3 → Communication agent structured → Complete feature

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 29 |
| **Phase 1 (Setup)** | 7 tasks |
| **Phase 2 (Foundational)** | 4 tasks |
| **Phase 3 (US1)** | 7 tasks |
| **Phase 4 (US2)** | 4 tasks |
| **Phase 5 (US3)** | 3 tasks |
| **Phase 6 (Polish)** | 4 tasks |
| **Parallel Opportunities** | T002-T006, T012-T014, T026-T028 |
| **MVP Scope** | Phases 1-3 (18 tasks) |
