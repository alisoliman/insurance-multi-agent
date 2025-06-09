'use client'

import React from 'react'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  IconChevronDown,
  IconChevronRight,
  IconAlertTriangle,
  IconShield,
  IconBrain,
  IconTarget
} from '@tabler/icons-react'

import { RiskFactor } from './ExplainabilityPanel'

interface ReasoningAccordionProps {
  reasoning: string
  riskFactors: RiskFactor[]
  confidence: number
  expandedSections: string[]
  onToggleSection: (sectionId: string) => void
}

export function ReasoningAccordion({
  reasoning,
  riskFactors,
  confidence,
  expandedSections,
  onToggleSection
}: ReasoningAccordionProps) {
  const isExpanded = (sectionId: string) => expandedSections.includes(sectionId)

  const getSeverityColor = (severity: RiskFactor['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: RiskFactor['severity']) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <IconAlertTriangle className="h-4 w-4" />
      case 'medium':
        return <IconShield className="h-4 w-4" />
      case 'low':
        return <IconTarget className="h-4 w-4" />
      default:
        return <IconShield className="h-4 w-4" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4">
      {/* Main Reasoning Section */}
      <Collapsible
        open={isExpanded('main-reasoning')}
        onOpenChange={() => onToggleSection('main-reasoning')}
      >
        <CollapsibleTrigger className="w-full">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-left">
                <div className="flex items-center space-x-2">
                  <IconBrain className="h-5 w-5 text-blue-600" />
                  <span>Primary Reasoning</span>
                  <Badge variant="outline" className={getConfidenceColor(confidence)}>
                    {Math.round(confidence * 100)}% confidence
                  </Badge>
                </div>
                {isExpanded('main-reasoning') ? (
                  <IconChevronDown className="h-4 w-4" />
                ) : (
                  <IconChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {reasoning}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Confidence Level</span>
                    <span className={`font-medium ${getConfidenceColor(confidence)}`}>
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={confidence * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Risk Factors Section */}
      {riskFactors.length > 0 && (
        <Collapsible
          open={isExpanded('risk-factors')}
          onOpenChange={() => onToggleSection('risk-factors')}
        >
          <CollapsibleTrigger className="w-full">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-left">
                  <div className="flex items-center space-x-2">
                    <IconAlertTriangle className="h-5 w-5 text-orange-600" />
                    <span>Risk Factors</span>
                    <Badge variant="outline">
                      {riskFactors.length} identified
                    </Badge>
                  </div>
                  {isExpanded('risk-factors') ? (
                    <IconChevronDown className="h-4 w-4" />
                  ) : (
                    <IconChevronRight className="h-4 w-4" />
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {riskFactors.map((factor) => (
                    <div key={factor.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(factor.severity)}
                          <span className="font-medium">{factor.factor}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getSeverityColor(factor.severity)}>
                            {factor.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(factor.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {factor.description}
                      </p>
                      
                      {factor.mitigation && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                          <div className="flex items-center space-x-1 mb-1">
                            <IconShield className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-800">
                              Mitigation
                            </span>
                          </div>
                          <p className="text-xs text-blue-700">
                            {factor.mitigation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Decision Factors Section */}
      <Collapsible
        open={isExpanded('decision-factors')}
        onOpenChange={() => onToggleSection('decision-factors')}
      >
        <CollapsibleTrigger className="w-full">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-left">
                <div className="flex items-center space-x-2">
                  <IconTarget className="h-5 w-5 text-green-600" />
                  <span>Decision Factors</span>
                </div>
                {isExpanded('decision-factors') ? (
                  <IconChevronDown className="h-4 w-4" />
                ) : (
                  <IconChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="font-medium text-green-700">Positive Factors</div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Complete documentation provided</li>
                      <li>• Policy coverage confirmed</li>
                      <li>• No fraud indicators detected</li>
                      <li>• Claim within policy limits</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-orange-700">Considerations</div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• High claim amount requires review</li>
                      <li>• Recent policy activation</li>
                      <li>• Multiple claims in short period</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
} 