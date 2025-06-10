'use client'

import React, { useState, useEffect } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  IconMessageCircle,
  IconUsers,
  IconCircleCheck,
  IconClock,
  IconStar,
  IconInfoCircle,
  IconLoader2
} from '@tabler/icons-react'

import { FeedbackDialog, useFeedbackDialog } from '@/components/feedback/FeedbackDialog'
import { useFeedback } from '@/hooks/useFeedback'
import { FeedbackResponse, FeedbackSubmissionResponse as ApiFeedbackSubmissionResponse } from '@/lib/api'
import { FeedbackData, FeedbackSubmissionResponse, ImmediateAgentFeedback, WorkflowCompletionFeedback } from '@/lib/feedback-types'

// Sample agent decisions for demo
const sampleAgentDecisions = [
  {
    agentName: "Assessment Agent",
    decision: "Approved",
    confidence: 0.85,
    reasoning: "Claim meets all policy requirements. Vehicle damage is consistent with reported incident. No red flags detected in documentation.",
    agentType: "Assessment",
    timestamp: "2024-01-15T10:30:00Z"
  },
  {
    agentName: "Communication Agent", 
    decision: "Draft Prepared",
    confidence: 0.92,
    reasoning: "Customer communication drafted with appropriate tone and all necessary information included. Ready for review and sending.",
    agentType: "Communication",
    timestamp: "2024-01-15T10:35:00Z"
  },
  {
    agentName: "Orchestrator Agent",
    decision: "Workflow Complete",
    confidence: 0.78,
    reasoning: "All agents have completed their tasks successfully. No human intervention required. Claim processing can proceed to final approval.",
    agentType: "Orchestrator", 
    timestamp: "2024-01-15T10:40:00Z"
  }
]

// Sample workflow data
const sampleWorkflow = {
  workflowId: "workflow-demo-001",
  agentNames: ["Assessment Agent", "Communication Agent", "Orchestrator Agent"],
  workflowDuration: 180, // 3 minutes
  humanReviewRequired: false,
  startTime: "2024-01-15T10:30:00Z",
  endTime: "2024-01-15T10:33:00Z"
}

export default function FeedbackDemoPage() {
  const [submittedFeedbackIds, setSubmittedFeedbackIds] = useState<string[]>([])
  const [recentFeedback, setRecentFeedback] = useState<FeedbackResponse[]>([])
  const [lastSubmissionResult, setLastSubmissionResult] = useState<FeedbackSubmissionResponse | null>(null)
  
  const feedbackDialog = useFeedbackDialog()
  const { 
    submitImmediateAgentFeedback, 
    submitWorkflowCompletionFeedback, 
    getFeedbackList,
    isLoading, 
    error 
  } = useFeedback()

  // Load recent feedback on component mount
  useEffect(() => {
    const loadRecentFeedback = async () => {
      try {
        const feedbackList = await getFeedbackList()
        setRecentFeedback(feedbackList.slice(0, 5)) // Show last 5 submissions
      } catch (err) {
        console.error('Failed to load recent feedback:', err)
      }
    }
    
    loadRecentFeedback()
  }, [getFeedbackList])

  // Real feedback submission handler using backend API
  const handleFeedbackSubmission = async (feedback: Omit<FeedbackData, 'id' | 'timestamp'>): Promise<FeedbackSubmissionResponse> => {
    try {
      let apiResult: ApiFeedbackSubmissionResponse

      if (feedback.type === 'immediate_agent') {
        // Type guard to ensure we have the right properties
        const immediateFeedback = feedback as Omit<ImmediateAgentFeedback, 'id' | 'timestamp'>
        
        // Structure the request according to API expectations
        const request = {
          session_id: `demo-session-${Date.now()}`,
          claim_id: `demo-claim-${Date.now()}`,
          agent_name: immediateFeedback.agentName!,
          interaction_id: `demo-interaction-${Date.now()}`,
          user_id: 'demo-user-001',
          ratings: [
            {
              category: 'accuracy',
              rating: immediateFeedback.accuracyRating,
              comment: immediateFeedback.comments || ''
            },
            {
              category: 'helpfulness', 
              rating: immediateFeedback.helpfulnessRating,
              comment: immediateFeedback.comments || ''
            }
          ],
          overall_rating: Math.round((immediateFeedback.accuracyRating + immediateFeedback.helpfulnessRating) / 2),
          positive_feedback: immediateFeedback.comments || '',
          improvement_suggestions: '',
          additional_comments: `Decision: ${immediateFeedback.decisionContext.decision}, Validation: ${immediateFeedback.decisionValidation}`
        }

        const response = await submitImmediateAgentFeedback(request)
        if (!response) {
          throw new Error('Failed to submit immediate agent feedback')
        }
        apiResult = response
      } else if (feedback.type === 'workflow_completion') {
        // Type guard to ensure we have the right properties
        const workflowFeedback = feedback as Omit<WorkflowCompletionFeedback, 'id' | 'timestamp'>
        
        // Structure the request according to API expectations
        const request = {
          session_id: `demo-session-${Date.now()}`,
          claim_id: `demo-claim-${Date.now()}`,
          workflow_type: 'claim_processing',
          user_id: 'demo-user-001',
          ratings: [
            {
              category: 'overall_satisfaction',
              rating: workflowFeedback.overallSatisfaction,
              comment: workflowFeedback.improvementSuggestions || ''
            },
            {
              category: 'efficiency',
              rating: workflowFeedback.efficiencyRating,
              comment: ''
            }
          ],
          overall_rating: Math.round((workflowFeedback.overallSatisfaction + workflowFeedback.efficiencyRating) / 2),
          positive_feedback: workflowFeedback.mostHelpfulAspect || '',
          improvement_suggestions: workflowFeedback.improvementSuggestions || '',
          additional_comments: `Most helpful: ${workflowFeedback.mostHelpfulAspect || 'N/A'}, Least helpful: ${workflowFeedback.leastHelpfulAspect || 'N/A'}`,
          completion_time_seconds: workflowFeedback.workflowDuration,
          steps_completed: workflowFeedback.totalAgents,
          encountered_issues: false
        }

        const response = await submitWorkflowCompletionFeedback(request)
        if (!response) {
          throw new Error('Failed to submit workflow completion feedback')
        }
        apiResult = response
      } else {
        throw new Error('Invalid feedback type')
      }

      // Convert API response to expected format
      const result: FeedbackSubmissionResponse = {
        success: apiResult.success,
        feedbackId: apiResult.feedback_id || 'unknown',
        message: apiResult.message,
        error: apiResult.error
      }

      // Track successful submissions
      setSubmittedFeedbackIds(prev => [...prev, result.feedbackId])
      setLastSubmissionResult(result)

      // Refresh recent feedback list
      try {
        const updatedFeedbackList = await getFeedbackList()
        setRecentFeedback(updatedFeedbackList.slice(0, 5))
      } catch (err) {
        console.error('Failed to refresh feedback list:', err)
      }

      return result
    } catch (err) {
      console.error('Feedback submission failed:', err)
      throw err
    }
  }

  const openImmediateFeedback = (decision: typeof sampleAgentDecisions[0]) => {
    feedbackDialog.openImmediateFeedback({
      agentName: decision.agentName,
      decision: decision.decision,
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      agentType: decision.agentType
    })
  }

  const openWorkflowFeedback = () => {
    feedbackDialog.openWorkflowFeedback({
      workflowId: sampleWorkflow.workflowId,
      agentNames: sampleWorkflow.agentNames,
      workflowDuration: sampleWorkflow.workflowDuration,
      humanReviewRequired: sampleWorkflow.humanReviewRequired
    })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800 border-green-200"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  const formatFeedbackSummary = (feedback: FeedbackResponse) => {
    // Find accuracy and helpfulness ratings from the ratings array
    const accuracyRating = feedback.ratings.find(r => r.category === 'accuracy')?.rating
    const helpfulnessRating = feedback.ratings.find(r => r.category === 'helpfulness')?.rating
    const efficiencyRating = feedback.ratings.find(r => r.category === 'efficiency')?.rating
    const overallSatisfactionRating = feedback.ratings.find(r => r.category === 'overall_satisfaction')?.rating

    switch (feedback.feedback_type) {
      case 'immediate_agent':
        return `${feedback.agent_name || 'Agent'}: ${accuracyRating || 'N/A'}/5 accuracy, ${helpfulnessRating || 'N/A'}/5 helpfulness`
      case 'workflow_completion':
        return `Workflow: ${overallSatisfactionRating || 'N/A'}/5 satisfaction, ${efficiencyRating || 'N/A'}/5 efficiency`
      default:
        return `${feedback.feedback_type} feedback submitted`
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              {/* Demo Explainer Card */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <IconInfoCircle className="h-5 w-5 text-green-600" />
                    <span>Live Feedback System</span>
                  </CardTitle>
                  <CardDescription>
                    This demo connects to the real backend API and stores your feedback in the database
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center space-x-1">
                        <IconUsers className="h-4 w-4" />
                        <span>Immediate Feedback</span>
                      </h4>
                      <ul className="text-muted-foreground space-y-1">
                        <li>• Rate individual agent decisions</li>
                        <li>• Provide accuracy and helpfulness scores</li>
                        <li>• Add comments and suggestions</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center space-x-1">
                        <IconCircleCheck className="h-4 w-4" />
                        <span>Workflow Feedback</span>
                      </h4>
                      <ul className="text-muted-foreground space-y-1">
                        <li>• Overall satisfaction rating</li>
                        <li>• Process efficiency evaluation</li>
                        <li>• Comprehensive workflow review</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        <strong>Live Backend Integration:</strong> All feedback is saved to the database and can be retrieved via API.
                      </p>
                      <div className="flex items-center space-x-1">
                        <IconCircleCheck className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 text-xs font-medium">{submittedFeedbackIds.length} Feedback Submitted</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Error Alert */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <IconInfoCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Error: {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {lastSubmissionResult && (
                <Alert className="border-green-200 bg-green-50">
                  <IconCircleCheck className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {lastSubmissionResult.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Immediate Agent Feedback Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <IconUsers className="h-5 w-5" />
                    <span>Immediate Agent Feedback</span>
                  </CardTitle>
                  <CardDescription>
                    Provide feedback on individual agent decisions during the workflow
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {sampleAgentDecisions.map((decision, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{decision.agentName}</Badge>
                            <Badge variant="secondary">{decision.agentType}</Badge>
                          </div>
                          <Badge className={getConfidenceColor(decision.confidence)}>
                            {Math.round(decision.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium mb-1">Decision:</div>
                          <div className="text-sm">{decision.decision}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium mb-1">Reasoning:</div>
                          <div className="text-sm text-muted-foreground">{decision.reasoning}</div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            size="sm" 
                            onClick={() => openImmediateFeedback(decision)}
                            disabled={isLoading}
                            className="flex items-center space-x-1"
                          >
                            {isLoading ? (
                              <IconLoader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <IconMessageCircle className="h-4 w-4" />
                            )}
                            <span>Provide Feedback</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Completion Feedback Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <IconCircleCheck className="h-5 w-5" />
                    <span>Workflow Completion Feedback</span>
                  </CardTitle>
                  <CardDescription>
                    Provide comprehensive feedback after the entire workflow is completed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <h4 className="font-medium">Sample Workflow Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <IconClock className="h-4 w-4 text-muted-foreground" />
                        <span>Duration: 3m 0s</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <IconUsers className="h-4 w-4 text-muted-foreground" />
                        <span>Agents: {sampleWorkflow.agentNames.length}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <IconCircleCheck className="h-4 w-4 text-green-600" />
                        <span>Automated Processing</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <IconStar className="h-4 w-4 text-yellow-600" />
                        <span>ID: {sampleWorkflow.workflowId}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Participating Agents:</div>
                      <div className="flex flex-wrap gap-2">
                        {sampleWorkflow.agentNames.map((agentName, index) => (
                          <Badge key={index} variant="outline">{agentName}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button 
                      onClick={openWorkflowFeedback}
                      disabled={isLoading}
                      className="flex items-center space-x-2"
                    >
                      {isLoading ? (
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <IconMessageCircle className="h-4 w-4" />
                      )}
                      <span>Provide Workflow Feedback</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Feedback from Backend */}
              {recentFeedback.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <IconInfoCircle className="h-5 w-5" />
                      <span>Recent Feedback (Live Data)</span>
                    </CardTitle>
                    <CardDescription>
                      Latest feedback submissions from the backend database
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentFeedback.map((feedback) => (
                        <div key={feedback.feedback_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {formatFeedbackSummary(feedback)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(feedback.submitted_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {feedback.feedback_type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              ID: {feedback.feedback_id.slice(-6)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Feedback Dialog */}
              <FeedbackDialog
                isOpen={feedbackDialog.isOpen}
                onClose={feedbackDialog.close}
                feedbackType={feedbackDialog.feedbackType}
                onSubmit={handleFeedbackSubmission}
                {...feedbackDialog.feedbackData}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 