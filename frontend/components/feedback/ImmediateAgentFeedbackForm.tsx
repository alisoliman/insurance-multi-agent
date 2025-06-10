'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  IconThumbUp, 
  IconThumbDown, 
  IconMinus,
  IconMessageCircle,
  IconSend,
  IconX,
  IconCheck,
  IconAlertTriangle
} from '@tabler/icons-react'

import { StarRating } from './StarRating'
import { 
  ImmediateAgentFeedback, 
  RatingScale, 
  DecisionValidation, 
  ConfidenceAgreement, 
  FeedbackCategory 
} from '@/lib/feedback-types'

interface ImmediateAgentFeedbackFormProps {
  agentName: string
  decision: string
  confidence: number
  reasoning: string
  agentType: string
  onSubmit: (feedback: Omit<ImmediateAgentFeedback, 'id' | 'timestamp'>) => Promise<void>
  onSkip?: () => void
  onClose?: () => void
  isSubmitting?: boolean
  className?: string
}

export function ImmediateAgentFeedbackForm({
  agentName,
  decision,
  confidence,
  reasoning,
  agentType,
  onSubmit,
  onSkip,
  onClose,
  isSubmitting = false,
  className = ""
}: ImmediateAgentFeedbackFormProps) {
  const [accuracyRating, setAccuracyRating] = useState<RatingScale>(3)
  const [helpfulnessRating, setHelpfulnessRating] = useState<RatingScale>(3)
  const [decisionValidation, setDecisionValidation] = useState<DecisionValidation>('correct')
  const [confidenceAgreement, setConfidenceAgreement] = useState<ConfidenceAgreement>('agree')
  const [selectedCategories, setSelectedCategories] = useState<FeedbackCategory[]>([])
  const [comments, setComments] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categoryOptions: { value: FeedbackCategory; label: string; icon: React.ReactNode }[] = [
    { value: 'accurate', label: 'Accurate', icon: <IconCheck className="h-4 w-4" /> },
    { value: 'helpful', label: 'Helpful', icon: <IconThumbUp className="h-4 w-4" /> },
    { value: 'too_conservative', label: 'Too Conservative', icon: <IconMinus className="h-4 w-4" /> },
    { value: 'too_aggressive', label: 'Too Aggressive', icon: <IconAlertTriangle className="h-4 w-4" /> },
    { value: 'too_slow', label: 'Too Slow', icon: <IconMinus className="h-4 w-4" /> },
    { value: 'inaccurate', label: 'Inaccurate', icon: <IconX className="h-4 w-4" /> },
    { value: 'unclear', label: 'Unclear', icon: <IconMessageCircle className="h-4 w-4" /> },
    { value: 'missing_info', label: 'Missing Info', icon: <IconAlertTriangle className="h-4 w-4" /> },
  ]

  const handleCategoryToggle = (category: FeedbackCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleSubmit = async () => {
    try {
      setError(null)
      
      const feedback: Omit<ImmediateAgentFeedback, 'id' | 'timestamp'> = {
        type: 'immediate_agent',
        accuracyRating,
        helpfulnessRating,
        decisionValidation,
        confidenceAgreement,
        categories: selectedCategories,
        comments: comments.trim() || undefined,
        decisionContext: {
          decision,
          confidence,
          reasoning,
          agentType
        },
        agentName
      }

      await onSubmit(feedback)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800 border-green-200"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision.toLowerCase()) {
      case 'approve':
      case 'approved':
        return <IconCheck className="h-4 w-4 text-green-600" />
      case 'deny':
      case 'denied':
        return <IconX className="h-4 w-4 text-red-600" />
      default:
        return <IconMessageCircle className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center space-x-2">
              {getDecisionIcon(decision)}
              <span>Agent Feedback</span>
            </CardTitle>
            <CardDescription>
              How would you rate the {agentName} decision?
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <IconX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Decision Context */}
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{agentName}</span>
              <Badge variant="outline">{agentType}</Badge>
            </div>
            <Badge className={getConfidenceColor(confidence)}>
              {Math.round(confidence * 100)}% confidence
            </Badge>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Decision:</div>
            <div className="text-sm">{decision}</div>
          </div>
          
          {reasoning && (
            <div>
              <div className="text-sm font-medium mb-1">Reasoning:</div>
              <div className="text-sm text-muted-foreground max-h-20 overflow-y-auto">
                {reasoning}
              </div>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <IconAlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Core Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StarRating
            label="Decision Accuracy"
            value={accuracyRating}
            onChange={(rating) => setAccuracyRating(rating as RatingScale)}
            showValue
            required
          />
          
          <StarRating
            label="Helpfulness"
            value={helpfulnessRating}
            onChange={(rating) => setHelpfulnessRating(rating as RatingScale)}
            showValue
            required
          />
        </div>

        <Separator />

        {/* Decision Validation */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Was this decision correct?</label>
          <div className="flex space-x-2">
            {[
              { value: 'correct', label: 'Correct', icon: <IconThumbUp className="h-4 w-4" />, color: 'bg-green-100 text-green-800 border-green-200' },
              { value: 'partially_correct', label: 'Partially', icon: <IconMinus className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
              { value: 'incorrect', label: 'Incorrect', icon: <IconThumbDown className="h-4 w-4" />, color: 'bg-red-100 text-red-800 border-red-200' }
            ].map((option) => (
              <Button
                key={option.value}
                variant={decisionValidation === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setDecisionValidation(option.value as DecisionValidation)}
                className={decisionValidation === option.value ? option.color : ""}
              >
                {option.icon}
                <span className="ml-1">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Confidence Agreement */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            Do you agree with the confidence level ({Math.round(confidence * 100)}%)?
          </label>
          <div className="flex space-x-2">
            {[
              { value: 'agree', label: 'Agree', icon: <IconCheck className="h-4 w-4" /> },
              { value: 'disagree', label: 'Disagree', icon: <IconX className="h-4 w-4" /> },
              { value: 'unsure', label: 'Unsure', icon: <IconMinus className="h-4 w-4" /> }
            ].map((option) => (
              <Button
                key={option.value}
                variant={confidenceAgreement === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setConfidenceAgreement(option.value as ConfidenceAgreement)}
              >
                {option.icon}
                <span className="ml-1">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Quick Categories */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Quick feedback (select all that apply):</label>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedCategories.includes(option.value) ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryToggle(option.value)}
              >
                {option.icon}
                <span className="ml-1">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Additional Comments</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              <IconMessageCircle className="h-4 w-4 mr-1" />
              {showComments ? 'Hide' : 'Add'} Comments
            </Button>
          </div>
          
          {showComments && (
            <Textarea
              placeholder="Share any additional thoughts or suggestions..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              maxLength={500}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <div className="flex space-x-2">
            {onSkip && (
              <Button variant="ghost" onClick={onSkip} disabled={isSubmitting}>
                Skip Feedback
              </Button>
            )}
          </div>
          
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="min-w-24"
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
        </div>
      </CardContent>
    </Card>
  )
} 