"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useOnboarding } from "@/components/onboarding/onboarding-provider"

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
  ToolCallCard,
  ConversationStep,
  WorkflowSummary,
} from '@/components/agent-outputs'
import {
  WorkflowResult,
  AgentOutput,
  isClaimAssessment,
  isCoverageVerification,
  isRiskAssessment,
  isCustomerCommunication,
  ToolCall,
} from '@/types/agent-outputs'

// Import scenario generator
import { ScenarioGeneratorModal } from '@/components/scenario-generator'
import { SavedScenariosList } from '@/components/saved-scenarios'
import { GeneratedScenario, SavedScenarioSummary, saveScenario, getScenario, getErrorMessage } from '@/lib/scenario-api'
import { formatCurrency } from '@/lib/locale-config'

// Import documentation hint component (Feature 005)
import { DocumentationHint, getDocumentationHintType } from '@/components/ai-elements/documentation-hint'

// Import scenario preview components (Feature 005 - US5)
import { 
  LocaleFlag, 
  ClaimTypeBadge, 
  ComplexityBadge,
  ScenarioPreviewExpanded,
} from '@/components/ai-elements/scenario-preview'

import { 
  IconUsers,
  IconRefresh,
  IconAlertCircle,
  IconClock,
  IconPlayerPlay,
  IconEye,
  IconFileOff,
  IconFileText,
  IconSparkles,
  IconDeviceFloppy,
  IconFolder,
} from '@tabler/icons-react'

import { AGENT_CONFIG, getAgentConfig, getSpecialistAgents } from '@/lib/agent-config'

interface ClaimSummary {
  claim_id: string
  claimant_name: string
  claim_type: string
  estimated_damage: number
  description: string
  // Additional fields for generated scenarios
  policy_number?: string
  claimant_id?: string
  incident_date?: string
  location?: string
  police_report?: boolean
  photos_provided?: boolean
  witness_statements?: string
  vehicle_info?: Record<string, unknown>
  customer_info?: Record<string, unknown>
}

interface ConversationEntry {
  role: string
  content: string
  node: string
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

// Helper to render agent output card based on type
function renderAgentOutputCard(
  agentOutput: AgentOutput | undefined,
  typeCheck: (output: unknown) => boolean,
  StructuredCard: React.ComponentType<{ output: unknown }>,
  displayName: string
): React.ReactNode {
  if (!agentOutput) return null
  
  if (agentOutput.structured_output && typeCheck(agentOutput.structured_output)) {
    return <StructuredCard output={agentOutput.structured_output} />
  }
  
  if (agentOutput.raw_text) {
    return <RawOutputFallback agentName={displayName} content={agentOutput.raw_text} />
  }
  
  return null
}

export function WorkflowDemo() {
  const TOOL_CALLS_STORAGE_KEY = "simai-workflow-tool-calls"

  const [availableClaims, setAvailableClaims] = useState<ClaimSummary[]>([])
  const [generatedScenarios, setGeneratedScenarios] = useState<GeneratedScenario[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false) // T040: 500ms delay threshold
  const [isLoadingSamples, setIsLoadingSamples] = useState(true)
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [savedScenariosRefreshTrigger, setSavedScenariosRefreshTrigger] = useState(0)
  const [savingScenarioId, setSavingScenarioId] = useState<string | null>(null)
  const [summaryLanguage, setSummaryLanguage] = useState<"english" | "original">("english")
  const [lastRunLanguage, setLastRunLanguage] = useState<"english" | "original" | null>(null)
  const [showToolCalls, setShowToolCalls] = useState(true)
  const { isDisabled: onboardingDisabled, setDisabled: setOnboardingDisabled } = useOnboarding()

  // T040: Show loading indicator after 500ms delay to avoid flickering on fast responses
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isLoading) {
      timer = setTimeout(() => setShowLoadingIndicator(true), 500)
    } else {
      setShowLoadingIndicator(false)
    }
    return () => clearTimeout(timer)
  }, [isLoading])

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedToolCalls = window.sessionStorage.getItem(TOOL_CALLS_STORAGE_KEY)
    if (storedToolCalls !== null) {
      setShowToolCalls(storedToolCalls === "true")
    }
  }, [setOnboardingDisabled])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.sessionStorage.setItem(TOOL_CALLS_STORAGE_KEY, String(showToolCalls))
  }, [showToolCalls])

  useEffect(() => {
    if (typeof window === "undefined") return
    // Onboarding persistence is handled in the OnboardingProvider (localStorage).
  }, [onboardingDisabled])

  // Handle newly generated scenario
  const handleScenarioGenerated = (scenario: GeneratedScenario) => {
    setGeneratedScenarios(prev => [scenario, ...prev])
    toast.success(`Generated scenario: ${scenario.name}`)
  }

  // Handle saving a generated scenario
  const handleSaveScenario = async (scenario: GeneratedScenario) => {
    setSavingScenarioId(scenario.id)
    try {
      await saveScenario({
        scenario,
        name: scenario.name,
      })
      toast.success(`Saved: ${scenario.name}`)
      // Remove from generated list (it's now saved)
      setGeneratedScenarios(prev => prev.filter(s => s.id !== scenario.id))
      // Refresh the saved scenarios list
      setSavedScenariosRefreshTrigger(prev => prev + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSavingScenarioId(null)
    }
  }

  // Handle using a saved scenario
  const handleUseSavedScenario = async (summary: SavedScenarioSummary) => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch the full scenario to get claim details
      const fullScenario = await getScenario(summary.id)
      // Run workflow with the saved scenario's full claim data
      const claim: ClaimSummary = {
        claim_id: fullScenario.claim.claim_id,
        policy_number: fullScenario.claim.policy_number,
        claimant_id: fullScenario.claim.claimant_id,
        claimant_name: fullScenario.claim.claimant_name,
        incident_date: fullScenario.claim.incident_date,
        claim_type: fullScenario.claim.claim_type,
        description: fullScenario.claim.description,
        estimated_damage: fullScenario.claim.estimated_damage,
        location: fullScenario.claim.location,
        police_report: fullScenario.claim.police_report,
        photos_provided: fullScenario.claim.photos_provided,
        witness_statements: fullScenario.claim.witness_statements,
        vehicle_info: fullScenario.claim.vehicle_info as Record<string, unknown> | undefined,
        customer_info: fullScenario.claim.customer_info as Record<string, unknown> | undefined,
      }
      await runWorkflowWithClaim(claim)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setIsLoading(false)
    }
  }

  // Convert generated scenario to ClaimSummary format for running workflow
  // Includes all fields needed for the backend to process without looking up sample claims
  const scenarioToClaimSummary = (scenario: GeneratedScenario): ClaimSummary => ({
    claim_id: scenario.claim.claim_id,
    policy_number: scenario.claim.policy_number,
    claimant_id: scenario.claim.claimant_id,
    claimant_name: scenario.claim.claimant_name,
    incident_date: scenario.claim.incident_date,
    claim_type: scenario.claim.claim_type,
    description: scenario.claim.description,
    estimated_damage: scenario.claim.estimated_damage,
    location: scenario.claim.location,
    police_report: scenario.claim.police_report,
    photos_provided: scenario.claim.photos_provided,
    witness_statements: scenario.claim.witness_statements,
    vehicle_info: scenario.claim.vehicle_info as Record<string, unknown> | undefined,
    customer_info: scenario.claim.customer_info as Record<string, unknown> | undefined,
  })


  // Fetch available claims on component mount
  useEffect(() => {
    fetchAvailableClaims()
  }, [])

  const fetchAvailableClaims = async () => {
    try {
      const apiUrl = await getApiUrl()
      const fullUrl = `${apiUrl}/api/v1/workflow/sample-claims`
      
      const response = await fetch(fullUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
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
    
    await runWorkflowWithClaim(claim)
  }

  const runWorkflowWithClaim = async (claim: ClaimSummary) => {
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

      // Determine if this is a generated scenario (has policy_number) or sample claim
      // For generated scenarios, send full claim data
      // For sample claims (no policy_number), just send claim_id
      let requestBody: Record<string, unknown>
      if (claim.policy_number) {
        // Full claim data from generated scenario
        requestBody = { ...claim, summary_language: summaryLanguage }
        if (paths.length > 0) {
          requestBody.supporting_images = paths
        }
      } else {
        // Sample claim - just send claim_id
        requestBody = paths.length > 0
          ? { claim_id: claim.claim_id, supporting_images: paths, summary_language: summaryLanguage }
          : { claim_id: claim.claim_id, summary_language: summaryLanguage }
      }

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
      setLastRunLanguage(summaryLanguage)
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
    setLastRunLanguage(null)
  }

  // Helper to determine if a conversation step should be skipped
  const shouldSkipStep = (step: ConversationEntry) => {
    if (step.content.includes('transfer_back_to_supervisor')) {
      return true
    }
    if (!showToolCalls) {
      return step.content.startsWith('TOOL_CALL:') || 
             step.content.startsWith('🔧 Calling tool:') ||
             step.content.startsWith('🔧 Tool Response') ||
             step.role === 'tool'
    }
    return false
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
            {getSpecialistAgents().map(([key, config]) => (
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconFileText className="h-5 w-5" />
                Sample Claims
              </CardTitle>
              <CardDescription>
                Select a sample claim and optionally upload supporting documents to run through the multi-agent workflow
              </CardDescription>
            </div>
            <ScenarioGeneratorModal
              onScenarioGenerated={handleScenarioGenerated}
              trigger={
                <Button variant="outline" className="gap-2">
                  <IconSparkles className="h-4 w-4" />
                  Generate New Scenario
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Workflow Options */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="space-y-0.5">
              <Label htmlFor="summary-language" className="text-sm font-medium">
                Workflow Language
              </Label>
              <p className="text-xs text-muted-foreground">
                {summaryLanguage === "original" 
                  ? "Workflow outputs will match the claim language" 
                  : "Workflow outputs will be in English"}
              </p>
              <p className="text-xs text-muted-foreground">Applies to next run</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">English</span>
              <Switch
                id="summary-language"
                checked={summaryLanguage === "original"}
                onCheckedChange={(checked) => setSummaryLanguage(checked ? "original" : "english")}
              />
              <span className="text-xs text-muted-foreground">Original</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="show-tool-calls" className="text-sm font-medium">
                  Tool Call Trace
                </Label>
                <p className="text-xs text-muted-foreground">
                  {showToolCalls ? "Show tool calls and responses in the trace" : "Hide tool calls and responses"}
                </p>
              </div>
              <Switch
                id="show-tool-calls"
                checked={showToolCalls}
                onCheckedChange={setShowToolCalls}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="disable-onboarding" className="text-sm font-medium">
                  Onboarding
                </Label>
                <p className="text-xs text-muted-foreground">
                  {onboardingDisabled ? "Onboarding is disabled" : "Disable onboarding and mark complete"}
                </p>
              </div>
              <Switch
                id="disable-onboarding"
                checked={onboardingDisabled}
                onCheckedChange={(checked) => setOnboardingDisabled(checked)}
              />
            </div>
          </div>
          
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

          {/* Generated Scenarios Section */}
          {generatedScenarios.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconSparkles className="h-4 w-4 text-purple-500" />
                <Label className="text-sm font-medium">AI-Generated Scenarios</Label>
                <Badge variant="secondary" className="text-xs">
                  {generatedScenarios.length}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {generatedScenarios.map((scenario) => (
                  <Card
                    key={scenario.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 bg-purple-50/50 dark:bg-purple-900/10"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Locale Flag (T033) */}
                          <LocaleFlag locale={scenario.locale} />
                          <CardTitle className="text-sm font-medium">
                            {scenario.name}
                          </CardTitle>
                        </div>
                      </div>
                      {/* Badges row (T033, T034) */}
                      <div className="flex gap-1 flex-wrap mt-1">
                        <ClaimTypeBadge claimType={scenario.claim.claim_type} />
                        <ComplexityBadge scenario={scenario} />
                      </div>
                      <CardDescription className="text-xs">
                        {scenario.claim.claimant_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(scenario.claim.estimated_damage, scenario.locale)}
                          </span>
                          <span className="text-muted-foreground text-xs ml-1">estimated</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {scenario.claim.description}
                        </p>
                        {/* Documentation Hint (Feature 005) - T024 */}
                        <DocumentationHint
                          type={getDocumentationHintType(
                            scenario.claim.photos_provided ?? false,
                            scenario.claim.police_report ?? false,
                            scenario.claim.witness_statements ?? "none"
                          )}
                          photosProvided={scenario.claim.photos_provided}
                          policeReport={scenario.claim.police_report}
                          witnessStatements={scenario.claim.witness_statements}
                        />
                        {/* Scenario Preview Expansion (T032) */}
                        <ScenarioPreviewExpanded scenario={scenario} />
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() => runWorkflow(scenarioToClaimSummary(scenario))}
                            disabled={isLoading || savingScenarioId === scenario.id}
                            className="flex-1"
                            size="sm"
                            variant="secondary"
                          >
                            {isLoading ? (
                              <>
                                <IconClock className="h-4 w-4 animate-spin mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <IconPlayerPlay className="h-4 w-4 mr-2" />
                                Run
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleSaveScenario(scenario)}
                            disabled={savingScenarioId === scenario.id || isLoading}
                            size="sm"
                            variant="outline"
                          >
                            {savingScenarioId === scenario.id ? (
                              <IconClock className="h-4 w-4 animate-spin" />
                            ) : (
                              <IconDeviceFloppy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Saved Scenarios Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconFolder className="h-4 w-4 text-amber-500" />
              <Label className="text-sm font-medium">Saved Scenarios</Label>
            </div>
            <SavedScenariosList
              onUseScenario={handleUseSavedScenario}
              refreshTrigger={savedScenariosRefreshTrigger}
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
      {(showLoadingIndicator || workflowResult) && (
        <div className="space-y-6">
          {lastRunLanguage && (
            <div>
              <Badge variant="outline" className="text-xs">
                Last run: {lastRunLanguage === "original" ? "Original" : "English"}
              </Badge>
            </div>
          )}
          {/* Workflow Summary for Viewers (T037-T039) */}
          {workflowResult && (
            <WorkflowSummary result={workflowResult} />
          )}

          {/* Agent Output Cards Grid */}
          {workflowResult?.agent_outputs && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderAgentOutputCard(
                workflowResult.agent_outputs.claim_assessor,
                isClaimAssessment,
                ClaimAssessmentCard as React.ComponentType<{ output: unknown }>,
                'Claim Assessor'
              )}
              {renderAgentOutputCard(
                workflowResult.agent_outputs.policy_checker,
                isCoverageVerification,
                CoverageVerificationCard as React.ComponentType<{ output: unknown }>,
                'Policy Checker'
              )}
              {renderAgentOutputCard(
                workflowResult.agent_outputs.risk_analyst,
                isRiskAssessment,
                RiskAssessmentCard as React.ComponentType<{ output: unknown }>,
                'Risk Analyst'
              )}
              {renderAgentOutputCard(
                workflowResult.agent_outputs.communication_agent,
                isCustomerCommunication,
                CustomerCommunicationCard as React.ComponentType<{ output: unknown }>,
                'Communication Agent'
              )}
            </div>
          )}

          {/* Tool Calls Section - Collapsible per agent */}
          {showToolCalls && workflowResult?.agent_outputs && hasAnyToolCalls(workflowResult.agent_outputs) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tool Calls</CardTitle>
                <CardDescription>Tools invoked by agents during processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(workflowResult.agent_outputs).map(([agentName, agentOutput]) => {
                  if (!agentOutput.tool_calls || agentOutput.tool_calls.length === 0) return null
                  const config = getAgentConfig(agentName)
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
              {showLoadingIndicator ? (
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
