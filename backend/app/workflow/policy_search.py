#!/usr/bin/env python3
"""
Policy Document Vector Search Utility

Provides vector-based semantic search for insurance policy documents.
Uses Azure OpenAI embeddings and FAISS for efficient similarity search.
"""
from __future__ import annotations

import logging
import os
import pickle
from pathlib import Path
from typing import Any, Dict, List, Optional

from langchain_openai import AzureOpenAIEmbeddings
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from .pdf_processor import get_pdf_processor

# Configure logger
logger = logging.getLogger(__name__)

try:
    from langchain_community.vectorstores import FAISS
except Exception as import_err:  # pragma: no cover – allow app to boot when FAISS unavailable
    FAISS = None  # type: ignore
    logger.warning(
        "FAISS backend unavailable – policy vector search disabled: %s", import_err)


BASE_DIR = Path(__file__).resolve().parent / "data"


class PolicyVectorSearch:  # noqa: D101
    def __init__(self, policies_dir: str | Path | None = None, index_path: str | Path | None = None):
        """Initialise vector search utility.

        By default we look for Markdown policy docs under `app/workflow/data/policies`.
        A pre-built FAISS index will be kept under `app/workflow/data/policy_index`.
        """
        self.policies_dir = Path(
            policies_dir) if policies_dir else BASE_DIR / "policies"
        self.index_path = Path(
            index_path) if index_path else BASE_DIR / "policy_index"
        self.embeddings: AzureOpenAIEmbeddings | None = None
        self.vectorstore: FAISS | None = None
        self._init_embeddings()

    # ------------------------------------------------------------------
    def _init_embeddings(self):
        try:
            from app.core.config import get_settings
            settings = get_settings()

            self.embeddings = AzureOpenAIEmbeddings(
                model=settings.azure_openai_embedding_model or "text-embedding-ada-002",
                azure_endpoint=settings.azure_openai_endpoint,
                api_key=settings.azure_openai_api_key,
                api_version="2024-02-01",
            )
            logger.info("Azure OpenAI embeddings initialized")
        except Exception as e:  # pragma: no cover
            logger.error("Failed to init embeddings: %s", e)
            raise

    # ------------------------------------------------------------------
    def load_and_split_documents(self) -> List[Document]:  # noqa: D401
        if not self.policies_dir.exists():
            raise FileNotFoundError(
                f"Policies directory not found: {self.policies_dir}")

        docs = []
        
        # Load Markdown files
        md_loader = DirectoryLoader(
            str(self.policies_dir), glob="*.md", loader_cls=TextLoader, loader_kwargs={"encoding": "utf-8"}
        )
        md_docs = md_loader.load()
        docs.extend(md_docs)
        logger.info("Loaded %s markdown policy documents", len(md_docs))
        
        # Load PDF files
        pdf_processor = get_pdf_processor()
        pdf_files = list(self.policies_dir.glob("*.pdf"))
        
        for pdf_file in pdf_files:
            try:
                if pdf_processor.is_valid_pdf(pdf_file):
                    pdf_docs = pdf_processor.pdf_to_langchain_documents(pdf_file, chunk_pages=False)
                    docs.extend(pdf_docs)
                    logger.info("Loaded PDF policy document: %s", pdf_file.name)
                else:
                    logger.warning("Skipping invalid PDF file: %s", pdf_file.name)
            except Exception as e:
                logger.error("Failed to load PDF %s: %s", pdf_file.name, e)
                continue
        
        logger.info("Loaded %s total policy documents (%s markdown, %s PDF)", 
                   len(docs), len(md_docs), len(pdf_files))

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
        )
        chunks = splitter.split_documents(docs)

        # annotate metadata
        for chunk in chunks:
            source_path = Path(chunk.metadata["source"])
            filename = source_path.stem
            file_extension = source_path.suffix.lower()
            
            # Set policy type based on filename
            chunk.metadata["policy_type"] = filename.replace("_", " ").title()
            chunk.metadata["file_type"] = file_extension[1:] if file_extension else "unknown"
            
            # For markdown files, try to extract section information
            section = None
            if file_extension == ".md":
                for line in chunk.page_content.split("\n"):
                    if line.startswith("## Section ") or line.startswith("### Section "):
                        if ":" in line:
                            section_part = line.split(":")[0]
                            if "Section " in section_part:
                                section = section_part.split(
                                    "Section ")[-1].strip()
                        break
            
            # For PDF files, use page information if available
            elif file_extension == ".pdf" and "page" in chunk.metadata:
                section = f"Page {chunk.metadata['page']}"
            
            chunk.metadata["section"] = section or "General"
            
        logger.info("Split into %s chunks", len(chunks))
        return chunks

    # ------------------------------------------------------------------
    def create_index(self, force_rebuild: bool = False):  # noqa: D401
        if FAISS is None:
            raise RuntimeError(
                "FAISS not available – cannot build policy index. Install faiss-cpu.")

        index_file = self.index_path / "index.faiss"
        meta_file = self.index_path / "index.pkl"

        if not force_rebuild and index_file.exists() and meta_file.exists():
            try:
                self.vectorstore = FAISS.load_local(
                    str(self.index_path), self.embeddings, allow_dangerous_deserialization=True
                )
                logger.info("Loaded existing FAISS index")
                return
            except Exception as e:
                logger.warning(
                    "Could not load existing index – rebuilding: %s", e)

        docs = self.load_and_split_documents()
        if not docs:
            raise ValueError("No documents to index")

        self.vectorstore = FAISS.from_documents(docs, self.embeddings)
        self.index_path.mkdir(parents=True, exist_ok=True)
        self.vectorstore.save_local(str(self.index_path))
        logger.info("FAISS index built and saved (%s docs)", len(docs))

    # ------------------------------------------------------------------
    def search_policies(self, query: str, k: int = 5, score_threshold: float = 0.3) -> List[Dict[str, Any]]:  # noqa: D401,E501
        if FAISS is None:
            logger.warning(
                "FAISS not available – returning empty results for policy search")
            return []

        if not self.vectorstore:
            raise ValueError(
                "Vectorstore not initialised – call create_index() first")
        results = self.vectorstore.similarity_search_with_score(query, k=k)
        out: List[Dict[str, Any]] = []
        for doc, score in results:
            similarity = 1 / (1 + score)
            if similarity >= score_threshold:
                out.append(
                    {
                        "content": doc.page_content,
                        "metadata": doc.metadata,
                        "similarity_score": similarity,
                        "policy_type": doc.metadata.get("policy_type", "Unknown"),
                        "section": doc.metadata.get("section", "General"),
                        "source": doc.metadata.get("source", "Unknown"),
                    }
                )
        logger.info("%s relevant sections for '%s'", len(out), query)
        return out

    # ------------------------------------------------------------------
    def add_document_to_index(self, document_path: str | Path) -> bool:
        """Add a single document to the existing vector index.
        
        Args:
            document_path: Path to the document file (PDF or markdown)
            
        Returns:
            True if document was successfully added, False otherwise
        """
        if FAISS is None:
            logger.error("FAISS not available – cannot add document to index")
            return False
            
        if not self.vectorstore:
            logger.error("Vectorstore not initialized – call create_index() first")
            return False
            
        document_path = Path(document_path)
        if not document_path.exists():
            logger.error(f"Document not found: {document_path}")
            return False
            
        try:
            docs = []
            file_extension = document_path.suffix.lower()
            
            if file_extension == ".pdf":
                # Process PDF file
                pdf_processor = get_pdf_processor()
                if pdf_processor.is_valid_pdf(document_path):
                    pdf_docs = pdf_processor.pdf_to_langchain_documents(document_path, chunk_pages=False)
                    docs.extend(pdf_docs)
                else:
                    logger.error(f"Invalid PDF file: {document_path}")
                    return False
                    
            elif file_extension == ".md":
                # Process markdown file
                loader = TextLoader(str(document_path), encoding="utf-8")
                md_docs = loader.load()
                docs.extend(md_docs)
                
            else:
                logger.error(f"Unsupported file type: {file_extension}")
                return False
            
            if not docs:
                logger.error(f"No content extracted from document: {document_path}")
                return False
            
            # Split documents into chunks
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len,
                separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
            )
            chunks = splitter.split_documents(docs)
            
            # Annotate metadata
            for chunk in chunks:
                source_path = Path(chunk.metadata["source"])
                filename = source_path.stem
                file_extension = source_path.suffix.lower()
                
                chunk.metadata["policy_type"] = filename.replace("_", " ").title()
                chunk.metadata["file_type"] = file_extension[1:] if file_extension else "unknown"
                
                # Extract section information
                section = None
                if file_extension == ".md":
                    for line in chunk.page_content.split("\n"):
                        if line.startswith("## Section ") or line.startswith("### Section "):
                            if ":" in line:
                                section_part = line.split(":")[0]
                                if "Section " in section_part:
                                    section = section_part.split("Section ")[-1].strip()
                            break
                elif file_extension == ".pdf" and "page" in chunk.metadata:
                    section = f"Page {chunk.metadata['page']}"
                
                chunk.metadata["section"] = section or "General"
            
            # Add chunks to existing vectorstore
            self.vectorstore.add_documents(chunks)
            
            # Save updated index
            self.vectorstore.save_local(str(self.index_path))
            
            logger.info(f"Successfully added document to index: {document_path.name} ({len(chunks)} chunks)")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add document to index {document_path}: {e}")
            return False

    # ------------------------------------------------------------------
    def get_policy_summary(self, policy_type: str) -> Optional[str]:  # noqa: D401
        if not self.vectorstore:
            raise ValueError(
                "Vectorstore not initialised – call create_index() first")
        query = f"{policy_type} policy overview coverage"
        res = self.search_policies(query, k=3, score_threshold=0.3)
        return res[0]["content"] if res else None


# ---------------------------------------------------------------------------
_policy_search_singleton: PolicyVectorSearch | None = None


def get_policy_search() -> PolicyVectorSearch:  # noqa: D401
    global _policy_search_singleton
    if _policy_search_singleton is None:
        _policy_search_singleton = PolicyVectorSearch()
        try:
            _policy_search_singleton.create_index()
        except Exception as e:  # pragma: no cover
            logger.error("Could not build policy index: %s", e)
    return _policy_search_singleton
