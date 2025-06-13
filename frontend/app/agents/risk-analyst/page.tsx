'use client'

import React, { useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  IconTrendingUp,
  IconPlayerPlay,
  IconRefresh,
  IconAlertCircle,
  IconCircleCheck,
  IconClock,
  IconAlertTriangle,
  IconEye,
  IconTarget
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { getApiUrl } from "@/lib/config"
import { AgentWorkflowVisualization } from "@/components/agent-workflow-visualization"

interface ClaimData {
  claim_id?: string
  policy_number: string
  claimant_name: string
  incident_date: string
  claim_type: string
  description: string
  estimated_damage: number
  location: string
  police_report: boolean
  photos_provided: boolean
  witness_statements: string
}

interface RiskAnalysisResult {
  success: boolean
  agent_name: string
  claim_body: ClaimData
  conversation_chronological: Array<{
    role: string
    content: string
  }>
}

const SAMPLE_CLAIMS = [
  {
    claim_id: "CLM-2024-001",
    policy_number: "POL-2024-001",
    claimant_name: "John Smith",
    incident_date: "2024-01-15",
    claim_type: "Auto Accident",
    description: "Rear-end collision at intersection. Vehicle sustained damage to rear bumper, trunk, and tail lights. No injuries reported.",
    estimated_damage: 4500,
    location: "Main St & Oak Ave, Springfield",
    police_report: true,
    photos_provided: true,
    witness_statements: "2"
  },
  {
    claim_id: "CLM-2024-002", 
    policy_number: "POL-2024-001",
    claimant_name: "John Smith",
    incident_date: "2024-02-15",
    claim_type: "Major Collision",
    description: "Multi-vehicle accident on highway during rush hour. Extensive front-end damage, airbag deployment.",
    estimated_damage: 45000,
    location: "Highway 101, Mile Marker 45",
    police_report: true,
    photos_provided: true,
    witness_statements: "3"
  },
  {
    claim_id: "CLM-2024-003",
    policy_number: "POL-2024-999",
    claimant_name: "Mike Wilson", 
    incident_date: "2024-03-01",
    claim_type: "Vandalism",
    description: "Vehicle vandalized while parked overnight. Extensive scratches and broken windows.",
    estimated_damage: 12000,
    location: "Unknown parking lot",
    police_report: false,
    photos_provided: false,
    witness_statements: "0"
  }
]

export default function RiskAnalystDemo() {
  const [claimData, setClaimData] = useState<ClaimData>({
    policy_number: '',
    claimant_name: '',
    incident_date: '',
    claim_type: '',
    description: '',
    estimated_damage: 0,
    location: '',
    police_report: false,
    photos_provided: false,
    witness_statements: '0'
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<RiskAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadSampleClaim = (sampleClaim: typeof SAMPLE_CLAIMS[0]) => {
    setClaimData(sampleClaim)
    setResult(null)
    setError(null)
  }

  const runRiskAnalysis = async () => {
    if (!claimData.policy_number || !claimData.claimant_name || !claimData.description) {
      toast.error('Please fill in required fields')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const apiUrl = await getApiUrl()
      const response = await fetch(`${apiUrl}/api/v1/agent/risk_analyst/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(claimData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: RiskAnalysisResult = await response.json()
      setResult(data)
      toast.success('Risk analysis completed successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast.error('Risk analysis failed: ' + errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setClaimData({
      policy_number: '',
      claimant_name: '',
      incident_date: '',
      claim_type: '',
      description: '',
      estimated_damage: 0,
      location: '',
      police_report: false,
      photos_provided: false,
      witness_statements: '0'
    })
    setResult(null)
    setError(null)
  }

  const formatContent = (content: string) => {
    // Hide tool calls
    if (content.startsWith('TOOL_CALL:') || content.includes('"type": "tool_call"')) {
      return null
    }
    
    // Format risk analysis results
    if (content.includes('Risk Score:') || content.includes('RISK:') || content.includes('Fraud Risk:')) {
      const lines = content.split('\n')
      return (
        <div className="space-y-2">
          {lines.map((line, idx) => {
            if (line.includes('Risk Score:') || line.includes('RISK:') || line.includes('Fraud Risk:')) {
              const [label, value] = line.split(':')
              const riskLevel = value?.trim().toLowerCase()
              return (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-medium">{label}:</span>
                  <Badge variant={riskLevel === 'high' || riskLevel === 'suspicious' ? 'destructive' : 
                                riskLevel === 'medium' || riskLevel === 'moderate' ? 'secondary' : 'default'}>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <IconTrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Risk Analyst Demo</h1>
            <p className="text-muted-foreground">
              Test the risk analysis agent that evaluates fraud indicators and risk factors
            </p>
          </div>
        </div>
      </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  
                  {/* Input Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconAlertTriangle className="h-5 w-5" />
                        Risk Assessment
                      </CardTitle>
                      <CardDescription>
                        Enter claim details for fraud and risk analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      
                      {/* Sample Claims */}
                      <div>
                        <Label className="text-sm font-medium">Sample Claims</Label>
                        <div className="grid gap-2 mt-2">
                          {SAMPLE_CLAIMS.map((sample, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              onClick={() => loadSampleClaim(sample)}
                              className="justify-start text-left h-auto p-3"
                            >
                              <div>
                                <div className="font-medium">{sample.claim_type}</div>
                                <div className="text-xs text-muted-foreground">
                                  ${sample.estimated_damage.toLocaleString()} • {sample.police_report ? 'Police Report' : 'No Police Report'}
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Form Fields */}
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="policy_number">Policy Number *</Label>
                            <Input
                              id="policy_number"
                              value={claimData.policy_number}
                              onChange={(e) => setClaimData({...claimData, policy_number: e.target.value})}
                              placeholder="POL-2024-001"
                            />
                          </div>
                          <div>
                            <Label htmlFor="claimant_name">Claimant Name *</Label>
                            <Input
                              id="claimant_name"
                              value={claimData.claimant_name}
                              onChange={(e) => setClaimData({...claimData, claimant_name: e.target.value})}
                              placeholder="John Smith"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="incident_date">Incident Date</Label>
                            <Input
                              id="incident_date"
                              type="date"
                              value={claimData.incident_date}
                              onChange={(e) => setClaimData({...claimData, incident_date: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="claim_type">Claim Type</Label>
                            <Select value={claimData.claim_type} onValueChange={(value) => setClaimData({...claimData, claim_type: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Auto Accident">Auto Accident</SelectItem>
                                <SelectItem value="Major Collision">Major Collision</SelectItem>
                                <SelectItem value="Vandalism">Vandalism</SelectItem>
                                <SelectItem value="Theft">Theft</SelectItem>
                                <SelectItem value="Weather Damage">Weather Damage</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="description">Description *</Label>
                          <Textarea
                            id="description"
                            value={claimData.description}
                            onChange={(e) => setClaimData({...claimData, description: e.target.value})}
                            placeholder="Describe the incident in detail..."
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="estimated_damage">Estimated Damage ($)</Label>
                            <Input
                              id="estimated_damage"
                              type="number"
                              value={claimData.estimated_damage}
                              onChange={(e) => setClaimData({...claimData, estimated_damage: Number(e.target.value)})}
                              placeholder="4500"
                            />
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={claimData.location}
                              onChange={(e) => setClaimData({...claimData, location: e.target.value})}
                              placeholder="Main St & Oak Ave"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="police_report"
                              checked={claimData.police_report}
                              onChange={(e) => setClaimData({...claimData, police_report: e.target.checked})}
                              className="rounded"
                              aria-label="Police Report Filed"
                            />
                            <Label htmlFor="police_report" className="text-sm">Police Report</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="photos_provided"
                              checked={claimData.photos_provided}
                              onChange={(e) => setClaimData({...claimData, photos_provided: e.target.checked})}
                              className="rounded"
                              aria-label="Photos Provided"
                            />
                            <Label htmlFor="photos_provided" className="text-sm">Photos Provided</Label>
                          </div>
                          <div>
                            <Label htmlFor="witness_statements" className="text-sm">Witnesses</Label>
                            <Input
                              id="witness_statements"
                              value={claimData.witness_statements}
                              onChange={(e) => setClaimData({...claimData, witness_statements: e.target.value})}
                              placeholder="0"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          onClick={runRiskAnalysis} 
                          disabled={isLoading}
                          className="flex-1"
                        >
                          {isLoading ? (
                            <>
                              <IconClock className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing Risk...
                            </>
                          ) : (
                            <>
                              <IconPlayerPlay className="mr-2 h-4 w-4" />
                              Analyze Risk Factors
                            </>
                          )}
                        </Button>
                        <Button variant="outline" onClick={resetForm}>
                          <IconRefresh className="mr-2 h-4 w-4" />
                          Reset
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Results */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconEye className="h-5 w-5" />
                        Risk Analysis Results
                      </CardTitle>
                      <CardDescription>
                        Fraud detection and risk factor evaluation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {error && (
                        <Alert className="mb-4">
                          <IconAlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      {result ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <IconCircleCheck className="h-5 w-5 text-green-500" />
                            <span className="font-medium">Risk Analysis Completed</span>
                            <Badge variant="default">risk_analyst</Badge>
                          </div>

                          <Separator />

                          <ScrollArea className="h-96">
                            <div className="space-y-4">
                              {result.conversation_chronological.map((entry, idx) => (
                                <div key={idx} className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={entry.role === 'assistant' ? 'default' : 'secondary'}>
                                      {entry.role}
                                    </Badge>
                                  </div>
                                  <div className="bg-muted/50 rounded-lg p-3">
                                    {formatContent(entry.content)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <IconTrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Run a risk analysis to see results here</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Agent Description */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconTarget className="h-5 w-5" />
                      About the Risk Analyst Agent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium mb-2">Primary Functions</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Evaluates fraud risk indicators</li>
                          <li>• Analyzes claim patterns and anomalies</li>
                          <li>• Assesses documentation completeness</li>
                          <li>• Calculates overall risk scores</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Key Capabilities</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Fraud pattern detection</li>
                          <li>• Historical claim analysis</li>
                          <li>• Risk factor scoring</li>
                          <li>• Suspicious activity flagging</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

      {/* Workflow Visualization */}
      <AgentWorkflowVisualization currentAgent="risk_analyst" />
    </div>
  )
} 