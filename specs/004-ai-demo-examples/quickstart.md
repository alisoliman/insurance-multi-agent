# Quickstart: AI-Powered Demo Example Generation

**Feature**: `004-ai-demo-examples`  
**Date**: 2026-01-18

## Overview

This feature adds the ability to generate localized, culturally-appropriate insurance claim demo scenarios using AI. Users can:

1. **Generate from parameters**: Select locale, claim type, and complexity
2. **Generate from description**: Enter a natural language description
3. **Save scenarios**: Persist generated scenarios to a backend database
4. **Use preset templates**: Quick-access regional templates

## Quick Test

### 1. Generate a German Auto Claim

```bash
# Generate scenario via API
curl -X POST http://localhost:8000/api/v1/scenarios/generate \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "DE",
    "claim_type": "auto",
    "complexity": "moderate"
  }'
```

**Expected response**: A complete scenario with German names, EUR amounts, German addresses, and a description in German.

### 2. Generate from Custom Description

```bash
curl -X POST http://localhost:8000/api/v1/scenarios/generate \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "NL",
    "custom_description": "A delivery van in Rotterdam damaged two parked cars during a storm"
  }'
```

### 3. Save and Retrieve Scenario

```bash
# Save a generated scenario
curl -X POST http://localhost:8000/api/v1/scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rotterdam Storm Demo",
    "scenario": { /* generated scenario object */ }
  }'

# List saved scenarios
curl http://localhost:8000/api/v1/scenarios

# Get specific scenario
curl http://localhost:8000/api/v1/scenarios/{scenario_id}
```

### 4. Run Generated Scenario Through Workflow

```bash
# Use the generated claim data with the existing workflow endpoint
curl -X POST http://localhost:8000/api/v1/workflow/run \
  -H "Content-Type: application/json" \
  -d '{
    "claim_id": "CLM-2026-001",
    "policy_number": "POL-DE-2026-123456",
    "claimant_name": "Hans Müller",
    ...
  }'
```

## Frontend Usage

1. Navigate to the demo page (`/demo`)
2. Click **"Generate New Scenario"** button
3. Choose between:
   - **Quick Generate tab**: Select locale, claim type, complexity → Generate
   - **Custom tab**: Enter description → Generate
4. Generated scenario appears in the claims list
5. Click **"Run Workflow"** to process
6. Optionally click **"Save"** to persist for later

## Supported Locales

| Code | Country | Language | Currency |
|------|---------|----------|----------|
| US | United States | English | USD |
| UK | United Kingdom | English | GBP |
| DE | Germany | German | EUR |
| NL | Netherlands | Dutch | EUR |
| FR | France | French | EUR |
| ES | Spain | Spanish | EUR |
| JP | Japan | Japanese | JPY |
| AU | Australia | English | AUD |

## Preset Templates

Quick-access templates available via UI or API:

| Template | Locale | Claim Type | Complexity |
|----------|--------|------------|------------|
| Dutch Auto Claim | NL | Auto | Moderate |
| German Home Insurance | DE | Home | Simple |
| UK Health Emergency | UK | Health | Moderate |
| US Auto Accident | US | Auto | Complex |
| French Commercial Claim | FR | Commercial | Complex |
| Japanese Life Insurance | JP | Life | Simple |

## Development Setup

### Backend

```bash
cd backend
uv sync  # Installs aiosqlite dependency
uv run python -m app.main
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

No new environment variables required. Uses existing:
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_DEPLOYMENT_NAME`

## Database

SQLite database auto-created at `backend/app/db/scenarios.db` on first API call.

To reset: `rm backend/app/db/scenarios.db`

## Troubleshooting

### Generation fails with timeout
- Check Azure OpenAI connectivity
- Verify API key is valid
- Try simpler complexity level

### Generated scenario fails workflow
- Ensure policy was added to FAISS index
- Check claim_type matches expected values
- Verify all required fields present

### Saved scenarios not appearing
- Check SQLite file exists and is writable
- Verify database connection in logs
- Check for disk space issues
