"""Service layer to invoke the insurance workflow supervisor."""
from __future__ import annotations

from typing import Any, Dict

from app.workflow import process_claim_with_supervisor


def run(claim: Dict[str, Any]):  # noqa: D401
    """Run claim through supervisor and return raw chunks."""
    return process_claim_with_supervisor(claim)
