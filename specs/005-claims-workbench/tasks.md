---
description: "Task list for Claims Handler Workbench feature implementation"
---

# Tasks: Claims Handler Workbench

**Input**: Design documents from `/specs/005-claims-workbench/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL for this feature - not explicitly requested in specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/`
- **Frontend**: `frontend/app/`, `frontend/components/`, `frontend/lib/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create directory structure for backend `backend/app/api/v1/endpoints/`, `backend/app/services/`, `backend/app/db/repositories/` and frontend `frontend/app/claims/`, `frontend/components/claims/`
- [x] T002 [P] Verify aiosqlite dependency is installed in backend

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Setup database schema for Claims, Handlers, Decisions, AIAssessments, AuditLog tables in `backend/app/db/database.py`
- [x] T004 [P] Define Pydantic models for all workbench entities in `backend/app/models/workbench.py`
- [x] T058 [P] Update workbench Pydantic models to include `latest_assessment_status` on Claim in `backend/app/models/workbench.py`
- [x] T005 Create Claims Repository with CRUD operations in `backend/app/db/repositories/claim_repo.py`
- [x] T006 Setup Claims Service layer in `backend/app/services/claim_service.py`
- [x] T007 Setup Claims API router and include in main app `backend/app/api/v1/endpoints/claims.py` and `backend/app/main.py`
- [x] T008 [P] Create Claims API client functions in `frontend/lib/api/claims.ts`
- [x] T009 Create demo claim seeder/generator endpoint `POST /api/v1/claims/seed` in `backend/app/api/v1/endpoints/claims.py` to populate queue with sample claims

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View My Assigned Claims (Priority: P1) 🎯 MVP

**Goal**: Handlers can see their assigned claims list with key details, sorted by priority

**Independent Test**: Log in as handler (Alice), view assigned claims list, verify claims appear with correct details and priority sorting.

### Implementation for User Story 1

- [x] T010 [US1] Implement `get_claims` method with handler_id filter in `backend/app/db/repositories/claim_repo.py`
- [x] T011 [US1] Implement `get_assigned_claims` service method in `backend/app/services/claim_service.py`
- [x] T012 [US1] Implement `GET /claims?handler_id={id}` endpoint in `backend/app/api/v1/endpoints/claims.py`
- [x] T013 [US1] Create `ClaimsTable` component with priority sorting in `frontend/components/claims/claims-table.tsx`
- [x] T014 [US1] Create "My Claims" page in `frontend/app/claims/page.tsx`
- [x] T015 [US1] Add empty state with "View Review Queue" action per spec US1 acceptance #3 in `frontend/components/claims/claims-table.tsx`
- [x] T016 [US1] Add auto-refresh polling (15s) to My Claims page per FR-013 in `frontend/app/claims/page.tsx`

**Checkpoint**: User Story 1 should be fully functional - handler can view their assigned claims

---

## Phase 4: User Story 2 - View Review Queue and AI Processing Queue (Priority: P1)

**Goal**: Handlers can view AI-processed review queue claims, see a live AI processing queue, and pick up review work

**Independent Test**: Seed demo claims, verify they appear in AI processing queue, then in review queue after AI completes; pick up a claim and verify it moves to assigned list.

### Implementation for User Story 2

- [x] T017 [US2] Update `get_claims` (review queue) to return unassigned claims with latest AI assessment status in [completed, failed] in `backend/app/db/repositories/claim_repo.py`
- [x] T018 [US2] Update `assign_claim` to guard against claiming before AI completes (latest assessment must be completed/failed) in `backend/app/db/repositories/claim_repo.py`
- [x] T019 [US2] Implement `POST /claims/{id}/assign` endpoint in `backend/app/api/v1/endpoints/claims.py`
- [x] T020 [US2] Create "Review Queue" page in `frontend/app/claims/queue/page.tsx`
- [x] T021 [US2] Update auto-refresh polling to 15s in review queue page `frontend/app/claims/queue/page.tsx`
- [x] T022 [US2] Add "Create Test Claim" button/form for demo purposes (auto-enqueues AI) in `frontend/app/claims/queue/page.tsx` or create `frontend/components/claims/create-claim-form.tsx`
- [x] T023 [US2] Implement `POST /claims` frontend function to create claims in `frontend/lib/api/claims.ts`
- [x] T050 [US2] Auto-start AI processing on claim creation in `backend/app/services/claim_service.py`
- [x] T051 [US2] Implement AI processing queue query (latest assessment status pending/processing) in `backend/app/db/repositories/claim_repo.py`
- [x] T052 [US2] Implement `GET /claims/processing-queue` endpoint in `backend/app/api/v1/endpoints/claims.py`
- [x] T053 [US2] Add processing queue API client in `frontend/lib/api/claims.ts`
- [x] T054 [US2] Create AI Processing Queue view (dashboard table or page) in `frontend/app/page.tsx` or `frontend/app/claims/processing-queue/page.tsx`
- [x] T055 [US2] Add 15s auto-refresh polling to AI processing queue view

**Checkpoint**: User Stories 1 AND 2 should both work - handlers can view review/processing queues AND pick up review claims

---

## Phase 5: User Story 3 - Review AI Assessment and Re-run (Priority: P2)

**Goal**: Handlers can review AI assessments and manually re-run the workflow if needed

**Independent Test**: Open a review-queue claim, verify AI results render, then click "Re-run AI" and confirm latest results update.

### Implementation for User Story 3

- [x] T024 [US3] Integrate existing `process_claim_with_supervisor` workflow in `backend/app/services/claim_service.py`
- [x] T025 [US3] Implement `POST /claims/{id}/process` endpoint in `backend/app/api/v1/endpoints/claims.py`
- [x] T026 [US3] Create `AIResults` component to display agent outputs in `frontend/components/claims/ai-results.tsx`
- [x] T027 [US3] Create `ClaimDetail` component in `frontend/components/claims/claim-detail.tsx`
- [x] T028 [US3] Create Claim Detail page in `frontend/app/claims/[id]/page.tsx`
- [x] T029 [US3] Add loading/progress indicator during AI processing in `frontend/components/claims/ai-results.tsx`
- [x] T056 [US3] Add "Re-run AI" button to claim detail and wire to `POST /claims/{id}/process` in `frontend/app/claims/[id]/page.tsx`

**Checkpoint**: User Story 3 complete - handlers can process claims with AI

---

## Phase 6: User Story 4 - Record Claim Decision (Priority: P2)

**Goal**: Handlers can approve, deny, or request info for a claim

**Independent Test**: Process claim, select decision, add notes, confirm, verify status updates correctly.

### Implementation for User Story 4

- [x] T030 [US4] Implement `record_decision` and status update in `backend/app/db/repositories/claim_repo.py`
- [x] T031 [US4] Implement decision logic in `backend/app/services/claim_service.py`
- [x] T032 [US4] Implement `POST /claims/{id}/decision` endpoint in `backend/app/api/v1/endpoints/claims.py`
- [x] T033 [US4] Create `DecisionForm` component in `frontend/components/claims/decision-form.tsx`
- [x] T034 [US4] Integrate `DecisionForm` into Claim Detail page `frontend/app/claims/[id]/page.tsx`

**Checkpoint**: User Story 4 complete - full claim lifecycle works end-to-end

---

## Phase 7: User Story 5 - Filter and Search Claims (Priority: P3)

**Goal**: Handlers can filter assigned and review-queue claims by status, type, and submission date; search by ID/name

**Independent Test**: Apply status/type/date filters, verify list updates. Search by claim ID or claimant name, verify results.

### Implementation for User Story 5

- [x] T035 [US5] Update `get_claims` repository to support status, claim_type, created_at range, and search filters in `backend/app/db/repositories/claim_repo.py`
- [x] T036 [US5] Update `GET /claims` endpoint to accept status, claim_type, created_from, created_to, and search query params in `backend/app/api/v1/endpoints/claims.py`
- [x] T037 [US5] Add filter controls (status, claim type, created_at range) to `frontend/components/claims/claims-table.tsx`
- [x] T038 [US5] Add search input (claim ID exact, claimant name partial) to `frontend/components/claims/claims-table.tsx`
- [x] T057 [US5] Update review queue endpoint to accept same filter/search params in `backend/app/api/v1/endpoints/claims.py`
- [x] T059 [US5] Update claims API client to pass filter/search params for assigned claims and review queue in `frontend/lib/api/claims.ts`
- [x] T060 [US5] Wire filters/search UI to API params in list views (My Claims + Review Queue)

**Checkpoint**: User Story 5 complete - handlers can filter and search claims

---

## Phase 8: User Story 6 - Workbench Dashboard Metrics (Priority: P3)

**Goal**: Handlers can view summary metrics on dashboard

**Independent Test**: View dashboard, verify metrics match actual data (assigned count, review queue depth, processing queue depth, processed today, avg processing time).

### Implementation for User Story 6

- [x] T039 [US6] Update `get_metrics` to include review queue depth, processing queue depth, and avg processing time (assignment → decision) in `backend/app/db/repositories/claim_repo.py`
- [x] T040 [US6] Implement `GET /metrics` endpoint in `backend/app/api/v1/endpoints/claims.py`
- [x] T041 [US6] Update `MetricsCards` component to show new metrics in `frontend/components/dashboard/metrics-cards.tsx`
- [x] T042 [US6] Update Workbench Home page to display updated metrics `frontend/app/page.tsx`

**Checkpoint**: User Story 6 complete - dashboard shows live metrics

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T043 [P] Update navigation sidebar to include Claims Workbench links in `frontend/components/app-sidebar.tsx`
- [x] T044 [P] Ensure all claims pages use consistent sidebar layout
- [x] T045 Implement `POST /claims/{id}/unassign` endpoint per API contract in `backend/app/api/v1/endpoints/claims.py`
- [x] T046 Add unassign button to claim detail page for returning claims to review queue in `frontend/app/claims/[id]/page.tsx`
- [x] T047 Run `npx eslint .` in frontend and fix any lint errors at root cause
- [ ] T048 Verify full end-to-end flow: seed claims → AI auto-process → review queue → pick up → re-run AI (optional) → record decision
- [x] T049 Update quickstart.md with actual test steps based on implementation

---

## Phase 10: Demo Experience Enhancements

**Purpose**: Strengthen usefulness, UI/UX clarity, and demo wow-factor

- [x] T061 [P] Enrich claim queries with latest AI outputs for UI summaries in `backend/app/db/repositories/claim_repo.py`
- [x] T062 [P] Make claim rows clickable and add AI summary panel on detail view in `frontend/components/claims/claims-table.tsx` and `frontend/components/claims/claim-detail.tsx`
- [x] T063 [P] Add Auto-Approvals page with metrics and navigation entry in `frontend/app/claims/auto-approvals/page.tsx` and `frontend/components/app-sidebar.tsx`
- [x] T064 [P] Add dashboard queue insights charts + auto-approved table in `frontend/components/dashboard/queue-insights.tsx` and `frontend/app/page.tsx`
- [x] T065 [P] Surface AI summary columns in My Claims view in `frontend/app/claims/page.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 priority - implement together for MVP
  - US3 and US4 are P2 - complete after P1 stories
  - US5 and US6 are P3 - complete after P2 stories
- **Polish (Phase 9)**: Depends on core user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 3 (P2)**: Requires claim to be assigned (US2) for realistic test
- **User Story 4 (P2)**: Typically follows AI processing (US3) but can work independently
- **User Story 5 (P3)**: Enhances US1/US2 views but independent
- **User Story 6 (P3)**: Independent - just reads aggregated data

### Critical Path for MVP

1. T001-T009 + T050-T055: Setup + Foundational + AI auto-processing + queues
2. T010-T016: User Story 1 (My Claims)
3. T017-T023: User Story 2 (Review Queue + Create Claims)
4. **MVP Complete**: Can demo AI auto-processing, review queue pickup, and assigned claims

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (including claim seeder T009)
3. Complete Phase 3: User Story 1 (My Claims view)
4. Complete Phase 4: User Story 2 (Queue + Claim pickup)
5. **STOP and VALIDATE**: Test full pickup flow with seeded claims
6. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational + US1 + US2 → **MVP Demo** (AI processing + review queue operations)
2. Add US3 + US4 → **Full Processing Demo** (AI review + decisions)
3. Add US5 + US6 → **Complete Workbench** (filters + metrics)

---

## Gap Summary (Current State)

### Completed Tasks: 59/60

### Remaining Critical Tasks:
| Task | Priority | Description |
|------|----------|-------------|
| T048 | MEDIUM | Verify end-to-end flow: seed → AI auto-process → review queue → pick up → re-run AI → decision |

### Immediate Next Steps (Priority Order):
1. **T048**: Verify end-to-end flow
