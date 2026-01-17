# Data Model: Microsoft Agent Framework Migration

**Feature**: 001-migrate-ms-agents  
**Date**: 2026-01-17

## Overview

This document defines the data structures used in the migrated orchestration layer. The external API contracts remain unchanged; only internal orchestration structures change.

---

## Agent Definitions

### ChatAgent Configuration

Each specialist agent is defined with the following structure:

```python
@dataclass
class AgentConfig:
    """Configuration for a specialist agent."""
    name: str                    # Unique identifier (e.g., "claim_assessor")
    instructions: str            # System prompt defining agent behavior
    tools: list[Callable]        # List of tool functions the agent can call
    description: str | None      # Optional description for workflow routing
```

### Agent Registry

```python
AGENT_CONFIGS: dict[str, AgentConfig] = {
    "claim_assessor": AgentConfig(
        name="claim_assessor",
        instructions=CLAIM_ASSESSOR_PROMPT,
        tools=[get_vehicle_details, analyze_image],
        description="Evaluates damage validity and cost assessment"
    ),
    "policy_checker": AgentConfig(
        name="policy_checker", 
        instructions=POLICY_CHECKER_PROMPT,
        tools=[get_policy_details, search_policy_documents],
        description="Verifies coverage and policy terms"
    ),
    "risk_analyst": AgentConfig(
        name="risk_analyst",
        instructions=RISK_ANALYST_PROMPT,
        tools=[get_claimant_history],
        description="Analyzes fraud risk and claimant history"
    ),
    "communication_agent": AgentConfig(
        name="communication_agent",
        instructions=COMMUNICATION_AGENT_PROMPT,
        tools=[],  # No tools - language model only
        description="Drafts customer communications for missing info"
    ),
}
```

---

## Tool Function Signatures

All tools migrate from `@tool` decorator to plain functions with `Annotated` type hints:

### get_vehicle_details

```python
def get_vehicle_details(
    vin: Annotated[str, Field(description="The VIN number to look up")]
) -> dict[str, Any]:
    """Retrieve vehicle information for a VIN number.
    
    Returns vehicle make, model, year, value, and specifications.
    """
```

### analyze_image

```python
def analyze_image(
    image_path: Annotated[str, Field(description="Path or URL to the image to analyze")]
) -> str:
    """Analyze an image using Azure OpenAI vision capabilities.
    
    Returns extracted text and visual analysis from the image.
    """
```

### get_policy_details

```python
def get_policy_details(
    policy_number: Annotated[str, Field(description="The policy number to retrieve")]
) -> dict[str, Any]:
    """Retrieve detailed policy information for a given policy number.
    
    Returns coverage limits, deductibles, exclusions, and status.
    """
```

### search_policy_documents

```python
def search_policy_documents(
    query: Annotated[str, Field(description="Search query for policy documents")],
    top_k: Annotated[int, Field(description="Number of results to return")] = 5
) -> list[dict[str, Any]]:
    """Search policy documents using semantic similarity.
    
    Returns matching policy sections with relevance scores.
    """
```

### get_claimant_history

```python
def get_claimant_history(
    claimant_id: Annotated[str, Field(description="The claimant ID to look up")]
) -> dict[str, Any]:
    """Retrieve claim history and risk indicators for a claimant.
    
    Returns previous claims, fraud indicators, and risk factors.
    """
```

---

## Workflow State

### WorkflowContext

State passed through the sequential workflow:

```python
@dataclass
class WorkflowContext:
    """Context maintained across workflow execution."""
    claim_data: dict[str, Any]           # Original claim input
    agent_outputs: dict[str, str]        # Agent name -> output mapping
    conversation_history: list[Message]  # Full conversation for context
    start_time: datetime                 # For performance tracking
```

### WorkflowEvent

Events emitted during workflow streaming:

```python
@dataclass
class WorkflowEvent:
    """Event emitted during workflow execution."""
    event_type: Literal["agent_start", "agent_output", "agent_complete", "workflow_complete"]
    agent_name: str | None
    content: str | None
    timestamp: datetime
    metadata: dict[str, Any]
```

---

## Output Structures

### Assessment Output (unchanged)

The final assessment format remains identical to current implementation:

```
ASSESSMENT_COMPLETE

PRIMARY RECOMMENDATION: [APPROVE/DENY/INVESTIGATE] (Confidence: HIGH/MEDIUM/LOW)
- Brief rationale for the recommendation

SUPPORTING FACTORS:
- Key evidence that supports the recommendation
- Positive indicators identified by the team
- Policy compliance confirmations

RISK FACTORS:
- Concerns or red flags identified
- Potential fraud indicators
- Policy coverage limitations or exclusions

INFORMATION GAPS:
- Missing documentation or data
- Areas requiring clarification
- Additional verification needed

RECOMMENDED NEXT STEPS:
- Specific actions for the human reviewer
- Priority areas for further investigation
- Suggested timeline for decision
```

### API Response (unchanged)

```python
class ClaimOut(BaseModel):
    """Response model for claim processing - UNCHANGED."""
    success: bool
    claim_body: dict[str, Any]
    conversation_grouped: dict[str, list[dict]]
    conversation_chronological: list[dict]
    decision: str | None
    confidence: str | None
```

---

## Message Transformation

### LangGraph Message → Microsoft Agent Framework

| LangGraph | Microsoft Agent Framework |
|-----------|---------------------------|
| `HumanMessage(content=...)` | `ChatMessage(role="user", text=...)` |
| `AIMessage(content=...)` | `ChatMessage(role="assistant", text=...)` |
| `ToolMessage(content=..., tool_call_id=...)` | `FunctionResultContent(...)` |

### Chunk Transformation

Workflow events are transformed to match current chunk format:

```python
def transform_event_to_chunk(event: WorkflowEvent) -> dict[str, Any]:
    """Transform workflow event to API chunk format."""
    if event.event_type == "agent_output":
        return {
            event.agent_name: {
                "messages": [{"role": "assistant", "content": event.content}]
            }
        }
    return {}
```

---

## Entity Relationships

```
┌─────────────────┐
│   ClaimInput    │
│ (unchanged API) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ WorkflowContext │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬─────────────┐
    ▼         ▼            ▼             ▼
┌───────┐ ┌───────┐ ┌──────────┐ ┌────────────┐
│Claim  │ │Policy │ │Risk      │ │Communication│
│Assessor│ │Checker│ │Analyst   │ │Agent       │
└───┬───┘ └───┬───┘ └────┬─────┘ └─────┬──────┘
    │         │          │             │
    └─────────┴──────────┴─────────────┘
                    │
                    ▼
           ┌───────────────┐
           │  Synthesizer  │
           │    Agent      │
           └───────┬───────┘
                   │
                   ▼
           ┌───────────────┐
           │ AssessmentOut │
           │ (unchanged)   │
           └───────────────┘
```
