#!/usr/bin/env python3
"""
Policy Document Vector Search Utility

Adapted from the original `langgraph_insurance.policy_search` so the backend
remains self-contained. Requires `faiss-cpu`, `langchain_openai`, and related
dependencies already listed in `pyproject.toml`.
"""
from __future__ import annotations

import logging
import os
import pickle
from pathlib import Path
from typing import Any, Dict, List, Optional

from langchain_openai import AzureOpenAIEmbeddings
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

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

        # Fallback for legacy path (before data migrated out of langgraph_insurance)
        if not self.policies_dir.exists():
            legacy = Path(__file__).resolve(
            ).parents[2] / "langgraph_insurance/data/policies"
            if legacy.exists():
                self.policies_dir = legacy

        if not self.index_path.exists():
            legacy_idx = Path(__file__).resolve(
            ).parents[2] / "langgraph_insurance/data/policy_index"
            if legacy_idx.exists():
                self.index_path = legacy_idx

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

        loader = DirectoryLoader(
            str(self.policies_dir), glob="*.md", loader_cls=TextLoader, loader_kwargs={"encoding": "utf-8"}
        )
        docs = loader.load()
        logger.info("Loaded %s policy documents", len(docs))

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
        )
        chunks = splitter.split_documents(docs)

        # annotate metadata
        for chunk in chunks:
            filename = Path(chunk.metadata["source"]).stem
            chunk.metadata["policy_type"] = filename.replace("_", " ").title()
            section = None
            for line in chunk.page_content.split("\n"):
                if line.startswith("## Section ") or line.startswith("### Section "):
                    if ":" in line:
                        section_part = line.split(":")[0]
                        if "Section " in section_part:
                            section = section_part.split(
                                "Section ")[-1].strip()
                    break
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
