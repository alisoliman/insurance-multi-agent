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
    "witness_statements": "2",
    "vehicle_info": {
        "vin": "1HGBH41JXMN109186",  # Added for vehicle lookup
        "make": "Honda",
        "model": "Civic",
        "year": 2021,
        "license_plate": "ABC123"
    },
    "supporting_images": [
        "/demo-evidence/CLM-2024-001/rear-bumper-damage.jpg",
        "/demo-evidence/CLM-2024-001/trunk-damage.jpg",
        "/demo-evidence/CLM-2024-001/intersection-scene.jpg"
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
    "witness_statements": "3",
    "vehicle_info": {
        "vin": "1HGBH41JXMN109186",
        "make": "Honda",
        "model": "Civic",
        "year": 2021,
        "license_plate": "ABC123"
    },
    "supporting_images": [
        "/demo-evidence/CLM-2024-002/highway-collision.jpg",
        "/demo-evidence/CLM-2024-002/front-end-damage.jpg",
        "/demo-evidence/CLM-2024-002/airbag-deployed.jpg",
        "/demo-evidence/CLM-2024-002/tow-truck-scene.jpg"
    ]
}

# Dutch auto insurance claim for policy checker demo
dutch_auto_claim = {
    "claim_id": "CLM-2024-004",
    "policy_number": "UNAuto-02-2024-567890",
    "claimant_id": "CLM-004",
    "claimant_name": "Jan de Vries",
    "incident_date": "2024-01-14",
    "claim_type": "Auto Collision",
    "description": "Aanrijding met een andere auto tijdens het uitparkeren. Ik reed achteruit uit een parkeerplaats toen een andere bestuurder plotseling van rechts kwam en tegen mijn rechterzijkant botste. De andere bestuurder beweerde dat ik niet goed had gekeken, maar ik had wel degelijk gecheckt.",
    "estimated_damage": 3500.00,
    "location": "Damrak 45, Amsterdam",
    "police_report": True,
    "photos_provided": True,
    "witness_statements": "1",
    "vehicle_info": {
        "vin": "WVWZZZ1JZXW123456",
        "make": "Volkswagen",
        "model": "Golf",
        "year": 2022,
        "license_plate": "12-ABC-3"
    },
    "supporting_images": [
        "/demo-evidence/CLM-2024-004/side-damage.jpg",
        "/demo-evidence/CLM-2024-004/bumper-closeup.jpg"
    ]
}

# List of all sample claims for easy access
ALL_SAMPLE_CLAIMS = [sample_claim, high_value_claim, dutch_auto_claim]
