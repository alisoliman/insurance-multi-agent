# Quickstart: Complete Demo Scenario Pipeline

**Feature**: 005-complete-demo-pipeline  
**Date**: 2026-01-18  
**Estimated Implementation Time**: 2-3 days

## Prerequisites

- Python 3.12+ with virtual environment
- Node.js 22+ with pnpm
- Azure OpenAI deployment (GPT-4o recommended)
- Backend running at localhost:8000
- Frontend running at localhost:3000

## Environment Setup

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -e ".[dev]"

# Set environment variables
export AZURE_OPENAI_ENDPOINT="your-endpoint"
export AZURE_OPENAI_API_KEY="your-key"
export AZURE_OPENAI_DEPLOYMENT="gpt-4o"

# Frontend
cd frontend
pnpm install
cp env.example .env.local
```

## Implementation Order

### Phase 1: Backend Data Pipeline (Day 1)

1. **Add vehicles table to database**
   - File: `backend/app/db/database.py`
   - Add CREATE TABLE statement to `init_db()`
   
2. **Create vehicle repository**
   - File: `backend/app/db/vehicle_repo.py` (NEW)
   - Implement: `create_vehicle()`, `get_by_vin()`, `get_by_policy_number()`, `delete_for_scenario()`

3. **Update scenario generator for structured outputs**
   - File: `backend/app/services/scenario_generator.py`
   - Add: `ScenarioGenerationOutput` model usage
   - Change: `response_format={"type": "json_object"}` → `response_format=ScenarioGenerationOutput`
   - Use: `client.beta.chat.completions.parse()`

4. **Add policy indexing to generation flow**
   - File: `backend/app/services/scenario_generator.py`
   - After generation: Call `add_policy_from_text()` with generated policy

### Phase 2: Backend API Updates (Day 1-2)

5. **Update scenario save endpoint**
   - File: `backend/app/api/scenarios.py`
   - On save: Create vehicle record in vehicles table
   
6. **Add Policy Checker fallback**
   - File: `backend/app/workflow/policy_search.py`
   - Wrap search in try/except, return INSUFFICIENT_EVIDENCE on failure

### Phase 3: Frontend UX (Day 2-3)

7. **Create documentation hint component**
   - File: `frontend/components/ai-elements/documentation-hint.tsx` (NEW)
   - Accept: `hasPhotos`, `hasPoliceReport`, `hasWitness` props
   - Render: Badge with count or "recommended" hint

8. **Integrate hints into workflow demo**
   - File: `frontend/components/workflow-demo.tsx`
   - Add: DocumentationHint to claim cards

9. **Add loading delay threshold**
   - File: `frontend/components/workflow-demo.tsx`
   - Implement: 500ms delay before showing spinner

### Phase 4: Testing & Polish (Day 3)

10. **Test scenario generation → workflow execution**
11. **Verify vehicle lookup works in workflow**
12. **Test policy search fallback behavior**

## Key Files to Modify

| File | Changes |
|------|---------|
| `backend/app/db/database.py` | Add vehicles + policies tables |
| `backend/app/db/vehicle_repo.py` | NEW - Vehicle CRUD operations |
| `backend/app/db/policy_repo.py` | NEW - Policy CRUD operations |
| `backend/app/models/scenario.py` | Add ScenarioGenerationOutput |
| `backend/app/services/scenario_generator.py` | Structured outputs |
| `backend/app/api/scenarios.py` | Save vehicle + policy on scenario save |
| `backend/app/workflow/policy_search.py` | Fallback handling |
| `backend/app/main.py` | Add startup re-indexing lifespan |

```bash
# Backend tests
cd backend
pytest tests/ -v

# Run backend server
uvicorn app.main:app --reload

# Frontend
cd frontend
pnpm dev

# Generate test scenario
curl -X POST http://localhost:8000/api/scenarios/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a minor fender bender scenario"}'
```

## Verification Checklist

- [ ] Vehicle + policies tables created on server start
- [ ] Generated scenarios create vehicle AND policy records
- [ ] Policy indexed in FAISS for semantic search after generation
- [ ] Policy record queryable by policy_number for coverage checks
- [ ] Structured output returns proper Pydantic models
- [ ] Policy Checker returns INSUFFICIENT_EVIDENCE when not found
- [ ] Saved policies re-indexed on server restart
- [ ] Documentation hints show on claim cards
- [ ] Loading spinner has 500ms delay
- [ ] Single agent demo works with generated scenarios
- [ ] Workflow demo works with generated scenarios

## Common Issues

### "Vehicle not found" in workflow
- Ensure scenario was saved (not just generated)
- Check vehicles table has entry: `sqlite3 scenarios.db "SELECT * FROM vehicles"`

### "Policy not found" or coverage check fails
- Ensure scenario was saved (creates policy record)
- Check policies table: `sqlite3 scenarios.db "SELECT * FROM policies WHERE policy_number='...'"`
- For semantic search: Restart server triggers re-indexing from saved scenarios

### Structured output parsing error
- Check OpenAI SDK version >= 1.0.0
- Ensure Pydantic model has proper Field descriptions
- Verify model can serialize to JSON schema
