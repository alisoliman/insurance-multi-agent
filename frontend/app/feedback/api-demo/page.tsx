'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  IconMessageCircle,
  IconUsers,
  IconCheckCircle,
  IconClock,
  IconStar,
  IconInfoCircle,
  IconDatabase,
  IconApi
} from '@tabler/icons-react'

import { ImmediateAgentFeedbackFormWithAPI } from '@/components/feedback/ImmediateAgentFeedbackFormWithAPI'

// Sample agent decisions for demo
const sampleAgentDecisions = [
  {
    agentName: "Assessment Agent",
    decision: "Approved",
    confidence: 0.85,
    reasoning: "Claim meets all policy requirements. Vehicle damage is consistent with reported incident. No red flags detected in documentation.",
    agentType: "Assessment",
    sessionId: "session-demo-001",
    claimId: "claim-demo-001",
    interactionId: "interaction-001"
  },
  {
    agentName: "Communication Agent", 
    decision: "Draft Prepared",
    confidence: 0.92,
    reasoning: "Customer communication drafted with appropriate tone and all necessary information included. Ready for review and sending.",
    agentType: "Communication",
    sessionId: "session-demo-001",
    claimId: "claim-demo-001",
    interactionId: "interaction-002"
  },
  {
    agentName: "Orchestrator Agent",
    decision: "Workflow Complete",
    confidence: 0.78,
    reasoning: "All agents have completed their tasks successfully. No human intervention required. Claim processing can proceed to final approval.",
    agentType: "Orchestrator",
    sessionId: "session-demo-001",
    claimId: "claim-demo-001",
    interactionId: "interaction-003"
  }
]

export default function FeedbackAPIDemoPage() {
  const [selectedDecision, setSelectedDecision] = useState<typeof sampleAgentDecisions[0] | null>(null)
  const [submittedFeedbackIds, setSubmittedFeedbackIds] = useState<string[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

  const handleFeedbackSuccess = (feedbackId: string) => {
    setSubmittedFeedbackIds(prev => [...prev, feedbackId])
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 5000) // Hide success message after 5 seconds
  }

  const handleCloseFeedback = () => {
    setSelectedDecision(null)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800 border-green-200"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <IconApi className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Feedback API Integration Demo</h1>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          This demo showcases the complete feedback collection system with real backend API integration. 
          Feedback is submitted to the backend and stored in the system for analysis and improvement.
        </p>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <IconDatabase className="h-4 w-4 text-green-600" />
            <span className="text-green-600">Backend Connected</span>
          </div>
          <div className="flex items-center space-x-1">
            <IconCheckCircle className="h-4 w-4 text-blue-600" />
            <span className="text-blue-600">{submittedFeedbackIds.length} Feedback Submitted</span>
          </div>
        </div>
      </div>

      {showSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <IconCheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Feedback submitted successfully! It has been stored in the backend for analysis.
          </AlertDescription>
        </Alert>
      )}

      {/* Agent Decisions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <IconUsers className="h-5 w-5" />
            <span>Agent Decisions - Provide Feedback</span>
          </CardTitle>
          <CardDescription>
            Click on any agent decision below to provide feedback using the API-integrated form
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
                    {submittedFeedbackIds.some(id => id.includes(decision.interactionId)) && (
                      <Badge className="bg-green-100 text-green-800">
                        <IconCheckCircle className="h-3 w-3 mr-1" />
                        Feedback Submitted
                      </Badge>
                    )}
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
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Session: {decision.sessionId}</div>
                    <div>Claim: {decision.claimId}</div>
                    <div>Interaction: {decision.interactionId}</div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setSelectedDecision(decision)}
                    className="flex items-center space-x-1"
                    disabled={submittedFeedbackIds.some(id => id.includes(decision.interactionId))}
                  >
                    <IconMessageCircle className="h-4 w-4" />
                    <span>
                      {submittedFeedbackIds.some(id => id.includes(decision.interactionId)) 
                        ? 'Feedback Submitted' 
                        : 'Provide Feedback'
                      }
                    </span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Form Section */}
      {selectedDecision && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IconStar className="h-5 w-5" />
              <span>Submit Feedback - API Integration</span>
            </CardTitle>
            <CardDescription>
              This form submits feedback directly to the backend API and stores it in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImmediateAgentFeedbackFormWithAPI
              agentName={selectedDecision.agentName}
              decision={selectedDecision.decision}
              confidence={selectedDecision.confidence}
              reasoning={selectedDecision.reasoning}
              agentType={selectedDecision.agentType}
              sessionId={selectedDecision.sessionId}
              claimId={selectedDecision.claimId}
              interactionId={selectedDecision.interactionId}
              userId="demo-user-001"
              onSuccess={handleFeedbackSuccess}
              onClose={handleCloseFeedback}
              className="max-w-none"
            />
          </CardContent>
        </Card>
      )}

      {/* Submitted Feedback Summary */}
      {submittedFeedbackIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IconDatabase className="h-5 w-5" />
              <span>Submitted Feedback Summary</span>
            </CardTitle>
            <CardDescription>
              Feedback IDs that have been successfully submitted to the backend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {submittedFeedbackIds.map((feedbackId, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded border border-green-200">
                  <IconCheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-mono text-green-800">{feedbackId}</span>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    Stored in Backend
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <IconInfoCircle className="h-5 w-5" />
            <span>API Integration Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Frontend Integration</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• React hook for feedback submission</li>
                <li>• TypeScript interfaces for type safety</li>
                <li>• Error handling and loading states</li>
                <li>• Success feedback and validation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Backend Integration</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• FastAPI endpoints for feedback submission</li>
                <li>• Data validation and sanitization</li>
                <li>• In-memory storage (demo mode)</li>
                <li>• Comprehensive error handling</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">API Endpoints Used</h4>
            <div className="text-sm font-mono space-y-1">
              <div>POST /api/feedback/immediate-agent</div>
              <div>POST /api/feedback/workflow-completion</div>
              <div>GET /api/feedback/list</div>
              <div>GET /api/feedback/summary</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 