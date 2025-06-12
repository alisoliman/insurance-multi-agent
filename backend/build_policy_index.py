#!/usr/bin/env python3
"""
Build Policy Index Script

This script builds the FAISS vector index for policy documents.
Run this before starting the application to ensure policy search works properly.
"""
from app.workflow.policy_search import PolicyVectorSearch
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))


def main():
    """Build the policy vector index."""
    load_dotenv()

    # Check required environment variables
    required_vars = ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        print(
            f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please set these in your .env file")
        return 1

    try:
        print("🚀 Building policy vector index...")
        policy_search = PolicyVectorSearch()
        policy_search.create_index(force_rebuild=True)
        print("✅ Policy vector index built successfully!")
        return 0
    except Exception as e:
        print(f"❌ Failed to build policy index: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
