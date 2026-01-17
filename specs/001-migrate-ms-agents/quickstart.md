# Quickstart: Microsoft Agent Framework Migration

**Feature**: 001-migrate-ms-agents  
**Date**: 2026-01-17

## Prerequisites

- Python 3.12+
- [uv](https://github.com/astral-sh/uv) package manager
- Azure OpenAI resource with a deployed model (e.g., gpt-4.1)
- Azure CLI authenticated (`az login`) OR Azure OpenAI API key

## Environment Setup

### 1. Clone and checkout the feature branch

```bash
cd /path/to/simple-insurance-multi-agent
git checkout 001-migrate-ms-agents
```

### 2. Install dependencies

```bash
cd backend
uv sync
```

### 3. Configure environment variables

Create or update `.env` in the `backend/` directory:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1
AZURE_OPENAI_API_KEY=your_api_key_here  # Optional if using az login
AZURE_OPENAI_API_VERSION=2025-04-01-preview

# Optional: For Azure CLI credential auth
# Leave AZURE_OPENAI_API_KEY empty and ensure `az login` is completed
```

## Running the Backend

### Development server

```bash
cd backend
uv run python -m app.main
```

The API will be available at `http://localhost:8000`.

### Verify the migration

1. **Health check**:
   ```bash
   curl http://localhost:8000/health
   ```

2. **List sample claims**:
   ```bash
   curl http://localhost:8000/api/v1/workflow/sample-claims
   ```

3. **Process a claim**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/workflow/run \
     -H "Content-Type: application/json" \
     -d '{"claim_id": "CLM-2024-001"}'
   ```

4. **Test individual agent**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/agent/claim_assessor/run \
     -H "Content-Type: application/json" \
     -d '{"claim_id": "CLM-2024-001"}'
   ```

## Running Tests

```bash
cd backend
uv run pytest
```

### Run specific test categories

```bash
# Unit tests
uv run pytest tests/unit/

# Integration tests (requires Azure OpenAI)
uv run pytest tests/integration/

# Test with verbose output
uv run pytest -v --tb=short
```

## Running the Frontend

The frontend requires no changes for this migration.

```bash
cd frontend
npm install
npm run dev
```

Access the UI at `http://localhost:3000`.

## Verifying the Migration

### Expected behavior parity

| Scenario | Expected Result |
|----------|-----------------|
| Process claim via API | Returns same JSON structure with `conversation_grouped`, `conversation_chronological`, `decision`, `confidence` |
| Individual agent invocation | Returns agent output with same format |
| Frontend workflow visualization | Shows agent progression in real-time |
| Missing Azure OpenAI | Falls back to mock responses |

### Key files changed

```
backend/
├── pyproject.toml                      # Dependencies updated
├── app/workflow/
│   ├── supervisor.py                   # MS Agent Framework orchestration
│   ├── registry.py                     # Agent registration
│   ├── tools.py                        # Tool signatures updated
│   └── agents/
│       ├── claim_assessor.py           # ChatAgent factory
│       ├── policy_checker.py           # ChatAgent factory
│       ├── risk_analyst.py             # ChatAgent factory
│       └── communication_agent.py      # ChatAgent factory
└── app/services/
    └── single_agent.py                 # Single agent invocation
```

### Files unchanged (verify no modifications)

```
backend/app/api/v1/endpoints/workflow.py   # API contract preserved
backend/app/api/v1/endpoints/agent.py      # API contract preserved
backend/app/models/                        # Data models unchanged
frontend/                                  # No frontend changes
```

## Troubleshooting

### "Module not found: agent_framework"

```bash
cd backend
uv sync  # Re-sync dependencies
```

### "Azure OpenAI authentication failed"

Either:
- Set `AZURE_OPENAI_API_KEY` in `.env`
- Or run `az login` and ensure the logged-in user has `Cognitive Services OpenAI User` role

### "Streaming not working"

Check that the workflow is using async iteration:
```python
async for event in workflow.run_stream(task=...):
    ...
```

### "Tool not being called"

Verify tool function has:
- Type hints with `Annotated[type, Field(description=...)]`
- A docstring describing the function
- Correct return type annotation

## Performance Comparison

After migration, compare performance:

```bash
# Time a claim processing request
time curl -X POST http://localhost:8000/api/v1/workflow/run \
  -H "Content-Type: application/json" \
  -d '{"claim_id": "CLM-2024-001"}'
```

Expected: Within ±10% of previous LangGraph implementation.
