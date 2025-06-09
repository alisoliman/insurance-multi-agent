"use client"

import { IconEye, IconClock, IconCheck, IconAlertTriangle, IconX } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ClaimData {
  id: string
  claimNumber: string
  customerName: string
  policyType: string
  claimAmount: number
  status: 'pending' | 'processing' | 'review' | 'approved' | 'denied'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  submittedAt: Date
  assignedAgent: 'assessment' | 'communication' | 'orchestrator' | 'human'
  estimatedCompletion?: Date
}

interface ActiveClaimsTableProps {
  claims?: ClaimData[]
  maxItems?: number
}

const defaultClaims: ClaimData[] = [
  {
    id: '1',
    claimNumber: 'CLM-2024-001234',
    customerName: 'John Smith',
    policyType: 'Auto Insurance',
    claimAmount: 15750,
    status: 'processing',
    priority: 'medium',
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    assignedAgent: 'assessment',
    estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
  },
  {
    id: '2',
    claimNumber: 'CLM-2024-001235',
    customerName: 'Sarah Johnson',
    policyType: 'Home Insurance',
    claimAmount: 45200,
    status: 'review',
    priority: 'high',
    submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    assignedAgent: 'human'
  },
  {
    id: '3',
    claimNumber: 'CLM-2024-001236',
    customerName: 'Michael Brown',
    policyType: 'Health Insurance',
    claimAmount: 2850,
    status: 'pending',
    priority: 'low',
    submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    assignedAgent: 'orchestrator',
    estimatedCompletion: new Date(Date.now() + 45 * 60 * 1000) // 45 minutes from now
  },
  {
    id: '4',
    claimNumber: 'CLM-2024-001237',
    customerName: 'Emily Davis',
    policyType: 'Auto Insurance',
    claimAmount: 8900,
    status: 'processing',
    priority: 'medium',
    submittedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    assignedAgent: 'assessment',
    estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
  },
  {
    id: '5',
    claimNumber: 'CLM-2024-001238',
    customerName: 'Robert Wilson',
    policyType: 'Life Insurance',
    claimAmount: 125000,
    status: 'review',
    priority: 'urgent',
    submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    assignedAgent: 'human'
  }
]

function getStatusIcon(status: string) {
  switch (status) {
    case 'approved':
      return <IconCheck className="size-4 text-green-600" />
    case 'processing':
      return <IconClock className="size-4 text-blue-600" />
    case 'review':
      return <IconAlertTriangle className="size-4 text-orange-600" />
    case 'denied':
      return <IconX className="size-4 text-red-600" />
    case 'pending':
    default:
      return <IconClock className="size-4 text-gray-400" />
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return (
        <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
          Approved
        </Badge>
      )
    case 'processing':
      return (
        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
          Processing
        </Badge>
      )
    case 'review':
      return (
        <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
          Review
        </Badge>
      )
    case 'denied':
      return (
        <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
          Denied
        </Badge>
      )
    case 'pending':
    default:
      return (
        <Badge variant="outline" className="border-gray-200 text-gray-700 bg-gray-50">
          Pending
        </Badge>
      )
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'urgent':
      return (
        <Badge variant="destructive" className="text-xs">
          Urgent
        </Badge>
      )
    case 'high':
      return (
        <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 text-xs">
          High
        </Badge>
      )
    case 'medium':
      return (
        <Badge variant="outline" className="border-yellow-200 text-yellow-700 bg-yellow-50 text-xs">
          Medium
        </Badge>
      )
    case 'low':
    default:
      return (
        <Badge variant="outline" className="border-gray-200 text-gray-700 bg-gray-50 text-xs">
          Low
        </Badge>
      )
  }
}

function getAgentBadge(agent: string) {
  switch (agent) {
    case 'assessment':
      return (
        <Badge variant="secondary" className="text-xs">
          AI Assessment
        </Badge>
      )
    case 'communication':
      return (
        <Badge variant="secondary" className="text-xs">
          AI Communication
        </Badge>
      )
    case 'orchestrator':
      return (
        <Badge variant="secondary" className="text-xs">
          AI Orchestrator
        </Badge>
      )
    case 'human':
      return (
        <Badge variant="outline" className="text-xs">
          Human Review
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-xs">
          Unassigned
        </Badge>
      )
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
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

function formatEstimatedTime(date?: Date): string {
  if (!date) return 'TBD'
  
  const now = new Date()
  const diffInMinutes = Math.floor((date.getTime() - now.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 0) return 'Overdue'
  if (diffInMinutes < 60) return `${diffInMinutes}m`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d`
}

export function ActiveClaimsTable({ claims = defaultClaims, maxItems = 10 }: ActiveClaimsTableProps) {
  const displayClaims = claims.slice(0, maxItems)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Claims</CardTitle>
        <CardDescription>
          Claims currently being processed by the AI agents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Policy Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayClaims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(claim.status)}
                      <span className="font-mono text-sm">{claim.claimNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>{claim.customerName}</TableCell>
                  <TableCell>{claim.policyType}</TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(claim.claimAmount)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(claim.status)}
                  </TableCell>
                  <TableCell>
                    {getPriorityBadge(claim.priority)}
                  </TableCell>
                  <TableCell>
                    {getAgentBadge(claim.assignedAgent)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatTimeAgo(claim.submittedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatEstimatedTime(claim.estimatedCompletion)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <IconEye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {claims.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <IconClock className="size-8 mx-auto mb-2 opacity-50" />
            <p>No active claims</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 