from fastapi import FastAPI, HTTPException
from typing import Any, Dict
from collections import defaultdict

from langgraph_insurance import main as lg_main

app = FastAPI()


@app.get("/")
async def read_root() -> dict[str, str]:
    return {"message": "Hello World"}


@app.post("/workflow/run")
async def run_workflow(claim: Dict[str, Any]):
    """Run the complete insurance claim workflow via the supervisor agent.

    Body should be a JSON object representing the claim data.
    Returns the supervisor’s final decision *and* the full multi-agent conversation.
    """
    try:
        result_chunks = lg_main.process_claim_with_supervisor(claim)

        # Aggregate the conversation for each agent in order of appearance
        conversation: dict[str, list[dict[str, str]]] = defaultdict(list)
        msg_counters: dict[str, int] = {}

        for chunk in result_chunks:
            for node_name, node_data in chunk.items():
                if node_name == "__end__" or "messages" not in node_data:
                    continue

                messages = node_data["messages"]
                start_idx = msg_counters.get(node_name, 0)
                new_messages = messages[start_idx:]

                # Serialize new message objects to primitive JSON-friendly dicts
                for m in new_messages:
                    conversation[node_name].append({
                        "role": getattr(m, "role", "assistant"),
                        "content": getattr(m, "content", str(m))
                    })

                msg_counters[node_name] = len(messages)

        # Extract supervisor final decision (last supervisor message content)
        final_decision: str | None = None
        supervisor_msgs = conversation.get("supervisor", [])
        if supervisor_msgs:
            final_decision = supervisor_msgs[-1]["content"]

        return {
            "success": True,
            "final_decision": final_decision,
            "conversation": conversation
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
