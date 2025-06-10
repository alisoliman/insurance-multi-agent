'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { IconCheck, IconAlertTriangle } from '@tabler/icons-react'

import { ImmediateAgentFeedbackForm } from './ImmediateAgentFeedbackForm'
import { WorkflowCompletionFeedbackForm } from './WorkflowCompletionFeedbackForm'
import { 
  FeedbackData, 
  FeedbackSubmissionResponse,
  ImmediateAgentFeedback,
  WorkflowCompletionFeedback
} from '@/lib/feedback-types'

interface FeedbackDialogProps {
  isOpen: boolean
  onClose: () => void
  feedbackType: 'immediate_agent' | 'workflow_completion'
  
  // For immediate agent feedback
  agentName?: string
  decision?: string
  confidence?: number
  reasoning?: string
  agentType?: string
  
  // For workflow completion feedback
  workflowId?: string
  agentNames?: string[]
  workflowDuration?: number
  humanReviewRequired?: boolean
  
  // Submission handler
  onSubmit: (feedback: Omit<FeedbackData, 'id' | 'timestamp'>) => Promise<FeedbackSubmissionResponse>
  
  className?: string
}

export function FeedbackDialog({
  isOpen,
  onClose,
  feedbackType,
  agentName,
  decision,
  confidence,
  reasoning,
  agentType,
  workflowId,
  agentNames,
  workflowDuration,
  humanReviewRequired,
  onSubmit,
  className = ""
}: FeedbackDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<FeedbackSubmissionResponse | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (feedback: Omit<FeedbackData, 'id' | 'timestamp'>) => {
    setIsSubmitting(true)
    setSubmissionResult(null)
    
    try {
      const result = await onSubmit(feedback)
      setSubmissionResult(result)
      
      if (result.success) {
        setShowSuccess(true)
        // Auto-close after showing success message
        setTimeout(() => {
          handleClose()
        }, 2000)
      }
    } catch (error) {
      setSubmissionResult({
        success: false,
        feedbackId: '',
        error: error instanceof Error ? error.message : 'Failed to submit feedback'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsSubmitting(false)
    setSubmissionResult(null)
    setShowSuccess(false)
    onClose()
  }

  const getDialogTitle = () => {
    switch (feedbackType) {
      case 'immediate_agent':
        return `Feedback for ${agentName || 'Agent'}`
      case 'workflow_completion':
        return 'Workflow Feedback'
      default:
        return 'Feedback'
    }
  }

  const renderFeedbackForm = () => {
    if (showSuccess) {
      return (
        <div className="text-center py-8 space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <IconCheck className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">Thank you!</h3>
            <p className="text-sm text-green-700 mt-1">
              Your feedback has been submitted successfully.
            </p>
          </div>
        </div>
      )
    }

    switch (feedbackType) {
      case 'immediate_agent':
        if (!agentName || !decision || confidence === undefined || !reasoning || !agentType) {
          return (
            <Alert variant="destructive">
              <IconAlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Missing required information for agent feedback. Please ensure all agent details are provided.
              </AlertDescription>
            </Alert>
          )
        }
        
        return (
          <ImmediateAgentFeedbackForm
            agentName={agentName}
            decision={decision}
            confidence={confidence}
            reasoning={reasoning}
            agentType={agentType}
            onSubmit={handleSubmit as (feedback: Omit<ImmediateAgentFeedback, 'id' | 'timestamp'>) => Promise<void>}
            isSubmitting={isSubmitting}
            className="border-0 shadow-none"
          />
        )

      case 'workflow_completion':
        if (!workflowId || !agentNames || workflowDuration === undefined || humanReviewRequired === undefined) {
          return (
            <Alert variant="destructive">
              <IconAlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Missing required information for workflow feedback. Please ensure all workflow details are provided.
              </AlertDescription>
            </Alert>
          )
        }
        
        return (
          <WorkflowCompletionFeedbackForm
            workflowId={workflowId}
            agentNames={agentNames}
            workflowDuration={workflowDuration}
            humanReviewRequired={humanReviewRequired}
            onSubmit={handleSubmit as (feedback: Omit<WorkflowCompletionFeedback, 'id' | 'timestamp'>) => Promise<void>}
            isSubmitting={isSubmitting}
            className="border-0 shadow-none"
          />
        )

      default:
        return (
          <Alert variant="destructive">
            <IconAlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unknown feedback type: {feedbackType}
            </AlertDescription>
          </Alert>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {submissionResult && !submissionResult.success && (
            <Alert variant="destructive">
              <IconAlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {submissionResult.error || 'Failed to submit feedback. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
          
          {renderFeedbackForm()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook for managing feedback dialog state
export function useFeedbackDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'immediate_agent' | 'workflow_completion'>('immediate_agent')
  const [feedbackData, setFeedbackData] = useState<Partial<FeedbackDialogProps>>({})

  const openImmediateFeedback = (data: {
    agentName: string
    decision: string
    confidence: number
    reasoning: string
    agentType: string
  }) => {
    setFeedbackType('immediate_agent')
    setFeedbackData(data)
    setIsOpen(true)
  }

  const openWorkflowFeedback = (data: {
    workflowId: string
    agentNames: string[]
    workflowDuration: number
    humanReviewRequired: boolean
  }) => {
    setFeedbackType('workflow_completion')
    setFeedbackData(data)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setFeedbackData({})
  }

  return {
    isOpen,
    feedbackType,
    feedbackData,
    openImmediateFeedback,
    openWorkflowFeedback,
    close
  }
} 