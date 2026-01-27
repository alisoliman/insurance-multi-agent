/**
 * Agent configuration for UI display.
 * 
 * Maps backend agent names to display properties (icons, colors, descriptions).
 */

import {
  IconRobot,
  IconFileText,
  IconShield,
  IconTrendingUp,
  IconMessage,
} from '@tabler/icons-react'
import type { Icon } from '@tabler/icons-react'

export interface AgentConfigItem {
  icon: Icon
  color: string
  bgColor: string
  borderColor: string
  displayName: string
  description: string
  capabilities: string[]
}

export type AgentName = 
  | 'claim_assessor'
  | 'policy_checker'
  | 'risk_analyst'
  | 'communication_agent'
  | 'supervisor'

export const AGENT_CONFIG: Record<AgentName, AgentConfigItem> = {
  claim_assessor: {
    icon: IconFileText,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    displayName: 'Claim Assessor',
    description: 'Damage evaluation specialist',
    capabilities: ['Image Analysis', 'Damage Assessment', 'Cost Estimation'],
  },
  policy_checker: {
    icon: IconShield,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
    displayName: 'Policy Checker',
    description: 'Coverage verification specialist',
    capabilities: ['Policy Verification', 'Coverage Analysis', 'Exclusion Review'],
  },
  risk_analyst: {
    icon: IconTrendingUp,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    displayName: 'Risk Analyst',
    description: 'Fraud detection specialist',
    capabilities: ['Fraud Detection', 'Risk Assessment', 'Pattern Analysis'],
  },
  communication_agent: {
    icon: IconMessage,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    displayName: 'Communication Agent',
    description: 'Customer communication specialist',
    capabilities: ['Email Drafting', 'Customer Updates', 'Documentation'],
  },
  supervisor: {
    icon: IconRobot,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    borderColor: 'border-gray-200 dark:border-gray-800',
    displayName: 'Supervisor',
    description: 'Workflow orchestrator',
    capabilities: ['Decision Making', 'Agent Coordination', 'Final Assessment'],
  },
}

/**
 * Get agent config by name with type safety.
 * Returns undefined for unknown agents.
 */
export function getAgentConfig(agentName: string): AgentConfigItem | undefined {
  return AGENT_CONFIG[agentName as AgentName]
}

/**
 * Get specialist agents (excludes supervisor).
 */
export function getSpecialistAgents(): [AgentName, AgentConfigItem][] {
  return Object.entries(AGENT_CONFIG)
    .filter(([key]) => key !== 'supervisor') as [AgentName, AgentConfigItem][]
}
