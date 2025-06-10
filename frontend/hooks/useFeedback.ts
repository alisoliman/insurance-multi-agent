'use client'

import { useState, useCallback } from 'react'
import { apiClient, ImmediateAgentFeedbackRequest, WorkflowCompletionFeedbackRequest, FeedbackSubmissionResponse, FeedbackResponse } from '@/lib/api'

interface UseFeedbackReturn {
  submitImmediateAgentFeedback: (request: ImmediateAgentFeedbackRequest) => Promise<FeedbackSubmissionResponse | null>
  submitWorkflowCompletionFeedback: (request: WorkflowCompletionFeedbackRequest) => Promise<FeedbackSubmissionResponse | null>
  getFeedbackList: () => Promise<FeedbackResponse[]>
  isSubmitting: boolean
  isLoading: boolean
  error: string | null
  lastSubmissionId: string | null
  clearError: () => void
}

export function useFeedback(): UseFeedbackReturn {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const submitImmediateAgentFeedback = useCallback(async (
    request: ImmediateAgentFeedbackRequest
  ): Promise<FeedbackSubmissionResponse | null> => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await apiClient.submitImmediateAgentFeedback(request)
      
      if (response.success && response.data) {
        setLastSubmissionId(response.data.feedback_id || null)
        return response.data
      } else {
        const errorMessage = response.error || 'Failed to submit feedback'
        setError(errorMessage)
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const submitWorkflowCompletionFeedback = useCallback(async (
    request: WorkflowCompletionFeedbackRequest
  ): Promise<FeedbackSubmissionResponse | null> => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await apiClient.submitWorkflowCompletionFeedback(request)
      
      if (response.success && response.data) {
        setLastSubmissionId(response.data.feedback_id || null)
        return response.data
      } else {
        const errorMessage = response.error || 'Failed to submit feedback'
        setError(errorMessage)
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const getFeedbackList = useCallback(async (): Promise<FeedbackResponse[]> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.getFeedbackList()
      
      if (response.success && response.data) {
        return response.data.feedback || []
      } else {
        const errorMessage = response.error || 'Failed to fetch feedback list'
        setError(errorMessage)
        return []
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    submitImmediateAgentFeedback,
    submitWorkflowCompletionFeedback,
    getFeedbackList,
    isSubmitting,
    isLoading,
    error,
    lastSubmissionId,
    clearError,
  }
} 