"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Claim, getClaims } from "@/lib/api/claims"
import { ClaimsTable } from "@/components/claims/claims-table"
import { Button } from "@/components/ui/button"

// Hardcoded for demo - Phase 3
const CURRENT_HANDLER_ID = "handler-001"
const REFRESH_INTERVAL_MS = 20000 // 20 seconds

export default function MyClaimsPage() {
  const router = useRouter()
  const [claims, setClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadClaims = useCallback(async () => {
    try {
      const data = await getClaims({ handler_id: CURRENT_HANDLER_ID })
      setClaims(data)
    } catch (error) {
      console.error("Failed to load claims", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClaims()
    
    // Auto-refresh every 20 seconds (FR-013)
    const intervalId = setInterval(loadClaims, REFRESH_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [loadClaims])

  return (
    <div className="flex flex-1 flex-col p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Assigned Claims</h1>
          <p className="text-muted-foreground mt-2">
            Manage and process your assigned claim caseload.
          </p>
        </div>
        <Button onClick={() => router.push("/claims/queue")}>
          View Incoming Queue
        </Button>
      </div>

      <ClaimsTable 
        claims={claims} 
        isLoading={isLoading}
        emptyMessage="No claims assigned to you."
        emptyLinkText="View the incoming queue to pick up claims"
        emptyLinkHref="/claims/queue"
      />
    </div>
  )
}
