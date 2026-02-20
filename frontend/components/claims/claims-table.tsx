"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { useDebouncedCallback } from "use-debounce"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Copy, AlertTriangle, CheckCircle, Clock, FileQuestion, XCircle, Inbox } from "lucide-react"
import { toast } from "sonner"

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
  fromPage?: string
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
  pageSize?: number
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
  fromPage,
  filters,
  onFiltersChange,
  pageSize = 10
}: ClaimsTableProps) {
  const router = useRouter()
  const activeFilters = filters ?? {}
  const [searchInput, setSearchInput] = React.useState(activeFilters.search || "")
  const [currentPage, setCurrentPage] = React.useState(1)

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback((value: string) => {
    if (onFiltersChange) {
      onFiltersChange({ ...activeFilters, search: value || undefined })
    }
  }, 300)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    debouncedSearch(value)
  }

  // Pagination
  const totalPages = Math.ceil(claims.length / pageSize)
  const paginatedClaims = claims.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Reset to page 1 when claims change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [claims.length])

  const claimUrl = (claimId: string) =>
    fromPage ? `/claims/${claimId}?from=${fromPage}` : `/claims/${claimId}`

  const handleRowClick = (event: React.MouseEvent, claimId: string) => {
    const target = event.target as HTMLElement
    if (target.closest("[data-no-row-click]")) return
    if (target.closest("button, a, [role='button']")) return
    router.push(claimUrl(claimId))
  }

  const handleRowKeyDown = (event: React.KeyboardEvent, claimId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      router.push(claimUrl(claimId))
    }
  }

  const copyClaimId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success("Claim ID copied to clipboard")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'secondary'
      case 'assigned': return 'outline'
      case 'in_progress': return 'default'
      case 'awaiting_info': return 'outline'
      case 'approved': return 'default'
      case 'denied': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Inbox className="w-3 h-3" />
      case 'in_progress': return <Clock className="w-3 h-3" />
      case 'awaiting_info': return <FileQuestion className="w-3 h-3" />
      case 'approved': return <CheckCircle className="w-3 h-3" />
      case 'denied': return <XCircle className="w-3 h-3" />
      default: return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'default'
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

  const isHighRisk = (claim: Claim) => claim.ai_risk_level === 'HIGH_RISK' || claim.priority === 'urgent'

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {showFilters && (
          <div className="flex flex-wrap gap-3 items-end rounded-md border p-4">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-40" />
          </div>
        )}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </TableCell>
                  <TableCell><Skeleton className="h-6 w-14 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-14 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
    <div className="space-y-4">
      {showFilters && onFiltersChange && (
        <div className="flex flex-wrap gap-3 items-end rounded-md border p-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="claim-search" className="text-xs text-muted-foreground">Search</label>
            <input
              id="claim-search"
              className="h-9 w-48 rounded-md border border-input bg-background px-3 text-sm"
              placeholder="Claim ID or name"
              value={searchInput}
              onChange={handleSearchChange}
              aria-label="Search claims by ID or claimant name"
            />
          </div>
          {!hideStatusFilter && (
            <div className="flex flex-col gap-2">
              <label htmlFor="status-filter" className="text-xs text-muted-foreground">Status</label>
              <select
                id="status-filter"
                className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm"
                value={activeFilters.status || ""}
                onChange={(e) => onFiltersChange({ ...activeFilters, status: e.target.value || undefined })}
                aria-label="Filter by claim status"
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
            <label htmlFor="type-filter" className="text-xs text-muted-foreground">Claim Type</label>
            <select
              id="type-filter"
              className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm"
              value={activeFilters.claim_type || ""}
              onChange={(e) => onFiltersChange({ ...activeFilters, claim_type: e.target.value || undefined })}
              aria-label="Filter by claim type"
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
            <label htmlFor="date-from" className="text-xs text-muted-foreground">From</label>
            <input
              id="date-from"
              type="date"
              className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm"
              value={activeFilters.created_from ? activeFilters.created_from.slice(0, 10) : ""}
              onChange={(e) => {
                const value = e.target.value
                const iso = value ? new Date(`${value}T00:00:00`).toISOString() : undefined
                onFiltersChange({ ...activeFilters, created_from: iso })
              }}
              aria-label="Filter claims from date"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="date-to" className="text-xs text-muted-foreground">To</label>
            <input
              id="date-to"
              type="date"
              className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm"
              value={activeFilters.created_to ? activeFilters.created_to.slice(0, 10) : ""}
              onChange={(e) => {
                const value = e.target.value
                const iso = value ? new Date(`${value}T23:59:59`).toISOString() : undefined
                onFiltersChange({ ...activeFilters, created_to: iso })
              }}
              aria-label="Filter claims to date"
            />
          </div>
        </div>
      )}

      {claims.length === 0 ? (
        <div className="p-12 text-center border rounded-md bg-muted/30">
          <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">{emptyMessage}</p>
          {emptyLinkText && emptyLinkHref && (
            <Link 
              href={emptyLinkHref}
              className="mt-3 inline-flex items-center gap-2 text-primary hover:underline"
            >
              {emptyLinkText} →
            </Link>
          )}
        </div>
      ) : (
        <>
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
              {paginatedClaims.map((claim) => (
                <TableRow 
                  key={claim.id}
                  className={`cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isHighRisk(claim) ? 'bg-destructive/5 hover:bg-destructive/10' : ''}`}
                  onClick={(event) => handleRowClick(event, claim.id)}
                  onKeyDown={(event) => handleRowKeyDown(event, claim.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`View claim ${claim.id.substring(0, 8)} for ${claim.claimant_name}`}
                >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={claimUrl(claim.id)} className="hover:underline" data-no-row-click>
                        {claim.id.substring(0, 8)}…
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-mono text-xs">{claim.id}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => { e.stopPropagation(); copyClaimId(claim.id) }}
                    data-no-row-click
                    aria-label="Copy full claim ID"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
                  <TableCell>
                    <div>{claim.claimant_name}</div>
                    <div className="text-xs text-muted-foreground">{claim.policy_number}</div>
                  </TableCell>
                  <TableCell className="capitalize">{claim.claim_type}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(claim.status) as "default" | "secondary" | "destructive" | "outline"} className="gap-1">
                      {getStatusIcon(claim.status)}
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
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                  </TableCell>
                )}
                {showAiSummary && (
                  <TableCell>
                    {claim.ai_recommendation ? (
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline">
                          {claim.ai_recommendation}
                        </Badge>
                        {claim.ai_recommendation_override && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-[10px] text-muted-foreground cursor-help">⚡</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[220px]">
                              <p className="text-xs">Synthesizer said <strong>{claim.ai_recommendation_override}</strong> — overridden by specialist consensus (low risk, valid, covered)</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )}
                {showAiSummary && (
                  <TableCell>
                    {claim.ai_risk_level || claim.ai_risk_score !== undefined ? (
                      <div className="flex items-center gap-2">
                        <Badge variant={getRiskColor(claim.ai_risk_level) as "default" | "secondary" | "destructive" | "outline"} className="gap-1">
                          {claim.ai_risk_level === 'HIGH_RISK' && <AlertTriangle className="w-3 h-3" />}
                          {claim.ai_risk_level?.replace('_', ' ') || "UNKNOWN"}
                        </Badge>
                        {claim.ai_risk_score !== undefined && (
                          <span className="text-xs text-muted-foreground">{claim.ai_risk_score}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )}
                  <TableCell>
                    <Badge variant={getPriorityColor(claim.priority) as "default" | "secondary" | "destructive" | "outline"} className="gap-1">
                      {claim.priority === 'urgent' && <AlertTriangle className="w-3 h-3" />}
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
                      onClick={() => router.push(claimUrl(claim.id))}
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
                    onClick={() => router.push(claimUrl(claim.id))}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, claims.length)} of {claims.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
    </TooltipProvider>
  )
}
