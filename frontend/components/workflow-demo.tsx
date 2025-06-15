"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Play, 
  Bot,
  FileText,
  Shield,
  TrendingUp,
  MessageSquare,
  Users,
  Info,
  Zap,
  Target,
  Eye,
  Settings,
  ArrowRight,
  Upload,
  X
} from 'lucide-react'
import { getApiUrl } from "@/lib/config"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  Avatar, 
  AvatarFallback, 
} from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  IconUsers,
  IconRefresh,
  IconCircleCheck,
  IconAlertCircle,
  IconClock,
  IconUser,
  IconRobot,
  IconTool,
  IconFileText,
  IconShield,
  IconTrendingUp,
  IconMessage,
  IconUpload,
  IconX,
  IconPlayerPlay,
  IconEye
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

interface WorkflowResult {
  success: boolean
  final_decision: string
  conversation_chronological: ConversationEntry[]
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

const getDecisionIcon = (decision: string) => {
  switch (decision) {
    case 'APPROVED':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case 'DENIED':
      return <AlertCircle className="h-5 w-5 text-red-500" />
    case 'REQUIRES_INVESTIGATION':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
    default:
      return <Clock className="h-5 w-5 text-gray-500" />
  }
}

const getDecisionColor = (decision: string) => {
  switch (decision) {
    case 'APPROVED':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800'
    case 'DENIED':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
    case 'REQUIRES_INVESTIGATION':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800'
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
  }
}

const formatContent = (content: string) => {
  // Hide tool calls completely
  if (content.startsWith('TOOL_CALL:')) {
    return null
  }
  
  // Also hide content that contains tool call arrays like the one you mentioned
  if (content.includes('transfer_back_to_supervisor') || 
      content.includes('"type": "tool_call"') ||
      content.match(/\[.*"tool_call".*\]/)) {
    return null
  }
  
  // Format assessment results with better structure
  if (content.includes('Assessment:') || content.includes('FINAL ASSESSMENT:')) {
    const lines = content.split('\n')
    return (
      <div className="space-y-2">
        {lines.map((line, idx) => {
          if (line.includes('Assessment:') || line.includes('FINAL ASSESSMENT:')) {
            const [label, value] = line.split(':')
            return (
              <div key={idx} className="flex items-center gap-2">
                <span className="font-medium">{label}:</span>
                <Badge variant={value?.trim() === 'INVALID' ? 'destructive' : 
                              value?.trim() === 'COVERED' ? 'default' : 'secondary'}>
                  {value?.trim()}
                </Badge>
              </div>
            )
          }
          return line && <p key={idx} className="text-sm">{line}</p>
        })}
      </div>
    )
  }
  
  return <div className="text-sm whitespace-pre-wrap">{content}</div>
}

export function WorkflowDemo() {
  const [availableClaims, setAvailableClaims] = useState<ClaimSummary[]>([])
  const [selectedClaimId, setSelectedClaimId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSamples, setIsLoadingSamples] = useState(true)
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  // Derived selected claim object
  const selectedClaim = availableClaims.find(
    (claim) => claim.claim_id === selectedClaimId
  )

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>)=>{
    const files = Array.from(e.target.files||[])
    const allowed=['image/jpeg','image/png','image/bmp','image/webp','application/pdf','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const valid=files.filter(f=>{
      if(!allowed.includes(f.type)){ toast.error(`Unsupported type: ${f.name}`); return false }
      if(f.size>10*1024*1024){ toast.error(`File too large: ${f.name}`); return false }
      return true
    })
    if(valid.length>0){
      setUploadedFiles(prev=>[...prev,...valid]);
      toast.success(`${valid.length} file(s) added`)
      setError(null)
    }
  }

  const removeFile=(idx:number)=> setUploadedFiles(prev=>prev.filter((_,i)=>i!==idx))

  const renderAgentAvatar = (agentName: string) => {
    const config = AGENT_CONFIG[agentName as keyof typeof AGENT_CONFIG]
    if (!config) {
      return (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gray-500 text-white text-xs">
            {agentName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )
    }

    const IconComponent = config.icon
    return (
      <Avatar className="h-8 w-8">
        <AvatarFallback className={`${config.color} text-white text-xs`}>
          <IconComponent className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    )
  }

  const getAgentDisplayName = (agentName: string) => {
    const config = AGENT_CONFIG[agentName as keyof typeof AGENT_CONFIG]
    return config?.displayName || agentName
  }

  const resetDemo = () => {
    setWorkflowResult(null)
    setError(null)
    setUploadedFiles([])
  }

  const formatConversationStep = (step: ConversationEntry, index: number, isLast: boolean) => {
    const isUser = step.role === 'human'
    const isAssistant = step.role === 'ai'
    const agentConfig = AGENT_CONFIG[step.node as keyof typeof AGENT_CONFIG]

    // Skip tool calls in the display
    if (step.content.startsWith('TOOL_CALL:') || 
        step.content.includes('transfer_back_to_supervisor') || 
        step.content.includes('"type": "tool_call"') ||
        step.content.match(/\[.*"tool_call".*\]/)) {
      return null
    }

    return (
      <div key={index} className="relative">
        <div className="flex gap-4">
          {/* Timeline connector */}
          <div className="flex flex-col items-center">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              agentConfig ? agentConfig.bgColor + ' ' + agentConfig.borderColor :
              isUser ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' :
              'bg-gray-100 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800'
            }`}>
              {agentConfig ? (
                <agentConfig.icon className={`h-5 w-5 ${agentConfig.color}`} />
              ) : isUser ? (
                <IconUser className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <IconRobot className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </div>
            {/* Connecting line */}
            {!isLast && (
              <div className="w-0.5 h-8 bg-border mt-2"></div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 pb-8">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={isUser ? 'secondary' : 'default'}>
                {agentConfig ? agentConfig.displayName : isUser ? 'User' : step.node}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Step {index + 1}
              </span>
            </div>
            
            <div className={`rounded-lg p-4 shadow-sm border ${
              agentConfig ? agentConfig.bgColor + ' ' + agentConfig.borderColor :
              isUser ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' :
              'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800'
            }`}>
              <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Custom components for better styling
                    h1: ({children}) => <h1 className="text-lg font-semibold mb-2 text-foreground">{children}</h1>,
                    h2: ({children}) => <h2 className="text-base font-semibold mb-2 text-foreground">{children}</h2>,
                    h3: ({children}) => <h3 className="text-sm font-semibold mb-1 text-foreground">{children}</h3>,
                    p: ({children}) => <p className="mb-2 text-foreground">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                    li: ({children}) => <li className="text-foreground">{children}</li>,
                    strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                    em: ({children}) => <em className="italic text-foreground">{children}</em>,
                    code: ({children}) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">{children}</code>,
                    pre: ({children}) => <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs font-mono text-foreground">{children}</pre>,
                    blockquote: ({children}) => <blockquote className="border-l-4 border-muted-foreground/25 pl-4 italic text-muted-foreground">{children}</blockquote>,
                    a: ({href, children}) => <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                    table: ({children}) => <div className="overflow-x-auto"><table className="min-w-full border-collapse border border-border">{children}</table></div>,
                    th: ({children}) => <th className="border border-border bg-muted px-2 py-1 text-left font-semibold">{children}</th>,
                    td: ({children}) => <td className="border border-border px-2 py-1">{children}</td>,
                  }}
                >
                  {step.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const extractFinalDecision = () => {
    if (!workflowResult?.final_decision) return null
    
    const decision = workflowResult.final_decision.toUpperCase()
    return {
      decision,
      icon: decision === 'APPROVED' ? <IconCircleCheck className="h-5 w-5 text-green-500" /> :
            decision === 'DENIED' ? <IconAlertCircle className="h-5 w-5 text-red-500" /> :
            <IconClock className="h-5 w-5 text-yellow-500" />,
      color: decision === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800' :
             decision === 'DENIED' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800' :
             'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800'
    }
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
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-muted-foreground/50 transition-colors">
              <IconUpload className="mx-auto h-6 w-6 text-muted-foreground" />
              <Label htmlFor="workflow-upload" className="cursor-pointer block mt-2">
                <span className="text-sm text-primary hover:text-primary/80 transition-colors">Upload files</span>
                <input 
                  id="workflow-upload" 
                  type="file" 
                  multiple 
                  accept=".pdf,.jpg,.jpeg,.png,.bmp,.webp,.txt,.doc,.docx" 
                  onChange={handleFileUpload} 
                  className="sr-only"
                  aria-label="Upload supporting documents"
                />
              </Label>
              <p className="text-xs text-muted-foreground">Images or docs up to 10 MB each</p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-1">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/50 p-2 rounded border border-border">
                    <div className="flex items-center space-x-2">
                      <IconFileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate text-foreground">{f.name}</span>
                      <span className="text-xs text-muted-foreground">({(f.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeFile(i)}
                      aria-label={`Remove ${f.name}`}
                      title={`Remove ${f.name}`}
                      className="hover:bg-destructive/10 rounded p-1 transition-colors"
                    >
                      <IconX className="h-4 w-4 text-destructive hover:text-destructive/80" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Final Decision Card */}
          {workflowResult && (
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCircleCheck className="h-5 w-5" />
                  Final Decision
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const finalDecision = extractFinalDecision()
                  return finalDecision ? (
                    <div className={`rounded-lg p-4 border ${finalDecision.color} flex items-center gap-3`}>
                      {finalDecision.icon}
                      <div>
                        <div className="font-medium">
                          {finalDecision.decision.replace('_', ' ')}
                        </div>
                        <div className="text-sm opacity-75">
                          Multi-agent assessment complete
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <IconClock className="h-8 w-8 mx-auto mb-2" />
                      <p>Processing workflow...</p>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* Conversation Timeline */}
          <Card className={workflowResult ? "lg:col-span-2" : "lg:col-span-3"}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Agent Conversation</CardTitle>
                <CardDescription>
                  {isLoading ? 'Agents are collaborating on claim analysis...' : 'Multi-agent workflow conversation trace'}
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
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4 pr-4">
                    {workflowResult.conversation_chronological
                      ?.map((step, index) => formatConversationStep(step, index, index === workflowResult.conversation_chronological.length - 1))
                      .filter(Boolean)}
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