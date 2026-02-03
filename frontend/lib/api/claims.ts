import { getApiUrl } from '../config'

export interface Claim {
  id: string
  claimant_name: string
  claimant_id: string
  policy_number: string
  claim_type: string
  description: string
  incident_date: string
  estimated_damage?: number
  location?: string
  status: 'new' | 'assigned' | 'in_progress' | 'awaiting_info' | 'approved' | 'denied'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_handler_id?: string
  version: number
  created_at: string
  updated_at?: string
}

export interface Handler {
  id: string
  name: string
  email?: string
  is_active: boolean
  created_at: string
}

export interface AIAssessment {
  id: string
  claim_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  agent_outputs?: Record<string, unknown>
  final_recommendation?: string
  confidence_scores?: Record<string, number>
  processing_started_at?: string
  processing_completed_at?: string
  error_message?: string
  created_at: string
}

export interface ClaimsFilter {
  handler_id?: string
  status?: string
  limit?: number
  offset?: number
}

export interface ClaimDecision {
  claim_id: string
  handler_id: string
  decision_type: 'approved' | 'denied' | 'request_info'
  notes?: string
  ai_assessment_id?: string
}

export interface DashboardMetrics {
  assigned_count: number
  queue_depth: number
  processed_today: number
}

async function getBaseUrl(): Promise<string> {
  return await getApiUrl()
}

export async function getClaims(filter: ClaimsFilter = {}): Promise<Claim[]> {
  const baseUrl = await getBaseUrl()
  const params = new URLSearchParams()
  
  if (filter.handler_id) params.append('handler_id', filter.handler_id)
  if (filter.status) params.append('status', filter.status)
  if (filter.limit) params.append('limit', filter.limit.toString())
  if (filter.offset) params.append('offset', filter.offset.toString())

  const response = await fetch(`${baseUrl}/api/v1/claims?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch claims: ${response.statusText}`)
  }
  return response.json()
}

export async function getClaim(claimId: string): Promise<Claim> {
  const baseUrl = await getBaseUrl()
  const response = await fetch(`${baseUrl}/api/v1/claims/${claimId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch claim: ${response.statusText}`)
  }
  return response.json()
}

export async function processClaim(claimId: string): Promise<AIAssessment> {
  const baseUrl = await getBaseUrl()
  const response = await fetch(`${baseUrl}/api/v1/claims/${claimId}/process`, {
    method: 'POST'
  })
  if (!response.ok) {
    throw new Error(`Failed to process claim: ${response.statusText}`)
  }
  return response.json()
}

export async function assignClaim(claimId: string, handlerId: string): Promise<Claim> {
  const baseUrl = await getBaseUrl()
  const response = await fetch(`${baseUrl}/api/v1/claims/${claimId}/assign?handler_id=${handlerId}`, {
    method: 'POST'
  })
  if (!response.ok) {
    throw new Error(`Failed to assign claim: ${response.statusText}`)
  }
  return response.json()
}

export async function recordDecision(claimId: string, decision: Omit<ClaimDecision, 'claim_id'>): Promise<void> {
  const baseUrl = await getBaseUrl()
  const response = await fetch(`${baseUrl}/api/v1/claims/${claimId}/decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(decision)
  })
  if (!response.ok) {
    throw new Error(`Failed to record decision: ${response.statusText}`)
  }
}

export async function getMetrics(handlerId: string): Promise<DashboardMetrics> {
  const baseUrl = await getBaseUrl()
  const response = await fetch(`${baseUrl}/api/v1/claims/metrics?handler_id=${handlerId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch metrics: ${response.statusText}`)
  }
  return response.json()
}

export async function getHandlers(): Promise<Handler[]> {
  const baseUrl = await getBaseUrl()
  const response = await fetch(`${baseUrl}/api/v1/claims/handlers`)
  if (!response.ok) {
    throw new Error(`Failed to fetch handlers: ${response.statusText}`)
  }
  return response.json()
}

export interface ClaimCreate {
  claimant_name: string
  policy_number: string
  claim_type: string
  description: string
  incident_date: string
  estimated_damage?: number
  location?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export interface SeedResponse {
  claims_created: number
  claim_ids: string[]
}

export async function createClaim(claim: ClaimCreate): Promise<Claim> {
  const baseUrl = await getBaseUrl()
  const response = await fetch(`${baseUrl}/api/v1/claims`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(claim)
  })
  if (!response.ok) {
    throw new Error(`Failed to create claim: ${response.statusText}`)
  }
  return response.json()
}

export async function seedClaims(count: number = 5): Promise<SeedResponse> {
  const baseUrl = await getBaseUrl()
  const response = await fetch(`${baseUrl}/api/v1/claims/seed?count=${count}`, {
    method: 'POST'
  })
  if (!response.ok) {
    throw new Error(`Failed to seed claims: ${response.statusText}`)
  }
  return response.json()
}
