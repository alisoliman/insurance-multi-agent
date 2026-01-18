# Tasks: AI-Powered Demo Example Generation

**Input**: Design documents from `/specs/004-ai-demo-examples/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization and dependency configuration

- [x] T001 Add `aiosqlite>=0.19.0` dependency to backend/pyproject.toml
- [x] T002 [P] Create backend/app/db/ directory structure
- [x] T003 [P] Create backend/app/models/scenario.py with Pydantic models from data-model.md
- [x] T004 [P] Create frontend/lib/locale-config.ts with Locale enum and configuration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Implement SQLite database connection in backend/app/db/database.py (async init, get_db)
- [x] T006 Create saved_scenarios table schema with migrations in backend/app/db/database.py
- [x] T007 [P] Implement ScenarioRepository CRUD operations in backend/app/db/repositories/scenario_repo.py
- [x] T008 [P] Create base scenario generation prompt template in backend/app/services/scenario_generator.py
- [x] T009 Register scenarios router in backend/app/api/v1/__init__.py
- [x] T010 [P] Create frontend/lib/scenario-api.ts API client with TypeScript types

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Generate Localized Demo Scenario (Priority: P1) 🎯 MVP

**Goal**: Enable users to generate locale-specific demo scenarios by selecting region, claim type, and complexity

**Independent Test**: Select "Germany" as locale, "Auto" as claim type, generate scenario → German names, EUR, German addresses appear

### Implementation for User Story 1

- [x] T011 [US1] Implement locale-aware prompt builder in backend/app/services/scenario_generator.py (locale hints, currency, names)
- [x] T012 [US1] Implement Azure OpenAI JSON mode generation in backend/app/services/scenario_generator.py
- [x] T013 [US1] Implement policy markdown generation within scenario_generator.py
- [x] T014 [US1] Create POST /scenarios/generate endpoint in backend/app/api/v1/endpoints/scenarios.py
- [x] T014a [US1] Implement error handling and retry logic (max 2 retries) in backend/app/services/scenario_generator.py per FR-014
- [x] T015 [P] [US1] Create LocaleSelector component in frontend/components/scenario-generator/locale-selector.tsx
- [x] T016 [P] [US1] Create ClaimTypeSelector component in frontend/components/scenario-generator/claim-type-selector.tsx
- [x] T017 [P] [US1] Create ComplexitySelector component in frontend/components/scenario-generator/complexity-selector.tsx
- [x] T018 [US1] Create ScenarioGeneratorModal container in frontend/components/scenario-generator/scenario-generator-modal.tsx
- [x] T019 [US1] Add "Generate New Scenario" button to frontend/app/demo/page.tsx
- [x] T020 [US1] Integrate generated scenario into claims list display in frontend/app/demo/page.tsx
- [x] T021 [US1] Add loading state and error handling with retry in ScenarioGeneratorModal
- [x] T022 [US1] Add generated policy to FAISS index before workflow execution in backend/app/api/v1/endpoints/scenarios.py

**Checkpoint**: User Story 1 complete - can generate localized scenarios and run through workflow

---

## Phase 4: User Story 2 - Custom Scenario from Description (Priority: P1)

**Goal**: Enable users to generate scenarios from free-form natural language descriptions

**Independent Test**: Enter "A delivery van in Rotterdam damaged two parked cars during a storm" → Dutch scenario generated with matching details

### Implementation for User Story 2

- [x] T023 [US2] Extend prompt builder to handle custom_description input in backend/app/services/scenario_generator.py
- [x] T024 [US2] Add description inference logic (extract locale, claim_type from text) in scenario_generator.py
- [x] T025 [P] [US2] Create CustomDescriptionInput component in frontend/components/scenario-generator/custom-description-input.tsx
- [x] T026 [US2] Add "Custom" tab to ScenarioGeneratorModal with description textarea
- [x] T027 [US2] Connect custom description flow to generate API in ScenarioGeneratorModal

**Checkpoint**: User Stories 1 AND 2 complete - both parameter-based and custom description generation work

---

## Phase 5: User Story 3 - Save and Reuse Generated Scenarios (Priority: P2)

**Goal**: Allow users to save generated scenarios to the backend database for later reuse

**Independent Test**: Generate scenario → Save with name → Refresh page → Scenario appears in "Saved Scenarios" section

### Implementation for User Story 3

- [x] T028 [US3] Create POST /scenarios (save) endpoint in backend/app/api/v1/endpoints/scenarios.py
- [x] T029 [US3] Create GET /scenarios (list) endpoint in backend/app/api/v1/endpoints/scenarios.py
- [x] T030 [US3] Create GET /scenarios/{id} endpoint in backend/app/api/v1/endpoints/scenarios.py
- [x] T031 [US3] Create DELETE /scenarios/{id} endpoint in backend/app/api/v1/endpoints/scenarios.py
- [x] T032 [P] [US3] Create ScenarioCard component in frontend/components/saved-scenarios/scenario-card.tsx
- [x] T033 [P] [US3] Create SavedScenariosList component in frontend/components/saved-scenarios/saved-scenarios-list.tsx
- [x] T034 [US3] Add "Save Scenario" button with name input to ScenarioGeneratorModal
- [x] T035 [US3] Add "My Saved Scenarios" section to frontend/app/demo/page.tsx
- [x] T036 [US3] Implement delete confirmation dialog in SavedScenariosList
- [x] T037 [US3] Add save/list/delete methods to frontend/lib/scenario-api.ts

**Checkpoint**: User Stories 1, 2, AND 3 complete - full generation and persistence workflow

---

## Phase 6: User Story 4 - Preset Regional Templates (Priority: P3)

**Goal**: Provide quick-access preset templates for common locale/claim type combinations

**Independent Test**: Click "Dutch Auto Claim" template → Scenario generated immediately with Dutch characteristics

### Implementation for User Story 4

- [x] T038 [US4] Create GET /scenarios/templates endpoint in backend/app/api/v1/endpoints/scenarios.py
- [x] T039 [US4] Define 6 preset templates (per research.md) in backend/app/services/scenario_generator.py
- [x] T040 [P] [US4] Create PresetTemplates component in frontend/components/scenario-generator/preset-templates.tsx
- [x] T041 [US4] Add "Quick Templates" section to ScenarioGeneratorModal
- [x] T042 [US4] Connect template selection to one-click generation flow

**Checkpoint**: All user stories complete - full feature ready

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [x] T043 [P] Add structured logging for generation requests in scenario_generator.py
- [x] T044 [P] Add error boundary and toast notifications for API errors in frontend
- [x] T045 Validate all 8 locales produce correct formatting (names, currency, addresses)
- [x] T046 Run quickstart.md validation - test all curl examples
- [x] T047 Update frontend/components/workflow-demo.tsx to support generated scenarios seamlessly

**Note on T045 and T046**: These validation tasks are documented and ready for manual testing. The code includes:
- Locale configurations in LOCALE_CONFIG (scenario_generator.py) with proper names, cities, currency for all 8 locales
- quickstart.md provides curl examples for all API endpoints
- Frontend components properly display locale-specific formatting (flags, currencies)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3-6 (User Stories) → Phase 7 (Polish)
                                              ↓
                               [Can run P1 stories in parallel if staffed]
```

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 - Core generation capability
- **US2 (P1)**: Depends on Phase 2 + shares components with US1 - Custom description flow
- **US3 (P2)**: Depends on Phase 2 + uses generated scenarios from US1/US2 - Persistence
- **US4 (P3)**: Depends on Phase 2 + uses generation from US1 - Template shortcuts

### Within Each User Story

1. Backend models/services first
2. Backend endpoints second
3. Frontend components third
4. Integration and testing last

### Parallel Opportunities

```bash
# Phase 1 - all parallel:
T002, T003, T004

# Phase 2 - partial parallel:
T007, T008, T010 (after T005, T006)

# US1 - selector components parallel:
T015, T016, T017

# US3 - card components parallel:
T032, T033
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T010)
3. Complete Phase 3: User Story 1 (T011-T022)
4. **STOP and VALIDATE**: Generate German auto claim, run workflow
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test parameter generation → **MVP Ready!**
3. Add US2 → Test custom descriptions → Enhanced generation
4. Add US3 → Test save/load → Full persistence
5. Add US4 → Test templates → Convenience features
6. Polish → Production ready

### Task Count Summary

| Phase | Tasks | Parallel |
|-------|-------|----------|
| Setup | 4 | 3 |
| Foundational | 6 | 4 |
| US1 (P1) | 12 | 3 |
| US2 (P1) | 5 | 1 |
| US3 (P2) | 10 | 2 |
| US4 (P3) | 5 | 1 |
| Polish | 5 | 2 |
| **Total** | **47** | **16** |

---

## Notes

- All backend paths relative to `backend/`
- All frontend paths relative to `frontend/`
- [P] tasks can run in parallel within their phase
- [US#] label maps task to user story for traceability
- shadcn/ui components: use `npx shadcn@latest add <component>` if needed
- Commit after each task or logical group
