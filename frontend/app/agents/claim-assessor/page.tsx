'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { 
  IconFileText,
  IconRefresh,
  IconCircleCheck,
  IconAlertCircle,
  IconClock,
  IconUser,
  IconRobot,
  IconTool,
  IconBook,
  IconUpload,
  IconX
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
  claim_body: Record<string, unknown>
  conversation_chronological: Array<{
    role: string
    content: string
  }>
}

export default function ClaimAssessorDemo() {
  const [sampleClaims, setSampleClaims] = useState<SampleClaim[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSamples, setIsLoadingSamples] = useState(true)
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const allowed = ['image/jpeg', 'image/png', 'image/bmp', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const valid = files.filter(f => {
      if (!allowed.includes(f.type)) { 
        toast.error(`Unsupported type: ${f.name}`)
        return false 
      }
      if (f.size > 10 * 1024 * 1024) { 
        toast.error(`File too large: ${f.name}`)
        return false 
      }
      return true
    })
    if (valid.length > 0) {
      setUploadedFiles(prev => [...prev, ...valid])
      toast.success(`${valid.length} file(s) added`)
      setError(null)
    }
  }

  const removeFile = (idx: number) => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))

  const runAssessment = async (claim: SampleClaim) => {
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

      // Run the assessment with or without supporting images
      const requestBody = paths.length > 0
        ? { claim_id: claim.claim_id, supporting_images: paths }
        : { claim_id: claim.claim_id }

      const response = await fetch(`${apiUrl}/api/v1/agent/claim_assessor/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
    setResult(null)
    setError(null)
    setUploadedFiles([])
  }

  const formatConversationStep = (step: { role: string; content: string }, index: number, isLast: boolean) => {
    const isUser = step.role === 'human'
    const isAssistant = step.role === 'ai'

    // Skip tool calls in the display
    if (step.content.startsWith('TOOL_CALL:')) {
      return null
    }

    return (
      <div key={index} className="relative">
        <div className="flex gap-4">
          {/* Timeline connector */}
          <div className="flex flex-col items-center">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              isUser ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' :
              isAssistant ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800' :
              'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800'
            }`}>
              {isUser ? (
                <IconUser className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : isAssistant ? (
                <IconRobot className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <IconTool className="h-5 w-5 text-orange-600 dark:text-orange-400" />
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
              <Badge variant={isUser ? 'secondary' : isAssistant ? 'default' : 'outline'}>
                {isUser ? 'User' : isAssistant ? 'Claim Assessor' : 'Tool Response'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Step {index + 1}
              </span>
            </div>
            
            <div className={`rounded-lg p-4 shadow-sm ${
              isUser ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800' :
              isAssistant ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' :
              'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800'
            }`}>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {step.content}
              </div>
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
    
    // Extract assessment decision - try multiple patterns in order of specificity
    let assessment = 'PENDING'
    
    // First try to find explicit assessment patterns
    const assessmentPatterns = [
      /Assessment:\s*(APPROVED|DENIED|INVALID|QUESTIONABLE|VALID)/i,
      /Final Assessment:\s*(APPROVED|DENIED|INVALID|QUESTIONABLE|VALID)/i,
      /Assessment:\s*(\w+)/i,
      /Final Assessment:\s*(\w+)/i,
    ]
    
    for (const pattern of assessmentPatterns) {
      const match = content.match(pattern)
      if (match && match[1]) {
        const candidate = match[1].toUpperCase()
        // Only accept valid assessment values
        if (['APPROVED', 'DENIED', 'INVALID', 'QUESTIONABLE', 'VALID'].includes(candidate)) {
          assessment = candidate
          break
        }
      }
    }
    
    // If no explicit assessment found, look for standalone assessment words at the end
    if (assessment === 'PENDING') {
      const endMatch = content.match(/\b(APPROVED|DENIED|INVALID|QUESTIONABLE|VALID)\b(?!.*\b(?:APPROVED|DENIED|INVALID|QUESTIONABLE|VALID)\b)/i)
      if (endMatch) {
        assessment = endMatch[1].toUpperCase()
      }
    }
    
    return {
      decision: assessment,
      reasoning: content
    }
  }

  return (
    <div className="space-y-6">
      {/* Agent Overview Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <IconFileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Claim Assessor Agent</h1>
              <p className="text-sm text-muted-foreground font-normal">
                Specialized in damage evaluation and cost assessment
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconTool className="h-4 w-4" />
                Available Tools
              </h3>
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <IconFileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Vehicle Details</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Validates damage estimates using VIN numbers
                  </p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <IconFileText className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-sm">Image Analysis</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Analyzes uploaded images to extract damage details, categorize document types, and identify key information
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconCircleCheck className="h-4 w-4" />
                Assessment Outcomes
              </h3>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default" className="text-xs">VALID</Badge>
                  <Badge variant="secondary" className="text-xs">QUESTIONABLE</Badge>
                  <Badge variant="destructive" className="text-xs">INVALID</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Possible assessment results from the agent
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
            <IconFileText className="h-5 w-5" />
            Sample Claims
          </CardTitle>
          <CardDescription>
            Select a sample claim and optionally upload supporting documents to run through the claim assessor agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* File Upload Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Supporting Documents</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-muted-foreground/50 transition-colors">
              <IconUpload className="mx-auto h-6 w-6 text-muted-foreground" />
              <Label htmlFor="claim-assessor-upload" className="cursor-pointer block mt-2">
                <span className="text-sm text-primary hover:text-primary/80 transition-colors">Upload files</span>
                <input 
                  id="claim-assessor-upload" 
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

          {isLoadingSamples ? (
            <div className="flex items-center justify-center py-8">
              <IconClock className="h-6 w-6 animate-spin mr-2" />
              <span>Loading sample claims...</span>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
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
                        onClick={() => runAssessment(claim)}
                      >
                        {isLoading ? 'Processing...' : 'Analyze Claim'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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

      {/* Results - Full Width */}
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
              <div className="space-y-6">
                {/* Final Assessment Summary */}
                {(() => {
                  const assessment = extractFinalAssessment(result.conversation_chronological)
                  return assessment && (
                    <div className="bg-muted/50 rounded-lg p-4">
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
                               <div className="bg-muted/50 rounded p-2 text-xs max-w-full">
                                 {key === 'supporting_images' && Array.isArray(value) ? (
                                   <div className="space-y-1">
                                     {value.map((path: string, idx: number) => (
                                       <div key={idx} className="text-xs text-muted-foreground break-all">
                                         📎 {path.split('/').pop() || path}
                                       </div>
                                     ))}
                                   </div>
                                 ) : (
                                   <pre className="whitespace-pre-wrap overflow-x-auto break-words text-wrap max-w-full">
                                     {JSON.stringify(value, null, 2)}
                                   </pre>
                                 )}
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
                  <ScrollArea className="h-96">
                    <div className="py-4">
                      {result.conversation_chronological
                        .map((step, index, array) => formatConversationStep(step, index, index === array.length - 1))
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

      {/* Workflow Visualization */}
      <AgentWorkflowVisualization currentAgent="claim-assessor" />
    </div>
  )
} 