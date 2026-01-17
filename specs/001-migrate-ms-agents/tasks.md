```markdown
# Tasks: Migrate to Microsoft Agent Framework

**Input**: Design documents from `/specs/001-migrate-ms-agents/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested in spec. Integration tests will be run to verify migration correctness.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US#]**: User story label (US1=Full Workflow, US2=Individual Agents, US3=Frontend Visibility)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Dependencies & Configuration)

**Purpose**: Update dependencies and prepare project for migration

- [x] T001 Update dependencies in backend/pyproject.toml - remove LangGraph packages, add agent-framework and azure-identity
- [x] T002 [P] Run `uv sync` to install new dependencies and verify installation
- [x] T003 [P] Create backend/app/workflow/client.py with `build_chat_client()` factory for AzureOpenAIChatClient

---

## Phase 2: Foundational (Tool Migration)

**Purpose**: Migrate tools from `@tool` decorator to plain functions - BLOCKS all agent work

**⚠️ CRITICAL**: Tools must be migrated before any agent can be updated

- [x] T004 Migrate `get_vehicle_details` to Annotated type hints in backend/app/workflow/tools.py
- [x] T005 Migrate `analyze_image` to Annotated type hints in backend/app/workflow/tools.py
- [x] T006 Migrate `get_policy_details` to Annotated type hints in backend/app/workflow/tools.py
- [x] T007 Migrate `search_policy_documents` to Annotated type hints in backend/app/workflow/tools.py
- [x] T008 Migrate `get_claimant_history` to Annotated type hints in backend/app/workflow/tools.py
- [x] T009 Remove `langchain_core.tools` import from backend/app/workflow/tools.py

**Checkpoint**: Tools ready - agent migration can now begin

---

## Phase 3: User Story 1 - Process Claims with Migrated Multi-Agent System (Priority: P1) 🎯 MVP

**Goal**: Full workflow claim processing with all 4 specialist agents and supervisor synthesis

**Independent Test**: Submit claim via `POST /api/v1/workflow/run` → verify all agents invoked → verify structured assessment returned

### Agent Factory Migration (US1)

- [x] T010 [P] [US1] Migrate claim_assessor factory to ChatAgent pattern in backend/app/workflow/agents/claim_assessor.py
- [x] T011 [P] [US1] Migrate policy_checker factory to ChatAgent pattern in backend/app/workflow/agents/policy_checker.py
- [x] T012 [P] [US1] Migrate risk_analyst factory to ChatAgent pattern in backend/app/workflow/agents/risk_analyst.py
- [x] T013 [P] [US1] Migrate communication_agent factory to ChatAgent pattern in backend/app/workflow/agents/communication_agent.py

### Supervisor & Workflow Migration (US1)

- [x] T014 [US1] Create synthesizer agent for final assessment in backend/app/workflow/agents/synthesizer.py
- [x] T015 [US1] Implement SequentialBuilder workflow in backend/app/workflow/supervisor.py
- [x] T016 [US1] Implement `create_insurance_supervisor()` returning workflow in backend/app/workflow/supervisor.py
- [x] T017 [US1] Implement `process_claim_with_supervisor()` with workflow execution in backend/app/workflow/supervisor.py
- [x] T018 [US1] Add workflow streaming support in backend/app/workflow/supervisor.py for real-time updates

### Registry Update (US1)

- [x] T019 [US1] Update agent registry with AgentConfig dataclass in backend/app/workflow/registry.py
- [x] T020 [US1] Export all agents and workflow from backend/app/workflow/__init__.py

### Validation (US1)

- [x] T021 [US1] Test full workflow with sample claim CLM-2024-001 via API endpoint
- [x] T022 [US1] Verify output format matches expected assessment structure (PRIMARY RECOMMENDATION, etc.)
- [x] T023 [US1] Verify conversation_grouped and conversation_chronological format in response

**Checkpoint**: User Story 1 complete - full workflow processing functional

---

## Phase 4: User Story 2 - Invoke Individual Agents Independently (Priority: P2)

**Goal**: Each specialist agent callable independently via its endpoint

**Independent Test**: Call `POST /api/v1/agent/{agent_name}/run` for each agent → verify response format

### Single Agent Service (US2)

- [x] T024 [US2] Update `invoke_single_agent()` in backend/app/services/single_agent.py to use ChatAgent
- [x] T025 [US2] Preserve response format (conversation_chronological) in single_agent.py

### Agent Endpoint Validation (US2)

- [x] T026 [P] [US2] Test claim_assessor endpoint with sample claim
- [x] T027 [P] [US2] Test policy_checker endpoint with sample claim
- [x] T028 [P] [US2] Test risk_analyst endpoint with sample claim
- [x] T029 [P] [US2] Test communication_agent endpoint with sample claim

**Checkpoint**: User Story 2 complete - all agents independently callable

---

## Phase 5: User Story 3 - Real-Time Agent Workflow Visibility (Priority: P3)

**Goal**: Frontend receives real-time workflow events during claim processing

**Independent Test**: Monitor network during claim submission → verify agent status events streamed

### Streaming Event Transformation (US3)

- [x] T030 [US3] Implement workflow event transformation in backend/app/workflow/supervisor.py
- [x] T031 [US3] Verify streaming endpoint sends agent_start, agent_output, agent_complete events
- [x] T032 [US3] Test frontend workflow visualization receives and displays agent status updates

**Checkpoint**: User Story 3 complete - real-time visibility functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, validation, and documentation

- [x] T033 [P] Remove unused LangGraph imports from all modified files
- [x] T034 [P] Verify graceful degradation with mock responses when Azure OpenAI unavailable
- [x] T035 Run existing integration tests to verify no regressions
- [x] T036 [P] Update code comments and docstrings to reflect new framework
- [x] T037 Run quickstart.md validation steps to confirm local development works

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ──────────────────────────────┐
                                             │
Phase 2: Foundational (Tools) ◄──────────────┘
    │
    │ ⚠️ BLOCKS all user story work
    │
    ├───────────────────────────────────────────────────────┐
    │                                                       │
    ▼                                                       ▼
Phase 3: User Story 1 (P1)                    Phase 4: User Story 2 (P2)
    │                                               │
    │                                               │
    └───────────────────┬───────────────────────────┘
                        │
                        ▼
                Phase 5: User Story 3 (P3)
                    │
                    ▼
                Phase 6: Polish
```

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 (tools) - Core workflow
- **User Story 2 (P2)**: Depends on Phase 2 (tools) and agent factories from US1 (T010-T013)
- **User Story 3 (P3)**: Depends on US1 (workflow streaming must work first)

### Within User Story 1

1. Agent factories (T010-T013) - [P] run in parallel
2. Synthesizer agent (T014) - after factories
3. Supervisor workflow (T015-T018) - sequential, depends on all agents
4. Registry update (T019-T020) - after workflow
5. Validation (T021-T023) - after registry

---

## Parallel Opportunities

### Phase 2 (Tools) - Run in sequence (same file)

```bash
# Tools must be migrated in sequence (same file)
T004 → T005 → T006 → T007 → T008 → T009
```

### Phase 3 (US1) - Agent Factories in Parallel

```bash
# Launch all agent migrations together:
T010: "Migrate claim_assessor factory in backend/app/workflow/agents/claim_assessor.py"
T011: "Migrate policy_checker factory in backend/app/workflow/agents/policy_checker.py"
T012: "Migrate risk_analyst factory in backend/app/workflow/agents/risk_analyst.py"
T013: "Migrate communication_agent factory in backend/app/workflow/agents/communication_agent.py"
```

### Phase 4 (US2) - Endpoint Tests in Parallel

```bash
# Launch all endpoint tests together:
T026: "Test claim_assessor endpoint"
T027: "Test policy_checker endpoint"
T028: "Test risk_analyst endpoint"
T029: "Test communication_agent endpoint"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Tools (T004-T009) - CRITICAL
3. Complete Phase 3: User Story 1 (T010-T023)
4. **STOP and VALIDATE**: Test workflow with sample claim
5. Deploy/demo if ready - core functionality works

### Incremental Delivery

1. Setup + Tools → Foundation ready
2. User Story 1 → Full workflow working → Deploy/Demo (MVP!)
3. User Story 2 → Individual agents → Deploy/Demo
4. User Story 3 → Real-time visibility → Deploy/Demo
5. Each story adds value without breaking previous

---

## Notes

- All file paths are relative to repository root (`backend/app/...`)
- [P] tasks = different files, no dependencies - can run in parallel
- [US#] label maps task to specific user story
- Keep existing prompts unchanged - only orchestration layer migrates
- API contracts MUST remain identical - test responses match current format
- Pin `agent-framework>=1.0.0b260116` to avoid breaking changes

```
