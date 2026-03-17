#!/usr/bin/env python3
"""
Sample Insurance Claim Data

This module contains sample claim data for testing the multi-agent insurance claim processing system.
Each claim is designed around real evidence photos (Wikimedia Commons, CC BY-SA)
so that descriptions, vehicles, and locations match the actual images.
"""

# Claim A — Low-value residential fender bender (auto-approve path)
sample_claim = {
    "claim_id": "CLM-2026-001",
    "policy_number": "POL-2026-001",
    "claimant_id": "CLT-1001",
    "claimant_name": "Marie Claes",
    "incident_date": "2026-02-08",
    "claim_type": "Auto Accident",
    "description": "Low-speed collision in residential area. Vehicle struck a parked bicycle while maneuvering on a narrow street. Front bumper crushed and hood dented. No injuries reported. Police report filed.",
    "estimated_damage": 2400.00,
    "location": "Rue de la Station, Hamme-Mille, Belgium",
    "police_report": True,
    "photos_provided": True,
    "witness_statements": "1",
    "vehicle_info": {
        "vin": "VF32AKFXE43210987",
        "make": "Peugeot",
        "model": "206",
        "year": 2008,
        "license_plate": "FCR-407"
    },
    "supporting_images": [
        "/demo-evidence/CLM-2026-001/front-damage.jpg",
    ],
}

# Claim B — Intersection collision, total-loss candidate (review path)
high_value_claim = {
    "claim_id": "CLM-2026-002",
    "policy_number": "POL-2026-002",
    "claimant_id": "CLT-2001",
    "claimant_name": "David Park",
    "incident_date": "2026-01-23",
    "claim_type": "Major Collision",
    "description": "Intersection collision near school zone on Gregson Street, Durham NC. Vehicle collided with a Toyota Camry. Front end destroyed — bumper, hood, radiator, and headlights crushed. Driver-side airbag deployed. Durham Police responded and filed report. Likely total loss on older vehicle.",
    "estimated_damage": 7500.00,
    "location": "Gregson St & Knox St, Durham, NC",
    "police_report": True,
    "photos_provided": True,
    "witness_statements": "2",
    "vehicle_info": {
        "vin": "1HGEJ8145XL038295",
        "make": "Honda",
        "model": "Civic DX",
        "year": 1999,
        "license_plate": "NCR-4851"
    },
    "supporting_images": [
        "/demo-evidence/CLM-2026-002/front-damage.jpg",
        "/demo-evidence/CLM-2026-002/police-scene.jpg",
    ],
}

# Claim C — Nighttime T-bone, severe structural damage (investigate path)
suspicious_claim = {
    "claim_id": "CLM-2026-003",
    "policy_number": "POL-2026-003",
    "claimant_id": "CLT-3001",
    "claimant_name": "Robert Harmon",
    "incident_date": "2026-03-05",
    "claim_type": "Major Collision",
    "description": "Nighttime T-bone collision at intersection. Vehicle was struck on the passenger side by an unidentified vehicle that fled the scene. Severe side-impact damage to rear passenger door and quarter panel. Rear wheel pushed inward. No witnesses located. Claimant reports delayed notification — filed claim 3 days after incident.",
    "estimated_damage": 9800.00,
    "location": "29th St & 5th Ave N, Great Falls, MT",
    "police_report": True,
    "photos_provided": True,
    "witness_statements": "0",
    "vehicle_info": {
        "vin": "2G1WF52E839271045",
        "make": "Chevrolet",
        "model": "Impala",
        "year": 2003,
        "license_plate": "MT-45821A"
    },
    "supporting_images": [
        "/demo-evidence/CLM-2026-003/side-damage.jpg",
    ],
}

# List of all sample claims for easy access
ALL_SAMPLE_CLAIMS = [sample_claim, high_value_claim, suspicious_claim]
