# Research: Microsoft Agent Framework Migration

**Feature**: 001-migrate-ms-agents  
**Date**: 2026-01-17

## Executive Summary

Microsoft Agent Framework (`agent-framework` package) provides full equivalent functionality to LangGraph for this migration:

| Capability | LangGraph | Microsoft Agent Framework |
|------------|-----------|---------------------------|
| Agent creation | `create_react_agent(model, tools, prompt)` | `ChatAgent(chat_client, instructions, tools)` |
| Tool binding | `@tool` decorator | Plain Python functions or `@ai_function` decorator |
| Azure OpenAI | `AzureChatOpenAI` (LangChain) | `AzureOpenAIChatClient` (native) |
| Supervisor/orchestration | `create_supervisor()` | `SequentialBuilder` / `HandoffBuilder` workflows |
| Streaming | `graph.stream()` | `agent.run_stream()` / workflow streaming |

**Decision**: Proceed with migration using `AzureOpenAIChatClient` for agents and `SequentialBuilder` workflow for supervisor orchestration.

---

## Research Task 1: Agent Creation Pattern

### Question
How do we migrate from LangGraph's `create_react_agent` to Microsoft Agent Framework?

### Findings

**LangGraph (current)**:
```python
from langgraph.prebuilt import create_react_agent

agent = create_react_agent(
    model=llm,
    tools=[get_vehicle_details, analyze_image],
    prompt="You are a claim assessor...",
    name="claim_assessor"
)
```

**Microsoft Agent Framework (target)**:
```python
from agent_framework import ChatAgent
from agent_framework.azure import AzureOpenAIChatClient

agent = ChatAgent(
    chat_client=AzureOpenAIChatClient(credential=AzureCliCredential()),
    instructions="You are a claim assessor...",
    name="claim_assessor",
    tools=[get_vehicle_details, analyze_image]
)
```

**Or using the fluent `as_agent()` pattern**:
```python
agent = AzureOpenAIChatClient(credential=AzureCliCredential()).as_agent(
    name="claim_assessor",
    instructions="You are a claim assessor...",
    tools=[get_vehicle_details, analyze_image]
)
```

### Decision
Use `ChatAgent` with `AzureOpenAIChatClient` for explicit configuration control, matching the current explicit LLM setup pattern.

**Rationale**: The explicit `ChatAgent` constructor provides clearer separation between client configuration and agent definition, aligning with Constitution Principle II (Separation of Agent and Orchestration).

---

## Research Task 2: Tool Binding Compatibility

### Question
Can existing `@tool` decorated functions be used directly with Microsoft Agent Framework?

### Findings

**Current tools use LangChain's `@tool` decorator**:
```python
from langchain_core.tools import tool

@tool
def get_vehicle_details(vin: str) -> Dict[str, Any]:
    """Retrieve vehicle information for a VIN."""
    ...
```

**Microsoft Agent Framework accepts**:
1. Plain Python functions with type hints and docstrings
2. Functions decorated with `@ai_function` (optional, for approval modes)
3. Pydantic `Field` annotations for parameter descriptions

**Migration approach**:
```python
from typing import Annotated
from pydantic import Field

def get_vehicle_details(
    vin: Annotated[str, Field(description="The VIN number to look up")]
) -> Dict[str, Any]:
    """Retrieve vehicle information for a VIN."""
    ...
```

### Decision
Convert `@tool` decorated functions to plain functions with `Annotated[type, Field(description=...)]` type hints.

**Rationale**: 
- Removes LangChain dependency from tool definitions
- Microsoft Agent Framework auto-extracts tool schemas from type hints and docstrings
- Maintains same functionality with cleaner, framework-agnostic code

---

## Research Task 3: Supervisor/Orchestration Pattern

### Question
How do we replicate LangGraph's `create_supervisor()` pattern in Microsoft Agent Framework?

### Findings

**LangGraph (current)**:
```python
from langgraph_supervisor import create_supervisor

supervisor = create_supervisor(
    agents=[claim_assessor, policy_checker, risk_analyst, communication_agent],
    model=LLM,
    prompt="You are a senior claims manager..."
).compile()

# Execution
for chunk in supervisor.stream({"messages": messages}):
    ...
```

**Microsoft Agent Framework options**:

1. **SequentialBuilder** - For fixed sequential agent execution:
```python
from agent_framework.workflows import SequentialBuilder

workflow = (
    SequentialBuilder()
    .add_agent(claim_assessor)
    .add_agent(policy_checker)
    .add_agent(risk_analyst)
    .add_agent(communication_agent)  # conditional
    .build()
)
```

2. **HandoffBuilder** - For dynamic routing between agents:
```python
from agent_framework.workflows import HandoffBuilder

workflow = (
    HandoffBuilder()
    .add_participant(supervisor_agent, is_triage=True)
    .add_participant(claim_assessor)
    .add_participant(policy_checker)
    .add_participant(risk_analyst)
    .add_participant(communication_agent)
    .add_handoff(supervisor_agent, [claim_assessor, policy_checker, risk_analyst])
    .build()
)
```

3. **Custom workflow with edge conditions**:
```python
from agent_framework.workflows import Workflow, edge

workflow = Workflow()
workflow.add_executor("claim_assessor", claim_assessor_executor)
workflow.add_executor("policy_checker", policy_checker_executor)
workflow.add_edge("claim_assessor", "policy_checker")
# etc.
```

### Decision
Use **SequentialBuilder** with a **synthesizer agent at the end** to produce the final assessment.

**Rationale**:
- Current workflow is effectively sequential: Claim Assessor → Policy Checker → Risk Analyst → (Communication if needed) → Summary
- SequentialBuilder matches this pattern directly
- The supervisor's "synthesis" role can be a final agent that reads all prior outputs and generates the structured assessment
- Simpler than HandoffBuilder for deterministic agent order

**Implementation Pattern**:
```python
from agent_framework import ChatAgent
from agent_framework.azure import AzureOpenAIChatClient
from agent_framework.workflows import SequentialBuilder

# Create specialist agents
claim_assessor = ChatAgent(chat_client=client, name="claim_assessor", ...)
policy_checker = ChatAgent(chat_client=client, name="policy_checker", ...)
risk_analyst = ChatAgent(chat_client=client, name="risk_analyst", ...)
communication_agent = ChatAgent(chat_client=client, name="communication_agent", ...)
synthesizer = ChatAgent(chat_client=client, name="synthesizer", instructions=SUPERVISOR_PROMPT)

# Build sequential workflow
workflow = (
    SequentialBuilder()
    .add_agent(claim_assessor)
    .add_agent(policy_checker)
    .add_agent(risk_analyst)
    .add_agent(synthesizer)  # Final synthesis
    .build()
)

# For streaming
async for event in workflow.run_stream(task=claim_json):
    yield transform_event_to_chunk(event)
```

---

## Research Task 4: Azure OpenAI Integration

### Question
Does Microsoft Agent Framework support the same Azure OpenAI configuration as current LangChain setup?

### Findings

**Current LangChain setup**:
```python
from langchain_openai import AzureChatOpenAI

llm = AzureChatOpenAI(
    azure_deployment=deployment,
    api_key=api_key,
    azure_endpoint=endpoint,
    api_version="2024-08-01-preview",
    temperature=0.1,
)
```

**Microsoft Agent Framework setup**:
```python
from agent_framework.azure import AzureOpenAIChatClient
from azure.identity import AzureCliCredential

# Option 1: Environment variables (AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_CHAT_DEPLOYMENT_NAME)
client = AzureOpenAIChatClient(credential=AzureCliCredential())

# Option 2: Explicit configuration
client = AzureOpenAIChatClient(
    endpoint="https://your-resource.openai.azure.com/",
    deployment_name="gpt-4.1",
    credential=AzureCliCredential(),  # Or api_key="..."
)
```

### Decision
Use explicit configuration to match current settings pattern, supporting both credential-based auth and API key auth.

**Implementation**:
```python
from agent_framework.azure import AzureOpenAIChatClient
from azure.identity import AzureCliCredential
from app.core.config import get_settings

def build_chat_client() -> AzureOpenAIChatClient:
    settings = get_settings()
    
    # Support both API key and credential auth
    auth_kwargs = {}
    if settings.azure_openai_api_key:
        auth_kwargs["api_key"] = settings.azure_openai_api_key
    else:
        auth_kwargs["credential"] = AzureCliCredential()
    
    return AzureOpenAIChatClient(
        endpoint=settings.azure_openai_endpoint,
        deployment_name=settings.azure_openai_deployment_name or "gpt-4o",
        **auth_kwargs
    )
```

---

## Research Task 5: Streaming Support

### Question
How do we maintain real-time workflow updates for frontend visualization?

### Findings

**Microsoft Agent Framework streaming**:

1. **Agent-level streaming**:
```python
async for chunk in agent.run_stream(query):
    if chunk.text:
        print(chunk.text)
```

2. **Workflow-level streaming** (events):
```python
async for event in workflow.run_stream(task=input_data):
    if isinstance(event, ExecutorInvokedEvent):
        # Agent starting
        yield {"agent": event.executor_name, "status": "starting"}
    elif isinstance(event, ExecutorCompletedEvent):
        # Agent completed
        yield {"agent": event.executor_name, "status": "completed", "output": event.output}
```

### Decision
Use workflow streaming with event transformation to match current chunk format.

**Rationale**: The current API returns chunks with agent names and message content. Workflow events provide the same information.

---

## Research Task 6: Dependency Changes

### Question
What dependency changes are required in pyproject.toml?

### Findings

**Remove**:
```toml
langchain-core>=0.3.65
langchain-openai>=0.3.22
langgraph>=0.4.8
langgraph-supervisor>=0.0.27
langchain-community>=0.3.0  # If only used for LangGraph
```

**Add**:
```toml
agent-framework>=1.0.0b260116  # Latest pre-release
azure-identity>=1.15.0  # For AzureCliCredential
```

**Keep** (still needed):
```toml
faiss-cpu>=1.8.0  # Vector search - independent of orchestration
tiktoken>=0.8.0  # Token counting for chunking
python-dotenv>=1.1.0  # Environment loading
pydantic-settings>=2.9.1  # Settings management
pymupdf>=1.26.1  # PDF processing
```

### Decision
Replace LangGraph dependencies with `agent-framework` package. Keep all non-orchestration dependencies unchanged.

---

## Alternatives Considered

### Alternative 1: AutoGen
**Rejected**: AutoGen is now deprecated in favor of Microsoft Agent Framework. The README explicitly states: "if you are new to AutoGen, please checkout Microsoft Agent Framework."

### Alternative 2: Keep LangGraph, abstract orchestration layer
**Rejected**: This was the explicit request—migrate away from LangGraph. Also, Microsoft Agent Framework provides native Azure OpenAI integration which aligns with the existing Azure-centric infrastructure.

### Alternative 3: Custom orchestration without framework
**Rejected**: Would require implementing agent coordination, tool calling, streaming, and state management from scratch. Microsoft Agent Framework provides tested implementations of all these.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Framework API changes (pre-release) | Medium | Medium | Pin specific version; monitor releases |
| Tool binding incompatibility | Low | Medium | Test each tool individually; fallback to `@ai_function` |
| Streaming format differences | Low | High | Write adapter layer to transform events to current chunk format |
| Performance regression | Low | Medium | Benchmark before/after; constitution allows ±10% variance |

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Agent creation | `ChatAgent` with `AzureOpenAIChatClient` | Explicit control, framework-agnostic agent definitions |
| Tool binding | Plain functions with `Annotated` types | Removes LangChain dependency, cleaner code |
| Orchestration | `SequentialBuilder` workflow | Matches current sequential pattern |
| Azure OpenAI | Explicit configuration with API key support | Compatibility with current settings |
| Streaming | Workflow events transformed to chunks | Maintains frontend compatibility |
| Dependencies | Replace LangGraph with `agent-framework` | Clean migration, native Azure support |
