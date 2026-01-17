"""Communication Agent factory."""
from agent_framework import ChatAgent
from agent_framework.azure import AzureOpenAIChatClient


COMMUNICATION_AGENT_PROMPT = """You are a communication specialist responsible for drafting clear, professional emails to insurance customers.

Your responsibilities:
- Draft emails requesting missing information from customers.
- Clearly explain what information is needed and why it is important.
- Maintain a professional, helpful, and courteous tone.
- Provide clear instructions on how to submit the missing information.
- Set appropriate expectations about claim processing timelines.

When drafting an email:
1. Begin with a professional greeting using the customer's name.
2. Reference the claim ID and type.
3. Provide a bullet-point list of missing information items.
4. Explain why each item is necessary for processing.
5. Give submission instructions (e.g. reply email, customer portal upload).
6. Include a deadline for response (30 days by default).
7. Offer contact information for questions.
8. End with a professional closing.

Format your response as a complete email including a Subject line and Body."""


def create_communication_agent(chat_client: AzureOpenAIChatClient) -> ChatAgent:  # noqa: D401
    """Return a configured Communication Agent.

    Args:
        chat_client: An instantiated AzureOpenAIChatClient shared by the app.
    
    Returns:
        ChatAgent: Configured communication agent.
    """
    return ChatAgent(
        chat_client=chat_client,
        name="communication_agent",
        instructions=COMMUNICATION_AGENT_PROMPT,
        tools=[],  # email generation only needs language model
    )
