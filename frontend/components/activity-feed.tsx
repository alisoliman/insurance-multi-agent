import { IconBrain, IconMessageCircle, IconNetwork, IconClock, IconCheck, IconX, IconAlertTriangle } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ActivityItem {
  id: string
  timestamp: Date
  agent: 'assessment' | 'communication' | 'orchestrator' | 'system'
  action: string
  status: 'success' | 'error' | 'warning' | 'info'
  details?: string
  claimId?: string
}

interface ActivityFeedProps {
  activities?: ActivityItem[]
  maxItems?: number
}

const defaultActivities: ActivityItem[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    agent: 'assessment',
    action: 'Claim assessment completed',
    status: 'success',
    details: 'Auto claim approved with 96% confidence',
    claimId: 'CLM-2024-001234'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    agent: 'communication',
    action: 'Customer notification sent',
    status: 'success',
    details: 'Approval notification sent in English',
    claimId: 'CLM-2024-001234'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
    agent: 'orchestrator',
    action: 'Workflow initiated',
    status: 'info',
    details: 'New claim processing workflow started',
    claimId: 'CLM-2024-001235'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
    agent: 'assessment',
    action: 'Manual review required',
    status: 'warning',
    details: 'Complex claim flagged for human review',
    claimId: 'CLM-2024-001233'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    agent: 'system',
    action: 'API rate limit warning',
    status: 'warning',
    details: 'Azure OpenAI API approaching rate limit'
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 18 * 60 * 1000), // 18 minutes ago
    agent: 'communication',
    action: 'Multi-language response generated',
    status: 'success',
    details: 'Response generated in Spanish and French',
    claimId: 'CLM-2024-001232'
  }
]

function getAgentIcon(agent: string) {
  switch (agent) {
    case 'assessment':
      return <IconBrain className="size-4" />
    case 'communication':
      return <IconMessageCircle className="size-4" />
    case 'orchestrator':
      return <IconNetwork className="size-4" />
    case 'system':
      return <IconClock className="size-4" />
    default:
      return <IconClock className="size-4" />
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <IconCheck className="size-3 text-green-600" />
    case 'error':
      return <IconX className="size-3 text-red-600" />
    case 'warning':
      return <IconAlertTriangle className="size-3 text-orange-600" />
    case 'info':
      return <IconClock className="size-3 text-blue-600" />
    default:
      return <IconClock className="size-3 text-gray-600" />
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'success':
      return (
        <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
          Success
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
          Error
        </Badge>
      )
    case 'warning':
      return (
        <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
          Warning
        </Badge>
      )
    case 'info':
      return (
        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
          Info
        </Badge>
      )
    default:
      return (
        <Badge variant="outline">
          Unknown
        </Badge>
      )
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

export function ActivityFeed({ activities = defaultActivities, maxItems = 10 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconClock className="size-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Real-time feed of agent activities and system events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
              <div className="flex items-center gap-2 mt-0.5">
                {getAgentIcon(activity.agent)}
                {getStatusIcon(activity.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-medium text-sm">{activity.action}</p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(activity.status)}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
                
                {activity.details && (
                  <p className="text-sm text-muted-foreground mb-1">
                    {activity.details}
                  </p>
                )}
                
                {activity.claimId && (
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {activity.claimId}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <IconClock className="size-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 