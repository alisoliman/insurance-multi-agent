# Research: Claims Handler Workbench

**Feature**: 005-claims-workbench
**Date**: 2026-02-03

## Research Topics

### 1. Claims Persistence Strategy

**Decision**: Extend existing SQLite database with claims-specific tables

**Rationale**:
- Project already uses aiosqlite for scenario persistence (`backend/app/db/database.py`)
- SQLite sufficient for 50 concurrent users and ~1000 claims (spec requirements)
- Maintains consistency with existing codebase patterns
- No infrastructure changes required; simpler deployment

**Alternatives Considered**:
- PostgreSQL: More robust for production, but adds operational complexity for a demo operationalization. Deferred to future scaling needs.
- In-memory with periodic dump: Rejected per spec clarification requiring persistence across restarts.

---

### 2. Concurrent Claim Assignment (Optimistic Locking)

**Decision**: Implement optimistic locking using version field + database transaction

**Rationale**:
- SQLite supports transactions; use `BEGIN IMMEDIATE` for write locks
- Add `version` column to claims table; increment on each update
- API checks version match before assignment; returns 409 Conflict if stale
- Simpler than pessimistic locking; matches typical web app patterns

**Alternatives Considered**:
- Pessimistic locking (SELECT FOR UPDATE): SQLite doesn't support row-level locks
- Redis distributed lock: Overkill for single-instance SQLite deployment
- Last-write-wins: Rejected; spec requires preventing simultaneous assignment

**Implementation Pattern**:
```python
async def assign_claim(claim_id: str, handler_id: str, expected_version: int) -> bool:
    async with get_db_connection() as db:
        result = await db.execute(
            """UPDATE claims 
               SET assigned_handler_id = ?, status = 'assigned', version = version + 1
               WHERE id = ? AND version = ? AND assigned_handler_id IS NULL""",
            (handler_id, claim_id, expected_version)
        )
        await db.commit()
        return result.rowcount == 1  # False means conflict
```

---

### 3. Auto-Refresh Polling Implementation

**Decision**: Client-side polling with SWR/React Query pattern (20-second interval)

**Rationale**:
- Spec requires 10-30 second refresh; 20s balances freshness vs server load
- Next.js + React Query (or SWR) provides built-in polling with stale-while-revalidate
- No WebSocket infrastructure needed; simpler deployment
- Existing frontend uses standard fetch; React Query adds caching layer

**Alternatives Considered**:
- WebSockets: Real-time but adds complexity; overkill per spec clarification
- Server-Sent Events (SSE): Simpler than WS but still requires connection management
- Manual refresh button only: Rejected per spec requirement for auto-refresh

**Implementation Pattern**:
```typescript
// Using React Query
const { data: claims } = useQuery({
  queryKey: ['claims', 'queue'],
  queryFn: () => fetchClaimsQueue(),
  refetchInterval: 20000, // 20 seconds
  staleTime: 10000,
});
```

---

### 4. Handler Identity Without Full Auth

**Decision**: Simple session-based handler identification with hardcoded demo users

**Rationale**:
- Spec assumes auth is "implemented separately"
- For operationalization, need handler identity for assignment tracking
- Use localStorage + backend session to persist handler selection
- Pre-populate 3-5 demo handlers for testing multi-user scenarios

**Alternatives Considered**:
- Full OAuth/OIDC: Out of scope per spec assumptions
- Anonymous handlers: Rejected; need attribution for audit trail
- IP-based identification: Unreliable; multiple users could share IP

**Implementation Pattern**:
```typescript
// Frontend: Handler selection persisted in localStorage
const [currentHandler, setCurrentHandler] = useState<Handler | null>(
  localStorage.getItem('handler') ? JSON.parse(localStorage.getItem('handler')!) : null
);

// Backend: Seed demo handlers on startup
DEMO_HANDLERS = [
    {"id": "handler-001", "name": "Alice Johnson"},
    {"id": "handler-002", "name": "Bob Smith"},
    {"id": "handler-003", "name": "Carol Williams"},
]
```

---

### 5. Claim Status State Machine

**Decision**: Enum-based status with explicit transition validation

**Rationale**:
- Spec defines 5 states: New → Assigned → In Progress → Awaiting Info → Approved/Denied
- State machine prevents invalid transitions (e.g., New → Approved)
- Audit trail captures each transition with timestamp and handler

**State Transitions**:
```
New → Assigned (handler claims)
Assigned → In Progress (AI processing started OR manual review started)
In Progress → Awaiting Info (handler requests more info)
In Progress → Approved (handler approves)
In Progress → Denied (handler denies)
Awaiting Info → In Progress (info received, resume processing)
Assigned → New (handler unassigns, returns to queue)
```

**Implementation Pattern**:
```python
VALID_TRANSITIONS = {
    ClaimStatus.NEW: [ClaimStatus.ASSIGNED],
    ClaimStatus.ASSIGNED: [ClaimStatus.IN_PROGRESS, ClaimStatus.NEW],
    ClaimStatus.IN_PROGRESS: [ClaimStatus.AWAITING_INFO, ClaimStatus.APPROVED, ClaimStatus.DENIED],
    ClaimStatus.AWAITING_INFO: [ClaimStatus.IN_PROGRESS],
    ClaimStatus.APPROVED: [],  # Terminal
    ClaimStatus.DENIED: [],    # Terminal
}
```

---

### 6. Integration with Existing Workflow

**Decision**: Call existing `/api/v1/workflow/process` endpoint; store AI assessment results

**Rationale**:
- Spec requires "no modifications to agent logic"
- Existing `workflow.py` endpoint already handles full multi-agent pipeline
- Store AI assessment results in new `ai_assessments` table for display
- Frontend calls workbench API, which internally calls workflow API

**Alternatives Considered**:
- Direct LangGraph invocation: Tighter coupling; harder to maintain agent isolation
- Duplicate workflow code: Violates DRY; maintenance burden
- Background job queue: Adds complexity; not needed for 30s timeout requirement

**Implementation Pattern**:
```python
# In claim_service.py
async def process_claim_with_ai(claim_id: str) -> AIAssessment:
    claim = await get_claim(claim_id)
    
    # Call existing workflow endpoint internally
    workflow_result = await process_workflow(ClaimIn(
        claim_id=claim.id,
        policy_number=claim.policy_number,
        # ... map claim fields
    ))
    
    # Store assessment for later retrieval
    assessment = AIAssessment(
        claim_id=claim_id,
        agent_outputs=workflow_result.agent_outputs,
        final_decision=workflow_result.final_decision,
    )
    await save_ai_assessment(assessment)
    return assessment
```

---

### 7. Frontend Component Reuse

**Decision**: Reuse existing agent output components; create new claims table using TanStack Table pattern

**Rationale**:
- Existing components: `claim-assessment-card.tsx`, `risk-assessment-card.tsx`, `coverage-verification-card.tsx` display agent outputs
- Existing `data-table.tsx` uses TanStack Table pattern; adapt for claims list
- Maintain UI consistency with existing demo aesthetic

**Components to Reuse**:
- `agent-outputs/*.tsx` - All agent result display components
- `workflow-demo.tsx` - AI processing flow visualization (adapt)
- `data-table.tsx` - Table pattern for claims list
- `section-cards.tsx` - Metrics cards pattern for dashboard

**New Components Needed**:
- `claims-table.tsx` - Claims list with assignment actions
- `claim-detail.tsx` - Single claim view with AI results
- `decision-form.tsx` - Approve/deny/request info form

---

## Summary

All technical decisions resolved. No remaining NEEDS CLARIFICATION items.

| Topic | Decision | Confidence |
|-------|----------|------------|
| Persistence | SQLite (extend existing) | High |
| Concurrency | Optimistic locking | High |
| Auto-refresh | React Query polling @ 20s | High |
| Handler identity | Session + demo users | Medium (acceptable for operationalization) |
| State machine | Enum with transition validation | High |
| Workflow integration | Internal API call | High |
| Frontend components | Reuse existing + new claims-specific | High |
