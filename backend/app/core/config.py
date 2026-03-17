"""Centralised application settings using Pydantic [v2].

All environment variables are optional so the app can still start for local
mock/testing. Access via `get_settings()` for a cached singleton.
"""
from __future__ import annotations

import functools
from typing import Any, Dict

try:
    from pydantic_settings import BaseSettings
    from pydantic import Field
except ImportError:
    # Fallback for older pydantic versions
    from pydantic import BaseSettings, Field


class Settings(BaseSettings):  # noqa: D101
    # PostgreSQL
    database_url: str = Field(alias="DATABASE_URL")
    database_pool_size: int = Field(default=5, alias="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=10, alias="DATABASE_MAX_OVERFLOW")
    test_database_url: str | None = Field(default=None, alias="TEST_DATABASE_URL")

    # Azure OpenAI (auth via DefaultAzureCredential — no API key needed)
    azure_openai_endpoint: str | None = Field(
        default=None, alias="AZURE_OPENAI_ENDPOINT")
    azure_openai_deployment_name: str | None = Field(
        default="gpt-4o", alias="AZURE_OPENAI_DEPLOYMENT_NAME")
    azure_openai_embedding_model: str | None = Field(
        default="text-embedding-ada-002", alias="AZURE_OPENAI_EMBEDDING_MODEL")

    # Frontend (used to fetch demo evidence images for AI vision analysis)
    frontend_origin: str | None = Field(
        default=None, alias="FRONTEND_ORIGIN")

    # FastAPI
    app_name: str = "Insurance Multi-Agent Backend"
    api_v1_prefix: str = "/api/v1"

    model_config = {
        "extra": "ignore",
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }

    # Convenience: serialise to dict sans secrets
    def dict_safe(self) -> Dict[str, Any]:  # noqa: D401
        return self.model_dump(
            exclude={"database_url", "test_database_url"},
        )


@functools.lru_cache(maxsize=1)
def get_settings() -> Settings:  # noqa: D401
    """Return a cached Settings instance (singleton)."""
    return Settings()
