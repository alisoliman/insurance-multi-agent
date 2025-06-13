'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  IconFileText,
  IconRefresh,
  IconCircleCheck,
  IconAlertCircle,
  IconClock,
  IconUser,
  IconRobot,
  IconTool,
  IconBook
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import { AgentWorkflowVisualization } from '@/components/agent-workflow-visualization'

// Sample claims from API
interface SampleClaim {
  claim_id: string
  claimant_name: string
  claim_type: string
  estimated_damage: number
  description: string
}

interface AssessmentResult {
  success: boolean
  agent_name: string
  claim_body: any
  conversation_chronological: Array<{
    role: string
    content: string
  }>
}

export default function ClaimAssessorDemo() {
  const [sampleClaims, setSampleClaims] = useState<SampleClaim[]>([])
  const [selectedClaim, setSelectedClaim] = useState<SampleClaim | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSamples, setIsLoadingSamples] = useState(true)
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch sample claims on component mount
  useEffect(() => {
    const fetchSampleClaims = async () => {
      try {
        const apiUrl = await getApiUrl()
        const response = await fetch(`${apiUrl}/api/v1/workflow/sample-claims`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        setSampleClaims(data.available_claims)
      } catch (err) {
        console.error('Failed to fetch sample claims:', err)
        toast.error('Failed to load sample claims')
      } finally {
        setIsLoadingSamples(false)
      }
    }

    fetchSampleClaims()
  }, [])

  const runAssessment = async (claim: SampleClaim) => {
    setIsLoading(true)
    setError(null)
    setSelectedClaim(claim)
    
    try {
      const apiUrl = await getApiUrl()
      const response = await fetch(`${apiUrl}/api/v1/agent/claim_assessor/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ claim_id: claim.claim_id }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: AssessmentResult = await response.json()
      setResult(data)
      toast.success('Assessment completed successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast.error('Assessment failed: ' + errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const resetDemo = () => {
    setSelectedClaim(null)
    setResult(null)
    setError(null)
  }

  const formatConversationStep = (step: { role: string; content: string }, index: number) => {
    const isUser = step.role === 'human'
    const isAssistant = step.role === 'ai'
    const isTool = step.role === 'tool'

    // Skip tool calls in the display
    if (step.content.startsWith('TOOL_CALL:')) {
      return null
    }

    return (
      <div key={index} className="flex gap-3 mb-4">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-100 dark:bg-blue-900/30' :
          isAssistant ? 'bg-green-100 dark:bg-green-900/30' :
          'bg-orange-100 dark:bg-orange-900/30'
        }`}>
          {isUser ? (
            <IconUser className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          ) : isAssistant ? (
            <IconRobot className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <IconTool className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          )}
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={isUser ? 'secondary' : isAssistant ? 'default' : 'outline'}>
              {isUser ? 'User' : isAssistant ? 'Claim Assessor' : 'Tool Response'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Step {index + 1}
            </span>
          </div>
          
          <div className={`rounded-lg p-3 ${
            isUser ? 'bg-blue-50 dark:bg-blue-950/30' :
            isAssistant ? 'bg-green-50 dark:bg-green-950/30' :
            'bg-orange-50 dark:bg-orange-950/30'
          }`}>
            <div className="text-sm whitespace-pre-wrap">
              {step.content}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const extractFinalAssessment = (conversation: Array<{ role: string; content: string }>) => {
    // Find the last assistant message which should contain the final assessment
    const lastAssistantMessage = conversation
      .filter(step => step.role === 'ai' && !step.content.startsWith('TOOL_CALL:'))
      .pop()

    if (!lastAssistantMessage) return null

    const content = lastAssistantMessage.content
    
    // Extract assessment decision
    const assessmentMatch = content.match(/Assessment:\s*(\w+)/i) || 
                           content.match(/Final Assessment:\s*(\w+)/i) ||
                           content.match(/\b(APPROVED|DENIED|INVALID|QUESTIONABLE|VALID)\b/i)
    
    const assessment = assessmentMatch ? assessmentMatch[1].toUpperCase() : 'PENDING'
    
    return {
      decision: assessment,
      reasoning: content
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <IconFileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Claim Assessor Demo</h1>
            <p className="text-muted-foreground">
              Test the claim assessment agent that analyzes claim details and determines initial assessment
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Sample Claims Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFileText className="h-5 w-5" />
              Sample Claims
            </CardTitle>
            <CardDescription>
              Select a sample claim to run through the claim assessor agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {isLoadingSamples ? (
              <div className="flex items-center justify-center py-8">
                <IconClock className="h-6 w-6 animate-spin mr-2" />
                <span>Loading sample claims...</span>
              </div>
            ) : (
              <div className="grid gap-3">
                {sampleClaims.map((claim) => (
                  <Button
                    key={claim.claim_id}
                    variant="outline"
                    onClick={() => runAssessment(claim)}
                    disabled={isLoading}
                    className="justify-start text-left h-auto p-4"
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{claim.claim_type}</span>
                        <Badge variant="secondary">{claim.claim_id}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {claim.claimant_name} • ${claim.estimated_damage.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {claim.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {result && (
              <div className="pt-4">
                <Button variant="outline" onClick={resetDemo} className="w-full">
                  <IconRefresh className="mr-2 h-4 w-4" />
                  Reset Demo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCircleCheck className="h-5 w-5" />
              Assessment Results
            </CardTitle>
            <CardDescription>
              Real-time conversation trace and final assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <IconClock className="h-6 w-6 animate-spin mr-2" />
                <span>Running claim assessment...</span>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Final Assessment Summary */}
                {(() => {
                  const assessment = extractFinalAssessment(result.conversation_chronological)
                  return assessment && (
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <IconCircleCheck className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Final Assessment</span>
                        <Badge variant={
                          assessment.decision === 'APPROVED' || assessment.decision === 'VALID' ? 'default' :
                          assessment.decision === 'DENIED' || assessment.decision === 'INVALID' ? 'destructive' :
                          'secondary'
                        }>
                          {assessment.decision}
                        </Badge>
                      </div>
                    </div>
                  )
                })()}

                <Separator />

                {/* Conversation Timeline */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <IconBook className="h-4 w-4" />
                    Conversation Timeline
                  </h4>
                  <ScrollArea className="h-96">
                    <div className="space-y-1">
                      {result.conversation_chronological
                        .map((step, index) => formatConversationStep(step, index))
                        .filter(Boolean)}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}

            {!result && !isLoading && !error && (
              <div className="text-center py-8 text-muted-foreground">
                <IconFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a sample claim to see the assessment process</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Description */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBook className="h-5 w-5" />
            About the Claim Assessor Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Primary Functions</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Analyzes claim details for consistency</li>
                <li>• Validates estimated damage costs</li>
                <li>• Reviews supporting documentation</li>
                <li>• Identifies potential red flags</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Key Capabilities</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Image analysis for damage verification</li>
                <li>• Vehicle database lookup</li>
                <li>• Cost estimation validation</li>
                <li>• Documentation completeness check</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Visualization */}
      <AgentWorkflowVisualization currentAgent="claim_assessor" />
    </div>
  )
} 