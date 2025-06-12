#!/usr/bin/env python3
"""
Insurance Claim Processing Tools

This module contains all the tools used by the multi-agent insurance claim processing system.
These tools provide access to policy details, claimant history, and vehicle information.
"""

from typing import Dict, Any, List
from langchain_core.tools import tool
from .policy_search import get_policy_search  # changed to relative import
import os
import base64
import logging
import json

logger = logging.getLogger(__name__)


@tool
def get_policy_details(policy_number: str) -> Dict[str, Any]:
    """Retrieve detailed policy information for a given policy number."""
    # Simulated policy database (full dataset from original file)
    policy_database = {
        "POL-2024-001": {
            "policy_number": "POL-2024-001",
            "policy_holder": "John Smith",
            "policy_type": "Comprehensive Auto Insurance",
            "coverage_limits": {
                "collision": 50000,
                "comprehensive": 50000,
                "liability": 100000,
                "medical": 10000,
            },
            "deductibles": {"collision": 500, "comprehensive": 250},
            "premium": 1200,
            "effective_date": "2024-01-01",
            "expiry_date": "2024-12-31",
            "status": "active",
            "exclusions": [
                "Racing or competitive driving",
                "Commercial use",
                "Intentional damage",
            ],
            "additional_coverage": [
                "Rental car coverage",
                "Roadside assistance",
            ],
        },
        "POL-2024-002": {
            "policy_number": "POL-2024-002",
            "policy_holder": "Sarah Johnson",
            "policy_type": "Basic Auto Insurance",
            "coverage_limits": {
                "collision": 25000,
                "comprehensive": 25000,
                "liability": 50000,
                "medical": 5000,
            },
            "deductibles": {"collision": 1000, "comprehensive": 500},
            "premium": 800,
            "effective_date": "2024-02-15",
            "expiry_date": "2025-02-14",
            "status": "active",
            "exclusions": ["Racing or competitive driving", "Commercial use"],
            "additional_coverage": [],
        },
    }
    policy = policy_database.get(policy_number)
    if not policy:
        return {"error": f"Policy {policy_number} not found in database"}
    return policy


@tool
def get_claimant_history(claimant_id: str) -> Dict[str, Any]:
    """Retrieve historical claim information for a given claimant."""
    claimant_database = {
        "CLM-001": {
            "claimant_id": "CLM-001",
            "name": "John Smith",
            "customer_since": "2020-01-15",
            "total_claims": 2,
            "claim_history": [
                {
                    "claim_id": "CLM-2023-456",
                    "date": "2023-08-15",
                    "type": "collision",
                    "amount_claimed": 3500,
                    "amount_paid": 3000,
                    "status": "closed",
                    "description": "Minor fender bender in parking lot",
                },
                {
                    "claim_id": "CLM-2022-123",
                    "date": "2022-03-10",
                    "type": "comprehensive",
                    "amount_claimed": 1200,
                    "amount_paid": 950,
                    "status": "closed",
                    "description": "Hail damage to vehicle",
                },
            ],
            "risk_factors": {
                "claim_frequency": "low",
                "average_claim_amount": 2350,
                "fraud_indicators": [],
                "credit_score": "good",
                "driving_record": "clean",
            },
            "contact_info": {
                "phone": "555-0123",
                "email": "john.smith@email.com",
                "address": "123 Main St, Anytown, ST 12345",
            },
        }
    }
    claimant = claimant_database.get(claimant_id)
    if not claimant:
        return {"error": f"Claimant {claimant_id} not found in database"}
    return claimant


@tool
def get_vehicle_details(vin: str) -> Dict[str, Any]:
    """Retrieve vehicle information for a given VIN number."""
    vehicle_database = {
        "1HGBH41JXMN109186": {
            "vin": "1HGBH41JXMN109186",
            "make": "Honda",
            "model": "Civic",
            "year": 2021,
            "color": "Silver",
            "mileage": 25000,
            "market_value": 22000,
            "condition": "good",
            "accident_history": [
                {"date": "2023-08-15", "severity": "minor",
                    "description": "Parking lot collision"}
            ],
            "maintenance_records": "up_to_date",
            "recalls": [],
            "modifications": [],
        }
    }
    vehicle = vehicle_database.get(vin)
    if not vehicle:
        return {"error": f"Vehicle with VIN {vin} not found in database"}
    return vehicle


@tool
def search_policy_documents(query: str) -> Dict[str, Any]:
    """Search through all policy documents to find relevant information."""
    try:
        policy_search = get_policy_search()

        # Check if vectorstore is properly initialized
        if not policy_search.vectorstore:
            return {
                "status": "error",
                "message": "Policy vectorstore not initialized. Index may not be built.",
                "query": query,
            }

        search_results = policy_search.search_policies(
            query, k=5, score_threshold=0.3)

        if not search_results:
            return {
                "status": "no_results_found",
                "message": f"No relevant policy information found for query: '{query}'",
                "query": query,
            }

        formatted_results = [
            {
                "policy_type": r["policy_type"],
                "section": r["section"],
                "content": r["content"],
                "relevance_score": round(r["similarity_score"], 3),
            }
            for r in search_results
        ]
        return {
            "status": "results_found",
            "query": query,
            "total_results": len(formatted_results),
            "results": formatted_results,
        }
    except Exception as e:
        logger.error("Error in search_policy_documents: %s", e, exc_info=True)
        return {"status": "error", "message": f"Search failed: {str(e)}", "query": query}


@tool
def analyze_image(image_path: str) -> Dict[str, Any]:
    """Analyze an image using the Azure OpenAI multimodal model.

    The model is asked to (a) classify the image into one of three categories —
    ``claim_form``, ``invoice``, or ``damage_photo`` — and (b) extract any
    relevant structured data it can confidently identify. The response **must**
    be valid JSON so downstream agents can parse it easily.

    Args:
        image_path: Path to a local image file (jpg, png, etc.).

    Returns:
        Dictionary with keys:
        ``status`` (success|error), ``category``, ``data_extracted`` (may be
        nested JSON), and optional ``raw_response``.
    """

    if not os.path.exists(image_path):
        return {"status": "error", "message": f"Image not found: {image_path}"}

    try:
        # ------------------------------------------------------------
        # 1) Base64-encode the image so we can send via data URL.
        # ------------------------------------------------------------
        with open(image_path, "rb") as f:
            image_b64 = base64.b64encode(f.read()).decode("utf-8")

        # ------------------------------------------------------------
        # 2) Build multimodal ChatCompletion request.
        # ------------------------------------------------------------
        import openai  # lazy import to avoid mandatory dependency elsewhere

        client = openai.AzureOpenAI(
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version="2024-02-15-preview",
        )

        deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")

        system_prompt = (
            "You are an insurance image analyst. "
            "Classify the image into exactly one of the following categories: "
            "claim_form, invoice, damage_photo. "
            "Then extract any structured data you can confidently identify.\n\n"
            "For damage_photo: extract vehicle type, damage location, damage type, visible damage details.\n"
            "For invoice: extract invoice number, total cost, service details, vehicle info.\n"
            "For claim_form: extract claim number, dates, claimant info.\n\n"
            "Always include a 'summary' field with a clear, detailed description of what you see in the image.\n\n"
            "Return JSON like:\n"
            "{\n  \"category\": \"damage_photo\",\n"
            "  \"summary\": \"Image shows a silver sedan with significant front-end collision damage...\",\n"
            "  \"data_extracted\": {\"vehicle_type\": \"car\", \"damage_location\": \"front\", ...}\n}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_b64}",
                            "detail": "auto",
                        },
                    }
                ],
            },
        ]

        response = client.chat.completions.create(
            model=deployment_name,
            messages=messages,
            temperature=0,
            response_format={"type": "json_object"},
        )

        # The model must reply with a JSON object.
        content = response.choices[0].message.content
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as err:
            logger.error("LLM returned non-JSON: %s", content)
            return {"status": "error", "message": "Invalid JSON from LLM", "raw_response": content}

        category = parsed.get("category")
        summary = parsed.get("summary")
        data_extracted = parsed.get("data_extracted")

        return {
            "status": "success",
            "image_path": image_path,
            "category": category,
            "summary": summary,
            "data_extracted": data_extracted,
        }

    except Exception as e:
        logger.error("Error analyzing image %s: %s",
                     image_path, str(e), exc_info=True)
        return {"status": "error", "message": str(e)}


# Convenience lists
ALL_TOOLS: List = [
    get_policy_details,
    get_claimant_history,
    get_vehicle_details,
    search_policy_documents,
    analyze_image,
]
TOOLS_BY_NAME = {t.name: t for t in ALL_TOOLS}
