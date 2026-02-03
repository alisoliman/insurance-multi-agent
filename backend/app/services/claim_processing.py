"""Service layer to invoke the insurance workflow supervisor."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.workflow import process_claim_with_supervisor


async def run(claim: Dict[str, Any], summary_language: Optional[str] = "english") -> List[Dict[str, Any]]:  # noqa: D401
    """Run claim through supervisor and return raw chunks."""
    return await process_claim_with_supervisor(claim, summary_language=summary_language)
