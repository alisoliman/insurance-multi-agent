'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  IconBrain, 
  IconGitBranch, 
  IconFileText, 
  IconUsers, 
  IconSettings,
  IconEye,
  IconAlertTriangle
} from '@tabler/icons-react'

import { DecisionTreeVisualization } from './DecisionTreeVisualization'
import { ReasoningAccordion } from './ReasoningAccordion'
import { SourceAttributionCard } from './SourceAttributionCard'
import { AgentTimelineView } from './AgentTimelineView'
import { InterventionControls } from './InterventionControls'

export interface ExplainabilityData {
  decisionId: string
  agentName: string
  decision: string
  confidence: number
  reasoning: string
  decisionTree: DecisionNode[]
  sources: SourceDocument[]
  agentCommunications: AgentCommunication[]
  riskFactors: RiskFactor[]
  interventionPoints: InterventionPoint[]
  metadata: Record<string, unknown>
}

export interface DecisionNode {
  id: string
  label: string
  type: 'condition' | 'action' | 'outcome'
  confidence: number
  children?: DecisionNode[]
  metadata?: Record<string, unknown>
}

export interface SourceDocument {
  id: string
  title: string
  type: 'policy' | 'regulation' | 'precedent' | 'data'
  relevance: number
  excerpt: string
  url?: string
}

export interface AgentCommunication {
  id: string
  timestamp: string
  fromAgent: string
  toAgent: string
  message: string
  type: 'request' | 'response' | 'notification'
  confidence?: number
}

export interface RiskFactor {
  id: string
  factor: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  description: string
  mitigation?: string
}

export interface InterventionPoint {
  id: string
  stage: string
  description: string
  canOverride: boolean
  requiresApproval: boolean
}

interface ExplainabilityPanelProps {
  data: ExplainabilityData
  onIntervention?: (interventionId: string, action: string) => void
  className?: string
}

export function ExplainabilityPanel({ 
  data, 
  onIntervention,
  className = "" 
}: ExplainabilityPanelProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800 border-green-200"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision.toLowerCase()) {
      case 'approve':
      case 'approved':
        return <IconBrain className="h-4 w-4 text-green-600" />
      case 'deny':
      case 'denied':
        return <IconAlertTriangle className="h-4 w-4 text-red-600" />
      case 'review':
      case 'needs_review':
        return <IconEye className="h-4 w-4 text-yellow-600" />
      default:
        return <IconSettings className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center space-x-2">
              {getDecisionIcon(data.decision)}
              <span>Decision Explainability</span>
              <Badge className={getConfidenceColor(data.confidence)}>
                {Math.round(data.confidence * 100)}% confidence
              </Badge>
            </CardTitle>
            <CardDescription>
              Detailed analysis and reasoning for {data.agentName} decision: {data.decision}
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            ID: {data.decisionId}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-1">
              <IconBrain className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="decision-tree" className="flex items-center space-x-1">
              <IconGitBranch className="h-4 w-4" />
              <span>Decision Tree</span>
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex items-center space-x-1">
              <IconFileText className="h-4 w-4" />
              <span>Sources</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center space-x-1">
              <IconUsers className="h-4 w-4" />
              <span>Agent Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="controls" className="flex items-center space-x-1">
              <IconSettings className="h-4 w-4" />
              <span>Controls</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <ReasoningAccordion 
              reasoning={data.reasoning}
              riskFactors={data.riskFactors}
              confidence={data.confidence}
              expandedSections={expandedSections}
              onToggleSection={(sectionId) => {
                setExpandedSections(prev => 
                  prev.includes(sectionId) 
                    ? prev.filter(id => id !== sectionId)
                    : [...prev, sectionId]
                )
              }}
            />
          </TabsContent>

          <TabsContent value="decision-tree" className="mt-4">
            <DecisionTreeVisualization 
              nodes={data.decisionTree}
              highlightPath={true}
            />
          </TabsContent>

          <TabsContent value="sources" className="space-y-4 mt-4">
            <div className="grid gap-4">
              {data.sources.map((source) => (
                <SourceAttributionCard 
                  key={source.id}
                  source={source}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <AgentTimelineView 
              communications={data.agentCommunications}
            />
          </TabsContent>

          <TabsContent value="controls" className="mt-4">
            <InterventionControls 
              interventionPoints={data.interventionPoints}
              onIntervention={onIntervention}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 