const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface AssessmentRequest {
  claim_data: {
    claim_id?: string
    policy_number: string
    incident_date: string
    description: string
    amount?: number
    documentation?: string[]
  }
  policy_data?: any
}

export interface AssessmentResponse {
  success: boolean
  assessment_result?: {
    assessment_id: string
    risk_score: number
    recommendation: string
    required_documents: string[]
    estimated_processing_time: string
    priority_level: string
    analysis: {
      fraud_indicators: string[]
      coverage_analysis: string
      settlement_recommendation: string
    }
  }
  error?: string
}

export interface CommunicationRequest {
  customer_name: string
  claim_id: string
  policy_number: string
  communication_type: string
  assessment_result?: any
  policy_details?: any
  preferred_language?: string
  special_instructions?: string
  urgency_level?: string
}

export interface CommunicationResponse {
  communication_id: string
  generated_content: string
  delivery_method: string
  estimated_delivery_time: string
  language_used: string
  tone_analysis: {
    formality_level: string
    empathy_score: number
    clarity_score: number
  }
}

export interface WorkflowRequest {
  workflow_type: string
  priority: string
  initial_data: {
    claim_description?: string
    policy_number?: string
    customer_info?: any
  }
  custom_instructions?: string
}

export interface WorkflowResponse {
  workflow_id: string
  status: string
  current_step: string
  estimated_completion: string
  agent_assignments: {
    agent_type: string
    status: string
    estimated_completion: string
  }[]
  progress: {
    completed_steps: number
    total_steps: number
    percentage: number
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/api/health')
  }

  // Assessment Agent
  async assessClaim(request: AssessmentRequest): Promise<ApiResponse<AssessmentResponse>> {
    return this.request('/api/agents/enhanced-assessment/assess-claim', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // Communication Agent
  async generateCommunication(request: CommunicationRequest): Promise<ApiResponse<CommunicationResponse>> {
    return this.request('/api/agents/enhanced-communication/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // Orchestrator Agent
  async startWorkflow(request: WorkflowRequest): Promise<ApiResponse<WorkflowResponse>> {
    return this.request('/api/agents/orchestrator/process-workflow', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async getWorkflowStatus(workflowId: string): Promise<ApiResponse<WorkflowResponse>> {
    return this.request(`/api/agents/orchestrator/workflow-status/${workflowId}`)
  }
}

export const apiClient = new ApiClient()

// Utility functions for demo data
export const generateMockAssessmentResponse = (request: AssessmentRequest): AssessmentResponse => ({
  success: true,
  assessment_result: {
    assessment_id: `ASS-${Date.now()}`,
    risk_score: Math.floor(Math.random() * 100),
    recommendation: request.claim_data.description.toLowerCase().includes('auto') ? 'Approve with standard processing' : 'Requires additional documentation',
    required_documents: ['Driver\'s license', 'Police report', 'Photos of damage'],
    estimated_processing_time: '3-5 business days',
    priority_level: request.claim_data.amount && request.claim_data.amount > 10000 ? 'high' : 'medium',
    analysis: {
      fraud_indicators: request.claim_data.description.toLowerCase().includes('total loss') ? ['High value claim'] : [],
      coverage_analysis: 'Claim falls within policy coverage limits',
      settlement_recommendation: `Estimated settlement: $${request.claim_data.amount || 5000}`
    }
  }
})

export const generateMockCommunicationResponse = (request: CommunicationRequest): CommunicationResponse => ({
  communication_id: `COM-${Date.now()}`,
  generated_content: `Dear ${request.customer_name || 'Valued Customer'},\n\nWe have received your ${request.communication_type} regarding claim ${request.claim_id || 'CLM-12345'}. Our team is currently reviewing your case and will provide an update within 24-48 hours.\n\nThank you for your patience.\n\nBest regards,\nInsurance Team`,
  delivery_method: request.communication_type === 'email' ? 'email' : 'sms',
  estimated_delivery_time: '2-5 minutes',
  language_used: request.preferred_language || 'en',
  tone_analysis: {
    formality_level: 'professional',
    empathy_score: 8.5,
    clarity_score: 9.2
  }
})

export const generateMockWorkflowResponse = (request: WorkflowRequest): WorkflowResponse => ({
  workflow_id: `WF-${Date.now()}`,
  status: 'in_progress',
  current_step: 'assessment',
  estimated_completion: '2-3 business days',
  agent_assignments: [
    {
      agent_type: 'assessment',
      status: 'in_progress',
      estimated_completion: '4 hours'
    },
    {
      agent_type: 'communication',
      status: 'pending',
      estimated_completion: '6 hours'
    }
  ],
  progress: {
    completed_steps: 1,
    total_steps: 4,
    percentage: 25
  }
}) 