# Quickstart: Claims Handler Workbench

**Feature**: 005-claims-workbench  
**Date**: 2026-02-03

This guide helps developers set up their local environment to work on the Claims Handler Workbench feature.

## Prerequisites

Before starting, ensure you have:

- Python 3.12+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv) for Python dependency management
- Git (on branch `005-claims-workbench`)

## Quick Start (5 minutes)

### 1. Backend Setup

```bash
# From repository root
cd backend

# Install dependencies (uv handles this automatically)
uv sync

# Start the development server
uv run fastapi dev
```

The API will be available at **http://localhost:8000**

- API docs: http://localhost:8000/docs
- Existing workflow endpoint: `POST /api/v1/workflow/process`

### 2. Frontend Setup

```bash
# From repository root
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start the development server
npm run dev
```

The frontend will be available at **http://localhost:3000**

### 3. Verify Setup

1. Open http://localhost:3000 - you should see the current demo dashboard
2. Open http://localhost:8000/docs - verify the API is running
3. Test the existing workflow endpoint still works (this must remain unchanged)

## Feature-Specific Setup

### Database Initialization

The Claims Workbench adds 5 new tables to the existing SQLite database (`backend/app/data/scenarios.db`):

| Table | Purpose |
|-------|---------|
| `claims` | Insurance claims in the workbench |
| `handlers` | Claim handler users |
| `claim_decisions` | Recorded decisions (approve/deny/request info) |
| `ai_assessments` | Multi-agent AI workflow results |
| `claim_audit_log` | Audit trail for compliance |

**Note**: Schema is defined in `specs/005-claims-workbench/data-model.md`. Tables will be created by the new migration when the feature is implemented.

### Demo Handlers

When the feature is implemented, 3 demo handlers will be seeded automatically:

| ID | Name | Email |
|----|------|-------|
| handler-001 | Alice Johnson | alice@contoso.com |
| handler-002 | Bob Smith | bob@contoso.com |
| handler-003 | Carol Williams | carol@contoso.com |

### Environment Variables

No new environment variables required for this feature. The existing Azure OpenAI configuration in `backend/.env` is used for AI processing:

```env
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1
AZURE_OPENAI_EMBEDDING_MODEL=your-embedding-model
AZURE_OPENAI_API_VERSION=2025-04-01-preview
```

## Development Workflow

### Branch Information

- **Branch**: `005-claims-workbench`
- **Spec**: `specs/005-claims-workbench/spec.md`
- **API Contract**: `specs/005-claims-workbench/contracts/claims-api.yaml`
- **Data Model**: `specs/005-claims-workbench/data-model.md`

### Key Directories

```
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
│   ├── page.tsx                # REPLACE: Workbench home
│   ├── claims/
│   │   ├── page.tsx            # NEW: My assigned claims
│   │   ├── queue/page.tsx      # NEW: Review queue (AI-completed claims)
│   │   └── [id]/page.tsx       # NEW: Claim detail + AI review
│   └── layout.tsx              # MODIFY: Navigation updates
├── components/
│   └── claims/                 # NEW: Claims UI components
└── lib/api/
    └── claims.ts               # NEW: Claims API client
```

### Existing Code (DO NOT MODIFY)

The following must remain unchanged per spec requirements:

- `backend/app/workflow/` - Multi-agent workflow implementation
- `backend/app/workflow/agents/` - Individual agent implementations
- `backend/app/api/v1/endpoints/workflow.py` - Workflow API endpoint
- `backend/app/api/v1/endpoints/agent.py` - Single agent testing endpoint

### Testing

**Backend tests** (pytest):
```bash
cd backend
uv run pytest tests/ -v
```

**Frontend tests** (when added):
```bash
cd frontend
npm test
```

### API Contract

The Claims API is defined in OpenAPI 3.1 format at:
`specs/005-claims-workbench/contracts/claims-api.yaml`

Key endpoints to implement:

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/claims | List claims with filters |
| POST | /api/v1/claims | Create new claim |
| GET | /api/v1/claims/{id} | Get claim details |
| POST | /api/v1/claims/{id}/assign | Assign claim to handler |
| POST | /api/v1/claims/{id}/unassign | Return claim to review queue |
| POST | /api/v1/claims/{id}/process | Re-run AI workflow |
| GET | /api/v1/claims/{id}/assessment | Get AI assessment |
| POST | /api/v1/claims/{id}/decision | Record decision |
| GET | /api/v1/claims/queue | Get review queue |
| GET | /api/v1/claims/processing-queue | Get AI processing queue |
| GET | /api/v1/claims?handler_id={id} | Get handler's assigned claims |
| GET | /api/v1/metrics | Dashboard metrics |

### End-to-End Flow (Manual Smoke Test)

1. Start backend and frontend (see Run the full stack locally).
2. In the UI, open **Review Queue** and click **Seed Sample Claims** or **New Claim**.
3. Open **AI Processing Queue** and confirm the new claim appears with AI status `pending`/`processing`.
4. Wait for AI to complete. The claim should move to **Review Queue** with AI status `completed` or `failed`.
5. Click **Pick Up** to assign the claim.
6. Open the claim detail page and click **Re-run AI** to verify it updates.
7. Record a decision (approve/deny/request info) and confirm the claim status updates.
8. Optionally click **Return to Review Queue** to unassign the claim.

Note: AI processing requires a working LLM configuration. If environment variables are missing, AI runs may fail and the claim will show status `failed` with an error message.

## Common Tasks

### Run the full stack locally

```bash
# Terminal 1: Backend
cd backend && uv run fastapi dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Check existing workflow still works

```bash
curl -X POST http://localhost:8000/api/v1/workflow/process \
  -H "Content-Type: application/json" \
  -d '{"claim_id": "test-001", "claim_type": "auto"}'
```

### View database contents

```bash
sqlite3 backend/app/data/scenarios.db ".tables"
sqlite3 backend/app/data/scenarios.db "SELECT * FROM claims LIMIT 5;"
```

## Troubleshooting

### Port already in use

```bash
# Find and kill process on port 8000
lsof -i :8000 | grep LISTEN
kill -9 <PID>

# Or use a different port
uv run fastapi dev --port 8001
```

### Database errors

If you encounter database issues, you can reset:

```bash
# Remove existing database (CAUTION: deletes all data)
rm backend/app/data/scenarios.db

# Restart backend to recreate tables
uv run fastapi dev
```

### Frontend build errors

```bash
# Clear Next.js cache and reinstall
cd frontend
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run dev
```

## Next Steps

1. Review the spec: `specs/005-claims-workbench/spec.md`
2. Review the data model: `specs/005-claims-workbench/data-model.md`
3. Review the API contract: `specs/005-claims-workbench/contracts/claims-api.yaml`
4. Check tasks (when generated): `specs/005-claims-workbench/tasks.md`

## Resources

- [Project README](../../README.md)
- [Feature Spec](./spec.md)
- [Implementation Plan](./plan.md)
- [Research Decisions](./research.md)
- [Data Model](./data-model.md)
- [API Contract](./contracts/claims-api.yaml)
