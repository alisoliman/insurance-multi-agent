"""File upload endpoints.

Accepts multipart file uploads, stores each file in a temporary location, and
returns a JSON payload containing the absolute paths of the stored files. These
paths can then be forwarded to other endpoints (e.g., claim assessment) as
`supporting_documents`.
"""
from __future__ import annotations

import tempfile
import shutil
from pathlib import Path
from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse

router = APIRouter(tags=["files"])


@router.post("/files/upload", response_class=JSONResponse)
async def upload_files(files: List[UploadFile] = File(...)) -> dict[str, List[str]]:
    """Upload one or more files and return their temporary filesystem paths.

    The files are stored in the host's temporary directory. It is the
    caller's responsibility to manage lifecycle (e.g., cleanup) of these files
    after they are consumed.
    """
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files uploaded")

    stored_paths: list[str] = []
    for upload in files:
        # Create a secure temporary file; use suffix from original filename to keep extension
        suffix = Path(upload.filename).suffix if upload.filename else ""
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                shutil.copyfileobj(upload.file, tmp)
                stored_paths.append(tmp.name)
        finally:
            await upload.close()

    return {"paths": stored_paths}
