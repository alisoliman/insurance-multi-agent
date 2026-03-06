import pytest


def skip_if_key_auth_disabled(message: str) -> None:
    if "AuthenticationTypeDisabled" in message:
        pytest.skip("Azure OpenAI resource has key-based auth disabled in this environment.")
