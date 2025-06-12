"""Centralised application settings using Pydantic [v2].

All environment variables are optional so the app can still start for local
mock/testing. Access via `get_settings()` for a cached singleton.
"""
from __future__ import annotations

import functools
from typing import Any, Dict

from pydantic import BaseSettings, Field


class Settings(BaseSettings):  # noqa: D101
    # Azure OpenAI
    azure_openai_api_key: str | None = Field(default=None, alias="AZURE_OPENAI_API_KEY")
    azure_openai_endpoint: str | None = Field(default=None, alias="AZURE_OPENAI_ENDPOINT")
    azure_openai_deployment_name: str | None = Field(default="gpt-4o", alias="AZURE_OPENAI_DEPLOYMENT_NAME")

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
        return self.model_dump(exclude={"azure_openai_api_key"})


@functools.lru_cache(maxsize=1)
def get_settings() -> Settings:  # noqa: D401
    """Return a cached Settings instance (singleton)."""
    return Settings()
