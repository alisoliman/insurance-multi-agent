# Quickstart: Structured Agent Outputs

**Feature**: 002-structured-agent-outputs  
**Date**: 2026-01-17

## Overview

This feature adds Pydantic-based structured outputs to all insurance claim processing agents, eliminating regex-based parsing in favor of LLM-enforced JSON schemas.

## Prerequisites

- Python 3.12+
- `uv` package manager
- Existing backend environment set up

## Key Files

| File | Purpose |
|------|---------|
| `backend/app/models/agent_outputs.py` | Pydantic models for all agent outputs |
| `backend/app/workflow/agents/*.py` | Agent factories (modified to use `response_format`) |
| `backend/app/workflow/supervisor.py` | Workflow orchestration (modified to parse structured responses) |

## Usage Examples

### 1. Defining a Structured Output Model

```python
from enum import Enum
from pydantic import BaseModel, Field

class RiskLevel(str, Enum):
    LOW_RISK = "LOW_RISK"
    MEDIUM_RISK = "MEDIUM_RISK"
    HIGH_RISK = "HIGH_RISK"

class RiskAssessment(BaseModel):
    risk_level: RiskLevel = Field(description="Overall risk classification")
    risk_score: int = Field(ge=0, le=100, description="Numeric risk score")
    fraud_indicators: list[str] = Field(default_factory=list)
    analysis: str = Field(description="Detailed risk analysis")
```

### 2. Running an Agent with Structured Output

Per the [official docs](https://learn.microsoft.com/en-us/agent-framework/tutorials/agents/structured-output?pivots=programming-language-python), pass `response_format` to `agent.run()`:

```python
from app.models.agent_outputs import RiskAssessment

# Run the agent with structured output
response = await agent.run(
    task,
    response_format=RiskAssessment
)

# Access the structured data directly - it's already a Pydantic model!
if response.value:
    assessment = response.value
    print(f"Risk Level: {assessment.risk_level}")
    print(f"Risk Score: {assessment.risk_score}")
```

### 3. Accessing Structured Response Data

The response is **automatically deserialized** - no need to parse JSON:

```python
from app.models.agent_outputs import RiskAssessment

async def run_risk_analyst(agent, task: str) -> RiskAssessment:
    response = await agent.run(task, response_format=RiskAssessment)
    
    # response.value is already a RiskAssessment instance
    if response.value:
        return response.value
    
    raise ValueError("No structured data in response")
```

## Testing

Run unit tests for the output models:

```bash
cd backend
uv run pytest tests/unit/test_agent_outputs.py -v
```

Run integration test with a sample claim:

```bash
cd backend
uv run python -c "
import asyncio
from app.workflow import process_claim_with_supervisor

claim = {'claim_id': 'TEST-001', 'description': 'Test claim'}
result = asyncio.run(process_claim_with_supervisor(claim))
print(result)
"
```

## Common Issues

### ValidationError on Agent Response

If you see `pydantic.ValidationError`, the LLM produced output not matching the schema. This is rare with structured outputs but can happen if:
- The prompt conflicts with the schema
- The model doesn't support structured outputs (requires GPT-4o or newer)

**Solution**: Check that the prompt instructions align with the expected output fields.

### Missing `response_format` Support

If the agent framework doesn't apply the schema, ensure:
1. Using `default_options` in `ChatAgent.__init__()`, not just runtime options
2. The `AzureOpenAIChatOptions` import is from `agent_framework.azure`

## Architecture Notes

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Supervisor     │────▶│    ChatAgent     │────▶│  LLM (GPT-4o)   │
│  .run(task,     │     │                  │     │ + JSON Schema   │
│   response_fmt) │     └──────────────────┘     └─────────────────┘
└─────────────────┘                                      │
                                                         ▼
                                              ┌──────────────────┐
                                              │  AgentResponse   │
                                              │  .value = Model  │
                                              │  (auto-parsed!)  │
                                              └──────────────────┘
```

The framework automatically deserializes the JSON response into the Pydantic model - no manual parsing required.
