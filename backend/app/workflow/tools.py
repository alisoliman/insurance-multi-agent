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

logger = logging.getLogger(__name__)


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
        
        # Run async function in sync context
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # We're in an async context, need to handle differently
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, get_policy_by_policy_number(policy_number))
                policy_record = future.result()
        else:
            policy_record = loop.run_until_complete(get_policy_by_policy_number(policy_number))
        
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
        "UNAuto-02-2024-567890": {
            "policy_number": "UNAuto-02-2024-567890",
            "policy_holder": "Jan de Vries",
            "policy_type": "WA All risk",
            "coverage_limits": {
                "wettelijke_aansprakelijkheid": "unlimited",
                "eigen_schade": 50000,
                "diefstal": 50000,
                "brand_storm_natuur": 50000,
                "ruitschade": 2500,
            },
            "deductibles": {
                "eigen_schade": 400,
                "ruitreparatie": 0,
                "ruitvervanging": 150,
            },
            "premium": 1450,
            "effective_date": "2024-01-01",
            "expiry_date": "2024-12-31",
            "status": "active",
            "modules": [
                "Schade Inzittenden",
                "Pechhulp Nederland", 
                "Rechtsbijstand"
            ],
            "services": {
                "schadegarant": True,
                "glasgarant": True,
                "vervangend_vervoer": True,
                "rechtsbijstand_das": True,
            },
            "schadevrije_jaren": 5,
            "korting_percentage": 45,
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
            "customer_since": "2024-01-01",
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
        },
        "CLM-004": {
            "claimant_id": "CLM-004",
            "name": "Jan de Vries",
            "customer_since": "2019-03-01",
            "total_claims": 1,
            "claim_history": [
                {
                    "claim_id": "CLM-2022-789",
                    "date": "2022-08-15",
                    "type": "ruitschade",
                    "amount_claimed": 450,
                    "amount_paid": 450,
                    "status": "closed",
                    "description": "Steenslag op voorruit tijdens snelwegrit",
                },
            ],
            "risk_factors": {
                "claim_frequency": "very_low",
                "average_claim_amount": 450,
                "fraud_indicators": [],
                "credit_score": "excellent",
                "driving_record": "clean",
            },
            "contact_info": {
                "phone": "+31 6 12345678",
                "email": "jan.devries@email.nl",
                "address": "Hoofdstraat 123, 1012 AB Amsterdam",
            },
        }
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
        
        # Run async function in sync context
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # We're in an async context, need to handle differently
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, get_vehicle_by_vin(vin))
                vehicle_record = future.result()
        else:
            vehicle_record = loop.run_until_complete(get_vehicle_by_vin(vin))
        
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
        },
        "WVWZZZ1JZXW123456": {
            "vin": "WVWZZZ1JZXW123456",
            "make": "Volkswagen",
            "model": "Golf",
            "year": 2022,
            "color": "Blauw",
            "mileage": 18000,
            "market_value": 28000,
            "condition": "excellent",
            "accident_history": [],
            "maintenance_records": "up_to_date",
            "recalls": [],
            "modifications": [],
            "license_plate": "12-ABC-3",
            "apk_valid_until": "2025-01-15",
            "insurance_category": "personenauto",
        }
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


def analyze_image(
    image_path: Annotated[str, Field(description="Path or URL to the image file to analyze")]
) -> Dict[str, Any]:
    """Analyze an image using the Azure OpenAI multimodal model.

    The model is asked to (a) classify the image into one of three categories —
    ``claim_form``, ``invoice``, or ``damage_photo`` — and (b) extract any
    relevant structured data it can confidently identify.
    
    Returns extracted text and visual analysis from the image.
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


# Convenience lists - plain functions (no longer LangChain tools)
ALL_TOOLS: List = [
    get_policy_details,
    get_claimant_history,
    get_vehicle_details,
    search_policy_documents,
    analyze_image,
]
TOOLS_BY_NAME = {f.__name__: f for f in ALL_TOOLS}
