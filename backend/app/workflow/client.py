"""Azure OpenAI chat client factory for Microsoft Agent Framework.

Provides a centralized factory function to create AzureOpenAIChatClient
instances configured from application settings.  Authentication uses
``DefaultAzureCredential`` via a token provider that auto-refreshes.
"""
from __future__ import annotations

import logging
from functools import lru_cache

from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from agent_framework.azure import AzureOpenAIChatClient

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_AZURE_OPENAI_SCOPE = "https://cognitiveservices.azure.com/.default"


def build_chat_client() -> AzureOpenAIChatClient:
    """Build and return an AzureOpenAIChatClient instance.

    Uses a token provider backed by ``DefaultAzureCredential`` so that
    tokens are automatically refreshed (managed identity in Azure,
    ``az login`` locally).

    Returns:
        AzureOpenAIChatClient: Configured chat client for Azure OpenAI.
    """
    settings = get_settings()

    endpoint = settings.azure_openai_endpoint
    deployment = settings.azure_openai_deployment_name or "gpt-4o"

    logger.info("✅ Building Azure OpenAI chat client")
    logger.info("   Endpoint: %s", endpoint or "Not set")
    logger.info("   Deployment: %s", deployment)
    logger.info("   Auth: DefaultAzureCredential (auto-refreshing token provider)")

    token_provider = get_bearer_token_provider(
        DefaultAzureCredential(), _AZURE_OPENAI_SCOPE
    )

    return AzureOpenAIChatClient(
        endpoint=endpoint,
        deployment_name=deployment,
        ad_token_provider=token_provider,
    )


@lru_cache(maxsize=1)
def get_chat_client() -> AzureOpenAIChatClient:
    """Get a cached AzureOpenAIChatClient instance (singleton).

    Returns:
        AzureOpenAIChatClient: Shared chat client instance.
    """
    return build_chat_client()
