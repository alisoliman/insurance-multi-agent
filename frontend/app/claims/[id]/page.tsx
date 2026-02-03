"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Claim, AIAssessment, getClaim, processClaim } from "@/lib/api/claims"
import { ClaimDetail } from "@/components/claims/claim-detail"
import { AIResults } from "@/components/claims/ai-results"
import { DecisionForm } from "@/components/claims/decision-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function ClaimPage() {
  const params = useParams()
  const router = useRouter()
  const claimId = params.id as string

  const [claim, setClaim] = useState<Claim | null>(null)
  const [assessment, setAssessment] = useState<AIAssessment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

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

  const handleProcessAI = async () => {
    setIsProcessing(true)
    try {
      toast.info("Starting AI analysis... This may take a minute.")
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

  if (isLoading) {
    return <div className="p-8 text-center">Loading claim details...</div>
  }

  if (!claim) {
    return <div className="p-8 text-center">Claim not found</div>
  }

  return (
    <div className="flex flex-1 flex-col p-6 space-y-8">
      <Button variant="ghost" onClick={() => router.back()} className="pl-0 w-fit">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Claims
      </Button>

      <ClaimDetail 
        claim={claim} 
        onProcessAI={handleProcessAI}
        isProcessing={isProcessing}
      />

      {(assessment || isProcessing) && (
        <AIResults 
          assessment={assessment} 
          isLoading={isProcessing} 
        />
      )}

      {claim.status !== 'approved' && claim.status !== 'denied' && (
         <DecisionForm 
            claimId={claim.id} 
            handlerId="handler-001"
            aiAssessmentId={assessment?.id}
            onDecisionRecorded={handleDecisionRecorded}
         />
      )}
    </div>
  )
}
