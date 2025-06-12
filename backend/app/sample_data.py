#!/usr/bin/env python3
"""
Sample Insurance Claim Data

This module contains sample claim data for testing the multi-agent insurance claim processing system.
"""

# Sample insurance claim data with tool-compatible IDs
sample_claim = {
    "claim_id": "CLM-2024-001",
    "policy_number": "POL-2024-001",  # Matches our policy database
    "claimant_id": "CLM-001",  # Added for claimant history lookup
    "claimant_name": "John Smith",
    "incident_date": "2024-01-15",
    "claim_type": "Auto Accident",
    "description": "Rear-end collision at intersection. Vehicle sustained damage to rear bumper, trunk, and tail lights. No injuries reported.",
    "estimated_damage": 4500.00,
    "location": "Main St & Oak Ave, Springfield",
    "police_report": True,
    "photos_provided": True,
    "witness_statements": 2,
    "vehicle_info": {
        "vin": "1HGBH41JXMN109186",  # Added for vehicle lookup
        "make": "Honda",
        "model": "Civic",
        "year": 2021,
        "license_plate": "ABC123"
    },
    "supporting_images": [
        "/Users/ali/Dev/ip/langgraph-insurance/data/claims/invoice.png",
        "/Users/ali/Dev/ip/langgraph-insurance/data/claims/crash2.jpg"
    ]
}

# High-value claim
high_value_claim = {
    "claim_id": "CLM-2024-002",
    "policy_number": "POL-2024-001",
    "claimant_id": "CLM-001",
    "claimant_name": "John Smith",
    "incident_date": "2024-02-15",
    "claim_type": "Major Collision",
    "description": "Multi-vehicle accident on highway during rush hour. Extensive front-end damage, airbag deployment.",
    "estimated_damage": 45000.00,
    "location": "Highway 101, Mile Marker 45",
    "police_report": True,
    "photos_provided": True,
    "witness_statements": 3,
    "vehicle_info": {
        "vin": "1HGBH41JXMN109186",
        "make": "Honda",
        "model": "Civic",
        "year": 2021,
        "license_plate": "ABC123"
    }
}

# Suspicious claim
suspicious_claim = {
    "claim_id": "CLM-2024-003",
    "policy_number": "POL-2024-999",  # Non-existent policy
    "claimant_id": "CLM-003",  # High-risk claimant
    "claimant_name": "Mike Wilson",
    "incident_date": "2024-03-01",
    "claim_type": "Vandalism",
    "description": "Vehicle vandalized while parked overnight. Extensive scratches and broken windows.",
    "estimated_damage": 12000.00,
    "location": "Unknown parking lot",
    "police_report": False,  # Red flag
    "photos_provided": False,  # Red flag
    "witness_statements": 0,  # Red flag
    "vehicle_info": {
        "vin": "UNKNOWN123456789",  # Invalid VIN
        "make": "Unknown",
        "model": "Unknown",
        "year": 2020,
        "license_plate": "XYZ999"
    }
}

# List of all sample claims for easy access
ALL_SAMPLE_CLAIMS = [sample_claim, high_value_claim, suspicious_claim]
