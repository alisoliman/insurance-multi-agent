"""Document management endpoints.

Handles persistent document storage, metadata management, and integration
with the policy vector search system for indexing uploaded documents.
"""
from __future__ import annotations

import json
import logging
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Query
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from app.workflow.policy_search import get_policy_search
from app.workflow.pdf_processor import get_pdf_processor

logger = logging.getLogger(__name__)
router = APIRouter(tags=["documents"])

# Document storage paths
WORKFLOW_DATA_DIR = Path(__file__).resolve().parents[3] / "workflow" / "data"
UPLOADED_DOCS_DIR = WORKFLOW_DATA_DIR / "uploaded_docs"
METADATA_FILE = WORKFLOW_DATA_DIR / "document_metadata.json"

# Ensure directories exist
UPLOADED_DOCS_DIR.mkdir(parents=True, exist_ok=True)
(UPLOADED_DOCS_DIR / "policies").mkdir(exist_ok=True)
(UPLOADED_DOCS_DIR / "regulations").mkdir(exist_ok=True)
(UPLOADED_DOCS_DIR / "reference").mkdir(exist_ok=True)

# Pydantic models
class DocumentMetadata(BaseModel):
    id: str
    filename: str
    original_filename: str
    category: str
    size: int
    content_type: str
    upload_date: datetime
    indexed: bool = False
    metadata: Dict[str, Any] = {}

class DocumentUploadResponse(BaseModel):
    success: bool
    documents: List[DocumentMetadata]
    message: str

class DocumentListResponse(BaseModel):
    documents: List[DocumentMetadata]
    total: int

class StatusResponse(BaseModel):
    success: bool
    message: str

class DocumentResponse(BaseModel):
    document: DocumentMetadata
    content: Optional[str] = None

# Helper functions
def load_document_metadata() -> Dict[str, DocumentMetadata]:
    """Load document metadata from JSON file."""
    if not METADATA_FILE.exists():
        return {}
    
    try:
        with open(METADATA_FILE, 'r') as f:
            data = json.load(f)
        return {doc_id: DocumentMetadata(**doc_data) for doc_id, doc_data in data.items()}
    except Exception:
        return {}

def save_document_metadata(metadata_dict: Dict[str, DocumentMetadata]):
    """Save document metadata to JSON file."""
    data = {doc_id: doc.model_dump() for doc_id, doc in metadata_dict.items()}
    with open(METADATA_FILE, 'w') as f:
        json.dump(data, f, indent=2, default=str)

def get_category_dir(category: str) -> Path:
    """Get the directory path for a document category."""
    category_dirs = {
        "policy": UPLOADED_DOCS_DIR / "policies",
        "regulation": UPLOADED_DOCS_DIR / "regulations", 
        "reference": UPLOADED_DOCS_DIR / "reference"
    }
    return category_dirs.get(category, UPLOADED_DOCS_DIR / "policies")

# API endpoints
@router.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_documents_for_indexing(
    files: List[UploadFile] = File(...),
    category: str = Query("policy", description="Document category: policy, regulation, or reference"),
    auto_index: bool = Query(True, description="Automatically add to search index")
) -> DocumentUploadResponse:
    """Upload documents for persistent storage and optional indexing.
    
    Documents are stored in categorized directories and can be automatically
    added to the search index for policy queries.
    """
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files uploaded")
    
    if category not in ["policy", "regulation", "reference"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category")
    
    # Load existing metadata
    metadata_dict = load_document_metadata()
    uploaded_docs = []
    
    category_dir = get_category_dir(category)
    
    for upload in files:
        try:
            # Validate file
            if not upload.filename:
                continue
                
            # Check file type (allow common document formats)
            allowed_types = {
                'text/plain', 'text/markdown', 'application/pdf',
                'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }
            
            # Also check by file extension for better PDF support
            file_extension = Path(upload.filename).suffix.lower()
            allowed_extensions = {'.txt', '.md', '.pdf', '.doc', '.docx'}
            
            if upload.content_type not in allowed_types and file_extension not in allowed_extensions:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File \"{upload.filename}\" has an unsupported format. Supported formats: PDF, Markdown, Text, Word documents."
                )
            
            # Special validation for PDF files
            if file_extension == '.pdf' or upload.content_type == 'application/pdf':
                # We'll validate the PDF after saving it temporarily
                pass
            
            # Generate unique ID and filename
            doc_id = str(uuid.uuid4())
            file_extension = Path(upload.filename).suffix
            stored_filename = f"{doc_id}{file_extension}"
            file_path = category_dir / stored_filename
            
            # Save file
            with open(file_path, 'wb') as f:
                shutil.copyfileobj(upload.file, f)
            
            # Validate PDF files after saving
            if file_extension == '.pdf' or upload.content_type == 'application/pdf':
                pdf_processor = get_pdf_processor()
                if not pdf_processor.is_valid_pdf(file_path):
                    # Clean up invalid file
                    file_path.unlink()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"File \"{upload.filename}\" is not a valid PDF or cannot be processed."
                    )
            
            # Create metadata
            doc_metadata = DocumentMetadata(
                id=doc_id,
                filename=stored_filename,
                original_filename=upload.filename,
                category=category,
                size=file_path.stat().st_size,
                content_type=upload.content_type or "application/octet-stream",
                upload_date=datetime.now(),
                indexed=False
            )
            
            metadata_dict[doc_id] = doc_metadata
            uploaded_docs.append(doc_metadata)
            
        except Exception as e:
            # Clean up on error
            if 'file_path' in locals() and file_path.exists():
                file_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload {upload.filename}: {str(e)}"
            )
        finally:
            await upload.close()
    
    # Save metadata
    save_document_metadata(metadata_dict)
    
    # Auto-index if requested
    if auto_index and uploaded_docs:
        try:
            policy_search = get_policy_search()
            indexed_count = 0
            
            for doc in uploaded_docs:
                file_path = get_category_dir(doc.category) / doc.filename
                if policy_search.add_document_to_index(file_path):
                    # Update metadata to mark as indexed
                    metadata_dict[doc.id].indexed = True
                    indexed_count += 1
            
            if indexed_count > 0:
                # Save updated metadata
                save_document_metadata(metadata_dict)
                logger.info(f"Successfully indexed {indexed_count} out of {len(uploaded_docs)} documents")
            
        except Exception as e:
            logger.error(f"Failed to auto-index documents: {e}")
            # Don't fail upload if indexing fails, but log the error
    
    return DocumentUploadResponse(
        success=True,
        documents=uploaded_docs,
        message=f"Successfully uploaded {len(uploaded_docs)} document(s)"
    )

@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    category: Optional[str] = Query(None, description="Filter by category"),
    indexed_only: bool = Query(False, description="Show only indexed documents")
) -> DocumentListResponse:
    """List all uploaded documents with optional filtering."""
    metadata_dict = load_document_metadata()
    documents = list(metadata_dict.values())
    
    # Apply filters
    if category:
        documents = [doc for doc in documents if doc.category == category]
    
    if indexed_only:
        documents = [doc for doc in documents if doc.indexed]
    
    # Sort by upload date (newest first)
    documents.sort(key=lambda x: x.upload_date, reverse=True)
    
    return DocumentListResponse(
        documents=documents,
        total=len(documents)
    )

@router.delete("/documents/{document_id}", response_model=StatusResponse)
async def delete_document(document_id: str) -> StatusResponse:
    """Delete a document and its metadata."""
    metadata_dict = load_document_metadata()
    
    if document_id not in metadata_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    doc_metadata = metadata_dict[document_id]
    
    # Delete file
    category_dir = get_category_dir(doc_metadata.category)
    file_path = category_dir / doc_metadata.filename
    
    if file_path.exists():
        file_path.unlink()
    
    # Remove from metadata
    del metadata_dict[document_id]
    save_document_metadata(metadata_dict)
    
    return StatusResponse(
        success=True,
        message=f"Document {doc_metadata.original_filename} deleted successfully"
    )

@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, include_content: bool = Query(False)) -> DocumentResponse:
    """Get document metadata and optionally its content."""
    metadata_dict = load_document_metadata()
    
    if document_id not in metadata_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    doc_metadata = metadata_dict[document_id]
    content = None
    
    if include_content:
        category_dir = get_category_dir(doc_metadata.category)
        file_path = category_dir / doc_metadata.filename
        
        if file_path.exists() and doc_metadata.content_type.startswith('text/'):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception:
                content = "Unable to read file content"
    
    return DocumentResponse(
        document=doc_metadata,
        content=content
    )

@router.get("/documents/{document_id}/download")
async def download_document(document_id: str):
    """Download a document file."""
    metadata_dict = load_document_metadata()
    
    if document_id not in metadata_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    doc_metadata = metadata_dict[document_id]
    category_dir = get_category_dir(doc_metadata.category)
    file_path = category_dir / doc_metadata.filename
    
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=doc_metadata.original_filename,
        media_type=doc_metadata.content_type
    )

@router.post("/documents/{document_id}/index", response_model=StatusResponse)
async def index_document(document_id: str) -> StatusResponse:
    """Manually add a specific document to the search index."""
    metadata_dict = load_document_metadata()
    
    if document_id not in metadata_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    doc_metadata = metadata_dict[document_id]
    file_path = get_category_dir(doc_metadata.category) / doc_metadata.filename
    
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file not found")
    
    try:
        policy_search = get_policy_search()
        
        if policy_search.add_document_to_index(file_path):
            # Update metadata to mark as indexed
            metadata_dict[document_id].indexed = True
            save_document_metadata(metadata_dict)
            
            return StatusResponse(
                success=True,
                message=f"Document '{doc_metadata.original_filename}' successfully added to search index"
            )
        else:
            return StatusResponse(
                success=False,
                message=f"Failed to add document '{doc_metadata.original_filename}' to search index"
            )
            
    except Exception as e:
        logger.error(f"Error indexing document {document_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to index document: {str(e)}"
        )