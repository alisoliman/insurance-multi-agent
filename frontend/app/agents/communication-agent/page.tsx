'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  IconMessage,
  IconRefresh,
  IconCircleCheck,
  IconAlertCircle,
  IconClock,
  IconBook,
  IconMail,
  IconFileText,
  IconTool
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import { AgentWorkflowVisualization } from '@/components/agent-workflow-visualization'
import { CustomerCommunicationCard, ToolCallCard, ConversationStep } from '@/components/agent-outputs'
import { isCustomerCommunication, CustomerCommunication, ToolCall, AgentOutput } from '@/types/agent-outputs'
import { ScenarioSelector, FullClaimData } from '@/components/scenario-selector'

// Sample claims from API
interface SampleClaim {
  claim_id: string
  claimant_name: string
  claim_type: string
  estimated_damage: number
  description: string
}

interface CommunicationResult {
  success: boolean
  agent_name: string
  claim_body: Record<string, unknown>
  conversation_chronological: Array<{
    role: string
    content: string
  }>
  structured_output?: AgentOutput
}

export default function CommunicationAgentDemo() {
  const [sampleClaims, setSampleClaims] = useState<SampleClaim[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSamples, setIsLoadingSamples] = useState(true)
  const [result, setResult] = useState<CommunicationResult | null>(null)
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

  const runCommunication = async (claim: SampleClaim) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const apiUrl = await getApiUrl()
      const response = await fetch(`${apiUrl}/api/v1/agent/communication_agent/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ claim_id: claim.claim_id }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: CommunicationResult = await response.json()
      setResult(data)
      toast.success('Communication draft completed successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast.error('Communication draft failed: ' + errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const resetDemo = () => {
    setResult(null)
    setError(null)
  }

  // Run communication with full claim data (for generated scenarios)
  const runCommunicationWithFullClaim = async (claim: FullClaimData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const apiUrl = await getApiUrl()
      const response = await fetch(`${apiUrl}/api/v1/agent/communication_agent/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(claim),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: CommunicationResult = await response.json()
      setResult(data)
      toast.success('Communication draft completed successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast.error('Communication draft failed: ' + errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper to determine if a conversation step should be skipped
  const shouldSkipStep = (step: { role: string; content: string }) => {
    return step.content.startsWith('TOOL_CALL:')
  }

  const extractEmailContent = (conversation: Array<{ role: string; content: string }>) => {
    // Find the last assistant message which should contain the email
    // Handle both LangChain naming ('ai') and OpenAI naming ('assistant')
    const lastAssistantMessage = conversation
      .filter(step => (step.role === 'ai' || step.role === 'assistant') && !step.content.startsWith('TOOL_CALL:'))
      .pop()

    if (!lastAssistantMessage) return null

    const content = lastAssistantMessage.content
    
    // Try to parse as JSON first (since communication agent uses JSON format)
    try {
      const parsed = JSON.parse(content)
      if (parsed.subject && parsed.body) {
        return {
          subject: parsed.subject,
          body: parsed.body
        }
      }
    } catch {
      // If not JSON, try to extract subject and body from text
      const subjectMatch = content.match(/Subject:\s*(.+)/i)
      const bodyMatch = content.match(/Body:\s*([\s\S]+)/i) || content.match(/Dear[\s\S]+/i)
      
      return {
        subject: subjectMatch ? subjectMatch[1].trim() : 'Email Communication',
        body: bodyMatch ? bodyMatch[0] : content
      }
    }
    
    return {
      subject: 'Email Communication',
      body: content
    }
  }

  return (
    <div className="space-y-6">
      {/* Agent Overview Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <IconMessage className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Communication Agent</h1>
              <p className="text-sm text-muted-foreground font-normal">
                Specialized in drafting professional customer communications
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconTool className="h-4 w-4" />
                Communication Types
              </h3>
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <IconMail className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">Information Requests</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Drafts emails requesting missing documentation
                  </p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <IconFileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Status Updates</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Creates professional claim status communications
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconCircleCheck className="h-4 w-4" />
                Communication Features
              </h3>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default" className="text-xs">Professional Tone</Badge>
                  <Badge variant="secondary" className="text-xs">Clear Instructions</Badge>
                  <Badge variant="outline" className="text-xs">Deadline Setting</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Key features of generated communications
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Claims Selection - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMessage className="h-5 w-5" />
            Select a Claim
          </CardTitle>
          <CardDescription>
            Generate a new scenario or select a sample claim to generate customer communication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Generated Scenarios Section */}
          <div className="space-y-3">
            <ScenarioSelector
              onSelectScenario={runCommunicationWithFullClaim}
              disabled={isLoading}
            />
          </div>

          <Separator />

          {/* Sample Claims Section */}
          <div className="space-y-3">
            <span className="text-sm font-medium">Sample Claims</span>
            {isLoadingSamples ? (
              <div className="flex items-center justify-center py-8">
                <IconClock className="h-6 w-6 animate-spin mr-2" />
                <span>Loading sample claims…</span>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sampleClaims.map((claim) => (
                <Card
                  key={claim.claim_id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4 h-full">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {claim.claim_id}
                        </Badge>
                        <span className="text-lg font-semibold text-green-600">
                          ${claim.estimated_damage.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <h3 className="font-medium text-base mb-1">
                          {claim.claim_type}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Claimant: {claim.claimant_name}
                        </p>
                      </div>
                      
                      <div className="text-xs text-muted-foreground leading-relaxed flex-grow mb-4">
                        {claim.description}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={isLoading}
                        className="w-full mt-auto"
                        onClick={() => runCommunication(claim)}
                      >
                        {isLoading ? 'Processing…' : 'Draft Email'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}          </div>
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

      {/* Results - Full Width */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCircleCheck className="h-5 w-5" />
              Communication Results
            </CardTitle>
            <CardDescription>
              Generated email communication and conversation trace
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
                <span>Drafting communication…</span>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {/* Structured Output Card - New Style */}
                {result.structured_output?.structured_output && 
                 isCustomerCommunication(result.structured_output.structured_output) ? (
                  <CustomerCommunicationCard 
                    output={result.structured_output.structured_output as CustomerCommunication}
                    className="shadow-md"
                  />
                ) : (
                  /* Fallback: Legacy Email Preview */
                  (() => {
                    const emailContent = extractEmailContent(result.conversation_chronological)
                    return emailContent && (
                      <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-l-yellow-500">
                        <div className="flex items-center gap-2 mb-4">
                          <IconMail className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">Generated Email</span>
                          <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-700">
                            Unstructured
                          </Badge>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 space-y-3">
                          <div className="border-b pb-2">
                            <div className="text-sm text-muted-foreground">Subject:</div>
                            <div className="font-medium">{emailContent.subject}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-2">Body:</div>
                            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                              {emailContent.body}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()
                )}

                {/* Tool Calls Section */}
                {result.structured_output?.tool_calls && result.structured_output.tool_calls.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <IconTool className="h-4 w-4" />
                      Tool Calls
                      <Badge variant="secondary" className="text-xs">
                        {result.structured_output.tool_calls.length}
                      </Badge>
                    </h4>
                    <div className="space-y-2">
                      {result.structured_output.tool_calls.map((toolCall: ToolCall, idx: number) => (
                        <ToolCallCard key={toolCall.id || idx} toolCall={toolCall} defaultExpanded={true} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Claim Data Visualization */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <IconFileText className="h-4 w-4" />
                    Processed Claim Data
                  </h4>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(result.claim_body).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div className="text-sm">
                            {typeof value === 'boolean' ? (
                              <Badge variant={value ? 'default' : 'secondary'}>
                                {value ? 'Yes' : 'No'}
                              </Badge>
                            ) : typeof value === 'number' ? (
                              <span className="font-medium">
                                {key.includes('damage') || key.includes('amount') ? 
                                  `$${value.toLocaleString()}` : 
                                  value.toLocaleString()
                                }
                              </span>
                            ) : typeof value === 'object' && value !== null ? (
                              <div className="bg-muted/50 rounded p-2 text-xs">
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              </div>
                            ) : (
                              <span className="break-words">
                                {String(value) || 'N/A'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Conversation Timeline */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <IconBook className="h-4 w-4" />
                    Conversation Timeline
                  </h4>
                  <ScrollArea className="h-[calc(100vh-28rem)] min-h-[500px] max-h-[700px]">
                    <div className="py-4">
                      {result.conversation_chronological
                        .filter(step => !shouldSkipStep(step))
                        .map((step, index, filteredArray) => (
                          <ConversationStep
                            key={index}
                            step={{ role: step.role, content: step.content }}
                            stepNumber={index + 1}
                            isLast={index === filteredArray.length - 1}
                            agentName="communication_agent"
                          />
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}

            {!result && !isLoading && !error && (
              <div className="text-center py-8 text-muted-foreground">
                <IconMessage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a sample claim to see the communication drafting process</p>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Workflow Visualization */}
      <AgentWorkflowVisualization currentAgent="communication-agent" />
    </div>
  )
} 