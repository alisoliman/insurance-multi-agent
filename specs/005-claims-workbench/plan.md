# Implementation Plan: Claims Handler Workbench

**Branch**: `005-claims-workbench` | **Date**: 2026-02-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-claims-workbench/spec.md`

## Summary

Transform the existing demo dashboard into an operational Claims Handler Workbench where insurance claim handlers can view AI-processed review queues and a live AI processing dashboard, manage their assignments, review AI assistance, and record decisions. The existing multi-agent workflow (Claim Assessor, Policy Checker, Risk Analyst, Communication Agent, Supervisor) remains unchanged; this feature wraps it in a production-ready operational UI with persistent storage.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.9 (frontend)
**Primary Dependencies**: FastAPI, agent-framework, aiosqlite (backend); Next.js 15, React 19, shadcn/ui, TanStack Table (frontend)
**Storage**: SQLite via aiosqlite (extending existing `backend/app/db/database.py`)
**Testing**: pytest (backend), Jest/React Testing Library (frontend - to be added)
**Target Platform**: Web browser (desktop-first, responsive)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: 3s page load, 30s AI workflow completion, 50 concurrent handlers
**Constraints**: Auto-refresh polling every 15 seconds, single-tenant deployment
**Scale/Scope**: 50 concurrent users, ~1000 claims in queue

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence/Plan |
|-----------|--------|---------------|
| **I. Agent Isolation** | ✅ PASS | Existing agents remain unchanged; workbench calls supervisor workflow via existing API |
| **II. Explainable AI** | ✅ PASS | FR-006 requires displaying structured outputs and confidence scores for transparency |
| **III. Test-First Development** | ⚠️ PENDING | Tests must be written for new API endpoints and critical frontend flows |
| **IV. Observability** | ✅ PASS | Spec clarified minimal logging (standard application logs); audit trail via FR-012 |
| **V. Security-First** | ⚠️ PENDING | Auth assumed separate; must validate handler identity before claim operations |

**Gate Evaluation**: PASS - No blocking violations. Test-First and Security addressed in implementation tasks.

## Project Structure

### Documentation (this feature)

```text
specs/005-claims-workbench/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── claims-api.yaml  # OpenAPI spec for claims endpoints
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/v1/endpoints/
│   │   └── claims.py           # NEW: Claims workbench API
│   ├── db/
│   │   ├── database.py         # EXTEND: Add claims tables
│   │   └── repositories/
│   │       └── claim_repo.py   # NEW: Claims data access
│   ├── models/
│   │   └── workbench.py        # NEW: Workbench Pydantic models
│   └── services/
│       └── claim_service.py    # NEW: Claims business logic
└── tests/
    └── test_claims_api.py      # NEW: API contract tests

frontend/
├── app/
│   ├── page.tsx                # REPLACE: Workbench home (was demo dashboard)
│   ├── claims/
│   │   ├── page.tsx            # NEW: My assigned claims
│   │   ├── queue/page.tsx      # NEW: Review queue (AI-completed claims)
│   │   └── [id]/page.tsx       # NEW: Claim detail + AI processing
│   └── layout.tsx              # MODIFY: Navigation updates
├── components/
│   ├── claims/
│   │   ├── claims-table.tsx    # NEW: Reusable claims list
│   │   ├── claim-card.tsx      # NEW: Claim summary card
│   │   ├── claim-detail.tsx    # NEW: Full claim view
│   │   ├── decision-form.tsx   # NEW: Approve/deny/request info
│   │   └── ai-results.tsx      # NEW: AI agent outputs display
│   └── dashboard/
│       └── metrics-cards.tsx   # MODIFY: Workbench metrics
├── lib/
│   └── api/
│       └── claims.ts           # NEW: Claims API client
└── tests/                      # NEW: Frontend tests directory
```

**Structure Decision**: Web application structure (Option 2). Extending existing backend/frontend directories. Claims-specific code isolated in dedicated subdirectories for clear boundaries.

## Complexity Tracking

> No constitution violations requiring justification. Design follows existing patterns.
