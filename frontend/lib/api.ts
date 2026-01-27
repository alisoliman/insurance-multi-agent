import { getApiUrl } from './config'

export interface ApiResponse<T = unknown> {
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
  policy_data?: Record<string, unknown>
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
  assessment_result?: Record<string, unknown>
  policy_details?: Record<string, unknown>
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
    customer_info?: Record<string, unknown>
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

// Feedback API interfaces
export interface FeedbackRatingRequest {
  category: string
  rating: number
  comment?: string
}

export interface ImmediateAgentFeedbackRequest {
  session_id?: string
  claim_id?: string
  agent_name?: string
  interaction_id?: string
  ratings: FeedbackRatingRequest[]
  overall_rating?: number
  positive_feedback?: string
  improvement_suggestions?: string
  additional_comments?: string
  user_id?: string
}

export interface WorkflowCompletionFeedbackRequest {
  session_id?: string
  claim_id?: string
  workflow_type?: string
  ratings: FeedbackRatingRequest[]
  overall_rating?: number
  positive_feedback?: string
  improvement_suggestions?: string
  additional_comments?: string
  completion_time_seconds?: number
  steps_completed?: number
  encountered_issues?: boolean
  user_id?: string
}

export interface FeedbackSubmissionResponse {
  success: boolean
  feedback_id?: string
  message: string
  error?: string
}

export interface FeedbackResponse {
  feedback_id: string
  feedback_type: string
  session_id?: string
  claim_id?: string
  agent_name?: string
  interaction_id?: string
  ratings: Array<{
    category: string
    rating: number
    comment?: string
  }>
  overall_rating?: number
  average_rating: number
  positive_feedback?: string
  improvement_suggestions?: string
  additional_comments?: string
  user_id?: string
  submitted_at: string
  is_processed: boolean
  processed_at?: string
  has_text_feedback: boolean
}

export interface FeedbackListResponse {
  success: boolean
  feedback: FeedbackResponse[]
  total_count: number
  page: number
  page_size: number
  error?: string
}

export interface FeedbackSummaryResponse {
  success: boolean
  summary?: Record<string, unknown>
  error?: string
}

export interface FeedbackQueryParams {
  feedback_type?: string
  agent_name?: string
  claim_id?: string
  session_id?: string
  user_id?: string
  start_date?: string
  end_date?: string
  min_rating?: number
  max_rating?: number
  is_processed?: boolean
  has_text_feedback?: boolean
  page?: number
  page_size?: number
}

class ApiClient {
  private baseUrl: string | null = null

  private async getBaseUrl(): Promise<string> {
    if (!this.baseUrl) {
      this.baseUrl = await getApiUrl()
    }
    return this.baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const baseUrl = await this.getBaseUrl()
      const url = `${baseUrl}${endpoint}`
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

  // Feedback API methods
  async submitImmediateAgentFeedback(request: ImmediateAgentFeedbackRequest): Promise<ApiResponse<FeedbackSubmissionResponse>> {
    return this.request('/api/feedback/immediate-agent', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async submitWorkflowCompletionFeedback(request: WorkflowCompletionFeedbackRequest): Promise<ApiResponse<FeedbackSubmissionResponse>> {
    return this.request('/api/feedback/workflow-completion', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async getFeedbackList(params?: FeedbackQueryParams): Promise<ApiResponse<FeedbackListResponse>> {
    const queryParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }

    const queryString = queryParams.toString()
    const endpoint = queryString ? `/api/feedback/list?${queryString}` : '/api/feedback/list'
    
    return this.request(endpoint)
  }

  async getFeedbackById(feedbackId: string): Promise<ApiResponse<FeedbackResponse>> {
    return this.request(`/api/feedback/${feedbackId}`)
  }

  async getFeedbackSummary(): Promise<ApiResponse<FeedbackSummaryResponse>> {
    return this.request('/api/feedback/summary')
  }

  async markFeedbackProcessed(feedbackId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.request(`/api/feedback/${feedbackId}/processed`, {
      method: 'PATCH',
    })
  }

  async deleteFeedback(feedbackId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.request(`/api/feedback/${feedbackId}`, {
      method: 'DELETE',
    })
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
  estimated_completion: request.priority === 'high' ? '1-2 business days' : '2-3 business days',
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