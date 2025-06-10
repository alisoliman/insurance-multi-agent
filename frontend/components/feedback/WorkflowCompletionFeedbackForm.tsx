'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  IconCheckCircle,
  IconClock,
  IconUsers,
  IconMessageCircle,
  IconSend,
  IconX,
  IconAlertTriangle,
  IconThumbUp,
  IconThumbDown
} from '@tabler/icons-react'

import { StarRating } from './StarRating'
import { 
  WorkflowCompletionFeedback, 
  RatingScale, 
  NPSScore 
} from '@/lib/feedback-types'

interface AgentRatingData {
  agentName: string
  performanceRating: RatingScale
  helpfulnessRating: RatingScale
}

interface WorkflowCompletionFeedbackFormProps {
  workflowId: string
  agentNames: string[]
  workflowDuration: number // in seconds
  humanReviewRequired: boolean
  onSubmit: (feedback: Omit<WorkflowCompletionFeedback, 'id' | 'timestamp'>) => Promise<void>
  onClose?: () => void
  isSubmitting?: boolean
  className?: string
}

export function WorkflowCompletionFeedbackForm({
  workflowId,
  agentNames,
  workflowDuration,
  humanReviewRequired,
  onSubmit,
  onClose,
  isSubmitting = false,
  className = ""
}: WorkflowCompletionFeedbackFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  // Step 1: Overall ratings
  const [overallSatisfaction, setOverallSatisfaction] = useState<RatingScale>(3)
  const [efficiencyRating, setEfficiencyRating] = useState<RatingScale>(3)

  // Step 2: Agent ratings
  const [agentRatings, setAgentRatings] = useState<AgentRatingData[]>(
    agentNames.map(name => ({
      agentName: name,
      performanceRating: 3 as RatingScale,
      helpfulnessRating: 3 as RatingScale
    }))
  )

  // Step 3: Process feedback
  const [mostHelpfulAspect, setMostHelpfulAspect] = useState('')
  const [leastHelpfulAspect, setLeastHelpfulAspect] = useState('')
  const [improvementSuggestions, setImprovementSuggestions] = useState('')

  // Step 4: Recommendation
  const [recommendationScore, setRecommendationScore] = useState<NPSScore>(7)

  const [error, setError] = useState<string | null>(null)

  const updateAgentRating = (agentName: string, field: 'performanceRating' | 'helpfulnessRating', rating: RatingScale) => {
    setAgentRatings(prev => 
      prev.map(agent => 
        agent.agentName === agentName 
          ? { ...agent, [field]: rating }
          : agent
      )
    )
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const getNPSCategory = (score: NPSScore) => {
    if (score >= 9) return { label: 'Promoter', color: 'text-green-600' }
    if (score >= 7) return { label: 'Passive', color: 'text-yellow-600' }
    return { label: 'Detractor', color: 'text-red-600' }
  }

  const handleSubmit = async () => {
    try {
      setError(null)
      
      const feedback: Omit<WorkflowCompletionFeedback, 'id' | 'timestamp'> = {
        type: 'workflow_completion',
        workflowId,
        overallSatisfaction,
        efficiencyRating,
        agentRatings,
        mostHelpfulAspect: mostHelpfulAspect.trim() || undefined,
        leastHelpfulAspect: leastHelpfulAspect.trim() || undefined,
        improvementSuggestions: improvementSuggestions.trim() || undefined,
        recommendationScore,
        workflowDuration,
        totalAgents: agentNames.length,
        humanReviewRequired
      }

      await onSubmit(feedback)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return overallSatisfaction > 0 && efficiencyRating > 0
      case 2:
        return agentRatings.every(agent => agent.performanceRating > 0 && agent.helpfulnessRating > 0)
      case 3:
        return true // Optional fields
      case 4:
        return recommendationScore >= 0
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Overall Experience</h3>
              <p className="text-sm text-muted-foreground">
                How would you rate your overall experience with this workflow?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StarRating
                label="Overall Satisfaction"
                value={overallSatisfaction}
                onChange={(rating) => setOverallSatisfaction(rating as RatingScale)}
                showValue
                required
              />
              
              <StarRating
                label="Process Efficiency"
                value={efficiencyRating}
                onChange={(rating) => setEfficiencyRating(rating as RatingScale)}
                showValue
                required
              />
            </div>

            {/* Workflow Summary */}
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h4 className="font-medium">Workflow Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <IconClock className="h-4 w-4 text-muted-foreground" />
                  <span>Duration: {formatDuration(workflowDuration)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <IconUsers className="h-4 w-4 text-muted-foreground" />
                  <span>Agents: {agentNames.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {humanReviewRequired ? (
                    <>
                      <IconAlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span>Human Review Required</span>
                    </>
                  ) : (
                    <>
                      <IconCheckCircle className="h-4 w-4 text-green-600" />
                      <span>Automated Processing</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Agent Performance</h3>
              <p className="text-sm text-muted-foreground">
                Rate each agent's performance and helpfulness
              </p>
            </div>

            <div className="space-y-6">
              {agentRatings.map((agent, index) => (
                <div key={agent.agentName} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{agent.agentName}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StarRating
                      label="Performance"
                      value={agent.performanceRating}
                      onChange={(rating) => updateAgentRating(agent.agentName, 'performanceRating', rating as RatingScale)}
                      showValue
                      size="sm"
                    />
                    
                    <StarRating
                      label="Helpfulness"
                      value={agent.helpfulnessRating}
                      onChange={(rating) => updateAgentRating(agent.agentName, 'helpfulnessRating', rating as RatingScale)}
                      showValue
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Process Feedback</h3>
              <p className="text-sm text-muted-foreground">
                Help us understand what worked well and what could be improved
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  What was the most helpful aspect of this workflow?
                </label>
                <Textarea
                  placeholder="e.g., Quick decision making, clear explanations, accurate assessments..."
                  value={mostHelpfulAspect}
                  onChange={(e) => setMostHelpfulAspect(e.target.value)}
                  rows={3}
                  maxLength={300}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  What was the least helpful or most frustrating aspect?
                </label>
                <Textarea
                  placeholder="e.g., Too slow, unclear reasoning, missing information..."
                  value={leastHelpfulAspect}
                  onChange={(e) => setLeastHelpfulAspect(e.target.value)}
                  rows={3}
                  maxLength={300}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Any suggestions for improvement?
                </label>
                <Textarea
                  placeholder="Share your ideas for making this process better..."
                  value={improvementSuggestions}
                  onChange={(e) => setImprovementSuggestions(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Recommendation</h3>
              <p className="text-sm text-muted-foreground">
                How likely are you to recommend this process to others?
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="flex justify-center items-center space-x-2 mb-4">
                  <span className="text-sm text-muted-foreground">Not likely</span>
                  <div className="flex space-x-1">
                    {Array.from({ length: 11 }, (_, index) => (
                      <Button
                        key={index}
                        variant={recommendationScore === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRecommendationScore(index as NPSScore)}
                        className="w-8 h-8 p-0"
                      >
                        {index}
                      </Button>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">Very likely</span>
                </div>
                
                <div className="text-center">
                  <Badge className={getNPSCategory(recommendationScore).color}>
                    {getNPSCategory(recommendationScore).label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className={`w-full max-w-3xl ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center space-x-2">
              <IconCheckCircle className="h-5 w-5 text-green-600" />
              <span>Workflow Feedback</span>
            </CardTitle>
            <CardDescription>
              Help us improve by sharing your experience with this workflow
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <IconX className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <IconAlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {renderStepContent()}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            {currentStep < totalSteps ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceedToNext()}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !canProceedToNext()}
                className="min-w-32"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <IconSend className="h-4 w-4" />
                    <span>Submit Feedback</span>
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 