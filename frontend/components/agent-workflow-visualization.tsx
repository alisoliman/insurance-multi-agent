'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  IconFileText,
  IconShield,
  IconTrendingUp,
  IconMessage,
  IconArrowRight,
  IconUsers,
  IconTarget
} from '@tabler/icons-react'
import Link from 'next/link'

interface AgentStep {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  href: string
  isActive?: boolean
}

interface AgentWorkflowVisualizationProps {
  currentAgent?: string
  showWorkflowLink?: boolean
}

const AGENT_STEPS: AgentStep[] = [
  {
    id: 'claim_assessor',
    name: 'Claim Assessor',
    description: 'Analyzes claim details and documentation',
    icon: <IconFileText className="h-4 w-4" />,
    color: 'bg-blue-500',
    href: '/agents/claim-assessor'
  },
  {
    id: 'policy_checker',
    name: 'Policy Checker',
    description: 'Validates coverage and policy terms',
    icon: <IconShield className="h-4 w-4" />,
    color: 'bg-green-500',
    href: '/agents/policy-checker'
  },
  {
    id: 'risk_analyst',
    name: 'Risk Analyst',
    description: 'Evaluates fraud and risk factors',
    icon: <IconTrendingUp className="h-4 w-4" />,
    color: 'bg-orange-500',
    href: '/agents/risk-analyst'
  },
  {
    id: 'communication_agent',
    name: 'Communication Agent',
    description: 'Generates customer communications',
    icon: <IconMessage className="h-4 w-4" />,
    color: 'bg-purple-500',
    href: '/agents/communication-agent'
  }
]

export function AgentWorkflowVisualization({ currentAgent, showWorkflowLink = true }: AgentWorkflowVisualizationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUsers className="h-5 w-5" />
          Multi-Agent Workflow
        </CardTitle>
        <CardDescription>
          These specialized agents work together in the complete claim processing workflow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Agent Steps */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {AGENT_STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center space-y-2 flex-1">
                  <Link href={step.href}>
                    <div className={`
                      p-3 rounded-lg transition-all cursor-pointer
                      ${currentAgent === step.id 
                        ? `${step.color} text-white shadow-lg scale-105` 
                        : 'bg-muted hover:bg-muted/80'
                      }
                    `}>
                      {step.icon}
                    </div>
                  </Link>
                  <div className="text-center">
                    <div className="font-medium text-sm">{step.name}</div>
                    <div className="text-xs text-muted-foreground max-w-24">
                      {step.description}
                    </div>
                    {currentAgent === step.id && (
                      <Badge variant="default" className="mt-1 text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                </div>
                
                {index < AGENT_STEPS.length - 1 && (
                  <IconArrowRight className="h-4 w-4 text-muted-foreground hidden md:block" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Workflow Integration */}
          {showWorkflowLink && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconTarget className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    See how these agents collaborate together
                  </span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/demo">
                    <IconUsers className="mr-2 h-4 w-4" />
                    Full Workflow Demo
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 