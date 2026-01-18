# Tasks: Complete Demo Scenario Pipeline

**Input**: Design documents from `/specs/005-complete-demo-pipeline/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Paths relative to repository root

---

## Phase 1: Setup

**Purpose**: Database schema changes and new repository files

- [X] T001 Add vehicles table schema to `backend/app/db/database.py` init_db()
- [X] T002 Add policies table schema to `backend/app/db/database.py` init_db()
- [X] T003 [P] Create `backend/app/db/vehicle_repo.py` with VehicleCreate, VehicleRecord models and CRUD operations
- [X] T004 [P] Create `backend/app/db/policy_repo.py` with PolicyCreate, PolicyRecord models and CRUD operations (get_by_policy_number, has_coverage, get_limit)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST complete before user story implementation

**⚠️ CRITICAL**: All user stories depend on structured outputs and data persistence working correctly

- [X] T005 Add ScenarioGenerationOutput Pydantic model to `backend/app/models/scenario.py` for SDK structured outputs
- [X] T006 Add GeneratedClaimData and GeneratedPolicyData nested models to `backend/app/models/scenario.py`
- [X] T007 Refactor `backend/app/services/scenario_generator.py` to use `client.beta.chat.completions.parse()` with ScenarioGenerationOutput model
- [X] T008 Add policy indexing call to `backend/app/services/scenario_generator.py` after generation (call `add_policy_from_text()`)
- [X] T009 Create `reindex_saved_policies()` function in `backend/app/services/scenario_generator.py`
- [X] T010 Add `reindex_saved_policies()` to app startup lifespan in `backend/app/main.py`

**Checkpoint**: Foundation ready - scenario generation uses Pydantic structured outputs, policies are indexed

---

## Phase 3: User Story 1 - Complete End-to-End Scenario Generation (Priority: P1) 🎯 MVP

**Goal**: Generated scenarios work fully through multi-agent workflow with no "not found" errors

**Independent Test**: Generate German auto claim, run workflow, verify all 4 agents produce outputs with no errors

### Implementation for User Story 1

- [X] T011 [US1] Update `backend/app/api/scenarios.py` save endpoint to create vehicle record via vehicle_repo
- [X] T012 [US1] Update `backend/app/api/scenarios.py` save endpoint to create policy record via policy_repo  
- [X] T013 [US1] Add INSUFFICIENT_EVIDENCE fallback to Policy Checker in `backend/app/workflow/policy_search.py`
- [X] T014 [US1] Wire Policy Checker to use `policy_repo.get_by_policy_number()` for coverage lookups in `backend/app/workflow/policy_search.py`
- [X] T015 [P] [US1] Add vehicle lookup endpoint (by VIN) to `backend/app/api/scenarios.py`
- [X] T016 [P] [US1] Add policy lookup endpoint (by policy_number) to `backend/app/api/scenarios.py`
- [ ] T017 [US1] Manual test: Generate scenario → Save → Run workflow → Verify all agents succeed

**Checkpoint**: User Story 1 complete - generated scenarios work end-to-end through workflow

---

## Phase 4: User Story 2 - Structured Output Generation via Pydantic (Priority: P1)

**Goal**: 100% of generated scenarios parse into valid Pydantic models without validation errors

**Independent Test**: Generate 10 scenarios across locales, verify 100% parse without errors

### Implementation for User Story 2

- [X] T018 [US2] Add Field descriptions to all ScenarioGenerationOutput model fields for better LLM guidance in `backend/app/models/scenario.py`
- [X] T019 [US2] Add sensible default handling in scenario_generator.py for partial schema compliance
- [X] T020 [US2] Add structured output parsing logging with model type in `backend/app/services/scenario_generator.py`
- [X] T021 [US2] Add retry logic (up to 3 times) for malformed responses in `backend/app/services/scenario_generator.py`
- [ ] T022 [US2] Manual test: Generate 10 scenarios across DE/NL/UK locales, verify all parse successfully

**Checkpoint**: User Story 2 complete - structured outputs are reliable and type-safe

---

## Phase 5: User Story 3 - Documentation Hints for Claim Assessor (Priority: P1)

**Goal**: UI shows subtle hints about documentation status to educate viewers

**Independent Test**: Run workflow on claim without photos, see hint; add photos, see acknowledgment

### Implementation for User Story 3

- [X] T023 [P] [US3] Create `frontend/components/ai-elements/documentation-hint.tsx` with Badge + Tooltip pattern
- [X] T024 [US3] Add DocumentationHint to claim cards in `frontend/components/workflow-demo.tsx`
- [X] T025 [US3] Style hints with muted colors, small icons per shadcn/ui patterns in `frontend/components/ai-elements/documentation-hint.tsx`
- [X] T026 [US3] Add positive acknowledgment display when documentation present ("📸 3 photos analyzed")
- [ ] T027 [US3] Manual test: Verify hints appear for missing docs, acknowledgments for present docs

**Checkpoint**: User Story 3 complete - documentation hints enhance demo experience

---

## Phase 6: User Story 4 - Single Agent Demo Compatibility (Priority: P2)

**Goal**: Individual agents work correctly with generated scenarios

**Independent Test**: Generate scenario, run Risk Analyst single-agent demo, verify structured output

### Implementation for User Story 4

- [X] T028 [US4] Ensure generated scenarios include all fields required by Claim Assessor in `backend/app/models/scenario.py`
- [X] T029 [US4] Ensure generated scenarios include all fields required by Risk Analyst in `backend/app/models/scenario.py`
- [X] T030 [US4] Verify Communication Agent locale-appropriate email generation with generated scenarios
- [ ] T031 [US4] Manual test: Run each single agent (Claim Assessor, Policy Checker, Risk Analyst, Communication) independently

**Checkpoint**: User Story 4 complete - single agent demos work with generated scenarios

---

## Phase 7: User Story 5 - Presenter-Friendly Scenario Management (Priority: P2)

**Goal**: Presenters can quickly preview and identify scenarios

**Independent Test**: Generate scenario, preview all fields, save, retrieve later, verify data intact

### Implementation for User Story 5

- [X] T032 [P] [US5] Add scenario preview expansion showing all data fields in `frontend/components/workflow-demo.tsx`
- [X] T033 [P] [US5] Add locale flag icons to scenario cards in `frontend/components/workflow-demo.tsx`
- [X] T034 [US5] Add claim type badges and complexity indicators to scenario list in `frontend/components/workflow-demo.tsx`
- [X] T035 [US5] Highlight missing documentation as improvement opportunity in scenario preview
- [ ] T036 [US5] Manual test: Verify presenters can identify scenario details within 2 seconds

**Checkpoint**: User Story 5 complete - scenario management is presenter-friendly

---

## Phase 8: User Story 6 - Viewer-Focused Demo Experience (Priority: P3)

**Goal**: Non-technical viewers understand what each agent does

**Independent Test**: Have unfamiliar viewer watch workflow, verify they can explain each agent's role

### Implementation for User Story 6

- [X] T037 [US6] Add agent role descriptions to workflow visualization in `frontend/components/workflow-demo.tsx`
- [X] T038 [US6] Highlight key metrics prominently (risk score, coverage status with color coding)
- [X] T039 [US6] Add final decision display with contributing factors summary
- [X] T040 [US6] Add 500ms loading indicator delay threshold in `frontend/components/workflow-demo.tsx`
- [ ] T041 [US6] Manual test: Verify workflow visualization is comprehensible to non-technical viewers

**Checkpoint**: User Story 6 complete - demo experience is viewer-friendly

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [X] T042 [P] Update TypeScript types in `frontend/types/` if needed for new policy/vehicle endpoints
- [ ] T043 Run full quickstart.md validation (generate → save → workflow → verify)
- [X] T044 [P] Add error handling for concurrent scenario generation in `backend/app/services/scenario_generator.py`
- [ ] T045 Performance test: Verify scenario generation < 15 seconds including indexing (SC-003)
- [ ] T046 Code cleanup and remove any debug logging

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────────► Phase 2 (Foundational) ─────────────► User Stories
   T001-T004                        T005-T010                           T011+
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|-----------|-------------------|
| US1 (P1) | Phase 2 | - |
| US2 (P1) | Phase 2 | US1 (different files) |
| US3 (P1) | Phase 2 | US1, US2 (frontend vs backend) |
| US4 (P2) | US1, US2 | US3 |
| US5 (P2) | US3 (frontend base) | US4 |
| US6 (P3) | US3, US5 | - |

### Parallel Opportunities

**Backend parallel (after T010):**
```
T011-T014 (US1 save/lookup)  ║  T018-T021 (US2 structured outputs)
```

**Frontend parallel (after Phase 2):**
```
T023-T027 (US3 hints)  ║  T032-T035 (US5 preview)
```

**Full parallel with team:**
```
Developer A: T005-T010, T011-T017 (backend foundation + US1)
Developer B: T018-T022 (US2 structured outputs)  
Developer C: T023-T027, T032-T041 (frontend US3, US5, US6)
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. **Phase 1**: Setup tables (T001-T004) → ~30 min
2. **Phase 2**: Foundational structured outputs (T005-T010) → ~2 hours
3. **Phase 3**: US1 end-to-end workflow (T011-T017) → ~2 hours
4. **Phase 4**: US2 reliable parsing (T018-T022) → ~1 hour
5. **Phase 5**: US3 documentation hints (T023-T027) → ~1 hour
6. **STOP AND VALIDATE**: Test MVP against SC-001, SC-002, SC-003

**MVP delivers**: Generated scenarios work through workflow with documentation hints

### Incremental Delivery

After MVP:
- **+US4**: Single agent demos work → ~1 hour
- **+US5**: Presenter scenario management → ~1 hour  
- **+US6**: Viewer experience polish → ~1 hour
- **Polish**: Final validation → ~30 min

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 46 |
| **Setup/Foundational** | 10 tasks |
| **US1 (P1)** | 7 tasks |
| **US2 (P1)** | 5 tasks |
| **US3 (P1)** | 5 tasks |
| **US4 (P2)** | 4 tasks |
| **US5 (P2)** | 5 tasks |
| **US6 (P3)** | 5 tasks |
| **Polish** | 5 tasks |
| **Parallelizable** | 15 tasks marked [P] |
| **Estimated MVP time** | ~6-7 hours |
| **Estimated total time** | ~10-12 hours |

All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
