/**
 * API client for AI-powered scenario generation.
 * 
 * Based on contracts/scenarios-api.yaml from specs/004-ai-demo-examples/
 */

import { Locale, ClaimType, Complexity } from "./locale-config";
import { getApiUrl } from "./config";

// ============================================================================
// Type Definitions
// ============================================================================

export interface VehicleInfo {
  vin: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  mileage?: number; // Added for Feature 005 - US5 preview
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address?: string; // Added for Feature 005 - US5 preview
}

export interface CoverageLimits {
  collision: number;
  comprehensive: number;
  liability_per_person: number;
  liability_per_accident: number;
  property_damage: number;
  medical_payments: number;
}

export interface Deductibles {
  collision: number;
  comprehensive: number;
}

export interface GeneratedClaim {
  claim_id: string;
  policy_number: string;
  claimant_id: string;
  claimant_name: string;
  incident_date: string;
  claim_type: string;
  description: string;
  estimated_damage: number;
  location: string;
  police_report: boolean;
  photos_provided: boolean;
  witness_statements: string;
  vehicle_info?: VehicleInfo;
  customer_info?: CustomerInfo;
}

export interface GeneratedPolicy {
  policy_number: string;
  policy_type: string;
  coverage_type: string;
  coverage_limits: CoverageLimits;
  deductibles: Deductibles;
  exclusions: string[];
  effective_date: string;
  expiration_date: string;
  markdown_content: string;
}

export interface GeneratedScenario {
  id: string;
  name: string;
  locale: Locale;
  claim_type: ClaimType;
  complexity: Complexity;
  claim: GeneratedClaim;
  policy: GeneratedPolicy;
  created_at: string;
}

export interface ScenarioGenerationRequest {
  locale: Locale;
  claim_type?: ClaimType;
  complexity?: Complexity;
  custom_description?: string;
}

export interface SaveScenarioRequest {
  name: string;
  scenario: GeneratedScenario;
}

export interface SavedScenarioSummary {
  id: string;
  name: string;
  locale: Locale;
  claim_type: ClaimType;
  complexity: Complexity;
  estimated_damage: number;
  created_at: string;
}

export interface SavedScenario extends GeneratedScenario {
  updated_at?: string;
}

export interface ScenarioListResponse {
  scenarios: SavedScenarioSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface PresetTemplate {
  id: string;
  name: string;
  locale: Locale;
  claim_type: ClaimType;
  complexity: Complexity;
  description: string;
}

export interface TemplateListResponse {
  templates: PresetTemplate[];
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// API Client Class
// ============================================================================

class ScenarioApiError extends Error {
  constructor(
    public statusCode: number,
    public errorResponse: ErrorResponse
  ) {
    super(errorResponse.message);
    this.name = "ScenarioApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorResponse: ErrorResponse;
    try {
      const errorData = await response.json();
      errorResponse = {
        error: errorData.detail?.error || "unknown_error",
        message: errorData.detail?.message || errorData.message || response.statusText,
        details: errorData.detail,
      };
    } catch {
      errorResponse = {
        error: "unknown_error",
        message: response.statusText || "An unknown error occurred",
      };
    }
    throw new ScenarioApiError(response.status, errorResponse);
  }
  
  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Generate a new demo scenario using AI.
 * 
 * @param request - Generation parameters (locale, claim_type, complexity, or custom_description)
 * @returns Generated scenario with claim and policy data
 */
export async function generateScenario(
  request: ScenarioGenerationRequest
): Promise<GeneratedScenario> {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/scenarios/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  
  return handleResponse<GeneratedScenario>(response);
}

/**
 * List saved scenarios with optional filtering.
 * 
 * @param options - Filter and pagination options
 * @returns List of saved scenario summaries
 */
export async function listScenarios(options?: {
  locale?: Locale;
  claim_type?: ClaimType;
  limit?: number;
  offset?: number;
}): Promise<ScenarioListResponse> {
  const params = new URLSearchParams();
  
  if (options?.locale) params.set("locale", options.locale);
  if (options?.claim_type) params.set("claim_type", options.claim_type);
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.offset) params.set("offset", String(options.offset));
  
  const queryString = params.toString();
  const apiUrl = await getApiUrl();
  const url = `${apiUrl}/api/v1/scenarios${queryString ? `?${queryString}` : ""}`;
  
  const response = await fetch(url);
  return handleResponse<ScenarioListResponse>(response);
}

/**
 * Save a generated scenario to the database.
 * 
 * @param request - Scenario to save with user-provided name
 * @returns Summary of the saved scenario
 */
export async function saveScenario(
  request: SaveScenarioRequest
): Promise<SavedScenarioSummary> {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/scenarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  
  return handleResponse<SavedScenarioSummary>(response);
}

/**
 * Get a saved scenario by ID.
 * 
 * @param scenarioId - UUID of the scenario
 * @returns Full scenario details
 */
export async function getScenario(scenarioId: string): Promise<SavedScenario> {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/scenarios/${scenarioId}`);
  return handleResponse<SavedScenario>(response);
}

/**
 * Delete a saved scenario.
 * 
 * @param scenarioId - UUID of the scenario to delete
 */
export async function deleteScenario(scenarioId: string): Promise<void> {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/scenarios/${scenarioId}`, {
    method: "DELETE",
  });
  
  return handleResponse<void>(response);
}

/**
 * Get preset scenario templates.
 * 
 * @returns List of preset templates
 */
export async function getTemplates(): Promise<TemplateListResponse> {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/scenarios/templates`);
  return handleResponse<TemplateListResponse>(response);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a scenario from a preset template.
 * 
 * @param template - Preset template to use
 * @returns Generated scenario
 */
export async function generateFromTemplate(
  template: PresetTemplate
): Promise<GeneratedScenario> {
  return generateScenario({
    locale: template.locale,
    claim_type: template.claim_type,
    complexity: template.complexity,
  });
}

/**
 * Check if an error is a ScenarioApiError.
 */
export function isScenarioApiError(error: unknown): error is ScenarioApiError {
  return error instanceof ScenarioApiError;
}

/**
 * Get a user-friendly error message from an error.
 */
export function getErrorMessage(error: unknown): string {
  if (isScenarioApiError(error)) {
    return error.errorResponse.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}
