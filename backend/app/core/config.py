from pydantic import ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings."""

    # Project info
    PROJECT_NAME: str = "Shadcn-FastAPI Starter"
    VERSION: str = "0.1.0"
    DESCRIPTION: str = "FastAPI backend for the shadcn-fastapi-starter boilerplate"

    # API settings
    API_PREFIX: str = "/api"

    # CORS settings
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Environment detection
    ENVIRONMENT: str = "development"

    @property
    def cors_origins(self) -> list[str]:
        """Get CORS origins based on environment."""
        return self.CORS_ORIGINS.copy()

    @property
    def cors_origin_regex(self) -> str | None:
        """Get CORS origin regex pattern for production environments."""
        if self.ENVIRONMENT == "production":
            # Allow any subdomain of azurecontainerapps.io over HTTPS
            return r"https://.*\.azurecontainerapps\.io"
        return None

    # Logging
    LOG_LEVEL: str = "INFO"

    # Azure OpenAI settings
    AZURE_OPENAI_API_KEY: str | None = None
    AZURE_OPENAI_ENDPOINT: str | None = None
    AZURE_OPENAI_API_VERSION: str = "2025-04-01-preview"
    AZURE_OPENAI_DEPLOYMENT_NAME: str | None = None

    model_config = ConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
