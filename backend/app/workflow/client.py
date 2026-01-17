"""Azure OpenAI chat client factory for Microsoft Agent Framework.

Provides a centralized factory function to create AzureOpenAIChatClient
instances configured from application settings.
"""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import TYPE_CHECKING

from azure.identity import AzureCliCredential, DefaultAzureCredential
from agent_framework.azure import AzureOpenAIChatClient

from app.core.config import get_settings

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)


def build_chat_client() -> AzureOpenAIChatClient:
    """Build and return an AzureOpenAIChatClient instance.

    Supports both API key authentication and Azure credential-based auth.
    Configuration is loaded from application settings.

    Returns:
        AzureOpenAIChatClient: Configured chat client for Azure OpenAI.
    """
    settings = get_settings()

    endpoint = settings.azure_openai_endpoint
    deployment = settings.azure_openai_deployment_name or "gpt-4o"
    api_key = settings.azure_openai_api_key

    logger.info("✅ Building Azure OpenAI chat client")
    logger.info("   Endpoint: %s", endpoint or "Not set")
    logger.info("   Deployment: %s", deployment)
    logger.info("   API Key configured: %s", "Yes" if api_key else "No (using credential)")

    # Build authentication kwargs
    auth_kwargs = {}
    if api_key:
        auth_kwargs["api_key"] = api_key
    else:
        # Use DefaultAzureCredential for production, AzureCliCredential for local dev
        try:
            auth_kwargs["credential"] = DefaultAzureCredential()
        except Exception:
            logger.warning("DefaultAzureCredential not available, falling back to AzureCliCredential")
            auth_kwargs["credential"] = AzureCliCredential()

    return AzureOpenAIChatClient(
        endpoint=endpoint,
        deployment_name=deployment,
        **auth_kwargs,
    )


@lru_cache(maxsize=1)
def get_chat_client() -> AzureOpenAIChatClient:
    """Get a cached AzureOpenAIChatClient instance (singleton).

    Returns:
        AzureOpenAIChatClient: Shared chat client instance.
    """
    return build_chat_client()
