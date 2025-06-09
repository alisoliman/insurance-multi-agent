"use client"

import { IconArrowRight, IconCheck, IconClock, IconAlertTriangle } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface WorkflowStage {
  id: string
  name: string
  status: 'completed' | 'active' | 'pending' | 'error'
  count: number
  avgTime?: string
  description: string
}

interface WorkflowChartProps {
  stages?: WorkflowStage[]
}

const defaultStages: WorkflowStage[] = [
  {
    id: 'intake',
    name: 'Claim Intake',
    status: 'completed',
    count: 45,
    avgTime: '30s',
    description: 'Initial claim submission and validation'
  },
  {
    id: 'assessment',
    name: 'AI Assessment',
    status: 'active',
    count: 12,
    avgTime: '2.3s',
    description: 'Automated claim analysis and risk evaluation'
  },
  {
    id: 'review',
    name: 'Human Review',
    status: 'pending',
    count: 8,
    avgTime: '15m',
    description: 'Manual review for complex or flagged claims'
  },
  {
    id: 'decision',
    name: 'Decision',
    status: 'pending',
    count: 3,
    avgTime: '5m',
    description: 'Final approval or denial determination'
  },
  {
    id: 'communication',
    name: 'Customer Notification',
    status: 'pending',
    count: 0,
    avgTime: '1.8s',
    description: 'Automated customer communication generation'
  }
]

function getStageIcon(status: string) {
  switch (status) {
    case 'completed':
      return <IconCheck className="size-4 text-green-600" />
    case 'active':
      return <IconClock className="size-4 text-blue-600 animate-pulse" />
    case 'error':
      return <IconAlertTriangle className="size-4 text-red-600" />
    case 'pending':
    default:
      return <IconClock className="size-4 text-gray-400" />
  }
}

function getStageColor(status: string) {
  switch (status) {
    case 'completed':
      return 'border-green-200 bg-green-50'
    case 'active':
      return 'border-blue-200 bg-blue-50'
    case 'error':
      return 'border-red-200 bg-red-50'
    case 'pending':
    default:
      return 'border-gray-200 bg-gray-50'
  }
}

function getStatusBadge(status: string, count: number) {
  const baseClasses = "text-xs font-medium"
  
  switch (status) {
    case 'completed':
      return (
        <Badge variant="outline" className={`${baseClasses} border-green-200 text-green-700 bg-green-50`}>
          {count} completed
        </Badge>
      )
    case 'active':
      return (
        <Badge variant="outline" className={`${baseClasses} border-blue-200 text-blue-700 bg-blue-50`}>
          {count} processing
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="outline" className={`${baseClasses} border-red-200 text-red-700 bg-red-50`}>
          {count} failed
        </Badge>
      )
    case 'pending':
    default:
      return (
        <Badge variant="outline" className={`${baseClasses} border-gray-200 text-gray-700 bg-gray-50`}>
          {count} waiting
        </Badge>
      )
  }
}

export function WorkflowChart({ stages = defaultStages }: WorkflowChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim Processing Workflow</CardTitle>
        <CardDescription>
          Real-time view of claims moving through the processing pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Desktop view - horizontal flow */}
          <div className="hidden md:flex items-center justify-between gap-2">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-2">
                <div className={`flex-1 p-4 rounded-lg border-2 transition-all hover:shadow-md ${getStageColor(stage.status)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getStageIcon(stage.status)}
                    <h3 className="font-medium text-sm">{stage.name}</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {getStatusBadge(stage.status, stage.count)}
                    
                    {stage.avgTime && (
                      <p className="text-xs text-muted-foreground">
                        Avg: {stage.avgTime}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {stage.description}
                    </p>
                  </div>
                </div>
                
                {index < stages.length - 1 && (
                  <IconArrowRight className="size-5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
          
          {/* Mobile view - vertical flow */}
          <div className="md:hidden space-y-3">
            {stages.map((stage, index) => (
              <div key={stage.id} className="space-y-2">
                <div className={`p-4 rounded-lg border-2 ${getStageColor(stage.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStageIcon(stage.status)}
                      <h3 className="font-medium text-sm">{stage.name}</h3>
                    </div>
                    {getStatusBadge(stage.status, stage.count)}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {stage.description}
                  </p>
                  
                  {stage.avgTime && (
                    <p className="text-xs text-muted-foreground">
                      Average processing time: {stage.avgTime}
                    </p>
                  )}
                </div>
                
                {index < stages.length - 1 && (
                  <div className="flex justify-center">
                    <div className="w-px h-4 bg-border"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Summary stats */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {stages.reduce((sum, stage) => sum + stage.count, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Claims</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {stages.find(s => s.id === 'intake')?.count || 0}
                </p>
                <p className="text-xs text-muted-foreground">Processed Today</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {stages.find(s => s.status === 'active')?.count || 0}
                </p>
                <p className="text-xs text-muted-foreground">Currently Processing</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {stages.find(s => s.id === 'review')?.count || 0}
                </p>
                <p className="text-xs text-muted-foreground">Awaiting Review</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 