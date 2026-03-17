#!/usr/bin/env python3
"""
Insurance Claim Processing Tools

This module contains all the tools used by the multi-agent insurance claim processing system.
These tools provide access to policy details, claimant history, and vehicle information.

Tools use Annotated type hints with Pydantic Field for Microsoft Agent Framework compatibility.
"""

from typing import Dict, Any, List, Annotated
from pydantic import Field
from .policy_search import get_policy_search  # changed to relative import
import os
import base64
import logging
import json
from functools import lru_cache

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _get_openai_token_provider():
    from azure.identity import DefaultAzureCredential, get_bearer_token_provider
    return get_bearer_token_provider(
        DefaultAzureCredential(),
        "https://cognitiveservices.azure.com/.default",
    )


def get_policy_details(
    policy_number: Annotated[str, Field(description="The policy number to retrieve details for")]
) -> Dict[str, Any]:
    """Retrieve detailed policy information for a given policy number.
    
    Returns coverage limits, deductibles, exclusions, and status.
    First checks the dynamic policy_repo (for generated scenarios), then falls back to
    the simulated policy database for static demo policies.
    """
    import asyncio
    
    # First, try to get policy from the policy_repo (generated scenarios)
    try:
        from app.db.policy_repo import get_policy_by_policy_number
        
        # Run async function from sync context without corrupting the
        # running event loop.  asyncio.run() calls set_event_loop(None)
        # on cleanup which breaks uvicorn on subsequent requests.
        import concurrent.futures

        def _fetch_policy():
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(get_policy_by_policy_number(policy_number))
            finally:
                loop.close()

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            policy_record = pool.submit(_fetch_policy).result(timeout=10)
        
        if policy_record:
            logger.info(f"Found policy {policy_number} in policy_repo (generated scenario)")
            return {
                "policy_number": policy_record.policy_number,
                "policy_holder": policy_record.customer_name,
                "policy_type": policy_record.policy_type,
                "coverage_limits": policy_record.coverage_limits,
                "deductibles": {"collision": policy_record.deductible, "comprehensive": 250},
                "premium": policy_record.premium,
                "effective_date": policy_record.effective_date,
                "expiry_date": policy_record.expiration_date,
                "status": "active",
                "exclusions": ["Racing or competitive driving", "Commercial use", "Intentional damage"],
                "additional_coverage": [],
                "source": "generated_scenario",
            }
    except Exception as e:
        logger.debug(f"Could not look up policy in policy_repo: {e}")
    
    # Fall back to simulated policy database (full dataset from original file)
    policy_database = {
        "POL-2026-001": {
            "policy_number": "POL-2026-001",
            "policy_holder": "Marie Claes",
            "policy_type": "Comprehensive Auto Insurance",
            "coverage_limits": {
                "collision": 50000,
                "comprehensive": 50000,
                "liability": 100000,
                "medical": 10000,
            },
            "deductibles": {"collision": 500, "comprehensive": 250},
            "premium": 1200,
            "effective_date": "2026-01-01",
            "expiry_date": "2026-12-31",
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
        "POL-2026-002": {
            "policy_number": "POL-2026-002",
            "policy_holder": "David Park",
            "policy_type": "Basic Auto Insurance",
            "coverage_limits": {
                "collision": 25000,
                "comprehensive": 25000,
                "liability": 50000,
                "medical": 5000,
            },
            "deductibles": {"collision": 1000, "comprehensive": 500},
            "premium": 800,
            "effective_date": "2025-06-01",
            "expiry_date": "2026-05-31",
            "status": "active",
            "exclusions": ["Racing or competitive driving", "Commercial use"],
            "additional_coverage": [],
        },
        "POL-2026-003": {
            "policy_number": "POL-2026-003",
            "policy_holder": "Robert Harmon",
            "policy_type": "Basic Auto Insurance",
            "coverage_limits": {
                "collision": 15000,
                "comprehensive": 15000,
                "liability": 50000,
                "medical": 5000,
            },
            "deductibles": {"collision": 1000, "comprehensive": 750},
            "premium": 650,
            "effective_date": "2025-09-01",
            "expiry_date": "2026-08-31",
            "status": "active",
            "exclusions": ["Racing or competitive driving", "Commercial use"],
            "additional_coverage": [],
        },
    }
    policy = policy_database.get(policy_number)
    if not policy:
        # Return INSUFFICIENT_EVIDENCE-friendly response (T013)
        logger.info(f"Policy {policy_number} not found - returning insufficient evidence indicator")
        return {
            "error": f"Policy {policy_number} not found in database",
            "insufficient_evidence": True,
            "suggestion": "The policy may need to be re-indexed or generated scenario was not saved",
        }
    return policy


def get_claimant_history(
    claimant_id: Annotated[str, Field(description="The claimant ID to look up claim history for")]
) -> Dict[str, Any]:
    """Retrieve historical claim information for a given claimant.
    
    Returns previous claims, fraud indicators, and risk factors.
    For generated scenarios (CLT-xxx IDs), returns a default new customer profile.
    """
    # Check if this is a generated scenario claimant (T029)
    if claimant_id.startswith("CLT-"):
        logger.info(f"Generated scenario claimant {claimant_id} - returning new customer profile")
        return {
            "claimant_id": claimant_id,
            "name": "Generated Scenario Customer",
            "customer_since": "2026-01-01",
            "total_claims": 0,
            "claim_history": [],
            "risk_factors": {
                "claim_frequency": "new_customer",
                "average_claim_amount": 0,
                "fraud_indicators": [],
                "credit_score": "unknown",
                "driving_record": "unknown",
            },
            "contact_info": {
                "phone": "N/A",
                "email": "N/A",
                "address": "N/A",
            },
            "note": "This is a new customer from a generated demo scenario with no prior claim history.",
            "source": "generated_scenario",
        }
    
    claimant_database = {
        "CLT-1001": {
            "claimant_id": "CLT-1001",
            "name": "Marie Claes",
            "customer_since": "2022-06-15",
            "total_claims": 0,
            "claim_history": [],
            "risk_factors": {
                "claim_frequency": "none",
                "average_claim_amount": 0,
                "fraud_indicators": [],
                "credit_score": "excellent",
                "driving_record": "clean",
            },
            "contact_info": {
                "phone": "+32 475 123456",
                "email": "marie.claes@email.be",
                "address": "Rue de la Station 12, 1320 Hamme-Mille, Belgium",
            },
        },
        "CLT-2001": {
            "claimant_id": "CLT-2001",
            "name": "David Park",
            "customer_since": "2021-03-10",
            "total_claims": 1,
            "claim_history": [
                {
                    "claim_id": "CLM-2024-812",
                    "date": "2024-11-20",
                    "type": "comprehensive",
                    "amount_claimed": 1100,
                    "amount_paid": 850,
                    "status": "closed",
                    "description": "Hail damage to hood and roof",
                },
            ],
            "risk_factors": {
                "claim_frequency": "low",
                "average_claim_amount": 1100,
                "fraud_indicators": [],
                "credit_score": "good",
                "driving_record": "clean",
            },
            "contact_info": {
                "phone": "919-555-0147",
                "email": "david.park@email.com",
                "address": "204 W Knox St, Durham, NC 27701",
            },
        },
        "CLT-3001": {
            "claimant_id": "CLT-3001",
            "name": "Robert Harmon",
            "customer_since": "2025-09-01",
            "total_claims": 0,
            "claim_history": [],
            "risk_factors": {
                "claim_frequency": "new_customer",
                "average_claim_amount": 0,
                "fraud_indicators": ["delayed_reporting"],
                "credit_score": "fair",
                "driving_record": "minor_violations",
            },
            "contact_info": {
                "phone": "406-555-0293",
                "email": "r.harmon@email.com",
                "address": "718 5th Ave N, Great Falls, MT 59401",
            },
        },
    }
    claimant = claimant_database.get(claimant_id)
    if not claimant:
        return {"error": f"Claimant {claimant_id} not found in database"}
    return claimant


def get_vehicle_details(
    vin: Annotated[str, Field(description="The VIN number to look up vehicle information for")]
) -> Dict[str, Any]:
    """Retrieve vehicle information for a given VIN number.
    
    Returns vehicle make, model, year, value, and specifications.
    First checks the dynamic vehicle_repo (for generated scenarios), then falls back
    to the simulated vehicle database for static demo vehicles.
    """
    import asyncio
    
    # First, try to get vehicle from the vehicle_repo (generated scenarios)
    try:
        from app.db.vehicle_repo import get_vehicle_by_vin
        
        import concurrent.futures

        def _fetch_vehicle():
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(get_vehicle_by_vin(vin))
            finally:
                loop.close()

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            vehicle_record = pool.submit(_fetch_vehicle).result(timeout=10)
        
        if vehicle_record:
            logger.info(f"Found vehicle {vin} in vehicle_repo (generated scenario)")
            return {
                "vin": vehicle_record.vin,
                "make": vehicle_record.make,
                "model": vehicle_record.model,
                "year": vehicle_record.year,
                "license_plate": vehicle_record.license_plate,
                "color": vehicle_record.color or "Unknown",
                "vehicle_type": vehicle_record.vehicle_type or "personenauto",
                "mileage": 20000,  # Default for generated
                "market_value": 25000,  # Default for generated
                "condition": "good",
                "accident_history": [],
                "maintenance_records": "up_to_date",
                "recalls": [],
                "modifications": [],
                "source": "generated_scenario",
            }
    except Exception as e:
        logger.debug(f"Could not look up vehicle in vehicle_repo: {e}")
    
    # Fall back to simulated vehicle database
    vehicle_database = {
        "VF32AKFXE43210987": {
            "vin": "VF32AKFXE43210987",
            "make": "Peugeot",
            "model": "206",
            "year": 2008,
            "color": "Silver",
            "mileage": 142000,
            "market_value": 3200,
            "condition": "fair",
            "accident_history": [],
            "maintenance_records": "up_to_date",
            "recalls": [],
            "modifications": [],
        },
        "1HGEJ8145XL038295": {
            "vin": "1HGEJ8145XL038295",
            "make": "Honda",
            "model": "Civic DX",
            "year": 1999,
            "color": "Silver",
            "mileage": 187000,
            "market_value": 2800,
            "condition": "fair",
            "accident_history": [
                {"date": "2024-11-20", "severity": "minor",
                    "description": "Hail damage to hood and roof"}
            ],
            "maintenance_records": "up_to_date",
            "recalls": [],
            "modifications": [],
        },
        "2G1WF52E839271045": {
            "vin": "2G1WF52E839271045",
            "make": "Chevrolet",
            "model": "Impala",
            "year": 2003,
            "color": "White",
            "mileage": 168000,
            "market_value": 3500,
            "condition": "fair",
            "accident_history": [],
            "maintenance_records": "sporadic",
            "recalls": [],
            "modifications": [],
        },
    }
    vehicle = vehicle_database.get(vin)
    if not vehicle:
        logger.info(f"Vehicle {vin} not found - returning not found response")
        return {"error": f"Vehicle with VIN {vin} not found in database"}
    return vehicle


def search_policy_documents(
    query: Annotated[str, Field(description="Search query for policy documents")],
    top_k: Annotated[int, Field(description="Number of results to return")] = 5
) -> Dict[str, Any]:
    """Search through all policy documents to find relevant information.
    
    Returns matching policy sections with relevance scores.
    """
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
            query, k=top_k, score_threshold=0.3)

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


def _resolve_image(image_path: str) -> bytes | None:
    """Resolve an image path to raw bytes.

    Handles three cases:
    1. Absolute/relative file path that exists on disk -> read directly.
    2. /demo-evidence/... path -> fetch from frontend (FRONTEND_ORIGIN in
       production, or frontend/public/ locally).
    3. Returns None if the image cannot be found.
    """
    import urllib.request

    # Case 1: already a real file on disk
    if os.path.exists(image_path):
        with open(image_path, "rb") as f:
            return f.read()

    # Case 2: relative URL path (e.g. /demo-evidence/CLM-2026-001/front-damage.jpg)
    if image_path.startswith("/demo-evidence/"):
        # Production: fetch from frontend container via HTTP
        frontend_origin = os.getenv("FRONTEND_ORIGIN", "").rstrip("/")
        if frontend_origin:
            url = f"{frontend_origin}{image_path}"
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "InsuranceBackend/1.0"})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    return resp.read()
            except Exception as exc:
                logger.warning("Failed to fetch image from %s: %s", url, exc)

        # Local dev: try resolving against frontend/public/
        for base in ["frontend/public", "../frontend/public"]:
            candidate = os.path.join(base, image_path.lstrip("/"))
            if os.path.exists(candidate):
                with open(candidate, "rb") as f:
                    return f.read()

    return None


def analyze_image(
    image_path: Annotated[str, Field(description="Path or URL to the image file to analyze")]
) -> Dict[str, Any]:
    """Analyze an image using the Azure OpenAI multimodal model.

    The model is asked to (a) classify the image into one of three categories —
    ``claim_form``, ``invoice``, or ``damage_photo`` — and (b) extract any
    relevant structured data it can confidently identify.
    
    Returns extracted text and visual analysis from the image.
    """

    image_data = _resolve_image(image_path)
    if image_data is None:
        return {"status": "error", "message": f"Image not found: {image_path}"}

    try:
        # ------------------------------------------------------------
        # 1) Base64-encode the image so we can send via data URL.
        # ------------------------------------------------------------
        image_b64 = base64.b64encode(image_data).decode("utf-8")

        # ------------------------------------------------------------
        # 2) Build multimodal ChatCompletion request.
        # ------------------------------------------------------------
        import openai  # lazy import to avoid mandatory dependency elsewhere

        client = openai.AzureOpenAI(
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            azure_ad_token_provider=_get_openai_token_provider(),
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


# Convenience lists - plain functions (no longer LangChain tools)
ALL_TOOLS: List = [
    get_policy_details,
    get_claimant_history,
    get_vehicle_details,
    search_policy_documents,
    analyze_image,
]
TOOLS_BY_NAME = {f.__name__: f for f in ALL_TOOLS}
