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
}

export function ClaimsTable({ 
  claims, 
  showAssignAction = false, 
  onAssign,
  isLoading = false,
  emptyMessage = "No claims found.",
  emptyLinkText,
  emptyLinkHref
}: ClaimsTableProps) {
  const router = useRouter()

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

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading claims...</div>
  }

  if (claims.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
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
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Claim ID</TableHead>
            <TableHead>Claimant</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.map((claim) => (
            <TableRow key={claim.id}>
              <TableCell className="font-medium">{claim.id.substring(0, 8)}...</TableCell>
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
              <TableCell>
                <Badge variant={getPriorityColor(claim.priority) as "default" | "secondary" | "destructive" | "outline"}>
                  {claim.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(claim.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="text-right">
                {showAssignAction && onAssign ? (
                  <Button size="sm" onClick={() => onAssign(claim.id)}>
                    Pick Up
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.push(`/claims/${claim.id}`)}
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
  )
}
