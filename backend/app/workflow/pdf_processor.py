"""PDF Processing Utility using PyMuPDF.

This module provides functionality to extract text from PDF files
for use in the policy vector search system.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

import fitz  # PyMuPDF
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


class PDFProcessor:
    """PDF text extraction and processing utility using PyMuPDF."""
    
    def __init__(self):
        """Initialize the PDF processor."""
        pass
    
    def extract_text_from_pdf(self, pdf_path: str | Path) -> str:
        """Extract all text content from a PDF file.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Extracted text content as a single string
            
        Raises:
            FileNotFoundError: If the PDF file doesn't exist
            Exception: If PDF processing fails
        """
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        try:
            doc = fitz.open(str(pdf_path))
            text_content = []
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text()
                if text.strip():  # Only add non-empty pages
                    text_content.append(text)
            
            doc.close()
            full_text = "\n\n".join(text_content)
            
            logger.info(f"Extracted text from PDF: {pdf_path.name} ({len(doc)} pages, {len(full_text)} characters)")
            return full_text
            
        except Exception as e:
            logger.error(f"Failed to extract text from PDF {pdf_path}: {e}")
            raise Exception(f"PDF processing failed: {e}")
    
    def extract_text_with_metadata(self, pdf_path: str | Path) -> Dict[str, Any]:
        """Extract text and metadata from a PDF file.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Dictionary containing text content and metadata
        """
        pdf_path = Path(pdf_path)
        
        try:
            doc = fitz.open(str(pdf_path))
            
            # Extract metadata
            metadata = doc.metadata
            page_count = len(doc)
            
            # Extract text from all pages
            text_content = []
            for page_num in range(page_count):
                page = doc.load_page(page_num)
                text = page.get_text()
                if text.strip():
                    text_content.append(text)
            
            doc.close()
            
            full_text = "\n\n".join(text_content)
            
            return {
                "text": full_text,
                "metadata": {
                    "title": metadata.get("title", ""),
                    "author": metadata.get("author", ""),
                    "subject": metadata.get("subject", ""),
                    "creator": metadata.get("creator", ""),
                    "producer": metadata.get("producer", ""),
                    "creation_date": metadata.get("creationDate", ""),
                    "modification_date": metadata.get("modDate", ""),
                    "page_count": page_count,
                    "file_size": pdf_path.stat().st_size,
                    "filename": pdf_path.name
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to extract text and metadata from PDF {pdf_path}: {e}")
            raise Exception(f"PDF processing failed: {e}")
    
    def pdf_to_langchain_documents(self, pdf_path: str | Path, chunk_pages: bool = True) -> List[Document]:
        """Convert a PDF file to LangChain Document objects.
        
        Args:
            pdf_path: Path to the PDF file
            chunk_pages: If True, create one document per page. If False, create one document for entire PDF.
            
        Returns:
            List of LangChain Document objects
        """
        pdf_path = Path(pdf_path)
        
        try:
            doc = fitz.open(str(pdf_path))
            documents = []
            
            if chunk_pages:
                # Create one document per page
                for page_num in range(len(doc)):
                    page = doc.load_page(page_num)
                    text = page.get_text()
                    
                    if text.strip():  # Only process non-empty pages
                        metadata = {
                            "source": str(pdf_path),
                            "page": page_num + 1,
                            "total_pages": len(doc),
                            "filename": pdf_path.name,
                            "file_type": "pdf"
                        }
                        
                        # Add PDF metadata if available
                        pdf_metadata = doc.metadata
                        if pdf_metadata.get("title"):
                            metadata["title"] = pdf_metadata["title"]
                        if pdf_metadata.get("author"):
                            metadata["author"] = pdf_metadata["author"]
                        
                        documents.append(Document(
                            page_content=text,
                            metadata=metadata
                        ))
            else:
                # Create one document for entire PDF
                text_content = []
                for page_num in range(len(doc)):
                    page = doc.load_page(page_num)
                    text = page.get_text()
                    if text.strip():
                        text_content.append(text)
                
                if text_content:
                    full_text = "\n\n".join(text_content)
                    metadata = {
                        "source": str(pdf_path),
                        "total_pages": len(doc),
                        "filename": pdf_path.name,
                        "file_type": "pdf"
                    }
                    
                    # Add PDF metadata if available
                    pdf_metadata = doc.metadata
                    if pdf_metadata.get("title"):
                        metadata["title"] = pdf_metadata["title"]
                    if pdf_metadata.get("author"):
                        metadata["author"] = pdf_metadata["author"]
                    
                    documents.append(Document(
                        page_content=full_text,
                        metadata=metadata
                    ))
            
            doc.close()
            logger.info(f"Converted PDF to {len(documents)} LangChain documents: {pdf_path.name}")
            return documents
            
        except Exception as e:
            logger.error(f"Failed to convert PDF to LangChain documents {pdf_path}: {e}")
            raise Exception(f"PDF to documents conversion failed: {e}")
    
    def is_valid_pdf(self, pdf_path: str | Path) -> bool:
        """Check if a file is a valid PDF that can be processed.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            True if the file is a valid PDF, False otherwise
        """
        try:
            pdf_path = Path(pdf_path)
            if not pdf_path.exists():
                return False
            
            doc = fitz.open(str(pdf_path))
            page_count = len(doc)
            doc.close()
            
            return page_count > 0
            
        except Exception:
            return False


# Singleton instance for easy access
_pdf_processor_singleton: PDFProcessor | None = None


def get_pdf_processor() -> PDFProcessor:
    """Get the singleton PDF processor instance."""
    global _pdf_processor_singleton
    if _pdf_processor_singleton is None:
        _pdf_processor_singleton = PDFProcessor()
    return _pdf_processor_singleton 