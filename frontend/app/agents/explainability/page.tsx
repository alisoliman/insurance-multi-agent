'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  IconBrain,
  IconRefresh,
  IconDownload,
  IconShare,
  IconInfoCircle
} from '@tabler/icons-react'

import { 
  ExplainabilityPanel,
  ExplainabilityData,
  DecisionNode,
  SourceDocument,
  AgentCommunication,
  RiskFactor,
  InterventionPoint
} from '@/components/explainability'

// Sample data for demonstration
const sampleDecisionTree: DecisionNode[] = [
  {
    id: 'root',
    label: 'Claim Assessment Initiated',
    type: 'condition',
    confidence: 0.95,
    children: [
      {
        id: 'policy-check',
        label: 'Policy Coverage Verification',
        type: 'condition',
        confidence: 0.92,
        metadata: { policyNumber: 'POL-2024-001', coverageType: 'Comprehensive' },
        children: [
          {
            id: 'coverage-confirmed',
            label: 'Coverage Confirmed',
            type: 'action',
            confidence: 0.88,
            children: [
              {
                id: 'fraud-analysis',
                label: 'Fraud Risk Analysis',
                type: 'condition',
                confidence: 0.85,
                children: [
                  {
                    id: 'low-fraud-risk',
                    label: 'Low Fraud Risk Detected',
                    type: 'outcome',
                    confidence: 0.91,
                    metadata: { fraudScore: 0.15, riskLevel: 'Low' }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]

const sampleSources: SourceDocument[] = [
  {
    id: 'policy-doc-001',
    title: 'Comprehensive Auto Insurance Policy - Section 4.2',
    type: 'policy',
    relevance: 0.94,
    excerpt: 'Coverage includes collision damage, comprehensive coverage for theft, vandalism, and natural disasters. Deductible applies as specified in the policy schedule.',
    url: 'https://example.com/policy/section-4-2'
  },
  {
    id: 'regulation-dmv-2024',
    title: 'State DMV Regulation 2024-15: Vehicle Damage Assessment',
    type: 'regulation',
    relevance: 0.87,
    excerpt: 'All vehicle damage assessments must include photographic evidence and certified repair estimates from licensed facilities.',
    url: 'https://example.com/regulations/dmv-2024-15'
  },
  {
    id: 'precedent-case-456',
    title: 'Similar Claim Resolution - Case #CLM-2024-456',
    type: 'precedent',
    relevance: 0.76,
    excerpt: 'Vehicle with similar damage pattern and circumstances was approved for full coverage after independent assessment confirmed repair estimates.',
  },
  {
    id: 'claims-data-analysis',
    title: 'Historical Claims Data Analysis',
    type: 'data',
    relevance: 0.82,
    excerpt: 'Analysis of 10,000+ similar claims shows 94% approval rate for claims with complete documentation and low fraud indicators.'
  }
]

const sampleCommunications: AgentCommunication[] = [
  {
    id: 'comm-001',
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    fromAgent: 'Assessment Agent',
    toAgent: 'Orchestrator Agent',
    message: 'Initial claim assessment completed. Policy coverage verified, documentation complete. Proceeding with fraud analysis.',
    type: 'response',
    confidence: 0.92
  },
  {
    id: 'comm-002',
    timestamp: new Date(Date.now() - 240000).toISOString(), // 4 minutes ago
    fromAgent: 'Orchestrator Agent',
    toAgent: 'Fraud Detection Agent',
    message: 'Please analyze claim CLM-2024-789 for fraud indicators. Priority: Standard. Expected completion: 2 minutes.',
    type: 'request'
  },
  {
    id: 'comm-003',
    timestamp: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
    fromAgent: 'Fraud Detection Agent',
    toAgent: 'Orchestrator Agent',
    message: 'Fraud analysis complete. Risk score: 0.15 (Low). No suspicious patterns detected. Claim appears legitimate.',
    type: 'response',
    confidence: 0.89
  },
  {
    id: 'comm-004',
    timestamp: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
    fromAgent: 'Orchestrator Agent',
    toAgent: 'Communication Agent',
    message: 'Prepare approval notification for customer. Include repair shop recommendations and next steps.',
    type: 'request'
  },
  {
    id: 'comm-005',
    timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    fromAgent: 'System Monitor',
    toAgent: 'All Agents',
    message: 'Claim processing workflow completed successfully. Total processing time: 4 minutes 23 seconds.',
    type: 'notification'
  }
]

const sampleRiskFactors: RiskFactor[] = [
  {
    id: 'risk-001',
    factor: 'High Claim Amount',
    severity: 'medium',
    confidence: 0.78,
    description: 'Claim amount of $8,500 is above average for similar incidents but within policy limits.',
    mitigation: 'Verified with independent repair estimates from certified facilities.'
  },
  {
    id: 'risk-002',
    factor: 'Recent Policy Activation',
    severity: 'low',
    confidence: 0.65,
    description: 'Policy was activated 45 days ago, which is within normal range for legitimate claims.',
    mitigation: 'Customer has clean driving record and no previous claims history.'
  },
  {
    id: 'risk-003',
    factor: 'Weather-Related Incident',
    severity: 'low',
    confidence: 0.91,
    description: 'Incident occurred during documented severe weather event in the area.',
    mitigation: 'Weather reports confirm hail storm in customer location at time of incident.'
  }
]

const sampleInterventionPoints: InterventionPoint[] = [
  {
    id: 'intervention-001',
    stage: 'Final Approval',
    description: 'Override automatic approval decision and require manual review.',
    canOverride: true,
    requiresApproval: false
  },
  {
    id: 'intervention-002',
    stage: 'Payment Authorization',
    description: 'Modify payment amount or add additional conditions.',
    canOverride: true,
    requiresApproval: true
  },
  {
    id: 'intervention-003',
    stage: 'Fraud Investigation',
    description: 'Escalate to specialized fraud investigation team.',
    canOverride: false,
    requiresApproval: false
  }
]

const sampleExplainabilityData: ExplainabilityData = {
  decisionId: 'DEC-2024-789-001',
  agentName: 'Assessment Agent',
  decision: 'approve',
  confidence: 0.89,
  reasoning: 'Based on comprehensive analysis of the submitted claim, all policy requirements have been met. The incident is covered under the comprehensive coverage section of the policy. Documentation is complete and authentic. Fraud risk analysis indicates low probability of fraudulent activity. Repair estimates are reasonable and within market standards for the reported damage.',
  decisionTree: sampleDecisionTree,
  sources: sampleSources,
  agentCommunications: sampleCommunications,
  riskFactors: sampleRiskFactors,
  interventionPoints: sampleInterventionPoints,
  metadata: {
    claimId: 'CLM-2024-789',
    policyNumber: 'POL-2024-001',
    processingTime: '4m 23s',
    totalCost: 8500,
    currency: 'USD'
  }
}

export default function ExplainabilityDemo() {
  const [isLoading, setIsLoading] = useState(false)
  const [explainabilityData] = useState<ExplainabilityData>(sampleExplainabilityData)

  const handleIntervention = async (interventionId: string, action: string, reason?: string) => {
    console.log('Intervention triggered:', { interventionId, action, reason })
    // In a real implementation, this would call the backend API
    alert(`Intervention ${action} for ${interventionId}${reason ? `: ${reason}` : ''}`)
  }

  const handleRefreshData = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // In a real implementation, this would fetch fresh data
    }, 1000)
  }

  const handleExportData = () => {
    const dataStr = JSON.stringify(explainabilityData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `explainability-${explainabilityData.decisionId}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleShareData = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Decision Explainability Report',
          text: `Decision analysis for ${explainabilityData.decisionId}`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy URL to clipboard
      await navigator.clipboard.writeText(window.location.href)
      alert('URL copied to clipboard!')
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Explainability Demo</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive AI decision transparency and human oversight interface
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleRefreshData}
            disabled={isLoading}
          >
            <IconRefresh className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportData}
          >
            <IconDownload className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button
            variant="outline"
            onClick={handleShareData}
          >
            <IconShare className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
                          <IconInfoCircle className="h-4 w-4" />
        <AlertDescription>
          This demo showcases comprehensive explainability features for AI agent decisions. 
          All data shown is simulated for demonstration purposes.
        </AlertDescription>
      </Alert>

      {/* Decision Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <IconBrain className="h-5 w-5" />
            <span>Decision Summary</span>
          </CardTitle>
          <CardDescription>
            High-level overview of the AI decision and key metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Decision</div>
              <Badge className="bg-green-100 text-green-800 text-base px-3 py-1">
                {explainabilityData.decision.toUpperCase()}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Confidence</div>
              <div className="text-2xl font-bold">
                {Math.round(explainabilityData.confidence * 100)}%
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Processing Time</div>
              <div className="text-2xl font-bold">
                {explainabilityData.metadata.processingTime}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Claim Amount</div>
              <div className="text-2xl font-bold">
                ${explainabilityData.metadata.totalCost.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Explainability Panel */}
      <ExplainabilityPanel
        data={explainabilityData}
        onIntervention={handleIntervention}
      />

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Features Demonstrated</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Interactive decision tree visualization</li>
                <li>• Expandable reasoning sections</li>
                <li>• Source document attribution</li>
                <li>• Real-time agent communications</li>
                <li>• Human intervention controls</li>
                <li>• Confidence scoring throughout</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Technical Implementation</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• TypeScript interfaces for type safety</li>
                <li>• shadcn/ui components for consistency</li>
                <li>• Responsive design for all screen sizes</li>
                <li>• Accessibility features built-in</li>
                <li>• Modular component architecture</li>
                <li>• Real-time data updates support</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 