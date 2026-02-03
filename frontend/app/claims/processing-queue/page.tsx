"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Claim, ClaimsFilter, getProcessingQueue } from "@/lib/api/claims"
import { ClaimsTable } from "@/components/claims/claims-table"
import { Button } from "@/components/ui/button"

const POLLING_INTERVAL_MS = 15000

export default function ProcessingQueuePage() {
  const router = useRouter()
  const [claims, setClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<ClaimsFilter>({})
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const loadClaims = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      const data = await getProcessingQueue(filters)
      setClaims(data)
    } catch (error) {
      console.error("Failed to load processing queue", error)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [filters])

  const pendingCount = claims.filter(c => c.latest_assessment_status === "pending").length
  const processingCount = claims.filter(c => c.latest_assessment_status === "processing").length

  useEffect(() => {
    loadClaims(true)
    pollingRef.current = setInterval(() => {
      loadClaims(false)
    }, POLLING_INTERVAL_MS)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [loadClaims])

  return (
    <div className="flex flex-1 flex-col p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Processing Queue</h1>
          <p className="text-muted-foreground mt-2">
            Live view of claims currently being analyzed by AI.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/")}>
          Back to Dashboard
        </Button>
      </div>

      {claims.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border p-4">
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-xs text-muted-foreground">Processing</div>
            <div className="text-2xl font-bold">{processingCount}</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{claims.length}</div>
          </div>
        </div>
      )}

      <ClaimsTable
        claims={claims}
        isLoading={isLoading}
        showAssessmentStatus={true}
        showAiSummary={true}
        showFilters={true}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  )
}
