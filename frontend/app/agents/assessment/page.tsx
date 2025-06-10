"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, FileText, AlertCircle, CheckCircle, Clock, Eye, Image, FileImage } from "lucide-react"

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
import { FileUpload } from "@/components/ui/file-upload"
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

interface ImageAnalysisResult {
  filename: string
  file_size: number
  image_type: string
  classification: string
  confidence_score: number
  relevance_score: number
  extracted_text?: string
  extracted_data?: {
    document_type?: string
    vendor_name?: string
    amounts?: (string | { label?: string; amount?: string })[]
    dates?: string[]
    names?: string[]
    invoice_number?: string
    line_items?: (string | { description?: string; quantity?: string; part?: string; amount?: string })[]
    tax_amount?: string
    total_amount?: string
    payment_terms?: string
    key_details?: string[]
    error?: string
    error_type?: string
  }
  damage_assessment?: {
    severity: string
    estimated_cost?: string
    description?: string
    affected_areas?: string[]
  }
  fraud_indicators?: {
    suspicious_elements?: string[]
    authenticity_score?: number
    concerns?: string[]
  }
  processing_time_seconds: number
}

interface MultiImageAssessmentResult {
  total_images_processed: number
  processing_time_seconds: number
  image_analyses: ImageAnalysisResult[]
  overall_relevance_score: number
  recommended_actions: string[]
  summary: string
}

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

interface AssessmentWithImagesResult {
  success: boolean
  assessment_result?: AssessmentResult
  image_analysis_result?: MultiImageAssessmentResult
  error?: string
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
  const [imageAnalysisResult, setImageAnalysisResult] = useState<MultiImageAssessmentResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showExplainability, setShowExplainability] = useState(false)
  const [activeTab, setActiveTab] = useState<"summary" | "images" | "explainability">("summary")
  const [currentClaimData, setCurrentClaimData] = useState<AssessmentFormData | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

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
    setImageAnalysisResult(null)
    setError(null)
    setShowExplainability(false)
    setCurrentClaimData(null)
    setUploadedFiles([])
  }

  const onSubmit = async (data: AssessmentFormData) => {
    setIsLoading(true)
    setError(null)
    setAssessmentResult(null)
    setImageAnalysisResult(null)
    setShowExplainability(false)

    try {
      // Determine which endpoint to use based on whether images are uploaded
      const hasImages = uploadedFiles.length > 0
      const endpoint = hasImages 
        ? "http://localhost:8000/api/agents/enhanced-assessment/assess-claim-with-images"
        : "http://localhost:8000/api/agents/enhanced-assessment/assess-claim"

      let response: Response

      if (hasImages) {
        // Use FormData for multipart/form-data request
        const formData = new FormData()
        formData.append("policy_number", data.policyNumber)
        formData.append("incident_date", data.incidentDate)
        formData.append("description", data.description)
        formData.append("amount", data.amount)
        formData.append("claim_id", `CLAIM-${Date.now()}`)
        
        // Add image files
        uploadedFiles.forEach((file) => {
          formData.append("image_files", file)
        })

        response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        })
      } else {
        // Use JSON for regular request
        response = await fetch(endpoint, {
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
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: AssessmentWithImagesResult = await response.json()
      
      if (result.success) {
        if (result.assessment_result) {
          setAssessmentResult(result.assessment_result)
        }
        if (result.image_analysis_result) {
          setImageAnalysisResult(result.image_analysis_result)
        }
        setCurrentClaimData(data)
        toast.success(hasImages ? "Assessment with image analysis completed!" : "Assessment completed successfully!")
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Claim Assessment Form</CardTitle>
            <CardDescription>
              Enter claim details, upload supporting images, or use a sample claim to test the assessment agent.
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

                {/* File Upload Section */}
                <div className="space-y-2">
                  <FormLabel>Supporting Images (Optional)</FormLabel>
                  <FileUpload
                    onFilesChange={setUploadedFiles}
                    accept="image/*"
                    maxFiles={5}
                    maxSize={10 * 1024 * 1024} // 10MB
                    disabled={isLoading}
                    value={uploadedFiles}
                  />
                  <FormDescription>
                    Upload images related to your claim (invoices, damage photos, receipts, etc.). 
                    Supported formats: JPEG, PNG, TIFF, BMP, WebP. Max 5 files, 10MB each.
                  </FormDescription>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadedFiles.length > 0 ? "Analyzing Claim & Images..." : "Analyzing Claim..."}
                    </>
                  ) : (
                    <>
                      {uploadedFiles.length > 0 && <Image className="mr-2 h-4 w-4" aria-label="Image icon" />}
                      Assess Claim {uploadedFiles.length > 0 && `(${uploadedFiles.length} images)`}
                    </>
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
                  Real-time AI analysis and decision-making results with image processing.
                </CardDescription>
              </div>
              {assessmentResult && currentClaimData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newShowExplainability = !showExplainability
                    setShowExplainability(newShowExplainability)
                    setActiveTab(newShowExplainability ? "explainability" : "summary")
                  }}
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
                  <span className="text-sm">
                    {uploadedFiles.length > 0 
                      ? `Processing claim assessment with ${uploadedFiles.length} images...`
                      : "Processing claim assessment..."
                    }
                  </span>
                </div>
                <Progress value={33} className="w-full" />
              </div>
            )}

            {assessmentResult && currentClaimData && (
              <Tabs value={activeTab} onValueChange={(value) => {
                setActiveTab(value as "summary" | "images" | "explainability")
                setShowExplainability(value === "explainability")
              }} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger 
                    value="summary" 
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Summary</span>
                  </TabsTrigger>
                  {imageAnalysisResult && (
                    <TabsTrigger 
                      value="images"
                      className="flex items-center space-x-2"
                    >
                      <FileImage className="h-4 w-4" />
                      <span>Images</span>
                    </TabsTrigger>
                  )}
                  <TabsTrigger 
                    value="explainability" 
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
                      {imageAnalysisResult && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <FileImage className="h-3 w-3" />
                          <span>{imageAnalysisResult.total_images_processed} images analyzed</span>
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Reasoning</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {assessmentResult.reasoning}
                        </p>
                      </div>

                      {imageAnalysisResult && (
                        <div>
                          <h4 className="font-medium mb-2">Image Analysis Summary</h4>
                          <div className="bg-muted p-3 rounded space-y-2">
                            <p className="text-sm text-muted-foreground">{imageAnalysisResult.summary}</p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>Overall Relevance: {Math.round(imageAnalysisResult.overall_relevance_score * 100)}%</span>
                              <span>Processing Time: {imageAnalysisResult.processing_time_seconds.toFixed(2)}s</span>
                            </div>
                          </div>
                        </div>
                      )}

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

                {imageAnalysisResult && (
                  <TabsContent value="images" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Image Analysis Results</h4>
                        <Badge variant="secondary">
                          {imageAnalysisResult.total_images_processed} images processed
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {imageAnalysisResult.image_analyses.map((analysis, index) => (
                          <div key={index} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <FileImage className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{analysis.filename}</span>
                                <Badge variant={
                                  analysis.image_type === "error" 
                                    ? "destructive" 
                                    : "outline"
                                } className="text-xs">
                                  {analysis.image_type}
                                </Badge>
                                {analysis.image_type === "error" && (
                                  <Badge variant="destructive" className="text-xs">
                                    FAILED
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(analysis.file_size)}
                              </span>
                            </div>

                            {/* Error Display for Failed Images */}
                            {analysis.image_type === "error" && (
                              <div className="bg-red-50 border border-red-200 rounded p-3 space-y-2">
                                <div className="flex items-center space-x-2">
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                  <span className="font-medium text-red-700">Image Processing Failed</span>
                                </div>
                                <p className="text-sm text-red-600">{analysis.classification}</p>
                                {analysis.extracted_data?.error && (
                                  <div className="mt-2">
                                    <span className="text-xs font-medium text-red-700">Error Details:</span>
                                    <p className="text-xs text-red-600 bg-red-100 p-2 rounded mt-1 font-mono">
                                      {analysis.extracted_data.error}
                                    </p>
                                  </div>
                                )}
                                {analysis.extracted_data?.error_type && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-medium text-red-700">Error Type:</span>
                                    <Badge variant="destructive" className="text-xs">
                                      {analysis.extracted_data.error_type}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Normal Analysis Display for Successful Images */}
                            {analysis.image_type !== "error" && (
                              <>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Classification:</span>
                                    <p className="font-medium">{analysis.classification}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Confidence:</span>
                                    <p className="font-medium">{Math.round(analysis.confidence_score * 100)}%</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Relevance:</span>
                                    <p className="font-medium">{Math.round(analysis.relevance_score * 100)}%</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Processing Time:</span>
                                    <p className="font-medium">{analysis.processing_time_seconds.toFixed(2)}s</p>
                                  </div>
                                </div>

                                {/* Enhanced Invoice/Financial Document Display */}
                                {analysis.image_type === "invoice" && analysis.extracted_data && (
                                  <div>
                                    <span className="text-muted-foreground text-sm">Invoice Details:</span>
                                    <div className="bg-muted p-3 rounded mt-1 space-y-2">
                                      {analysis.extracted_data.vendor_name && (
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-medium">Vendor:</span>
                                          <span className="text-sm">{analysis.extracted_data.vendor_name}</span>
                                        </div>
                                      )}
                                      
                                      {analysis.extracted_data.invoice_number && (
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-medium">Invoice #:</span>
                                          <span className="text-sm font-mono">{analysis.extracted_data.invoice_number}</span>
                                        </div>
                                      )}

                                      {analysis.extracted_data.total_amount && (
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-medium">Total Amount:</span>
                                          <Badge variant="outline" className="font-mono">
                                            {analysis.extracted_data.total_amount}
                                          </Badge>
                                        </div>
                                      )}

                                      {analysis.extracted_data.dates && analysis.extracted_data.dates.length > 0 && (
                                        <div>
                                          <span className="text-sm font-medium">Dates:</span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {analysis.extracted_data.dates.map((date, idx) => (
                                              <Badge key={idx} variant="secondary" className="text-xs">
                                                {date}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {analysis.extracted_data.amounts && analysis.extracted_data.amounts.length > 0 && (
                                        <div>
                                          <span className="text-muted-foreground">Amounts Found:</span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {analysis.extracted_data.amounts.slice(0, 5).map((amount, idx) => (
                                              <Badge key={idx} variant="outline" className="text-xs font-mono">
                                                {typeof amount === 'string' 
                                                  ? amount 
                                                  : `${amount.label || 'Amount'}: ${amount.amount || 'N/A'}`
                                                }
                                              </Badge>
                                            ))}
                                            {analysis.extracted_data.amounts.length > 5 && (
                                              <Badge variant="outline" className="text-xs">
                                                +{analysis.extracted_data.amounts.length - 5} more
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {analysis.extracted_data.line_items && analysis.extracted_data.line_items.length > 0 && (
                                        <div>
                                          <span className="text-muted-foreground">Line Items:</span>
                                          <div className="mt-1 space-y-1">
                                            {analysis.extracted_data.line_items.slice(0, 3).map((item, idx) => (
                                              <p key={idx} className="text-xs bg-background p-1 rounded border">
                                                {typeof item === 'string' 
                                                  ? item 
                                                  : `${item.description || 'Item'} ${item.quantity ? `(Qty: ${item.quantity})` : ''} ${item.amount ? `- ${item.amount}` : ''}`
                                                }
                                              </p>
                                            ))}
                                            {analysis.extracted_data.line_items.length > 3 && (
                                              <p className="text-xs text-muted-foreground">
                                                +{analysis.extracted_data.line_items.length - 3} more items
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {analysis.extracted_data.tax_amount && (
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-medium">Tax:</span>
                                          <span className="text-sm font-mono">{analysis.extracted_data.tax_amount}</span>
                                        </div>
                                      )}

                                      {analysis.extracted_data.payment_terms && (
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-medium">Payment Terms:</span>
                                          <span className="text-sm">{analysis.extracted_data.payment_terms}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Extracted Text for Non-Invoice Documents */}
                                {analysis.extracted_text && analysis.image_type !== "invoice" && (
                                  <div>
                                    <span className="text-muted-foreground text-sm">Extracted Text:</span>
                                    <p className="text-sm bg-muted p-2 rounded mt-1">{analysis.extracted_text}</p>
                                  </div>
                                )}

                                {/* General Extracted Data for Non-Invoice Documents */}
                                {analysis.extracted_data && analysis.image_type !== "invoice" && (
                                  <div>
                                    <span className="text-muted-foreground text-sm">Extracted Information:</span>
                                    <div className="bg-muted p-2 rounded mt-1 space-y-1">
                                      {analysis.extracted_data.document_type && (
                                        <p className="text-sm">
                                          <span className="font-medium">Document Type:</span> {analysis.extracted_data.document_type}
                                        </p>
                                      )}
                                      
                                      {analysis.extracted_data.amounts && analysis.extracted_data.amounts.length > 0 && (
                                        <div>
                                          <span className="text-sm font-medium">Amounts:</span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {analysis.extracted_data.amounts.slice(0, 3).map((amount, idx) => (
                                              <Badge key={idx} variant="outline" className="text-xs font-mono">
                                                {typeof amount === 'string' 
                                                  ? amount 
                                                  : `${amount.label || 'Amount'}: ${amount.amount || 'N/A'}`
                                                }
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {analysis.extracted_data.dates && analysis.extracted_data.dates.length > 0 && (
                                        <div>
                                          <span className="text-sm font-medium">Dates:</span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {analysis.extracted_data.dates.slice(0, 3).map((date, idx) => (
                                              <Badge key={idx} variant="secondary" className="text-xs">
                                                {date}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {analysis.extracted_data.key_details && analysis.extracted_data.key_details.length > 0 && (
                                        <div>
                                          <span className="text-sm font-medium">Key Details:</span>
                                          <div className="mt-1 space-y-1">
                                            {analysis.extracted_data.key_details.slice(0, 2).map((detail, idx) => (
                                              <p key={idx} className="text-xs bg-background p-1 rounded border">
                                                {detail}
                                              </p>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Fraud Indicators */}
                                {analysis.fraud_indicators && (
                                  <div>
                                    <span className="text-muted-foreground text-sm">Fraud Analysis:</span>
                                    <div className="bg-muted p-2 rounded mt-1 space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium">Authenticity Score:</span>
                                        <Badge variant={
                                          (analysis.fraud_indicators.authenticity_score || 0) > 0.8 
                                            ? "default" 
                                            : (analysis.fraud_indicators.authenticity_score || 0) > 0.6 
                                            ? "secondary" 
                                            : "destructive"
                                        }>
                                          {Math.round((analysis.fraud_indicators.authenticity_score || 0) * 100)}%
                                        </Badge>
                                      </div>
                                      
                                      {analysis.fraud_indicators.suspicious_elements && analysis.fraud_indicators.suspicious_elements.length > 0 && (
                                        <div>
                                          <span className="text-sm font-medium text-yellow-600">Suspicious Elements:</span>
                                          <div className="mt-1 space-y-1">
                                            {analysis.fraud_indicators.suspicious_elements.map((element, idx) => (
                                              <p key={idx} className="text-xs bg-yellow-50 p-1 rounded border border-yellow-200">
                                                {element}
                                              </p>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {analysis.fraud_indicators.concerns && analysis.fraud_indicators.concerns.length > 0 && (
                                        <div>
                                          <span className="text-sm font-medium text-orange-600">Concerns:</span>
                                          <div className="mt-1 space-y-1">
                                            {analysis.fraud_indicators.concerns.map((concern, idx) => (
                                              <p key={idx} className="text-xs bg-orange-50 p-1 rounded border border-orange-200">
                                                {concern}
                                              </p>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {analysis.damage_assessment && analysis.damage_assessment.severity !== "none" && (
                                  <div>
                                    <span className="text-muted-foreground text-sm">Damage Assessment:</span>
                                    <div className="bg-muted p-2 rounded mt-1 space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium">Severity:</span>
                                        <Badge variant={
                                          analysis.damage_assessment.severity === "severe" || analysis.damage_assessment.severity === "total_loss" 
                                            ? "destructive" 
                                            : analysis.damage_assessment.severity === "moderate" 
                                            ? "default" 
                                            : "secondary"
                                        }>
                                          {analysis.damage_assessment.severity}
                                        </Badge>
                                      </div>
                                      {analysis.damage_assessment.estimated_cost && (
                                        <p className="text-sm">
                                          <span className="font-medium">Estimated Cost:</span> {analysis.damage_assessment.estimated_cost}
                                        </p>
                                      )}
                                      {analysis.damage_assessment.description && (
                                        <p className="text-sm">{analysis.damage_assessment.description}</p>
                                      )}
                                      {analysis.damage_assessment.affected_areas && analysis.damage_assessment.affected_areas.length > 0 && (
                                        <div>
                                          <span className="text-sm font-medium">Affected Areas:</span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {analysis.damage_assessment.affected_areas.map((area, idx) => (
                                              <Badge key={idx} variant="outline" className="text-xs">
                                                {area}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>

                      {imageAnalysisResult.recommended_actions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Image-Based Recommendations</h4>
                          <div className="space-y-1">
                            {imageAnalysisResult.recommended_actions.map((action, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm">
                                <CheckCircle className="h-3 w-3 text-blue-500" />
                                <span>{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}

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
                <p className="text-sm mt-2">Upload images for enhanced analysis with AI vision capabilities</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  } 