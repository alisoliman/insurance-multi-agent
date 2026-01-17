# Quickstart: Agent Trace UI Enhancement

**Feature**: 003-agent-trace-ui  
**Date**: January 17, 2026

## Prerequisites

- Node.js 18+
- Python 3.12+ with `uv`
- Running backend server (`uv run uvicorn app.main:app`)
- Running frontend dev server (`npm run dev`)

---

## Quick Test

### 1. Start Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Run Workflow Demo

1. Open http://localhost:3000/demo
2. Select a sample claim (e.g., "CLM-2024-001")
3. Click "Run Workflow"
4. Observe agent outputs in the timeline

---

## Component Usage Examples

### Structured Output Card

```tsx
import { ClaimAssessmentCard } from '@/components/agent-outputs/claim-assessment-card'

<ClaimAssessmentCard 
  output={{
    validity_status: "VALID",
    cost_assessment: "Repair costs are reasonable...",
    red_flags: [],
    reasoning: "Vehicle verified via VIN..."
  }}
/>
```

### Risk Score Progress Bar

```tsx
import { RiskScoreBar } from '@/components/agent-outputs/risk-score-bar'

<RiskScoreBar score={75} /> // Yellow (medium risk)
<RiskScoreBar score={25} /> // Green (low risk)
<RiskScoreBar score={90} /> // Red (high risk)
```

### Status Badge

```tsx
import { StatusBadge } from '@/components/agent-outputs/status-badge'

<StatusBadge status="VALID" type="validity" />
<StatusBadge status="COVERED" type="coverage" />
<StatusBadge status="HIGH_RISK" type="risk" />
<StatusBadge status="APPROVE" type="recommendation" />
```

### Tool Call Card

```tsx
import { ToolCallCard } from '@/components/agent-outputs/tool-call-card'

<ToolCallCard
  toolCall={{
    id: "tc_001",
    name: "get_vehicle_details",
    arguments: { vin: "1HGBH41JXMN109186" },
    result: { make: "Honda", model: "Accord", year: 2021 },
    duration_ms: 145
  }}
  defaultExpanded={true}
/>
```

### Final Assessment Summary

```tsx
import { FinalAssessmentCard } from '@/components/agent-outputs/final-assessment-card'

<FinalAssessmentCard
  output={{
    recommendation: "APPROVE",
    confidence: "HIGH",
    summary: "All agents concur...",
    key_findings: ["Valid claim", "Full coverage"],
    next_steps: ["Approve payment", "Send confirmation"]
  }}
/>
```

---

## File Structure (New Components)

```
frontend/
├── types/
│   └── agent-outputs.ts          # TypeScript types
├── components/
│   └── agent-outputs/
│       ├── index.ts              # Barrel export
│       ├── status-badge.tsx      # Enum status badges
│       ├── risk-score-bar.tsx    # Risk score visualization
│       ├── claim-assessment-card.tsx
│       ├── coverage-verification-card.tsx
│       ├── risk-assessment-card.tsx
│       ├── customer-communication-card.tsx
│       ├── final-assessment-card.tsx
│       ├── tool-call-card.tsx    # Collapsible tool call
│       └── agent-trace-step.tsx  # Timeline step wrapper
```

---

## Testing Checklist

- [x] Structured output cards render correctly for each agent type
- [x] Status badges display correct colors (green/yellow/red)
- [x] Risk score progress bar shows gradient color based on value
- [x] Tool call cards expand/collapse properly
- [x] Final assessment appears at top of results
- [x] Dark mode colors are accessible
- [x] Fallback "Unstructured response" badge appears when needed
- [x] Timeline shows clear agent progression
- [x] Performance acceptable with 50+ conversation steps (React.memo applied)

---

## API Testing with curl

```bash
# Run workflow and check for agent_outputs field
curl -X POST http://localhost:8000/api/v1/workflow/run \
  -H "Content-Type: application/json" \
  -d '{"claim_id": "CLM-2024-001"}' | jq '.agent_outputs'
```
