"use client"

import * as React from "react"
import {
  Timeline,
  TimelineItem,
  TimelineContent,
  TimelineHeader,
  TimelineTitle,
  TimelineDescription,
} from "@/components/ui/timeline"
import { cn } from "@/lib/utils"
import { 
  IconFileText,
  IconShield,
  IconTrendingUp,
  IconMessage,
  IconRobot,
} from '@tabler/icons-react'

// Agent configuration with icons and colors
const AGENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'claim_assessor': IconFileText,
  'policy_checker': IconShield,
  'risk_analyst': IconTrendingUp,
  'communication_agent': IconMessage,
  'synthesizer': IconRobot,
  'supervisor': IconRobot,
}

const AGENT_COLORS: Record<string, { icon: string; bg: string; border: string }> = {
  'claim_assessor': {
    icon: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
  },
  'policy_checker': {
    icon: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800',
  },
  'risk_analyst': {
    icon: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-200 dark:border-orange-800',
  },
  'communication_agent': {
    icon: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
  },
  'synthesizer': {
    icon: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  'supervisor': {
    icon: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    border: 'border-gray-200 dark:border-gray-800',
  },
}

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  'claim_assessor': 'Claim Assessor',
  'policy_checker': 'Policy Checker',
  'risk_analyst': 'Risk Analyst',
  'communication_agent': 'Communication Agent',
  'synthesizer': 'Synthesizer',
  'supervisor': 'Supervisor',
}

interface AgentTraceStepProps {
  agentName: string
  stepNumber: number
  timestamp?: string
  children: React.ReactNode
  className?: string
}

export const AgentTraceStep = React.memo(function AgentTraceStep({
  agentName,
  stepNumber,
  timestamp,
  children,
  className,
}: AgentTraceStepProps) {
  const Icon = AGENT_ICONS[agentName] || IconRobot
  const colors = AGENT_COLORS[agentName] || AGENT_COLORS['supervisor']
  const displayName = AGENT_DISPLAY_NAMES[agentName] || agentName

  return (
    <TimelineItem className={className}>
      <TimelineHeader>
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full border-2",
          colors.bg,
          colors.border
        )}>
          <Icon className={cn("h-5 w-5", colors.icon)} />
        </div>
        <div className="flex flex-col">
          <TimelineTitle className="flex items-center gap-2">
            {displayName}
            <span className="text-xs text-muted-foreground font-normal">
              Step {stepNumber}
            </span>
          </TimelineTitle>
          {timestamp && (
            <TimelineDescription>{timestamp}</TimelineDescription>
          )}
        </div>
      </TimelineHeader>
      <TimelineContent>
        {children}
      </TimelineContent>
    </TimelineItem>
  )
})

interface AgentTraceTimelineProps {
  children: React.ReactNode
  className?: string
}

export function AgentTraceTimeline({ children, className }: AgentTraceTimelineProps) {
  return (
    <Timeline className={cn("w-full", className)}>
      {children}
    </Timeline>
  )
}

export { AgentTraceStep as default }
