"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { 
  IconUser,
  IconRobot,
  IconFileText,
  IconShield,
  IconTrendingUp,
  IconMessage,
  IconTool,
  IconChevronDown,
  IconCar,
  IconCalendar,
  IconMapPin,
  IconFileDescription,
  IconPhoto,
  IconAlertTriangle,
  IconCheck,
  IconX,
} from '@tabler/icons-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Agent configuration
const AGENT_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
  displayName: string
}> = {
  'claim_assessor': {
    icon: IconFileText,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    displayName: 'Claim Assessor',
  },
  'policy_checker': {
    icon: IconShield,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    displayName: 'Policy Checker',
  },
  'risk_analyst': {
    icon: IconTrendingUp,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    displayName: 'Risk Analyst',
  },
  'communication_agent': {
    icon: IconMessage,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
    displayName: 'Communication Agent',
  },
  'supervisor': {
    icon: IconRobot,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    borderColor: 'border-gray-200 dark:border-gray-800',
    displayName: 'Supervisor',
  },
  'synthesizer': {
    icon: IconRobot,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    displayName: 'Synthesizer',
  },
}

interface ConversationEntry {
  role: string
  content: string
  node?: string  // Optional - can be provided via agentName prop instead
}

interface ConversationStepProps {
  step: ConversationEntry
  stepNumber: number
  isLast: boolean
  agentName?: string  // Optional agent name to use when step.node is not available
}

// Check if content is a JSON claim submission
function isClaimJson(content: string): boolean {
  try {
    const parsed = JSON.parse(content.replace(/^Please process this insurance claim:\s*/i, '').trim())
    return parsed && (parsed.claim_id || parsed.claimant_name || parsed.claim_type)
  } catch {
    return false
  }
}

// Parse claim JSON from content
function parseClaimJson(content: string): Record<string, unknown> | null {
  try {
    const jsonPart = content.replace(/^Please process this insurance claim:\s*/i, '').trim()
    return JSON.parse(jsonPart)
  } catch {
    return null
  }
}

// Check if content contains tool calls
function hasToolCalls(content: string): boolean {
  return content.includes('🔧 Calling tool:') || content.includes('TOOL_CALL:')
}

// Check if content contains tool responses
function hasToolResponses(content: string): boolean {
  return content.includes('🔧 Tool Response')
}

// Parse tool calls from content
function parseToolCalls(content: string): Array<{ name: string; args: Record<string, unknown> }> {
  const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = []

  if (content.includes('TOOL_CALL:')) {
    const payload = content.split('TOOL_CALL:')[1]?.trim() || ''
    const tryParse = (value: string) => {
      try {
        return JSON.parse(value)
      } catch {
        return null
      }
    }
    let parsed = tryParse(payload)
    if (!parsed) {
      const sanitized = payload
        .replace(/None/g, 'null')
        .replace(/True/g, 'true')
        .replace(/False/g, 'false')
        .replace(/'/g, '"')
      parsed = tryParse(sanitized)
    }
    if (Array.isArray(parsed)) {
      parsed.forEach((call) => {
        const name = call?.name || call?.function?.name || 'tool'
        const args = call?.arguments ?? call?.function?.arguments ?? {}
        toolCalls.push({ name, args: typeof args === 'string' ? { raw: args } : args })
      })
      return toolCalls
    }
    if (parsed && typeof parsed === 'object') {
      const name = (parsed as Record<string, unknown>).name || 'tool'
      const args = (parsed as Record<string, unknown>).arguments ?? {}
      toolCalls.push({ name: String(name), args: typeof args === 'string' ? { raw: args } : (args as Record<string, unknown>) })
      return toolCalls
    }
    toolCalls.push({ name: 'tool', args: { raw: payload } })
    return toolCalls
  }

  const lines = content.split('\n')
  let currentTool: string | null = null
  let argsBuffer: string[] = []
  let collectingArgs = false

  const saveCurrentTool = () => {
    if (currentTool) {
      if (argsBuffer.length > 0) {
        try {
          const argsStr = argsBuffer.join('\n').trim()
          const args = JSON.parse(argsStr)
          toolCalls.push({ name: currentTool, args })
        } catch {
          toolCalls.push({ name: currentTool, args: {} })
        }
      } else {
        toolCalls.push({ name: currentTool, args: {} })
      }
      argsBuffer = []
      collectingArgs = false
    }
  }

  for (const line of lines) {
    const toolMatch = line.match(/🔧 Calling tool:\s*(\w+)/)
    if (toolMatch) {
      saveCurrentTool()
      currentTool = toolMatch[1]
    } else if (line.trim().startsWith('Arguments:')) {
      collectingArgs = true
      const inlineMatch = line.match(/Arguments:\s*(\{.*)/)
      if (inlineMatch) {
        argsBuffer.push(inlineMatch[1])
      }
    } else if (collectingArgs && line.trim()) {
      argsBuffer.push(line.trim())
    } else if (currentTool && !collectingArgs && line.trim() && line.trim().startsWith('{')) {
      collectingArgs = true
      argsBuffer.push(line.trim())
    }
  }

  saveCurrentTool()
  return toolCalls
}

// Parse tool responses from content
function parseToolResponses(content: string): Array<{ name: string; result: unknown; isError: boolean }> {
  const responses: Array<{ name: string; result: unknown; isError: boolean }> = []
  const parts = content.split(/🔧 Tool Response \(([^)]+)\):/)
  
  for (let i = 1; i < parts.length; i += 2) {
    const name = parts[i]
    const resultText = parts[i + 1]?.trim() || ''
    
    try {
      const result = JSON.parse(resultText)
      const isError = result?.status === 'error' || result?.error
      responses.push({ name, result, isError })
    } catch {
      responses.push({ name, result: resultText, isError: false })
    }
  }
  
  return responses
}

// Check if content is structured output format (like "- validity_status: QUESTIONABLE")
function isStructuredOutput(content: string): boolean {
  return content.match(/^- \w+:/) !== null || content.match(/\n- \w+:/) !== null
}

function isJsonObject(content: string): boolean {
  try {
    const parsed = JSON.parse(content.trim())
    return !!parsed && typeof parsed === 'object' && !Array.isArray(parsed)
  } catch {
    return false
  }
}

function parseJsonObject(content: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(content.trim())
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

// Parse structured output format
function parseStructuredOutput(content: string): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {}
  const lines = content.split('\n')
  
  let currentKey: string | null = null
  let currentList: string[] = []
  let isInList = false
  
  for (const line of lines) {
    const keyMatch = line.match(/^- (\w+):\s*(.*)/)
    if (keyMatch) {
      // Save previous list if any
      if (currentKey && isInList && currentList.length > 0) {
        result[currentKey] = currentList
        currentList = []
      }
      
      currentKey = keyMatch[1]
      const value = keyMatch[2].trim()
      
      if (value) {
        result[currentKey] = value
        isInList = false
      } else {
        isInList = true
        currentList = []
      }
    } else if (isInList && line.trim().startsWith('- ')) {
      currentList.push(line.trim().replace(/^- /, ''))
    } else if (currentKey && !isInList && line.trim()) {
      // Multi-line value continuation
      result[currentKey] = (result[currentKey] || '') + ' ' + line.trim()
    }
  }
  
  // Save final list
  if (currentKey && isInList && currentList.length > 0) {
    result[currentKey] = currentList
  }
  
  return result
}

// Component: Formatted Claim Data
function ClaimDataDisplay({ claim }: { claim: Record<string, unknown> }) {
  const claimId = String(claim.claim_id || 'Unknown')
  const claimType = String(claim.claim_type || 'Unknown Type')
  const estimatedDamage = claim.estimated_damage ? Number(claim.estimated_damage) : null
  const claimantName = String(claim.claimant_name || 'Unknown')
  const incidentDate = claim.incident_date ? String(claim.incident_date) : null
  const location = claim.location ? String(claim.location) : null
  const description = claim.description ? String(claim.description) : null
  const witnessCount = claim.witness_statements ? String(claim.witness_statements) : null
  
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground mb-2">Processing Insurance Claim</div>
      
      {/* Header with Claim ID and Type */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="text-sm">
          {claimId}
        </Badge>
        <Badge variant="secondary">
          {claimType}
        </Badge>
        {estimatedDamage !== null ? (
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            ${estimatedDamage.toLocaleString()} estimated
          </span>
        ) : null}
      </div>

      {/* Claimant & Date */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <IconUser className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Claimant:</span>
          <span className="font-medium">{claimantName}</span>
        </div>
        {incidentDate !== null ? (
          <div className="flex items-center gap-2">
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Date:</span>
            <span className="font-medium">{incidentDate}</span>
          </div>
        ) : null}
      </div>

      {/* Location */}
      {location !== null ? (
        <div className="flex items-start gap-2 text-sm">
          <IconMapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <span className="text-muted-foreground">Location:</span>
          <span>{location}</span>
        </div>
      ) : null}

      {/* Description */}
      {description !== null ? (
        <div className="text-sm">
          <div className="flex items-center gap-2 mb-1">
            <IconFileDescription className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Description:</span>
          </div>
          <p className="pl-6 text-foreground">{description}</p>
        </div>
      ) : null}

      {/* Vehicle Info */}
      {claim.vehicle_info && typeof claim.vehicle_info === 'object' ? (
        <div className="text-sm">
          <div className="flex items-center gap-2 mb-2">
            <IconCar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Vehicle:</span>
          </div>
          <div className="pl-6 flex flex-wrap gap-2">
            {(() => {
              const v = claim.vehicle_info as Record<string, unknown>
              const vehicleStr = `${String(v.year || '')} ${String(v.make || '')} ${String(v.model || '')}`.trim()
              const vin = v.vin ? String(v.vin) : null
              const plate = v.license_plate ? String(v.license_plate) : null
              return (
                <>
                  {vehicleStr ? <Badge variant="outline">{vehicleStr}</Badge> : null}
                  {vin ? <Badge variant="secondary" className="font-mono text-xs">VIN: {vin}</Badge> : null}
                  {plate ? <Badge variant="outline">{plate}</Badge> : null}
                </>
              )
            })()}
          </div>
        </div>
      ) : null}

      {/* Evidence */}
      <div className="flex flex-wrap gap-4 text-sm">
        {claim.police_report !== undefined ? (
          <div className="flex items-center gap-1.5">
            {claim.police_report ? (
              <IconCheck className="h-4 w-4 text-green-500" />
            ) : (
              <IconX className="h-4 w-4 text-red-500" />
            )}
            <span className="text-muted-foreground">Police Report</span>
          </div>
        ) : null}
        {claim.photos_provided !== undefined ? (
          <div className="flex items-center gap-1.5">
            {claim.photos_provided ? (
              <IconCheck className="h-4 w-4 text-green-500" />
            ) : (
              <IconX className="h-4 w-4 text-red-500" />
            )}
            <span className="text-muted-foreground">Photos</span>
          </div>
        ) : null}
        {witnessCount !== null ? (
          <div className="flex items-center gap-1.5">
            <IconCheck className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">{witnessCount} Witness Statement(s)</span>
          </div>
        ) : null}
      </div>

      {/* Supporting Images */}
      {claim.supporting_images && Array.isArray(claim.supporting_images) && claim.supporting_images.length > 0 ? (
        <div className="text-sm">
          <div className="flex items-center gap-2 mb-1">
            <IconPhoto className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Attached Files:</span>
          </div>
          <div className="pl-6 space-y-1">
            {(claim.supporting_images as string[]).map((path, idx) => (
              <div key={idx} className="text-xs text-muted-foreground">
                📎 {String(path).split('/').pop()}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

// Component: Tool Calls Display
function ToolCallsDisplay({ toolCalls }: { toolCalls: Array<{ name: string; args: Record<string, unknown> }> }) {
  const [isOpen, setIsOpen] = React.useState(true)
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
        <IconTool className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium">Tool Calls</span>
        <Badge variant="secondary" className="text-xs">{toolCalls.length}</Badge>
        <IconChevronDown className={cn("h-4 w-4 ml-auto transition-transform", isOpen && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {toolCalls.map((tool, idx) => (
          <div key={idx} className="rounded-md bg-muted/50 p-3 border">
            <div className="flex items-center gap-2 mb-2">
              <code className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400">
                {tool.name}
              </code>
            </div>
            <pre className="text-xs bg-background/60 rounded p-2 overflow-x-auto font-mono">
              {JSON.stringify(tool.args, null, 2)}
            </pre>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

// Component: Tool Responses Display
function ToolResponsesDisplay({ responses }: { responses: Array<{ name: string; result: unknown; isError: boolean }> }) {
  const [isOpen, setIsOpen] = React.useState(true)
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
        <IconTool className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-medium">Tool Responses</span>
        <Badge variant="secondary" className="text-xs">{responses.length}</Badge>
        <IconChevronDown className={cn("h-4 w-4 ml-auto transition-transform", isOpen && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {responses.map((response, idx) => (
          <div key={idx} className={cn(
            "rounded-md p-3 border",
            response.isError ? "bg-red-500/10 border-red-500/30" : "bg-muted/50"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <code className="text-sm font-mono font-medium">
                {response.name}
              </code>
              {response.isError ? (
                <Badge variant="destructive" className="text-xs">Error</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">Success</Badge>
              )}
            </div>
            <pre className={cn(
              "text-xs rounded p-2 overflow-x-auto font-mono max-h-40 overflow-y-auto",
              response.isError ? "bg-red-500/10" : "bg-background/60"
            )}>
              {typeof response.result === 'object' 
                ? JSON.stringify(response.result, null, 2) 
                : String(response.result)}
            </pre>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

// Component: Structured Output Display
function StructuredOutputDisplay({ data }: { data: Record<string, unknown> }) {
  // Field display configuration
  const fieldConfig: Record<string, { label: string; type: 'status' | 'text' | 'list' }> = {
    validity_status: { label: 'Validity Status', type: 'status' },
    coverage_status: { label: 'Coverage Status', type: 'status' },
    risk_level: { label: 'Risk Level', type: 'status' },
    recommendation: { label: 'Recommendation', type: 'status' },
    confidence: { label: 'Confidence', type: 'status' },
    cost_assessment: { label: 'Cost Assessment', type: 'text' },
    coverage_details: { label: 'Coverage Details', type: 'text' },
    analysis: { label: 'Analysis', type: 'text' },
    summary: { label: 'Summary', type: 'text' },
    reasoning: { label: 'Reasoning', type: 'text' },
    red_flags: { label: 'Red Flags', type: 'list' },
    fraud_indicators: { label: 'Fraud Indicators', type: 'list' },
    cited_sections: { label: 'Cited Sections', type: 'list' },
    key_findings: { label: 'Key Findings', type: 'list' },
    next_steps: { label: 'Next Steps', type: 'list' },
  }

  const getStatusVariant = (value: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const upper = value.toUpperCase()
    if (['VALID', 'COVERED', 'LOW_RISK', 'APPROVE', 'HIGH', 'APPROVED'].includes(upper)) return 'default'
    if (['INVALID', 'NOT_COVERED', 'HIGH_RISK', 'DENY', 'LOW', 'DENIED'].includes(upper)) return 'destructive'
    if (['QUESTIONABLE', 'PARTIALLY_COVERED', 'MEDIUM_RISK', 'INVESTIGATE', 'MEDIUM', 'REQUIRES_INVESTIGATION'].includes(upper)) return 'secondary'
    return 'outline'
  }

  // Get specific styling for QUESTIONABLE and similar warning states
  const getStatusClassName = (value: string): string => {
    const upper = value.toUpperCase()
    if (['QUESTIONABLE', 'INVESTIGATE', 'REQUIRES_INVESTIGATION', 'MEDIUM_RISK'].includes(upper)) {
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50'
    }
    if (['VALID', 'COVERED', 'LOW_RISK', 'APPROVE', 'HIGH', 'APPROVED'].includes(upper)) {
      return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50'
    }
    if (['INVALID', 'NOT_COVERED', 'HIGH_RISK', 'DENY', 'LOW', 'DENIED'].includes(upper)) {
      return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50'
    }
    return ''
  }

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => {
        const config = fieldConfig[key] || { label: key.replace(/_/g, ' '), type: 'text' }
        
        if (config.type === 'status' && typeof value === 'string') {
          const statusClass = getStatusClassName(value)
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground capitalize">{config.label}:</span>
              <Badge variant={getStatusVariant(value)} className={cn(statusClass, "font-medium")}>
                {value.replace(/_/g, ' ')}
              </Badge>
            </div>
          )
        }
        
        if (Array.isArray(value)) {
          const isPrimitiveList = value.every(
            (item) => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
          )
          if (!isPrimitiveList) {
            return (
              <div key={key}>
                <div className="text-sm font-medium text-muted-foreground mb-1 capitalize">
                  {config.label}
                </div>
                <pre className="text-xs rounded p-2 bg-background/60 border overflow-x-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            )
          }
          return (
            <div key={key}>
              <div className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                {key === 'red_flags' || key === 'fraud_indicators' ? (
                  <IconAlertTriangle className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <IconCheck className="h-3.5 w-3.5 text-green-500" />
                )}
                {config.label}
              </div>
              <ul className="space-y-1 pl-5">
                {value.map((item, idx) => (
                  <li key={idx} className={cn(
                    "text-sm",
                    (key === 'red_flags' || key === 'fraud_indicators') && "text-red-700 dark:text-red-400"
                  )}>
                    • {String(item)}
                  </li>
                ))}
              </ul>
            </div>
          )
        }

        if (value && typeof value === 'object') {
          return (
            <div key={key}>
              <div className="text-sm font-medium text-muted-foreground mb-1 capitalize">
                {config.label}
              </div>
              <pre className="text-xs rounded p-2 bg-background/60 border overflow-x-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          )
        }
        
        return (
          <div key={key}>
            <div className="text-sm font-medium text-muted-foreground mb-1 capitalize">
              {config.label}
            </div>
            <p className="text-sm leading-relaxed">{String(value)}</p>
          </div>
        )
      })}
    </div>
  )
}

// Main Component
export const ConversationStep = React.memo(function ConversationStep({ 
  step, 
  stepNumber, 
  isLast,
  agentName 
}: ConversationStepProps) {
  const isUser = step.role === 'human' || step.role === 'user'
  const nodeOrAgent = step.node || agentName || ''
  const agentConfig = AGENT_CONFIG[nodeOrAgent]
  
  // Skip internal messages
  if (step.content.includes('transfer_back_to_supervisor')) {
    return null
  }

  // Determine content type and parse accordingly
  const claimData = isUser && isClaimJson(step.content) ? parseClaimJson(step.content) : null
  const toolCalls = hasToolCalls(step.content) ? parseToolCalls(step.content) : null
  const toolResponses = hasToolResponses(step.content) ? parseToolResponses(step.content) : null
  const jsonOutput = !claimData && !toolCalls && !toolResponses && isJsonObject(step.content)
    ? parseJsonObject(step.content)
    : null
  const structuredOutput = !claimData && !toolCalls && !toolResponses && !jsonOutput && isStructuredOutput(step.content)
    ? parseStructuredOutput(step.content)
    : null

  return (
    <div className="relative">
      <div className="flex gap-4">
        {/* Timeline connector */}
        <div className="flex flex-col items-center">
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2",
            agentConfig ? `${agentConfig.bgColor} ${agentConfig.borderColor}` :
            isUser ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' :
            toolResponses ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800' :
            'bg-gray-100 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800'
          )}>
            {agentConfig ? (
              <agentConfig.icon className={`h-5 w-5 ${agentConfig.color}`} />
            ) : isUser ? (
              <IconUser className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            ) : toolResponses ? (
              <IconTool className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            ) : (
              <IconRobot className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </div>
          {/* Connecting line */}
          {!isLast && (
            <div className="w-0.5 flex-1 min-h-8 bg-border mt-2" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={isUser ? 'secondary' : 'default'}>
              {agentConfig ? agentConfig.displayName : 
               isUser ? 'User' : 
               toolResponses ? 'Tool Response' : 
               nodeOrAgent || 'Assistant'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Step {stepNumber}
            </span>
          </div>
          
          <Card className={cn(
            "shadow-sm",
            agentConfig ? `${agentConfig.bgColor} ${agentConfig.borderColor}` :
            isUser ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' :
            toolResponses ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800' :
            'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800'
          )}>
            <CardContent className="p-4">
              {/* Render based on content type */}
              {claimData ? (
                <ClaimDataDisplay claim={claimData} />
              ) : toolCalls ? (
                <ToolCallsDisplay toolCalls={toolCalls} />
              ) : toolResponses ? (
                <ToolResponsesDisplay responses={toolResponses} />
              ) : jsonOutput ? (
                <StructuredOutputDisplay data={jsonOutput} />
              ) : structuredOutput ? (
                <StructuredOutputDisplay data={structuredOutput} />
              ) : (
                <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {step.content}
                  </ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
})

export default ConversationStep
