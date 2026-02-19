"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Claim, AIAssessment, getClaim, processClaim, getAssessment, unassignClaim } from "@/lib/api/claims"
import { ClaimDetail } from "@/components/claims/claim-detail"
import { AIResults } from "@/components/claims/ai-results"
import { DecisionForm } from "@/components/claims/decision-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { OnboardingCue } from "@/components/onboarding/onboarding-cue"
import { Skeleton } from "@/components/ui/skeleton"
import { useHandler } from "@/components/handler-context"

export default function ClaimPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const claimId = params.id as string
  const fromPage = searchParams.get("from")
  const { handler } = useHandler()

  const [claim, setClaim] = useState<Claim | null>(null)
  const [assessment, setAssessment] = useState<AIAssessment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPolling, setIsPolling] = useState(false)

  const getBackLabel = () => {
    switch (fromPage) {
      case "queue": return "Back to Review Queue"
      case "processing": return "Back to Processing Queue"
      case "dashboard": return "Back to Dashboard"
      case "auto-approvals": return "Back to Auto-Approvals"
      case "claims": return "Back to My Claims"
      default: return "Back to Dashboard"
    }
  }

  const getBackHref = () => {
    switch (fromPage) {
      case "queue": return "/claims/queue"
      case "processing": return "/claims/processing-queue"
      case "dashboard": return "/"
      case "auto-approvals": return "/claims/auto-approvals"
      case "claims": return "/claims"
      default: return "/"
    }
  }

  useEffect(() => {
    async function loadData() {
      if (!claimId) return
      try {
        const claimData = await getClaim(claimId)
        setClaim(claimData)
      } catch (error) {
        console.error("Failed to load claim", error)
        toast.error("Failed to load claim details")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [claimId])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    const loadAssessment = async () => {
      try {
        const data = await getAssessment(claimId)
        setAssessment(data)
        const shouldPoll = data.status === "pending" || data.status === "processing"
        setIsPolling(shouldPoll)
      } catch {
        // If no assessment yet, ignore
      }
    }

    if (claimId) {
      loadAssessment()
    }

    if (isPolling) {
      interval = setInterval(loadAssessment, 15000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [claimId, isPolling])

  const handleProcessAI = async () => {
    setIsProcessing(true)
    try {
      toast.info("Re-running AI analysis... This may take a minute.")
      const result = await processClaim(claimId)
      setAssessment(result)
      toast.success("AI analysis completed successfully")
    } catch (error) {
      console.error("AI processing failed", error)
      toast.error("AI processing failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecisionRecorded = () => {
    // Refresh claim data to update status
    getClaim(claimId).then(setClaim)
  }

  const handleUnassign = async () => {
    if (!claim) return
    try {
      await unassignClaim(claim.id, handler.id)
      toast.success("Claim returned to review queue")
      router.push("/claims/queue")
    } catch (error) {
      console.error("Failed to unassign claim", error)
      toast.error("Failed to return claim to review queue")
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col p-6 space-y-8">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    )
  }

  if (!claim) {
    return <div className="p-8 text-center">Claim not found</div>
  }

  return (
    <div className="flex flex-1 flex-col p-6 space-y-8">
      <Button variant="ghost" onClick={() => router.push(getBackHref())} className="pl-0 w-fit">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {getBackLabel()}
      </Button>

      <OnboardingCue stepId="detail" />

      <ClaimDetail 
        claim={claim} 
        onProcessAI={handleProcessAI}
        isProcessing={isProcessing}
        aiStatus={claim.latest_assessment_status}
      />

      {(assessment || isProcessing) && (
        <AIResults 
          assessment={assessment} 
          isLoading={isProcessing} 
        />
      )}

      {claim.assigned_handler_id === handler.id && claim.status !== 'approved' && claim.status !== 'denied' && (
        <div>
          <Button variant="outline" onClick={handleUnassign}>
            Return to Review Queue
          </Button>
        </div>
      )}

      {claim.status !== 'approved' && claim.status !== 'denied' && (
         <DecisionForm 
            claimId={claim.id} 
            handlerId={handler.id}
            aiAssessmentId={assessment?.id}
            onDecisionRecorded={handleDecisionRecorded}
         />
      )}
    </div>
  )
}
