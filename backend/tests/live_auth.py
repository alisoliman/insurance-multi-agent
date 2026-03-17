import pytest


def skip_if_auth_error(message: str) -> None:
    """Skip a test if the error message indicates an Azure auth/authz failure."""
    auth_signals = (
        "AuthenticationTypeDisabled",
        "CredentialUnavailableError",
        "ClientAuthenticationError",
        "DefaultAzureCredential",
        "No credential in this chain",
        "AADSTS",
        "ManagedIdentityCredential",
        "AuthorizationFailed",
        "does not have permission",
        "Forbidden",
        "403",
        "401",
    )
    if any(signal in message for signal in auth_signals):
        pytest.skip(f"Azure auth unavailable in this environment: {message[:120]}")


def ensure_azure_credential() -> None:
    """Pre-flight check: skip if DefaultAzureCredential cannot obtain a token."""
    from azure.identity import (
        CredentialUnavailableError,
        DefaultAzureCredential,
    )

    try:
        DefaultAzureCredential().get_token(
            "https://cognitiveservices.azure.com/.default"
        )
    except CredentialUnavailableError as exc:
        pytest.skip(f"Azure credential not available (run `az login`): {exc!s:.120}")
    except Exception as exc:
        if "AADSTS" in str(exc) or "ClientAuthenticationError" in type(exc).__name__:
            pytest.skip(f"Azure credential not available: {exc!s:.120}")
        raise
