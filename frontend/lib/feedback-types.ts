// Feedback Collection System Types
// Defines interfaces for collecting user feedback on agent decisions and workflows

export interface FeedbackBase {
  id: string
  timestamp: string
  userId?: string
  sessionId?: string
  workflowId?: string
  agentName?: string
  decisionId?: string
}

// Rating scale from 1-5
export type RatingScale = 1 | 2 | 3 | 4 | 5

// Feedback categories for quick selection
export type FeedbackCategory = 
  | 'accurate' 
  | 'helpful' 
  | 'too_conservative' 
  | 'too_aggressive' 
  | 'too_slow' 
  | 'inaccurate' 
  | 'unclear' 
  | 'missing_info'

// Decision validation options
export type DecisionValidation = 'correct' | 'incorrect' | 'partially_correct'

// Confidence agreement options
export type ConfidenceAgreement = 'agree' | 'disagree' | 'unsure'

// NPS-style recommendation scale (0-10)
export type NPSScore = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

// Immediate feedback given after each agent decision
export interface ImmediateAgentFeedback extends FeedbackBase {
  type: 'immediate_agent'
  
  // Core ratings
  accuracyRating: RatingScale
  helpfulnessRating: RatingScale
  
  // Decision validation
  decisionValidation: DecisionValidation
  confidenceAgreement: ConfidenceAgreement
  
  // Quick categorical feedback
  categories: FeedbackCategory[]
  
  // Optional detailed feedback
  comments?: string
  
  // Context about the decision being rated
  decisionContext: {
    decision: string
    confidence: number
    reasoning: string
    agentType: string
  }
}

// Feedback for human review/escalation scenarios
export interface HumanReviewFeedback extends FeedbackBase {
  type: 'human_review'
  
  // Escalation appropriateness
  escalationNecessary: boolean
  informationSufficient: boolean
  
  // Decision override tracking
  overrideOccurred: boolean
  overrideReason?: string // Required if override occurred
  
  // Process feedback
  processRating: RatingScale
  suggestions?: string
  
  // Context
  escalationReason: string
  originalDecision: string
  finalDecision: string
}

// Comprehensive feedback after workflow completion
export interface WorkflowCompletionFeedback extends FeedbackBase {
  type: 'workflow_completion'
  
  // Overall satisfaction
  overallSatisfaction: RatingScale
  efficiencyRating: RatingScale
  
  // Individual agent ratings
  agentRatings: {
    agentName: string
    performanceRating: RatingScale
    helpfulnessRating: RatingScale
  }[]
  
  // Process feedback
  mostHelpfulAspect?: string
  leastHelpfulAspect?: string
  improvementSuggestions?: string
  
  // NPS-style recommendation
  recommendationScore: NPSScore
  
  // Workflow context
  workflowDuration: number // in seconds
  totalAgents: number
  humanReviewRequired: boolean
}

// Feedback specifically for explainability features
export interface ExplainabilityFeedback extends FeedbackBase {
  type: 'explainability'
  
  // Feature-specific ratings
  explanationClarity: RatingScale
  decisionTreeUsefulness: RatingScale
  sourceAttributionHelpfulness: RatingScale
  agentTimelineClarity: RatingScale
  interventionControlsEffectiveness: RatingScale
  
  // Feature usage
  featuresUsed: string[] // Which explainability features were actually used
  mostUsefulFeature?: string
  leastUsefulFeature?: string
  
  // Improvement suggestions
  missingFeatures?: string
  improvementSuggestions?: string
  
  // Context
  explainabilityContext: {
    decisionComplexity: 'low' | 'medium' | 'high'
    userExperience: 'novice' | 'intermediate' | 'expert'
    primaryUseCase: string
  }
}

// Union type for all feedback types
export type FeedbackData = 
  | ImmediateAgentFeedback 
  | HumanReviewFeedback 
  | WorkflowCompletionFeedback 
  | ExplainabilityFeedback

// Feedback submission response
export interface FeedbackSubmissionResponse {
  success: boolean
  feedbackId: string
  message?: string
  error?: string
}

// Feedback analytics/aggregation interfaces
export interface FeedbackSummary {
  totalFeedback: number
  averageRatings: {
    accuracy: number
    helpfulness: number
    satisfaction: number
    efficiency: number
  }
  commonCategories: {
    category: FeedbackCategory
    count: number
    percentage: number
  }[]
  npsScore: number
  improvementAreas: string[]
}

// Feedback collection configuration
export interface FeedbackConfig {
  enableImmediateFeedback: boolean
  enableHumanReviewFeedback: boolean
  enableWorkflowCompletionFeedback: boolean
  enableExplainabilityFeedback: boolean
  
  // Trigger conditions
  lowConfidenceThreshold: number // Trigger feedback when confidence below this
  mandatoryFeedbackStages: string[] // Workflow stages requiring feedback
  
  // UI preferences
  showSkipOption: boolean
  requireComments: boolean
  maxCommentLength: number
}

// Feedback form state management
export interface FeedbackFormState {
  isOpen: boolean
  feedbackType: FeedbackData['type']
  isSubmitting: boolean
  hasSubmitted: boolean
  errors: Record<string, string>
  currentStep?: number
  totalSteps?: number
} 