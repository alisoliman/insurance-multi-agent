# Tasks: Agent Trace UI Enhancement

**Feature**: 003-agent-trace-ui  
**Input**: [plan.md](plan.md), [spec.md](spec.md), [data-model.md](data-model.md), [contracts/workflow-run.md](contracts/workflow-run.md), [research.md](research.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install dependencies and create project structure

- [X] T001 Install Magic UI timeline component via `npx shadcn@latest add "https://magicui.design/r/timeline"` in frontend/ (created custom timeline component - Magic UI URL unavailable)
- [X] T002 [P] Create agent-outputs directory structure at frontend/components/agent-outputs/
- [X] T003 [P] Create TypeScript types file at frontend/types/agent-outputs.ts with all enums and interfaces from data-model.md

---

## Phase 2: Foundational (Backend API Enhancement)

**Purpose**: Backend changes required before frontend can display structured outputs

**⚠️ CRITICAL**: Frontend structured output display depends on this phase

- [X] T004 Add ToolCallOut and AgentOutputOut Pydantic models in backend/app/models/claim.py
- [X] T005 Update ClaimOut model to include agent_outputs field in backend/app/models/claim.py
- [X] T006 Modify workflow.py to collect and return structured outputs in backend/app/api/v1/endpoints/workflow.py
- [X] T007 Test API returns structured outputs by running workflow and verifying agent_outputs field

**Checkpoint**: Backend API now returns structured outputs - frontend work can begin

---

## Phase 3: User Story 1 - View Structured Agent Outputs (Priority: P1) 🎯 MVP

**Goal**: Display agent responses in type-specific card components instead of raw text

**Independent Test**: Run workflow, verify ClaimAssessment fields display in dedicated UI components

### Base Components for US1

- [X] T008 [P] [US1] Create StatusBadge component in frontend/components/agent-outputs/status-badge.tsx
- [X] T009 [P] [US1] Create RiskScoreBar component in frontend/components/agent-outputs/risk-score-bar.tsx

### Agent Output Cards for US1

- [X] T010 [P] [US1] Create ClaimAssessmentCard component in frontend/components/agent-outputs/claim-assessment-card.tsx
- [X] T011 [P] [US1] Create CoverageVerificationCard component in frontend/components/agent-outputs/coverage-verification-card.tsx
- [X] T012 [P] [US1] Create RiskAssessmentCard component in frontend/components/agent-outputs/risk-assessment-card.tsx
- [X] T013 [P] [US1] Create CustomerCommunicationCard component in frontend/components/agent-outputs/customer-communication-card.tsx

### Integration for US1

- [X] T014 [US1] Create barrel export in frontend/components/agent-outputs/index.ts
- [X] T015 [US1] Update WorkflowDemo to render structured output cards in frontend/components/workflow-demo.tsx
- [X] T016 [US1] Add fallback display with "Unstructured response" badge when structured_output is null

**Checkpoint**: User Story 1 complete - structured outputs display in type-specific cards

---

## Phase 4: User Story 4 - View Final Assessment Summary (Priority: P1) 🎯 MVP

**Goal**: Display final synthesis prominently at top of results

**Independent Test**: Run workflow, verify FinalAssessment card appears first with recommendation badge

### Implementation for US4

- [X] T017 [P] [US4] Create FinalAssessmentCard component in frontend/components/agent-outputs/final-assessment-card.tsx
- [X] T018 [US4] Update WorkflowDemo to render FinalAssessmentCard at top of results in frontend/components/workflow-demo.tsx

**Checkpoint**: User Story 4 complete - final assessment displays prominently

---

## Phase 5: User Story 2 - View Tool Calls and Responses (Priority: P2)

**Goal**: Display tool calls distinctly with collapsible cards showing name, inputs, and response

**Independent Test**: Run agent with tool usage, verify tool cards appear separately from reasoning

### Implementation for US2

- [X] T019 [P] [US2] Create ToolCallCard component with collapsible content in frontend/components/agent-outputs/tool-call-card.tsx
- [X] T020 [US2] Update WorkflowDemo to render tool calls using ToolCallCard in frontend/components/workflow-demo.tsx
- [X] T021 [US2] Add error state styling to ToolCallCard when tool returns error

**Checkpoint**: User Story 2 complete - tool calls display in distinct collapsible cards

---

## Phase 6: User Story 3 - Navigate Agent Trace Timeline (Priority: P2)

**Goal**: Provide visual timeline with agent icons, colors, and connecting lines

**Independent Test**: Run full workflow, verify timeline shows agent sections with visual connectors

### Implementation for US3

- [X] T022 [P] [US3] Create AgentTraceStep wrapper component in frontend/components/agent-outputs/agent-trace-step.tsx
- [X] T023 [US3] Integrate Magic UI timeline component into workflow display in frontend/components/workflow-demo.tsx
- [X] T024 [US3] Add agent-specific icons and colors to timeline steps
- [X] T025 [US3] Add timestamp/step number indicators to each trace step

**Checkpoint**: User Story 3 complete - timeline navigation with visual hierarchy

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Dark mode, accessibility, performance, and documentation

- [X] T026 [P] Verify dark mode colors for all status badges and cards
- [X] T027 [P] Add ARIA labels and keyboard navigation to collapsible sections
- [X] T028 [P] Add React.memo optimization to agent-trace-step and card components
- [X] T029 [P] Update demo page to showcase new structured output display in frontend/app/demo/page.tsx
- [X] T030 Run quickstart.md testing checklist to validate all components

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──────────────────────────────────────┐
                                                       │
Phase 2 (Backend API) ─────────────────────────────────┤
                                                       │
    ┌──────────────────────────────────────────────────┤
    │                                                  │
    ▼                                                  ▼
Phase 3 (US1: Structured Outputs) ──────► Phase 4 (US4: Final Assessment)
    │                                          │
    │                                          │
    ▼                                          ▼
Phase 5 (US2: Tool Calls) ◄────────────────────┤
    │                                          │
    ▼                                          │
Phase 6 (US3: Timeline) ◄──────────────────────┘
    │
    ▼
Phase 7 (Polish)
```

### User Story Dependencies

- **US1 (P1)**: Requires Phase 2 (Backend API) - Can start immediately after
- **US4 (P1)**: Requires Phase 2 (Backend API) - Can run parallel to US1
- **US2 (P2)**: Requires Phase 2 (Backend API) - Can start after US1 or parallel
- **US3 (P2)**: Requires US1 components (StatusBadge) - Start after US1

### Parallel Opportunities

```bash
# Phase 1: All setup tasks
T001, T002, T003 (parallel)

# Phase 2: Sequential (API changes)
T004 → T005 → T006 → T007

# Phase 3 (US1): Base components parallel, then cards parallel
T008, T009 (parallel) → T010, T011, T012, T013 (parallel) → T014 → T015 → T016

# Phase 4 (US4): Can run parallel to late US1
T017 (parallel with T010-T013) → T018

# Phase 5 (US2): After US1 integration
T019 → T020 → T021

# Phase 6 (US3): After US1 complete
T022 → T023 → T024 → T025

# Phase 7: All polish tasks parallel
T026, T027, T028, T029 (parallel) → T030
```

---

## Implementation Strategy

### MVP First (US1 + US4)

1. Complete Phase 1: Setup
2. Complete Phase 2: Backend API Enhancement
3. Complete Phase 3: User Story 1 (Structured Outputs)
4. Complete Phase 4: User Story 4 (Final Assessment)
5. **STOP and VALIDATE**: Demo shows structured cards + final assessment at top
6. Deploy MVP

### Incremental Delivery

| Increment | Stories | Value Delivered |
|-----------|---------|-----------------|
| MVP | US1 + US4 | Structured output cards, final assessment |
| +1 | US2 | Tool call visualization |
| +2 | US3 | Timeline navigation |
| +3 | Polish | Dark mode, a11y, performance |

---

## Task Count Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|------------------------|
| Setup | 3 | 3 parallel |
| Foundational | 4 | Sequential |
| US1 (P1) | 9 | 6 parallel in groups |
| US4 (P1) | 2 | 1 parallel |
| US2 (P2) | 3 | 1 parallel |
| US3 (P2) | 4 | 1 parallel |
| Polish | 5 | 4 parallel |
| **Total** | **30** | **16 parallel opportunities** |

---

## Notes

- Backend changes (Phase 2) are blocking - complete first
- US1 and US4 are both P1 priority and MVP scope
- US2 and US3 are P2 priority, can be deferred
- All card components follow same structure: props interface, semantic colors, dark mode
- Test with CLM-2024-001 sample claim for consistent data
