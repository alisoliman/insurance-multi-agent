"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Claim } from "@/lib/api/claims"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ClaimsTableProps {
  claims: Claim[]
  showAssignAction?: boolean
  onAssign?: (claimId: string) => void
  isLoading?: boolean
  emptyMessage?: string
  emptyLinkText?: string
  emptyLinkHref?: string
  showAssessmentStatus?: boolean
  showAiSummary?: boolean
  showFilters?: boolean
  hideStatusFilter?: boolean
  filters?: {
    status?: string
    claim_type?: string
    created_from?: string
    created_to?: string
    search?: string
  }
  onFiltersChange?: (next: {
    status?: string
    claim_type?: string
    created_from?: string
    created_to?: string
    search?: string
  }) => void
}

export function ClaimsTable({ 
  claims, 
  showAssignAction = false, 
  onAssign,
  isLoading = false,
  emptyMessage = "No claims found.",
  emptyLinkText,
  emptyLinkHref,
  showAssessmentStatus = false,
  showAiSummary = false,
  showFilters = false,
  hideStatusFilter = false,
  filters,
  onFiltersChange
}: ClaimsTableProps) {
  const router = useRouter()
  const activeFilters = filters ?? {}
  const handleRowClick = (event: React.MouseEvent, claimId: string) => {
    const target = event.target as HTMLElement
    if (target.closest("[data-no-row-click]")) return
    if (target.closest("button, a, [role='button']")) return
    router.push(`/claims/${claimId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'secondary'
      case 'assigned': return 'outline'
      case 'in_progress': return 'default'
      case 'awaiting_info': return 'outline' // warning/orange not standard in basic badge
      case 'approved': return 'default' // green usually, but using default for now
      case 'denied': return 'destructive'
      default: return 'outline'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'default' // maybe orange/yellow if custom variants exist
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'LOW_RISK': return 'secondary'
      case 'MEDIUM_RISK': return 'outline'
      case 'HIGH_RISK': return 'destructive'
      default: return 'outline'
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading claims...</div>
  }

  return (
    <div className="space-y-4">
      {showFilters && onFiltersChange && (
        <div className="flex flex-wrap gap-3 items-end rounded-md border p-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">Search</label>
            <input
              className="h-9 w-48 rounded-md border border-input bg-background px-3 text-sm"
              placeholder="Claim ID or name"
              value={activeFilters.search || ""}
              onChange={(e) => onFiltersChange({ ...activeFilters, search: e.target.value })}
            />
          </div>
          {!hideStatusFilter && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm"
                value={activeFilters.status || ""}
                onChange={(e) => onFiltersChange({ ...activeFilters, status: e.target.value || undefined })}
              >
                <option value="">All</option>
                <option value="new">New</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="awaiting_info">Awaiting Info</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
              </select>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">Claim Type</label>
            <select
              className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm"
              value={activeFilters.claim_type || ""}
              onChange={(e) => onFiltersChange({ ...activeFilters, claim_type: e.target.value || undefined })}
            >
              <option value="">All</option>
              <option value="auto">Auto</option>
              <option value="property">Property</option>
              <option value="liability">Liability</option>
              <option value="health">Health</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">From</label>
            <input
              type="date"
              className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm"
              value={activeFilters.created_from ? activeFilters.created_from.slice(0, 10) : ""}
              onChange={(e) => {
                const value = e.target.value
                const iso = value ? new Date(`${value}T00:00:00`).toISOString() : undefined
                onFiltersChange({ ...activeFilters, created_from: iso })
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">To</label>
            <input
              type="date"
              className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm"
              value={activeFilters.created_to ? activeFilters.created_to.slice(0, 10) : ""}
              onChange={(e) => {
                const value = e.target.value
                const iso = value ? new Date(`${value}T23:59:59`).toISOString() : undefined
                onFiltersChange({ ...activeFilters, created_to: iso })
              }}
            />
          </div>
        </div>
      )}

      {claims.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-md">
          <p>{emptyMessage}</p>
          {emptyLinkText && emptyLinkHref && (
            <Link 
              href={emptyLinkHref}
              className="mt-2 inline-block text-primary hover:underline"
            >
              {emptyLinkText}
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim ID</TableHead>
                <TableHead>Claimant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                {showAssessmentStatus && <TableHead>AI Status</TableHead>}
                {showAiSummary && <TableHead>AI Rec</TableHead>}
                {showAiSummary && <TableHead>Risk</TableHead>}
                <TableHead>Priority</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow 
                  key={claim.id}
                  className="cursor-pointer"
                  onClick={(event) => handleRowClick(event, claim.id)}
                >
              <TableCell className="font-medium">
                <Link href={`/claims/${claim.id}`} className="hover:underline" data-no-row-click>
                  {claim.id.substring(0, 8)}...
                </Link>
              </TableCell>
                  <TableCell>
                    <div>{claim.claimant_name}</div>
                    <div className="text-xs text-muted-foreground">{claim.policy_number}</div>
                  </TableCell>
                  <TableCell className="capitalize">{claim.claim_type}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(claim.status) as "default" | "secondary" | "destructive" | "outline"}>
                      {claim.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                {showAssessmentStatus && (
                  <TableCell>
                    {claim.latest_assessment_status ? (
                      <Badge variant="outline">
                        {claim.latest_assessment_status}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                  </TableCell>
                )}
                {showAiSummary && (
                  <TableCell>
                    {claim.ai_recommendation ? (
                      <Badge variant="outline">
                        {claim.ai_recommendation}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                )}
                {showAiSummary && (
                  <TableCell>
                    {claim.ai_risk_level || claim.ai_risk_score !== undefined ? (
                      <div className="flex items-center gap-2">
                        <Badge variant={getRiskColor(claim.ai_risk_level) as "default" | "secondary" | "destructive" | "outline"}>
                          {claim.ai_risk_level || "UNKNOWN"}
                        </Badge>
                        {claim.ai_risk_score !== undefined && (
                          <span className="text-xs text-muted-foreground">{claim.ai_risk_score}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                )}
                  <TableCell>
                    <Badge variant={getPriorityColor(claim.priority) as "default" | "secondary" | "destructive" | "outline"}>
                      {claim.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(claim.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right" data-no-row-click>
                {showAssignAction && onAssign ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => router.push(`/claims/${claim.id}`)}
                      data-no-row-click
                    >
                      View
                    </Button>
                    <Button size="sm" onClick={() => onAssign(claim.id)} data-no-row-click>
                      Pick Up & Open
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.push(`/claims/${claim.id}`)}
                    data-no-row-click
                  >
                    View
                  </Button>
                )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
