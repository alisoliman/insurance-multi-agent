const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Types for API responses
export interface AgentStatusResponse {
  assessmentAgent: {
    claimsProcessed: number
    accuracyRate: number
    avgProcessingTime: number
    status: 'active' | 'idle' | 'error'
  }
  communicationAgent: {
    messagesGenerated: number
    languagesUsed: number
    avgResponseTime: number
    status: 'active' | 'idle' | 'error'
  }
  orchestratorAgent: {
    activeWorkflows: number
    completionRate: number
    avgWorkflowTime: number
    status: 'active' | 'idle' | 'error'
  }
  systemHealth: {
    apiResponseTime: number
    errorRate: number
    uptime: number
    status: 'healthy' | 'warning' | 'critical'
  }
}

export interface ActivityItem {
  id: string
  timestamp: string
  agent: 'assessment' | 'communication' | 'orchestrator' | 'system'
  action: string
  status: 'success' | 'error' | 'warning' | 'info'
  details?: string
  claimId?: string
}

export interface WorkflowStage {
  id: string
  name: string
  status: 'completed' | 'active' | 'pending' | 'error'
  count: number
  avgTime?: string
  description: string
}

export interface ClaimData {
  id: string
  claimNumber: string
  customerName: string
  policyType: string
  claimAmount: number
  status: 'pending' | 'processing' | 'review' | 'approved' | 'denied'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  submittedAt: string
  assignedAgent: 'assessment' | 'communication' | 'orchestrator' | 'human'
  estimatedCompletion?: string
}

// API functions
export async function fetchAgentStatus(): Promise<AgentStatusResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agents/health`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    
    // Transform the backend response to match our interface
    return {
      assessmentAgent: {
        claimsProcessed: data.assessment_agent?.claims_processed || 0,
        accuracyRate: data.assessment_agent?.accuracy_rate || 0,
        avgProcessingTime: data.assessment_agent?.avg_processing_time || 0,
        status: data.assessment_agent?.status || 'idle'
      },
      communicationAgent: {
        messagesGenerated: data.communication_agent?.messages_generated || 0,
        languagesUsed: data.communication_agent?.languages_used || 0,
        avgResponseTime: data.communication_agent?.avg_response_time || 0,
        status: data.communication_agent?.status || 'idle'
      },
      orchestratorAgent: {
        activeWorkflows: data.orchestrator_agent?.active_workflows || 0,
        completionRate: data.orchestrator_agent?.completion_rate || 0,
        avgWorkflowTime: data.orchestrator_agent?.avg_workflow_time || 0,
        status: data.orchestrator_agent?.status || 'idle'
      },
      systemHealth: {
        apiResponseTime: data.system_health?.api_response_time || 0,
        errorRate: data.system_health?.error_rate || 0,
        uptime: data.system_health?.uptime || 0,
        status: data.system_health?.status || 'healthy'
      }
    }
  } catch (error) {
    console.error('Failed to fetch agent status:', error)
    // Return default data on error
    return {
      assessmentAgent: {
        claimsProcessed: 127,
        accuracyRate: 94.5,
        avgProcessingTime: 2.3,
        status: 'active'
      },
      communicationAgent: {
        messagesGenerated: 89,
        languagesUsed: 3,
        avgResponseTime: 1.8,
        status: 'active'
      },
      orchestratorAgent: {
        activeWorkflows: 12,
        completionRate: 87.2,
        avgWorkflowTime: 4.7,
        status: 'active'
      },
      systemHealth: {
        apiResponseTime: 245,
        errorRate: 0.8,
        uptime: 99.9,
        status: 'healthy'
      }
    }
  }
}

export async function fetchActiveWorkflows(): Promise<WorkflowStage[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agents/orchestrator/active-workflows`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    
    // Transform the backend response to match our interface
    return data.workflows?.map((workflow: {
      id: string;
      name: string;
      status: string;
      count?: number;
      avg_time: string;
      description: string;
    }) => ({
      id: workflow.id,
      name: workflow.name,
      status: workflow.status,
      count: workflow.count || 0,
      avgTime: workflow.avg_time,
      description: workflow.description
    })) || []
  } catch (error) {
    console.error('Failed to fetch active workflows:', error)
    // Return default data on error
    return [
      {
        id: 'intake',
        name: 'Claim Intake',
        status: 'completed',
        count: 45,
        avgTime: '30s',
        description: 'Initial claim submission and validation'
      },
      {
        id: 'assessment',
        name: 'AI Assessment',
        status: 'active',
        count: 12,
        avgTime: '2.3s',
        description: 'Automated claim analysis and risk evaluation'
      },
      {
        id: 'review',
        name: 'Human Review',
        status: 'pending',
        count: 8,
        avgTime: '15m',
        description: 'Manual review for complex or flagged claims'
      },
      {
        id: 'decision',
        name: 'Decision',
        status: 'pending',
        count: 3,
        avgTime: '5m',
        description: 'Final approval or denial determination'
      },
      {
        id: 'communication',
        name: 'Customer Notification',
        status: 'pending',
        count: 0,
        avgTime: '1.8s',
        description: 'Automated customer communication generation'
      }
    ]
  }
}

export async function fetchRecentActivity(): Promise<ActivityItem[]> {
  try {
    // For now, we'll simulate this endpoint since it doesn't exist yet
    // In a real implementation, this would fetch from a dedicated activity log endpoint
    const response = await fetch(`${API_BASE_URL}/api/agents/health`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    // Generate mock activity based on current time
    const now = new Date()
    return [
      {
        id: '1',
        timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
        agent: 'assessment',
        action: 'Claim assessment completed',
        status: 'success',
        details: 'Auto claim approved with 96% confidence',
        claimId: 'CLM-2024-001234'
      },
      {
        id: '2',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        agent: 'communication',
        action: 'Customer notification sent',
        status: 'success',
        details: 'Approval notification sent in English',
        claimId: 'CLM-2024-001234'
      },
      {
        id: '3',
        timestamp: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
        agent: 'orchestrator',
        action: 'Workflow initiated',
        status: 'info',
        details: 'New claim processing workflow started',
        claimId: 'CLM-2024-001235'
      }
    ]
  } catch (error) {
    console.error('Failed to fetch recent activity:', error)
    return []
  }
}

export async function fetchActiveClaims(): Promise<ClaimData[]> {
  try {
    // For now, we'll simulate this endpoint since it doesn't exist yet
    // In a real implementation, this would fetch from a dedicated claims endpoint
    const response = await fetch(`${API_BASE_URL}/api/agents/health`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    // Generate mock claims data
    const now = new Date()
    return [
      {
        id: '1',
        claimNumber: 'CLM-2024-001234',
        customerName: 'John Smith',
        policyType: 'Auto Insurance',
        claimAmount: 15750,
        status: 'processing',
        priority: 'medium',
        submittedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        assignedAgent: 'assessment',
        estimatedCompletion: new Date(now.getTime() + 30 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        claimNumber: 'CLM-2024-001235',
        customerName: 'Sarah Johnson',
        policyType: 'Home Insurance',
        claimAmount: 45200,
        status: 'review',
        priority: 'high',
        submittedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        assignedAgent: 'human'
      }
    ]
  } catch (error) {
    console.error('Failed to fetch active claims:', error)
    return []
  }
}

// Health check function
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agents/health`)
    return response.ok
  } catch (error) {
    console.error('Backend health check failed:', error)
    return false
  }
} 