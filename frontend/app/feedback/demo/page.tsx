'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  IconMessageCircle,
  IconUsers,
  IconCheckCircle,
  IconClock,
  IconStar,
  IconInfoCircle
} from '@tabler/icons-react'

import { FeedbackDialog, useFeedbackDialog } from '@/components/feedback/FeedbackDialog'
import { 
  FeedbackData, 
  FeedbackSubmissionResponse 
} from '@/lib/feedback-types'

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
  const [submittedFeedback, setSubmittedFeedback] = useState<FeedbackData[]>([])
  const [lastSubmissionResult, setLastSubmissionResult] = useState<FeedbackSubmissionResponse | null>(null)
  
  const feedbackDialog = useFeedbackDialog()

  // Mock feedback submission handler
  const handleFeedbackSubmission = async (feedback: Omit<FeedbackData, 'id' | 'timestamp'>): Promise<FeedbackSubmissionResponse> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Simulate occasional failures for demo purposes
    if (Math.random() < 0.1) {
      throw new Error("Network error - please try again")
    }

    const submittedFeedback: FeedbackData = {
      ...feedback,
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }

    setSubmittedFeedback(prev => [...prev, submittedFeedback])
    
    const result: FeedbackSubmissionResponse = {
      success: true,
      feedbackId: submittedFeedback.id,
      message: "Thank you for your feedback! It helps us improve our agents."
    }
    
    setLastSubmissionResult(result)
    return result
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

  const formatFeedbackSummary = (feedback: FeedbackData) => {
    switch (feedback.type) {
      case 'immediate_agent':
        return `${feedback.agentName}: ${feedback.accuracyRating}/5 accuracy, ${feedback.helpfulnessRating}/5 helpfulness`
      case 'workflow_completion':
        return `Workflow: ${feedback.overallSatisfaction}/5 satisfaction, ${feedback.efficiencyRating}/5 efficiency`
      default:
        return `${feedback.type} feedback submitted`
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <IconMessageCircle className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Feedback Collection System Demo</h1>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          This demo showcases the feedback collection system integrated with the multi-agent workflow. 
          Users can provide immediate feedback on individual agent decisions and comprehensive feedback 
          after workflow completion.
        </p>
      </div>

      {lastSubmissionResult && (
        <Alert className="border-green-200 bg-green-50">
          <IconCheckCircle className="h-4 w-4 text-green-600" />
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
                    className="flex items-center space-x-1"
                  >
                    <IconMessageCircle className="h-4 w-4" />
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
            <IconCheckCircle className="h-5 w-5" />
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
                <IconCheckCircle className="h-4 w-4 text-green-600" />
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
              className="flex items-center space-x-2"
            >
              <IconMessageCircle className="h-4 w-4" />
              <span>Provide Workflow Feedback</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Submitted Feedback Summary */}
      {submittedFeedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IconInfoCircle className="h-5 w-5" />
              <span>Submitted Feedback</span>
            </CardTitle>
            <CardDescription>
              Recent feedback submissions from this demo session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submittedFeedback.slice(-5).reverse().map((feedback, index) => (
                <div key={feedback.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {formatFeedbackSummary(feedback)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(feedback.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {feedback.type.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
              
              {submittedFeedback.length > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  ... and {submittedFeedback.length - 5} more feedback submissions
                </div>
              )}
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
  )
} 