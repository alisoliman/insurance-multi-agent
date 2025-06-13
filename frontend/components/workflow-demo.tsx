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
    icon: FileText,
    color: 'bg-blue-500',
    fallback: 'CA',
    displayName: 'Claim Assessor'
  },
  'policy_checker': {
    icon: Shield,
    color: 'bg-green-500',
    fallback: 'PC',
    displayName: 'Policy Checker'
  },
  'risk_analyst': {
    icon: TrendingUp,
    color: 'bg-orange-500',
    fallback: 'RA',
    displayName: 'Risk Analyst'
  },
  'communication_agent': {
    icon: MessageSquare,
    color: 'bg-purple-500',
    fallback: 'CM',
    displayName: 'Communication Agent'
  },
  'supervisor': {
    icon: Bot,
    color: 'bg-gray-600',
    fallback: 'SV',
    displayName: 'Supervisor'
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
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [supportingDocs, setSupportingDocs] = useState<string[]>([])

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
    }
  }

  const runWorkflow = async () => {
    if (!selectedClaimId) return

    setIsLoading(true)
    setError(null)
    setWorkflowResult(null)
    setProgress(0)

    // upload files first
    let paths:string[]=[]
    if(uploadedFiles.length>0){
      try{
        const fd=new FormData(); uploadedFiles.forEach(f=>fd.append('files',f))
        const upRes=await fetch(`${await getApiUrl()}/api/v1/files/upload`,{method:'POST',body:fd})
        if(!upRes.ok) throw new Error(`Upload failed (${upRes.status})`)
        const upJson=await upRes.json(); paths=Array.isArray(upJson.paths)?upJson.paths:[]; setSupportingDocs(paths)
      }catch(err){ console.error(err); setError('File upload failed'); }
    }

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev
        return Math.min(prev + Math.random() * 10, 95)
      })
    }, 500)

    try {
      console.log('Starting workflow for claim:', selectedClaimId)
      
      const apiUrl = await getApiUrl()
      const response = await fetch(`${apiUrl}/api/v1/workflow/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          paths.length>0
            ? { claim_id: selectedClaimId, supporting_images: paths }
            : { claim_id: selectedClaimId }
        ),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Workflow API error:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`)
      }

      const data = await response.json()
      console.log('Workflow response:', data)
      
      setWorkflowResult(data)
      setProgress(100)
    } catch (err) {
      console.error('Workflow execution failed:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      clearInterval(progressInterval)
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



  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - System Architecture and Workflow Execution */}
        <div className="space-y-6">
          {/* System Architecture Information */}
          <TooltipProvider>
                            <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  Multi-Agent System Architecture
                </CardTitle>
                <CardDescription>
                  Understanding how our AI agents collaborate to process insurance claims
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full" defaultValue="workflow">
                  {/* Workflow Process */}
                  <AccordionItem value="workflow" className="border-none">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold">Workflow Process</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
                            <Bot className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Supervisor orchestrates the entire workflow</span>
                          </div>
                          <div className="space-y-3">
                            {[
                              { step: 1, agent: 'Claim Assessor', action: 'evaluates damage and documentation', color: 'bg-blue-500', icon: FileText },
                              { step: 2, agent: 'Policy Checker', action: 'verifies coverage and policy terms', color: 'bg-green-500', icon: Shield },
                              { step: 3, agent: 'Risk Analyst', action: 'evaluates fraud potential and risk factors', color: 'bg-orange-500', icon: TrendingUp },
                              { step: 4, agent: 'Communication Agent', action: 'drafts customer emails if information is missing', color: 'bg-purple-500', icon: MessageSquare },
                              { step: 5, agent: 'Supervisor', action: 'makes final decision based on all assessments', color: 'bg-gray-600', icon: Target }
                            ].map((item, index) => (
                              <div key={index} className="flex items-center gap-3 group hover:bg-white/50 dark:hover:bg-gray-800/50 p-2 rounded transition-colors">
                                <div className={`w-8 h-8 ${item.color} text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm`}>
                                  {item.step}
                                </div>
                                <item.icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-sm">
                                  <strong className="text-gray-900 dark:text-gray-100">{item.agent}</strong> <span className="text-gray-700 dark:text-gray-300">{item.action}</span>
                                </span>
                                {index < 4 && <ArrowRight className="h-3 w-3 text-gray-400 ml-auto" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Agent Capabilities */}
                  <AccordionItem value="agents" className="border-none">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-500" />
                        <span className="font-semibold">Agent Capabilities & Tools</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2">
                        <Tabs defaultValue="claim_assessor" className="w-full">
                          <TabsList className="grid w-full grid-cols-4 mb-4">
                            <TabsTrigger value="claim_assessor" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              Assessor
                            </TabsTrigger>
                            <TabsTrigger value="policy_checker" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Policy
                            </TabsTrigger>
                            <TabsTrigger value="risk_analyst" className="text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Risk
                            </TabsTrigger>
                            <TabsTrigger value="communication_agent" className="text-xs">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Comm
                            </TabsTrigger>
                          </TabsList>

                          {/* Claim Assessor Tab */}
                          <TabsContent value="claim_assessor" className="mt-0">
                            <div className="border rounded-lg p-4 bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                              <div className="flex items-center gap-3 mb-4">
                                {renderAgentAvatar('claim_assessor')}
                                <div>
                                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">Claim Assessor</h4>
                                  <p className="text-sm text-blue-700 dark:text-blue-300">Damage evaluation specialist</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                    <Settings className="h-3 w-3" />
                                    Available Tools
                                  </h5>
                                  <div className="space-y-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 text-xs cursor-help hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                                          <code className="text-blue-600 dark:text-blue-400 font-medium">analyze_image</code>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>AI-powered image analysis for damage assessment</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 text-xs cursor-help hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                                          <code className="text-blue-600 dark:text-blue-400 font-medium">get_vehicle_details</code>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Vehicle information lookup by VIN</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                                <div>
                                  <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    Key Responsibilities
                                  </h5>
                                  <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                                    <li className="flex items-start gap-1">
                                      <span className="text-blue-500 mt-1">•</span>
                                      <span>Evaluate damage consistency</span>
                                    </li>
                                    <li className="flex items-start gap-1">
                                      <span className="text-blue-500 mt-1">•</span>
                                      <span>Assess repair cost estimates</span>
                                    </li>
                                    <li className="flex items-start gap-1">
                                      <span className="text-blue-500 mt-1">•</span>
                                      <span>Verify documentation quality</span>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          {/* Policy Checker Tab */}
                          <TabsContent value="policy_checker" className="mt-0">
                            <div className="border rounded-lg p-4 bg-green-50/30 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                              <div className="flex items-center gap-3 mb-4">
                                {renderAgentAvatar('policy_checker')}
                                <div>
                                  <h4 className="font-semibold text-green-900 dark:text-green-100">Policy Checker</h4>
                                  <p className="text-sm text-green-700 dark:text-green-300">Coverage verification specialist</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                    <Settings className="h-3 w-3" />
                                    Available Tools
                                  </h5>
                                  <div className="space-y-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 text-xs cursor-help hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors">
                                          <code className="text-green-600 dark:text-green-400 font-medium">get_policy_details</code>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Policy information and limits lookup</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 text-xs cursor-help hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors">
                                          <code className="text-green-600 dark:text-green-400 font-medium">search_policy_documents</code>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>AI-powered policy document search</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                                <div>
                                  <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    Key Responsibilities
                                  </h5>
                                  <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                                    <li className="flex items-start gap-1">
                                      <span className="text-green-500 mt-1">•</span>
                                      <span>Verify policy status</span>
                                    </li>
                                    <li className="flex items-start gap-1">
                                      <span className="text-green-500 mt-1">•</span>
                                      <span>Check coverage limits</span>
                                    </li>
                                    <li className="flex items-start gap-1">
                                      <span className="text-green-500 mt-1">•</span>
                                      <span>Identify exclusions</span>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          {/* Risk Analyst Tab */}
                          <TabsContent value="risk_analyst" className="mt-0">
                            <div className="border rounded-lg p-4 bg-orange-50/30 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                              <div className="flex items-center gap-3 mb-4">
                                {renderAgentAvatar('risk_analyst')}
                                <div>
                                  <h4 className="font-semibold text-orange-900 dark:text-orange-100">Risk Analyst</h4>
                                  <p className="text-sm text-orange-700 dark:text-orange-300">Fraud detection specialist</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                    <Settings className="h-3 w-3" />
                                    Available Tools
                                  </h5>
                                  <div className="space-y-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 text-xs cursor-help hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors">
                                          <code className="text-orange-600 dark:text-orange-400 font-medium">get_claimant_history</code>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Historical claims and risk factor analysis</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                                <div>
                                  <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    Key Responsibilities
                                  </h5>
                                  <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                                    <li className="flex items-start gap-1">
                                      <span className="text-orange-500 mt-1">•</span>
                                      <span>Analyze claimant history</span>
                                    </li>
                                    <li className="flex items-start gap-1">
                                      <span className="text-orange-500 mt-1">•</span>
                                      <span>Identify fraud indicators</span>
                                    </li>
                                    <li className="flex items-start gap-1">
                                      <span className="text-orange-500 mt-1">•</span>
                                      <span>Provide risk scoring</span>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          {/* Communication Agent Tab */}
                          <TabsContent value="communication_agent" className="mt-0">
                            <div className="border rounded-lg p-4 bg-purple-50/30 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                              <div className="flex items-center gap-3 mb-4">
                                {renderAgentAvatar('communication_agent')}
                                <div>
                                  <h4 className="font-semibold text-purple-900 dark:text-purple-100">Communication Agent</h4>
                                  <p className="text-sm text-purple-700 dark:text-purple-300">Customer communication specialist</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                    <Settings className="h-3 w-3" />
                                    Available Tools
                                  </h5>
                                  <div className="space-y-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 text-xs cursor-help hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors">
                                          <code className="text-purple-600 dark:text-purple-400 font-medium">Language Model</code>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Advanced language model for professional email generation</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                                <div>
                                  <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    Key Responsibilities
                                  </h5>
                                  <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                                    <li className="flex items-start gap-1">
                                      <span className="text-purple-500 mt-1">•</span>
                                      <span>Draft professional emails</span>
                                    </li>
                                    <li className="flex items-start gap-1">
                                      <span className="text-purple-500 mt-1">•</span>
                                      <span>Provide clear instructions</span>
                                    </li>
                                    <li className="flex items-start gap-1">
                                      <span className="text-purple-500 mt-1">•</span>
                                      <span>Set response timelines</span>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TooltipProvider>

          {/* Workflow Execution */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Play className="h-5 w-5 text-blue-600" />
                Workflow Execution
              </CardTitle>
              <CardDescription>
                Select a claim and run the multi-agent workflow to see the collaborative processing in action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select value={selectedClaimId} onValueChange={setSelectedClaimId}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a claim to process" />
                    </SelectTrigger>
                    <SelectContent className="w-[420px]">
                      {availableClaims.map((claim) => (
                        <SelectItem key={claim.claim_id} value={claim.claim_id}>
                          <div className="flex flex-col text-left">
                            <span className="font-medium">
                              {claim.claim_id} - {claim.claimant_name}
                            </span>
                            <span className="text-muted-foreground text-xs whitespace-normal">
                              {claim.claim_type} · ${claim.estimated_damage}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={runWorkflow} 
                  disabled={isLoading || !selectedClaimId}
                  className="flex items-center gap-2 h-11 px-6"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run Workflow
                    </>
                  )}
                </Button>
              </div>

              {selectedClaim && (
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 space-y-1 text-sm">
                  <div className="font-medium text-gray-900 dark:text-gray-100">Claim Summary</div>
                  <div>
                    <span className="font-medium">Claimant:</span>{' '}
                    {selectedClaim.claimant_name}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>{' '}
                    {selectedClaim.claim_type}
                  </div>
                  <div>
                    <span className="font-medium">Estimated Damage:</span>{' '}
                    ${selectedClaim.estimated_damage.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Description:</span>{' '}
                    <span className="whitespace-pre-wrap">{selectedClaim.description}</span>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">Processing workflow...</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 dark:text-blue-300">Agents collaborating on claim analysis</span>
                      <span className="font-medium text-blue-900 dark:text-blue-100">{Math.min(Math.round(progress),100)}%</span>
                    </div>
                    <Progress value={progress} className="w-full h-2" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <Info className="h-3 w-3" />
                    <span>This may take 30-60 seconds as agents analyze the claim thoroughly</span>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Upload section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Supporting Documents</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="mx-auto h-6 w-6 text-gray-400" />
              <Label htmlFor="wf-demo-upload" className="cursor-pointer block mt-2">
                <span className="text-sm text-blue-600 hover:text-blue-500">Upload files</span>
                <input id="wf-demo-upload" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.bmp,.webp,.txt,.doc,.docx" onChange={handleFileUpload} className="sr-only" />
              </Label>
              <p className="text-xs text-gray-500">Images or docs up to 10 MB each</p>
            </div>

            {uploadedFiles.length>0 && (
              <div className="space-y-1">
                {uploadedFiles.map((f,i)=>(
                  <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm truncate">{f.name}</span>
                      <span className="text-xs text-gray-500">({(f.size/1024).toFixed(1)} KB)</span>
                    </div>
                    <button type="button" onClick={()=>removeFile(i)}>
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Results Display */}
        <div className="space-y-6">
          {(isLoading || workflowResult) && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Workflow Results</span>
                  {workflowResult?.final_decision && (
                    <div className="flex items-center gap-2">
                      {getDecisionIcon(workflowResult.final_decision)}
                      <Badge className={getDecisionColor(workflowResult.final_decision)}>
                        {workflowResult.final_decision.replace('_', ' ')}
                      </Badge>
                    </div>
                  )}
                </CardTitle>
                {workflowResult && (
                  <CardDescription>
                    Claim processed successfully - Multi-agent workflow completed
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {isLoading && (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {workflowResult && (
                  <ScrollArea className="h-[800px]">
                    <div className="space-y-4 pr-4">
                      {workflowResult.conversation_chronological?.filter(message => {
                        // Filter out messages that would render as null (tool calls)
                        const formattedContent = formatContent(message.content)
                        return formattedContent !== null
                      }).map((message, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            {renderAgentAvatar(message.node)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {getAgentDisplayName(message.node)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Separator className="mb-3" />
                          {formatContent(message.content)}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          )}

          {/* Placeholder when no results */}
          {!isLoading && !workflowResult && (
            <Card className="h-fit">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 mb-4">
                  <Eye className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Ready to Process Claims
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm">
                  Select a claim from the left panel and click &quot;Run Workflow&quot; to see the multi-agent system in action.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  <span>Choose a claim to get started</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 