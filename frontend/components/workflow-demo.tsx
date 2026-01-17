"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { getApiUrl } from "@/lib/config"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileUpload } from '@/components/ui/file-upload'

// Import new agent output components
import {
  ClaimAssessmentCard,
  CoverageVerificationCard,
  RiskAssessmentCard,
  CustomerCommunicationCard,
  FinalAssessmentCard,
  ToolCallCard,
  ConversationStep,
} from '@/components/agent-outputs'
import {
  WorkflowResult,
  AgentOutput,
  isClaimAssessment,
  isCoverageVerification,
  isRiskAssessment,
  isCustomerCommunication,
  isFinalAssessment,
  ClaimAssessment,
  CoverageVerification,
  RiskAssessment,
  CustomerCommunication,
  FinalAssessment,
  ToolCall,
} from '@/types/agent-outputs'

import { 
  IconUsers,
  IconRefresh,
  IconAlertCircle,
  IconClock,
  IconRobot,
  IconFileText,
  IconShield,
  IconTrendingUp,
  IconMessage,
  IconPlayerPlay,
  IconEye,
  IconFileOff
} from '@tabler/icons-react'

interface ClaimSummary {
  claim_id: string
  claimant_name: string
  claim_type: string
  estimated_damage: number
  description: string
}

interface ConversationEntry {
  role: string
  content: string
  node: string
}

// Agent configuration with icons and colors (matching backend agent names)
const AGENT_CONFIG = {
  'claim_assessor': {
    icon: IconFileText,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    displayName: 'Claim Assessor',
    description: 'Damage evaluation specialist',
    capabilities: ['Image Analysis', 'Damage Assessment', 'Cost Estimation']
  },
  'policy_checker': {
    icon: IconShield,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
    displayName: 'Policy Checker',
    description: 'Coverage verification specialist',
    capabilities: ['Policy Verification', 'Coverage Analysis', 'Exclusion Review']
  },
  'risk_analyst': {
    icon: IconTrendingUp,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    displayName: 'Risk Analyst',
    description: 'Fraud detection specialist',
    capabilities: ['Fraud Detection', 'Risk Assessment', 'Pattern Analysis']
  },
  'communication_agent': {
    icon: IconMessage,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    displayName: 'Communication Agent',
    description: 'Customer communication specialist',
    capabilities: ['Email Drafting', 'Customer Updates', 'Documentation']
  },
  'supervisor': {
    icon: IconRobot,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    borderColor: 'border-gray-200 dark:border-gray-800',
    displayName: 'Supervisor',
    description: 'Workflow orchestrator',
    capabilities: ['Decision Making', 'Agent Coordination', 'Final Assessment']
  }
}

// Helper function to check if any agent has tool calls
function hasAnyToolCalls(agentOutputs: Record<string, AgentOutput>): boolean {
  return Object.values(agentOutputs).some(
    (output) => output.tool_calls && output.tool_calls.length > 0
  )
}

// Fallback component for raw/unstructured output
function RawOutputFallback({ agentName, content }: { agentName: string; content: string }) {
  return (
    <Card className="border-l-4 border-l-yellow-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{agentName}</CardTitle>
          <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
            <IconFileOff className="h-3 w-3 mr-1" />
            Unstructured
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  )
}

export function WorkflowDemo() {
  const [availableClaims, setAvailableClaims] = useState<ClaimSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSamples, setIsLoadingSamples] = useState(true)
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])


  // Fetch available claims on component mount
  useEffect(() => {
    fetchAvailableClaims()
  }, [])

  const fetchAvailableClaims = async () => {
    try {
      const apiUrl = await getApiUrl()
      console.log('Using API URL:', apiUrl)
      const fullUrl = `${apiUrl}/api/v1/workflow/sample-claims`
      console.log('Fetching from:', fullUrl)
      
      const response = await fetch(fullUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Received data:', data)
      setAvailableClaims(data.available_claims || [])
    } catch (err) {
      console.error('Failed to fetch available claims:', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to load available claims: ${message}`)
    } finally {
      setIsLoadingSamples(false)
    }
  }

  const runWorkflow = async (claim: ClaimSummary) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const apiUrl = await getApiUrl()
      
      // Upload files first if any
      let paths: string[] = []
      if (uploadedFiles.length > 0) {
        try {
          const fd = new FormData()
          uploadedFiles.forEach(f => fd.append('files', f))
          const upRes = await fetch(`${apiUrl}/api/v1/files/upload`, { method: 'POST', body: fd })
          if (!upRes.ok) throw new Error(`Upload failed (${upRes.status})`)
          const upJson = await upRes.json()
          paths = Array.isArray(upJson.paths) ? upJson.paths : []
        } catch (err) { 
          console.error(err)
          setError('File upload failed')
          return
        }
      }

      // Run the workflow with or without supporting images
      const requestBody = paths.length > 0
        ? { claim_id: claim.claim_id, supporting_images: paths }
        : { claim_id: claim.claim_id }

      const response = await fetch(`${apiUrl}/api/v1/workflow/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: WorkflowResult = await response.json()
      setWorkflowResult(data)
      toast.success('Workflow completed successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast.error('Workflow failed: ' + errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files)
    if (files.length > 0) {
      setError(null)
    }
  }

  const resetDemo = () => {
    setWorkflowResult(null)
    setError(null)
    setUploadedFiles([])
  }

  // Helper to determine if a conversation step should be skipped
  const shouldSkipStep = (step: ConversationEntry) => {
    return step.content.startsWith('TOOL_CALL:') || 
           step.content.includes('transfer_back_to_supervisor') || 
           step.content.includes('"type": "tool_call"') ||
           step.content.match(/\[.*"tool_call".*\]/)
  }

  return (
    <div className="space-y-6">
      {/* Multi-Agent System Overview Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <IconUsers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            Multi-Agent Workflow System
          </CardTitle>
          <CardDescription>
            Collaborative AI agents working together to process insurance claims with comprehensive analysis and decision-making
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Object.entries(AGENT_CONFIG).filter(([key]) => key !== 'supervisor').map(([key, config]) => (
              <div key={key} className={`rounded-lg p-3 border ${config.bgColor} ${config.borderColor}`}>
                <div className="flex items-center gap-2 mb-2">
                  <config.icon className={`h-4 w-4 ${config.color}`} />
                  <span className="font-medium text-sm">{config.displayName}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {config.description}
                </p>
                <div className="space-y-1">
                  {config.capabilities.map((capability, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground">
                      • {capability}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className={`rounded-lg p-4 border ${AGENT_CONFIG.supervisor.bgColor} ${AGENT_CONFIG.supervisor.borderColor}`}>
            <div className="flex items-center gap-2 mb-2">
              <AGENT_CONFIG.supervisor.icon className={`h-5 w-5 ${AGENT_CONFIG.supervisor.color}`} />
              <span className="font-medium">{AGENT_CONFIG.supervisor.displayName}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Orchestrates the entire workflow, coordinates between specialist agents, and makes the final claim decision based on all assessments.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sample Claims Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileText className="h-5 w-5" />
            Sample Claims
          </CardTitle>
          <CardDescription>
            Select a sample claim and optionally upload supporting documents to run through the multi-agent workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* File Upload Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Supporting Documents</Label>
            <FileUpload
              onFilesChange={handleFilesChange}
              value={uploadedFiles}
              accept=".pdf,.jpg,.jpeg,.png,.bmp,.webp,.txt,.doc,.docx"
              maxFiles={10}
              maxSize={10 * 1024 * 1024} // 10MB
            />
          </div>

          {/* Claims Grid */}
          {isLoadingSamples ? (
            <div className="flex items-center justify-center py-8">
              <IconClock className="h-6 w-6 animate-spin mr-2" />
              <span>Loading sample claims...</span>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableClaims.map((claim) => (
                <Card
                  key={claim.claim_id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {claim.claim_id}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {claim.claim_type}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {claim.claimant_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          ${claim.estimated_damage.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground text-xs ml-1">estimated</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {claim.description}
                      </p>
                      <Button
                        onClick={() => runWorkflow(claim)}
                        disabled={isLoading}
                        className="w-full mt-3"
                        size="sm"
                      >
                        {isLoading ? (
                          <>
                            <IconClock className="h-4 w-4 animate-spin mr-2" />
                            Processing...
                          </>
                                                 ) : (
                           <>
                             <IconPlayerPlay className="h-4 w-4 mr-2" />
                             Run Workflow
                           </>
                         )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {(isLoading || workflowResult) && (
        <div className="space-y-6">
          {/* Final Assessment Card - Displayed prominently at top when available */}
          {workflowResult?.agent_outputs?.synthesizer?.structured_output && 
           isFinalAssessment(workflowResult.agent_outputs.synthesizer.structured_output) && (
            <FinalAssessmentCard 
              output={workflowResult.agent_outputs.synthesizer.structured_output as FinalAssessment}
              className="shadow-lg"
            />
          )}

          {/* Agent Output Cards Grid */}
          {workflowResult?.agent_outputs && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Claim Assessor Output */}
              {workflowResult.agent_outputs.claim_assessor?.structured_output && 
               isClaimAssessment(workflowResult.agent_outputs.claim_assessor.structured_output) ? (
                <ClaimAssessmentCard 
                  output={workflowResult.agent_outputs.claim_assessor.structured_output as ClaimAssessment}
                />
              ) : workflowResult.agent_outputs.claim_assessor?.raw_text && (
                <RawOutputFallback 
                  agentName="Claim Assessor"
                  content={workflowResult.agent_outputs.claim_assessor.raw_text}
                />
              )}

              {/* Policy Checker Output */}
              {workflowResult.agent_outputs.policy_checker?.structured_output && 
               isCoverageVerification(workflowResult.agent_outputs.policy_checker.structured_output) ? (
                <CoverageVerificationCard 
                  output={workflowResult.agent_outputs.policy_checker.structured_output as CoverageVerification}
                />
              ) : workflowResult.agent_outputs.policy_checker?.raw_text && (
                <RawOutputFallback 
                  agentName="Policy Checker"
                  content={workflowResult.agent_outputs.policy_checker.raw_text}
                />
              )}

              {/* Risk Analyst Output */}
              {workflowResult.agent_outputs.risk_analyst?.structured_output && 
               isRiskAssessment(workflowResult.agent_outputs.risk_analyst.structured_output) ? (
                <RiskAssessmentCard 
                  output={workflowResult.agent_outputs.risk_analyst.structured_output as RiskAssessment}
                />
              ) : workflowResult.agent_outputs.risk_analyst?.raw_text && (
                <RawOutputFallback 
                  agentName="Risk Analyst"
                  content={workflowResult.agent_outputs.risk_analyst.raw_text}
                />
              )}

              {/* Communication Agent Output */}
              {workflowResult.agent_outputs.communication_agent?.structured_output && 
               isCustomerCommunication(workflowResult.agent_outputs.communication_agent.structured_output) ? (
                <CustomerCommunicationCard 
                  output={workflowResult.agent_outputs.communication_agent.structured_output as CustomerCommunication}
                />
              ) : workflowResult.agent_outputs.communication_agent?.raw_text && (
                <RawOutputFallback 
                  agentName="Communication Agent"
                  content={workflowResult.agent_outputs.communication_agent.raw_text}
                />
              )}
            </div>
          )}

          {/* Tool Calls Section - Collapsible per agent */}
          {workflowResult?.agent_outputs && hasAnyToolCalls(workflowResult.agent_outputs) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tool Calls</CardTitle>
                <CardDescription>Tools invoked by agents during processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(workflowResult.agent_outputs).map(([agentName, agentOutput]) => {
                  if (!agentOutput.tool_calls || agentOutput.tool_calls.length === 0) return null
                  const config = AGENT_CONFIG[agentName as keyof typeof AGENT_CONFIG]
                  return (
                    <div key={agentName} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {config && <config.icon className={`h-4 w-4 ${config.color}`} />}
                        <span className="text-sm font-medium">
                          {config?.displayName || agentName}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {agentOutput.tool_calls.length} call{agentOutput.tool_calls.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="space-y-2 ml-6">
                        {agentOutput.tool_calls.map((toolCall: ToolCall, idx: number) => (
                          <ToolCallCard key={toolCall.id || idx} toolCall={toolCall} defaultExpanded={true} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Legacy Conversation Timeline (collapsed by default, for debugging) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Agent Conversation Trace</CardTitle>
                <CardDescription>
                  {isLoading ? 'Agents are collaborating on claim analysis...' : 'Raw conversation history for debugging'}
                </CardDescription>
              </div>
              {workflowResult && (
                <Button onClick={resetDemo} variant="outline" size="sm">
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <IconClock className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Workflow in progress...</span>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse"></div>
                          <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : workflowResult ? (
                <ScrollArea className="h-[calc(100vh-24rem)] min-h-[500px] max-h-[800px]">
                  <div className="space-y-4 pr-4">
                    {workflowResult.conversation_chronological
                      ?.filter(step => !shouldSkipStep(step))
                      .map((step, index, filteredArray) => (
                        <ConversationStep 
                          key={index}
                          step={{ role: step.role, content: step.content, node: step.node }}
                          stepNumber={index + 1}
                          isLast={index === filteredArray.length - 1}
                        />
                      ))}
                    

                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-6 mb-4">
                    <IconEye className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Ready to Process Claims
                  </h3>
                  <p className="text-muted-foreground mb-4 max-w-sm">
                    Select a claim above to see the multi-agent system collaborate on processing it.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 