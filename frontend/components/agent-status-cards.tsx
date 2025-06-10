import { IconBrain, IconMessageCircle, IconNetwork } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface AgentStatusData {
  assessmentAgent: {
    claimsProcessed: number
    accuracyRate: number
    avgProcessingTime: number
    status: 'active' | 'idle' | 'error'
  }
  communicationAgent: {
    messagesGenerated: number
    languagesUsed: number
    avgResponseTime: number
    status: 'active' | 'idle' | 'error'
  }
  orchestratorAgent: {
    activeWorkflows: number
    completionRate: number
    avgWorkflowTime: number
    status: 'active' | 'idle' | 'error'
  }
}

interface AgentStatusCardsProps {
  data?: AgentStatusData
}

const defaultData: AgentStatusData = {
  assessmentAgent: {
    claimsProcessed: 127,
    accuracyRate: 94.5,
    avgProcessingTime: 2.3,
    status: 'active'
  },
  communicationAgent: {
    messagesGenerated: 89,
    languagesUsed: 3,
    avgResponseTime: 1.8,
    status: 'active'
  },
  orchestratorAgent: {
    activeWorkflows: 12,
    completionRate: 87.2,
    avgWorkflowTime: 4.7,
    status: 'active'
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
          ● Active
        </Badge>
      )
    case 'idle':
      return (
        <Badge variant="outline" className="border-yellow-200 text-yellow-700 bg-yellow-50">
          ● Idle
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
          ● Error
        </Badge>
      )
    default:
      return (
        <Badge variant="outline">
          ● Unknown
        </Badge>
      )
  }
}

export function AgentStatusCards({ data }: AgentStatusCardsProps) {
  const safeData = data || defaultData
  
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {/* Assessment Agent Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconBrain className="size-4" />
            Assessment Agent
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {safeData.assessmentAgent.claimsProcessed}
          </CardTitle>
          <CardAction>
            {getStatusBadge(safeData.assessmentAgent.status)}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {safeData.assessmentAgent.accuracyRate}% accuracy rate
          </div>
          <div className="text-muted-foreground">
            Avg processing: {safeData.assessmentAgent.avgProcessingTime}s
          </div>
        </CardFooter>
      </Card>

      {/* Communication Agent Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconMessageCircle className="size-4" />
            Communication Agent
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {safeData.communicationAgent.messagesGenerated}
          </CardTitle>
          <CardAction>
            {getStatusBadge(safeData.communicationAgent.status)}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {safeData.communicationAgent.languagesUsed} languages supported
          </div>
          <div className="text-muted-foreground">
            Avg response: {safeData.communicationAgent.avgResponseTime}s
          </div>
        </CardFooter>
      </Card>

      {/* Orchestrator Agent Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconNetwork className="size-4" />
            Orchestrator Agent
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {safeData.orchestratorAgent.activeWorkflows}
          </CardTitle>
          <CardAction>
            {getStatusBadge(safeData.orchestratorAgent.status)}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {safeData.orchestratorAgent.completionRate}% completion rate
          </div>
          <div className="text-muted-foreground">
            Avg workflow: {safeData.orchestratorAgent.avgWorkflowTime}min
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 