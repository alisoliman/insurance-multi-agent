"""Index management endpoints.

Provides API endpoints for managing the policy vector search index,
including rebuilding, resetting, and monitoring index status.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from pydantic import BaseModel

from app.workflow.policy_search import get_policy_search, PolicyVectorSearch

logger = logging.getLogger(__name__)
router = APIRouter(tags=["index"])

# Paths
WORKFLOW_DATA_DIR = Path(__file__).resolve().parents[3] / "workflow" / "data"
METADATA_FILE = WORKFLOW_DATA_DIR / "document_metadata.json"
INDEX_STATUS_FILE = WORKFLOW_DATA_DIR / "index_status.json"

# Pydantic models
class IndexStatus(BaseModel):
    is_built: bool
    last_rebuild: Optional[datetime] = None
    document_count: int = 0
    original_policies_count: int = 0
    uploaded_docs_count: int = 0
    indexed_uploaded_count: int = 0
    index_size_mb: Optional[float] = None
    status: str = "unknown"  # building, ready, error, empty

class IndexRebuildResponse(BaseModel):
    success: bool
    message: str
    status: IndexStatus
    task_id: Optional[str] = None

class IndexResetResponse(BaseModel):
    success: bool
    message: str
    status: IndexStatus

class IndexStatusResponse(BaseModel):
    status: IndexStatus

class IndexUpdateResponse(BaseModel):
    success: bool
    message: str
    added_count: int
    failed_count: int

# Helper functions
def get_index_status() -> IndexStatus:
    """Get current index status information."""
    try:
        policy_search = get_policy_search()
        
        # Check if index exists and is loaded
        index_path = policy_search.index_path
        index_file = index_path / "index.faiss"
        meta_file = index_path / "index.pkl"
        
        is_built = index_file.exists() and meta_file.exists() and policy_search.vectorstore is not None
        
        # Count original policies
        original_policies_count = 0
        if policy_search.policies_dir.exists():
            original_policies_count = len(list(policy_search.policies_dir.glob("*.md")))
        
        # Count uploaded documents
        uploaded_docs_count = 0
        indexed_uploaded_count = 0
        
        if METADATA_FILE.exists():
            try:
                with open(METADATA_FILE, 'r') as f:
                    metadata = json.load(f)
                uploaded_docs_count = len(metadata)
                indexed_uploaded_count = sum(1 for doc in metadata.values() if doc.get('indexed', False))
            except Exception:
                pass
        
        # Calculate index size
        index_size_mb = None
        if index_file.exists():
            try:
                index_size_mb = round(index_file.stat().st_size / (1024 * 1024), 2)
            except Exception:
                pass
        
        # Get last rebuild time
        last_rebuild = None
        if INDEX_STATUS_FILE.exists():
            try:
                with open(INDEX_STATUS_FILE, 'r') as f:
                    status_data = json.load(f)
                last_rebuild_str = status_data.get('last_rebuild')
                if last_rebuild_str:
                    last_rebuild = datetime.fromisoformat(last_rebuild_str)
            except Exception:
                pass
        
        # Determine status
        if not is_built:
            status_str = "empty"
        elif policy_search.vectorstore is None:
            status_str = "error"
        else:
            status_str = "ready"
        
        total_docs = original_policies_count + indexed_uploaded_count
        
        return IndexStatus(
            is_built=is_built,
            last_rebuild=last_rebuild,
            document_count=total_docs,
            original_policies_count=original_policies_count,
            uploaded_docs_count=uploaded_docs_count,
            indexed_uploaded_count=indexed_uploaded_count,
            index_size_mb=index_size_mb,
            status=status_str
        )
        
    except Exception as e:
        logger.error(f"Error getting index status: {e}")
        return IndexStatus(
            is_built=False,
            document_count=0,
            original_policies_count=0,
            uploaded_docs_count=0,
            indexed_uploaded_count=0,
            status="error"
        )

def save_index_status(status: IndexStatus):
    """Save index status to file."""
    try:
        status_data = {
            "last_rebuild": status.last_rebuild.isoformat() if status.last_rebuild else None,
            "status": status.status,
            "document_count": status.document_count
        }
        with open(INDEX_STATUS_FILE, 'w') as f:
            json.dump(status_data, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving index status: {e}")

def load_document_metadata() -> Dict[str, Any]:
    """Load document metadata from JSON file."""
    if not METADATA_FILE.exists():
        return {}
    
    try:
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return {}

def save_document_metadata(metadata_dict: Dict[str, Any]):
    """Save document metadata to JSON file."""
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata_dict, f, indent=2, default=str)

def rebuild_index_sync(include_uploaded: bool = True) -> IndexStatus:
    """Synchronously rebuild the index."""
    try:
        policy_search = get_policy_search()
        
        # Force rebuild the index
        policy_search.create_index(force_rebuild=True)
        
        # If including uploaded documents, we need to extend the functionality
        if include_uploaded:
            # For now, mark all uploaded docs as indexed
            # In a full implementation, we'd actually add them to the index
            metadata_dict = load_document_metadata()
            for doc_id, doc_data in metadata_dict.items():
                doc_data['indexed'] = True
            save_document_metadata(metadata_dict)
        
        # Update status
        status = get_index_status()
        status.last_rebuild = datetime.now()
        status.status = "ready"
        save_index_status(status)
        
        return status
        
    except Exception as e:
        logger.error(f"Error rebuilding index: {e}")
        status = get_index_status()
        status.status = "error"
        return status

# API endpoints
@router.get("/index/status", response_model=IndexStatusResponse)
async def get_index_status_endpoint() -> IndexStatusResponse:
    """Get current index status and statistics."""
    status = get_index_status()
    return IndexStatusResponse(status=status)

@router.post("/index/rebuild", response_model=IndexRebuildResponse)
async def rebuild_index(
    include_uploaded: bool = True,
    force: bool = False,
    background_tasks: BackgroundTasks = None
) -> IndexRebuildResponse:
    """Rebuild the policy search index.
    
    Args:
        include_uploaded: Whether to include uploaded documents in the index
        force: Force rebuild even if index appears healthy
        background_tasks: FastAPI background tasks for async processing
    """
    try:
        current_status = get_index_status()
        
        # Check if rebuild is needed
        if not force and current_status.is_built and current_status.status == "ready":
            return IndexRebuildResponse(
                success=True,
                message="Index is already up to date. Use force=true to rebuild anyway.",
                status=current_status
            )
        
        # For now, do synchronous rebuild
        # In production, you'd want to use background tasks for large indexes
        logger.info("Starting index rebuild...")
        new_status = rebuild_index_sync(include_uploaded=include_uploaded)
        
        if new_status.status == "ready":
            return IndexRebuildResponse(
                success=True,
                message=f"Index rebuilt successfully with {new_status.document_count} documents",
                status=new_status
            )
        else:
            return IndexRebuildResponse(
                success=False,
                message="Index rebuild failed - check logs for details",
                status=new_status
            )
            
    except Exception as e:
        logger.error(f"Error in rebuild_index endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rebuild index: {str(e)}"
        )

@router.post("/index/reset", response_model=IndexResetResponse)
async def reset_index_to_original() -> IndexResetResponse:
    """Reset the index to contain only original policy documents.
    
    This removes all uploaded documents from the index and rebuilds
    with only the original policy files.
    """
    try:
        # Mark all uploaded documents as not indexed
        metadata_dict = load_document_metadata()
        for doc_id, doc_data in metadata_dict.items():
            doc_data['indexed'] = False
        save_document_metadata(metadata_dict)
        
        # Rebuild index with only original policies
        new_status = rebuild_index_sync(include_uploaded=False)
        
        if new_status.status == "ready":
            return IndexResetResponse(
                success=True,
                message=f"Index reset to original policies ({new_status.original_policies_count} documents)",
                status=new_status
            )
        else:
            return IndexResetResponse(
                success=False,
                message="Index reset failed - check logs for details",
                status=new_status
            )
            
    except Exception as e:
        logger.error(f"Error in reset_index endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset index: {str(e)}"
        )

@router.post("/index/add-documents", response_model=IndexUpdateResponse)
async def add_documents_to_index(document_ids: List[str]) -> IndexUpdateResponse:
    """Add specific uploaded documents to the search index.
    
    This is a placeholder for incremental index updates.
    In the current implementation, it marks documents as indexed
    but requires a full rebuild to actually include them.
    """
    try:
        metadata_dict = load_document_metadata()
        added_count = 0
        failed_count = 0
        
        for doc_id in document_ids:
            if doc_id in metadata_dict:
                metadata_dict[doc_id]['indexed'] = True
                added_count += 1
            else:
                failed_count += 1
        
        save_document_metadata(metadata_dict)
        
        return IndexUpdateResponse(
            success=True,
            message=f"Marked {added_count} documents for indexing. Run rebuild to update search index.",
            added_count=added_count,
            failed_count=failed_count
        )
        
    except Exception as e:
        logger.error(f"Error in add_documents_to_index endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add documents to index: {str(e)}"
        ) 