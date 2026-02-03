# Data Model: Claims Handler Workbench

**Feature**: 005-claims-workbench
**Date**: 2026-02-03

## Entities

### 1. Claim

The core entity representing an insurance claim in the workbench.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique claim identifier (UUID) |
| `claimant_name` | TEXT | NOT NULL | Name of person filing claim |
| `claimant_id` | TEXT | NOT NULL | Reference to claimant record |
| `policy_number` | TEXT | NOT NULL | Associated insurance policy |
| `claim_type` | TEXT | NOT NULL | Type: 'auto', 'property', 'liability', etc. |
| `description` | TEXT | NOT NULL | Claim description/incident details |
| `incident_date` | TEXT | NOT NULL | ISO date of incident |
| `estimated_damage` | REAL | | Estimated damage amount |
| `location` | TEXT | | Incident location |
| `status` | TEXT | NOT NULL, DEFAULT 'new' | Lifecycle status (see enum below) |
| `priority` | TEXT | NOT NULL, DEFAULT 'medium' | Priority: 'low', 'medium', 'high', 'urgent' |
| `assigned_handler_id` | TEXT | FK → handlers.id | Handler currently assigned |
| `version` | INTEGER | NOT NULL, DEFAULT 1 | Optimistic locking version |
| `created_at` | TEXT | NOT NULL | ISO timestamp of submission |
| `updated_at` | TEXT | | ISO timestamp of last update |

**Status Enum**:
- `new` - Unassigned, in incoming queue
- `assigned` - Handler has claimed the claim
- `in_progress` - AI processing or manual review active
- `awaiting_info` - Pending additional information from claimant
- `approved` - Claim approved (terminal)
- `denied` - Claim denied (terminal)

**Priority Enum**:
- `low` - Routine claim, no urgency
- `medium` - Standard processing (default)
- `high` - Expedited handling required
- `urgent` - Immediate attention needed

**Indexes**:
- `idx_claims_status` ON (status)
- `idx_claims_assigned_handler` ON (assigned_handler_id)
- `idx_claims_priority_status` ON (priority DESC, status)
- `idx_claims_created_at` ON (created_at DESC)

---

### 2. Handler

Represents a claim handler user in the workbench.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique handler identifier |
| `name` | TEXT | NOT NULL | Display name |
| `email` | TEXT | UNIQUE | Email address (optional) |
| `is_active` | INTEGER | NOT NULL, DEFAULT 1 | Boolean: 1=active, 0=inactive |
| `created_at` | TEXT | NOT NULL | ISO timestamp |

**Note**: For demo operationalization, handlers are seeded at startup. Full user management deferred.

---

### 3. ClaimDecision

Records the final decision made by a handler on a claim.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique decision identifier (UUID) |
| `claim_id` | TEXT | NOT NULL, FK → claims.id | Associated claim |
| `handler_id` | TEXT | NOT NULL, FK → handlers.id | Handler who made decision |
| `decision_type` | TEXT | NOT NULL | 'approved', 'denied', 'request_info' |
| `notes` | TEXT | | Handler's reasoning/notes |
| `ai_assessment_id` | TEXT | FK → ai_assessments.id | Reference to AI recommendation |
| `created_at` | TEXT | NOT NULL | ISO timestamp of decision |

**Decision Type Enum**:
- `approved` - Claim approved for payment
- `denied` - Claim denied
- `request_info` - Additional information requested from claimant

**Indexes**:
- `idx_decisions_claim` ON (claim_id)
- `idx_decisions_handler` ON (handler_id)
- `idx_decisions_created_at` ON (created_at DESC)

---

### 4. AIAssessment

Stores results from multi-agent AI workflow processing.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique assessment identifier (UUID) |
| `claim_id` | TEXT | NOT NULL, FK → claims.id | Associated claim |
| `status` | TEXT | NOT NULL, DEFAULT 'pending' | 'pending', 'processing', 'completed', 'failed' |
| `agent_outputs` | TEXT | | JSON: per-agent structured outputs |
| `final_recommendation` | TEXT | | Supervisor agent's synthesized recommendation |
| `confidence_scores` | TEXT | | JSON: confidence scores by agent |
| `processing_started_at` | TEXT | | ISO timestamp processing began |
| `processing_completed_at` | TEXT | | ISO timestamp processing finished |
| `error_message` | TEXT | | Error details if failed |
| `created_at` | TEXT | NOT NULL | ISO timestamp |

**Status Enum**:
- `pending` - Queued for processing
- `processing` - AI workflow currently running
- `completed` - All agents finished successfully
- `failed` - Processing encountered error

**Indexes**:
- `idx_assessments_claim` ON (claim_id)
- `idx_assessments_status` ON (status)

---

### 5. ClaimAuditLog

Audit trail for all claim-related actions (compliance requirement FR-012).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique log entry identifier (UUID) |
| `claim_id` | TEXT | NOT NULL, FK → claims.id | Associated claim |
| `handler_id` | TEXT | FK → handlers.id | Handler who performed action (if applicable) |
| `action` | TEXT | NOT NULL | Action type (see enum below) |
| `old_value` | TEXT | | Previous value (JSON) |
| `new_value` | TEXT | | New value (JSON) |
| `timestamp` | TEXT | NOT NULL | ISO timestamp of action |

**Action Enum**:
- `created` - Claim submitted
- `assigned` - Handler claimed from queue
- `unassigned` - Handler returned to queue
- `status_changed` - Status transition
- `ai_processing_started` - AI workflow initiated
- `ai_processing_completed` - AI workflow finished
- `decision_recorded` - Final decision made
- `priority_changed` - Priority updated

**Indexes**:
- `idx_audit_claim` ON (claim_id)
- `idx_audit_timestamp` ON (timestamp DESC)
- `idx_audit_handler` ON (handler_id)

---

## Entity Relationships

```
┌─────────────┐       ┌─────────────┐
│   Handler   │       │    Claim    │
├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────┤ assigned_   │
│ name        │   1:N │ handler_id  │
│ is_active   │       │ (FK)        │
└─────────────┘       └──────┬──────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
      ┌───────────┐  ┌─────────────┐  ┌───────────┐
      │ Decision  │  │ AIAssessment│  │ AuditLog  │
      ├───────────┤  ├─────────────┤  ├───────────┤
      │ claim_id  │  │ claim_id    │  │ claim_id  │
      │ (FK)      │  │ (FK)        │  │ (FK)      │
      │ handler_id│  │             │  │ handler_id│
      │ (FK)      │  │             │  │ (FK)      │
      └───────────┘  └─────────────┘  └───────────┘
```

**Cardinality**:
- Handler 1:N Claims (one handler can have many assigned claims)
- Claim 1:N Decisions (claim may have multiple decisions over time, e.g., request_info → approved)
- Claim 1:N AIAssessments (may re-run AI processing)
- Claim 1:N AuditLogs (complete action history)

---

## State Transitions

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
┌───────┐    ┌──────────┐    ┌─────────────┐    ┌──────────┐ │
│  NEW  │───►│ ASSIGNED │───►│ IN_PROGRESS │───►│ APPROVED │ │
└───────┘    └──────────┘    └─────────────┘    └──────────┘ │
                 │                  │                         │
                 │                  │           ┌──────────┐  │
                 │                  └──────────►│  DENIED  │  │
                 │                  │           └──────────┘  │
                 │                  ▼                         │
                 │           ┌──────────────┐                 │
                 │           │ AWAITING_INFO│─────────────────┘
                 │           └──────────────┘
                 │                  │
                 └──────────────────┘
                 (unassign returns
                  to NEW)
```

**Transition Rules**:
1. NEW → ASSIGNED: Handler claims from queue
2. ASSIGNED → IN_PROGRESS: AI processing started OR manual review begins
3. ASSIGNED → NEW: Handler unassigns (returns to queue)
4. IN_PROGRESS → APPROVED: Handler approves claim
5. IN_PROGRESS → DENIED: Handler denies claim
6. IN_PROGRESS → AWAITING_INFO: Handler requests more information
7. AWAITING_INFO → IN_PROGRESS: Information received, processing resumes

---

## SQLite Schema

```sql
-- Claims table
CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    claimant_name TEXT NOT NULL,
    claimant_id TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    claim_type TEXT NOT NULL,
    description TEXT NOT NULL,
    incident_date TEXT NOT NULL,
    estimated_damage REAL,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    priority TEXT NOT NULL DEFAULT 'medium',
    assigned_handler_id TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (assigned_handler_id) REFERENCES handlers(id)
);

CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_assigned_handler ON claims(assigned_handler_id);
CREATE INDEX IF NOT EXISTS idx_claims_priority_status ON claims(priority DESC, status);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC);

-- Handlers table
CREATE TABLE IF NOT EXISTS handlers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

-- Decisions table
CREATE TABLE IF NOT EXISTS claim_decisions (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL,
    handler_id TEXT NOT NULL,
    decision_type TEXT NOT NULL,
    notes TEXT,
    ai_assessment_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (claim_id) REFERENCES claims(id),
    FOREIGN KEY (handler_id) REFERENCES handlers(id),
    FOREIGN KEY (ai_assessment_id) REFERENCES ai_assessments(id)
);

CREATE INDEX IF NOT EXISTS idx_decisions_claim ON claim_decisions(claim_id);
CREATE INDEX IF NOT EXISTS idx_decisions_handler ON claim_decisions(handler_id);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON claim_decisions(created_at DESC);

-- AI Assessments table
CREATE TABLE IF NOT EXISTS ai_assessments (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    agent_outputs TEXT,
    final_recommendation TEXT,
    confidence_scores TEXT,
    processing_started_at TEXT,
    processing_completed_at TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (claim_id) REFERENCES claims(id)
);

CREATE INDEX IF NOT EXISTS idx_assessments_claim ON ai_assessments(claim_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON ai_assessments(status);

-- Audit Log table
CREATE TABLE IF NOT EXISTS claim_audit_log (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL,
    handler_id TEXT,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (claim_id) REFERENCES claims(id),
    FOREIGN KEY (handler_id) REFERENCES handlers(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_claim ON claim_audit_log(claim_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON claim_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_handler ON claim_audit_log(handler_id);

-- Seed demo handlers
INSERT OR IGNORE INTO handlers (id, name, email, is_active, created_at) VALUES
    ('handler-001', 'Alice Johnson', 'alice@contoso.com', 1, datetime('now')),
    ('handler-002', 'Bob Smith', 'bob@contoso.com', 1, datetime('now')),
    ('handler-003', 'Carol Williams', 'carol@contoso.com', 1, datetime('now'));
```

---

## Validation Rules

### Claim
- `claimant_name`: Required, min 2 characters
- `policy_number`: Required, format validation (alphanumeric)
- `claim_type`: Must be one of: 'auto', 'property', 'liability', 'health', 'other'
- `incident_date`: Must be valid ISO date, not in future
- `estimated_damage`: If provided, must be >= 0
- `status`: Must be valid enum value; transitions validated
- `priority`: Must be valid enum value

### ClaimDecision
- `decision_type`: Must be one of: 'approved', 'denied', 'request_info'
- `notes`: Required for 'denied' decisions (must explain reasoning)
- Claim must be in 'in_progress' status to record decision
