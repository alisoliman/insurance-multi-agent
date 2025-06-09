"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, FileText, AlertCircle, CheckCircle, Clock, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExplainabilityPanel } from "@/components/explainability/ExplainabilityPanel"
import { transformAssessmentToExplainability } from "@/lib/explainability-utils"

const assessmentFormSchema = z.object({
  policyNumber: z.string().min(1, "Policy number is required"),
  incidentDate: z.string().min(1, "Incident date is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  amount: z.string().min(1, "Claim amount is required"),
  claimType: z.string().min(1, "Claim type is required"),
  customerName: z.string().min(1, "Customer name is required"),
})

type AssessmentFormData = z.infer<typeof assessmentFormSchema>

interface AssessmentResult {
  decision: string
  confidence_score: number
  confidence_level: string
  reasoning: string
  risk_factors: Array<{
    factor_type: string
    severity: string
    description: string
    confidence: number
  }>
  recommended_actions: string[]
  processing_time_seconds: number
  assessment_id: string
  fraud_risk_score: number
  documentation_completeness: number
  regulatory_compliance: {
    compliant: boolean
    requirements: string[]
    missing_items: string[]
  }
}

const sampleClaims = [
  {
    name: "Minor Auto Accident",
    data: {
      policyNumber: "AUTO-2024-001",
      incidentDate: "2024-01-15",
      description: "Minor fender bender in parking lot. No injuries reported. Damage to rear bumper and taillight.",
      amount: "2500",
      claimType: "auto",
      customerName: "John Smith"
    }
  },
  {
    name: "Home Water Damage",
    data: {
      policyNumber: "HOME-2024-002",
      incidentDate: "2024-01-10",
      description: "Burst pipe in basement caused flooding. Damage to flooring, drywall, and personal belongings.",
      amount: "15000",
      claimType: "home",
      customerName: "Sarah Johnson"
    }
  },
  {
    name: "Complex Fraud Case",
    data: {
      policyNumber: "AUTO-2024-003",
      incidentDate: "2024-01-05",
      description: "Total loss vehicle fire. Suspicious circumstances. Multiple previous claims. Inconsistent witness statements.",
      amount: "45000",
      claimType: "auto",
      customerName: "Mike Wilson"
    }
  }
]

export default function AssessmentAgentDemo() {
  const [isLoading, setIsLoading] = useState(false)
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showExplainability, setShowExplainability] = useState(false)
  const [currentClaimData, setCurrentClaimData] = useState<AssessmentFormData | null>(null)

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      policyNumber: "",
      incidentDate: "",
      description: "",
      amount: "",
      claimType: "",
      customerName: "",
    },
  })

  const loadSampleClaim = (sampleData: AssessmentFormData) => {
    form.reset(sampleData)
    setAssessmentResult(null)
    setError(null)
    setShowExplainability(false)
    setCurrentClaimData(null)
  }

  const onSubmit = async (data: AssessmentFormData) => {
    setIsLoading(true)
    setError(null)
    setAssessmentResult(null)
    setShowExplainability(false)

    try {
      const response = await fetch("http://localhost:8000/api/agents/enhanced-assessment/assess-claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          claim_data: {
            policy_number: data.policyNumber,
            incident_date: data.incidentDate,
            description: data.description,
            amount: parseFloat(data.amount),
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.assessment_result) {
        setAssessmentResult(result.assessment_result)
        setCurrentClaimData(data)
        toast.success("Assessment completed successfully!")
      } else {
        throw new Error(result.error || "Assessment failed")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      toast.error("Assessment failed: " + errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision.toLowerCase()) {
      case "approve":
        return "bg-green-100 text-green-800 border-green-200"
      case "reject":
        return "bg-red-100 text-red-800 border-red-200"
      case "investigate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision.toLowerCase()) {
      case "approve":
        return <CheckCircle className="h-4 w-4" />
      case "reject":
        return <AlertCircle className="h-4 w-4" />
      case "investigate":
        return <Clock className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const handleIntervention = (interventionId: string, action: string) => {
    toast.info(`Intervention ${action} for ${interventionId}`)
    // In a real implementation, this would trigger backend actions
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Assessment Agent Demo</h1>
        <p className="text-muted-foreground">
          Test the AI-powered claim assessment agent with real-time analysis and decision-making.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Claim Assessment Form</CardTitle>
            <CardDescription>
              Enter claim details or use a sample claim to test the assessment agent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sample Claims */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Quick Test with Sample Claims:</h4>
              <div className="flex flex-wrap gap-2">
                {sampleClaims.map((sample, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => loadSampleClaim(sample.data)}
                    className="text-xs"
                  >
                    {sample.name}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="policyNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Number</FormLabel>
                        <FormControl>
                          <Input placeholder="POL-2024-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="incidentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="claimType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Claim Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select claim type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="auto">Auto Insurance</SelectItem>
                            <SelectItem value="home">Home Insurance</SelectItem>
                            <SelectItem value="health">Health Insurance</SelectItem>
                            <SelectItem value="life">Life Insurance</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Claim Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the incident in detail..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed description of the incident for accurate assessment.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Claim...
                    </>
                  ) : (
                    "Assess Claim"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assessment Results</CardTitle>
                <CardDescription>
                  Real-time AI analysis and decision-making results.
                </CardDescription>
              </div>
              {assessmentResult && currentClaimData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExplainability(!showExplainability)}
                  className="flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>{showExplainability ? "Hide" : "Show"} Explainability</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing claim assessment...</span>
                </div>
                <Progress value={33} className="w-full" />
              </div>
            )}

            {assessmentResult && currentClaimData && (
              <Tabs value={showExplainability ? "explainability" : "summary"} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger 
                    value="summary" 
                    onClick={() => setShowExplainability(false)}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Summary</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="explainability" 
                    onClick={() => setShowExplainability(true)}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Explainability</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getDecisionColor(assessmentResult.decision)} flex items-center space-x-1`}>
                        {getDecisionIcon(assessmentResult.decision)}
                        <span>{assessmentResult.decision.toUpperCase()}</span>
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Confidence: {Math.round(assessmentResult.confidence_score * 100)}% ({assessmentResult.confidence_level})
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Reasoning</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {assessmentResult.reasoning}
                        </p>
                      </div>

                      {assessmentResult.risk_factors && assessmentResult.risk_factors.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Risk Factors</h4>
                          <div className="space-y-2">
                            {assessmentResult.risk_factors.map((factor, index) => (
                              <div key={index} className="border rounded p-2 text-sm">
                                <div className="flex items-center space-x-2 mb-1">
                                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                                  <span className="font-medium">{factor.factor_type}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {factor.severity}
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground">{factor.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Confidence: {Math.round(factor.confidence * 100)}%
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {assessmentResult.recommended_actions && assessmentResult.recommended_actions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Recommended Actions</h4>
                          <div className="space-y-1">
                            {assessmentResult.recommended_actions.map((action, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Processing Time:</span>
                          <span className="font-medium">{assessmentResult.processing_time_seconds.toFixed(2)}s</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Assessment ID:</span>
                          <span className="font-medium font-mono text-xs">{assessmentResult.assessment_id}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Fraud Risk Score:</span>
                          <span className="font-medium">{Math.round(assessmentResult.fraud_risk_score * 100)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Documentation Completeness:</span>
                          <span className="font-medium">{Math.round(assessmentResult.documentation_completeness * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="explainability" className="mt-4">
                  <ExplainabilityPanel
                    data={transformAssessmentToExplainability(assessmentResult, currentClaimData)}
                    onIntervention={handleIntervention}
                  />
                </TabsContent>
              </Tabs>
            )}

            {!assessmentResult && !isLoading && !error && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Submit a claim to see the assessment results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 