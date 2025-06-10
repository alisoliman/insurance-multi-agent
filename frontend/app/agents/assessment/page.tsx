"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Shield, Copy, Download, CheckCircle, AlertCircle, Clock, FileText, Upload, X, Eye, FileImage, Code } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const assessmentFormSchema = z.object({
  policyNumber: z.string().min(1, "Policy number is required"),
  claimAmount: z.string().min(1, "Claim amount is required"),
  dateOfIncident: z.string().min(1, "Incident date is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  claimType: z.string().min(1, "Claim type is required"),
  claimantName: z.string().min(1, "Claimant name is required"),
  contactInformation: z.string().optional(),
  specialCircumstances: z.string().optional(),
})

type AssessmentFormData = z.infer<typeof assessmentFormSchema>

interface AssessmentResult {
  decision: string
  confidence_score: number
  reasoning: string
  risk_factors: string[]
  recommended_actions: string[]
  estimated_amount: number
  processing_notes: string
  metadata?: {
    generation_method?: string
    error?: string
  }
}

interface ImageData {
  filename: string
  size: number
  type: string
  extractedText?: string
  analysis?: string
  metadata?: Record<string, any>
}

const claimTypes = [
  { value: "auto", label: "Auto Insurance" },
  { value: "home", label: "Home Insurance" },
  { value: "health", label: "Health Insurance" },
  { value: "life", label: "Life Insurance" },
  { value: "property", label: "Property Insurance" },
  { value: "liability", label: "Liability Insurance" },
  { value: "travel", label: "Travel Insurance" },
  { value: "other", label: "Other" },
]

const sampleClaims = [
  {
    name: "Minor Auto Accident",
    data: {
      policyNumber: "AUTO-2024-001",
      claimAmount: "2500",
      dateOfIncident: "2024-01-15",
      description: "Minor fender bender in parking lot. No injuries reported. Damage to rear bumper and taillight.",
      claimType: "auto",
      claimantName: "John Smith",
      contactInformation: "john.smith@email.com",
      specialCircumstances: "First claim on policy",
    }
  },
  {
    name: "Home Water Damage",
    data: {
      policyNumber: "HOME-2024-002",
      claimAmount: "15000",
      dateOfIncident: "2024-01-10",
      description: "Burst pipe in basement caused flooding. Damage to flooring, drywall, and personal belongings.",
      claimType: "home",
      claimantName: "Sarah Johnson",
      contactInformation: "sarah.j@email.com",
      specialCircumstances: "Emergency repairs already started",
    }
  },
  {
    name: "Complex Fraud Case",
    data: {
      policyNumber: "AUTO-2024-003",
      claimAmount: "45000",
      dateOfIncident: "2024-01-05",
      description: "Total loss vehicle fire. Suspicious circumstances. Multiple previous claims. Inconsistent witness statements.",
      claimType: "auto",
      claimantName: "Mike Wilson",
      contactInformation: "m.wilson@email.com",
      specialCircumstances: "Third claim this year, requires investigation",
    }
  }
]

export default function AssessmentAgentDemo() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [useFileUpload, setUseFileUpload] = useState(false)
  const [imageData, setImageData] = useState<ImageData[]>([])
  const [activeTab, setActiveTab] = useState("results")

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      policyNumber: "",
      claimAmount: "",
      dateOfIncident: "",
      description: "",
      claimType: "",
      claimantName: "",
      contactInformation: "",
      specialCircumstances: "",
    },
  })

  const loadSampleClaim = (sampleData: AssessmentFormData) => {
    Object.entries(sampleData).forEach(([key, value]) => {
      form.setValue(key as keyof AssessmentFormData, value)
    })
    toast.success("Sample claim loaded!")
  }

  const extractImageData = async (files: File[]): Promise<ImageData[]> => {
    const imageDataPromises = files.map(async (file): Promise<ImageData> => {
      const imageData: ImageData = {
        filename: file.name,
        size: file.size,
        type: file.type,
        metadata: {
          lastModified: new Date(file.lastModified).toISOString(),
          webkitRelativePath: (file as any).webkitRelativePath || '',
        }
      }

      // For images, we can extract basic metadata
      if (file.type.startsWith('image/')) {
        try {
          const img = new Image()
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              canvas.width = img.width
              canvas.height = img.height
              ctx?.drawImage(img, 0, 0)
              
              imageData.metadata = {
                ...imageData.metadata,
                width: img.width,
                height: img.height,
                aspectRatio: (img.width / img.height).toFixed(2),
                resolution: `${img.width}x${img.height}`,
                estimatedQuality: img.width * img.height > 1000000 ? 'High' : img.width * img.height > 300000 ? 'Medium' : 'Low'
              }
              resolve(void 0)
            }
            img.onerror = reject
            img.src = URL.createObjectURL(file)
          })
        } catch (error) {
          console.warn('Failed to extract image metadata:', error)
        }
      }

      // Simulate text extraction for documents
      if (file.type === 'application/pdf' || file.type.includes('document')) {
        imageData.extractedText = `[Simulated] Document content from ${file.name}. In a real implementation, this would contain extracted text from the document.`
        imageData.analysis = `Document Analysis: ${file.name} appears to be a ${file.type.includes('pdf') ? 'PDF document' : 'text document'} with ${(file.size / 1024).toFixed(1)}KB of content.`
      }

      // Simulate AI analysis for images
      if (file.type.startsWith('image/')) {
        imageData.analysis = `Image Analysis: ${file.name} is a ${file.type} image. Based on visual inspection, this appears to be ${file.name.toLowerCase().includes('receipt') ? 'a service receipt or document' : file.name.toLowerCase().includes('damage') ? 'damage documentation' : 'supporting documentation'}. The image quality is ${imageData.metadata?.estimatedQuality || 'unknown'} resolution.`
      }

      return imageData
    })

    return Promise.all(imageDataPromises)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/bmp', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type not supported: ${file.name}`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`File too large: ${file.name}`)
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles])
      
      // Extract image data
      const extractedData = await extractImageData(validFiles)
      setImageData(prev => [...prev, ...extractedData])
      
      toast.success(`${validFiles.length} file(s) uploaded and analyzed successfully`)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    setImageData(prev => prev.filter((_, i) => i !== index))
    toast.success("File removed")
  }

  const formatMarkdownAssessment = (result: AssessmentResult): string => {
    return `# Claim Assessment Report

## Decision: **${result.decision.toUpperCase()}**
**Confidence Score:** ${Math.round(result.confidence_score * 100)}%

---

## Assessment Details

### Reasoning
${result.reasoning}

### Risk Factors
${result.risk_factors && result.risk_factors.length > 0 
  ? result.risk_factors.map(factor => `- ⚠️ ${factor}`).join('\n')
  : '- ✅ No significant risk factors identified'
}

### Recommended Actions
${result.recommended_actions && result.recommended_actions.length > 0
  ? result.recommended_actions.map(action => `- 📋 ${action}`).join('\n')
  : '- No specific actions required'
}

### Financial Summary
- **Estimated Settlement:** $${result.estimated_amount.toLocaleString()}
- **Original Claim Amount:** $${form.getValues('claimAmount') ? parseInt(form.getValues('claimAmount')).toLocaleString() : 'N/A'}

### Processing Notes
${result.processing_notes}

---

*Assessment completed using AutoGen framework with Azure OpenAI*`
  }

  const handleAssessment = async (data: AssessmentFormData) => {
    if (useFileUpload && uploadedFiles.length > 0) {
      // Use file upload endpoint
      const endpoint = "http://localhost:8000/api/agents/enhanced-assessment/assess-claim-with-files"
      
      try {
        const formData = new FormData()
        formData.append("policy_number", data.policyNumber)
        formData.append("claim_amount", data.claimAmount)
        formData.append("date_of_incident", data.dateOfIncident)
        formData.append("description", data.description)
        formData.append("claim_type", data.claimType)
        formData.append("claimant_name", data.claimantName)
        formData.append("contact_information", data.contactInformation || "")
        formData.append("special_circumstances", data.specialCircumstances || "")
        
        // Add files
        uploadedFiles.forEach(file => {
          formData.append("files", file)
        })

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success && result.assessment_result) {
          setAssessmentResult(result.assessment_result)
          toast.success(`Assessment completed with ${uploadedFiles.length} file(s) processed!`)
        } else {
          throw new Error(result.error || "Assessment failed")
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
        setError(errorMessage)
        toast.error("Assessment failed: " + errorMessage)
      }
    } else {
      // Use regular endpoint
      const endpoint = "http://localhost:8000/api/agents/enhanced-assessment/assess-claim"

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            claim_data: {
              policy_number: data.policyNumber,
              incident_date: data.dateOfIncident,
              description: data.description,
              amount: parseFloat(data.claimAmount),
            },
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success && result.assessment_result) {
          setAssessmentResult(result.assessment_result)
          toast.success("Assessment completed successfully!")
        } else {
          throw new Error(result.error || "Assessment failed")
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
        setError(errorMessage)
        toast.error("Assessment failed: " + errorMessage)
      }
    }
  }

  const onSubmit = async (data: AssessmentFormData) => {
    setIsLoading(true)
    setError(null)
    setAssessmentResult(null)

    try {
      await handleAssessment(data)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const downloadAssessment = () => {
    if (!assessmentResult) return
    
    const content = formatMarkdownAssessment(assessmentResult)
    
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `assessment-${form.getValues('policyNumber')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Assessment downloaded!")
  }

  const getDecisionColor = (decision: string) => {
    switch (decision.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "denied":
        return "bg-red-100 text-red-800 border-red-200"
      case "investigation":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "denied":
        return <AlertCircle className="h-4 w-4" />
      case "investigation":
        return <Clock className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getClaimTypeDisplay = (value: string) => {
    const type = claimTypes.find(t => t.value === value)
    return type ? type.label : value
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Claim Assessment</span>
            <Badge variant="secondary" className="ml-2">AutoGen</Badge>
          </CardTitle>
          <CardDescription>
            Intelligent claim assessment using AutoGen framework with Azure OpenAI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sample Claims */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Test with Sample Claims</Label>
            <div className="grid grid-cols-1 gap-2">
              {sampleClaims.map((sample) => (
                <Button
                  key={sample.name}
                  variant="outline"
                  size="sm"
                  onClick={() => loadSampleClaim(sample.data)}
                  className="justify-start"
                >
                  {sample.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="claimantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Claimant Name</FormLabel>
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
                  name="dateOfIncident"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Incident</FormLabel>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select claim type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {claimTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="claimAmount"
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
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed description of the incident for accurate assessment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactInformation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Information</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com or phone number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional contact information for follow-up
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialCircumstances"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Circumstances</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special circumstances or additional context..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional additional context to consider during assessment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useFileUpload"
                    checked={useFileUpload}
                    onChange={(e) => setUseFileUpload(e.target.checked)}
                    className="rounded"
                    aria-label="Enable file upload for supporting documents"
                  />
                  <Label htmlFor="useFileUpload" className="text-sm font-medium">
                    Include supporting documents (images, PDFs, etc.)
                  </Label>
                </div>

                {useFileUpload && (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="mt-2">
                          <Label htmlFor="file-upload" className="cursor-pointer">
                            <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                              Upload files
                            </span>
                            <input
                              id="file-upload"
                              type="file"
                              multiple
                              accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp,.webp,.txt,.doc,.docx"
                              onChange={handleFileUpload}
                              className="sr-only"
                              aria-label="Upload supporting documents"
                              title="Upload supporting documents"
                            />
                          </Label>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, images, or documents up to 10MB each
                          </p>
                        </div>
                      </div>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Uploaded Files ({uploadedFiles.length})
                        </Label>
                        <div className="space-y-1">
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                            >
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm truncate">
                                  {file.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Assessing Claim..." : useFileUpload && uploadedFiles.length > 0 ? `Assess Claim with ${uploadedFiles.length} File(s)` : "Assess Claim"}
              </Button>
            </form>
          </Form>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Assessment Results</span>
            {assessmentResult && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(formatMarkdownAssessment(assessmentResult))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadAssessment}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardTitle>
          <CardDescription>
            AI-powered claim assessment using AutoGen framework with structured output
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assessmentResult ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="results" className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Assessment</span>
                </TabsTrigger>
                <TabsTrigger value="markdown" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Markdown</span>
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center space-x-2" disabled={imageData.length === 0}>
                  <FileImage className="h-4 w-4" />
                  <span>Image Data ({imageData.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="space-y-4 mt-4">
                {/* Assessment Decision */}
                <div className="flex items-center space-x-2">
                  <Badge className={`${getDecisionColor(assessmentResult.decision)} flex items-center space-x-1`}>
                    {getDecisionIcon(assessmentResult.decision)}
                    <span>{assessmentResult.decision.toUpperCase()}</span>
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Confidence: {Math.round(assessmentResult.confidence_score * 100)}%
                  </span>
                </div>

                {/* Assessment Metadata */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Claim Type</Label>
                    <div className="text-sm">{getClaimTypeDisplay(form.getValues('claimType'))}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Estimated Amount</Label>
                    <div className="text-sm">${assessmentResult.estimated_amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Policy Number</Label>
                    <div className="text-sm font-mono">{form.getValues('policyNumber')}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Confidence Score</Label>
                    <div className="text-sm">{Math.round(assessmentResult.confidence_score * 100)}%</div>
                  </div>
                </div>

                {/* Reasoning */}
                <div>
                  <Label className="text-sm font-medium">Assessment Reasoning</Label>
                  <div className="mt-1 p-4 bg-muted rounded-md">
                    <div className="text-sm whitespace-pre-wrap">{assessmentResult.reasoning}</div>
                  </div>
                </div>

                {/* Risk Factors */}
                {assessmentResult.risk_factors && assessmentResult.risk_factors.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Risk Factors</Label>
                    <div className="mt-1 space-y-1">
                      {assessmentResult.risk_factors.map((factor, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <AlertCircle className="h-3 w-3 text-yellow-500" />
                          <span>{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Actions */}
                {assessmentResult.recommended_actions && assessmentResult.recommended_actions.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Recommended Actions</Label>
                    <div className="mt-1 space-y-1">
                      {assessmentResult.recommended_actions.map((action, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Processing Notes */}
                <div>
                  <Label className="text-sm font-medium">Processing Notes</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <div className="text-sm">{assessmentResult.processing_notes}</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="markdown" className="mt-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {formatMarkdownAssessment(assessmentResult)}
                  </ReactMarkdown>
                </div>
              </TabsContent>

              <TabsContent value="images" className="mt-4">
                {imageData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Extracted data from {imageData.length} uploaded file(s)
                    </div>
                    {imageData.map((data, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center space-x-2">
                            <FileImage className="h-4 w-4" />
                            <span>{data.filename}</span>
                            <Badge variant="outline" className="text-xs">
                              {data.type}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Size: {(data.size / 1024).toFixed(1)} KB
                            {data.metadata?.resolution && ` • Resolution: ${data.metadata.resolution}`}
                            {data.metadata?.estimatedQuality && ` • Quality: ${data.metadata.estimatedQuality}`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {data.analysis && (
                            <div>
                              <Label className="text-sm font-medium">AI Analysis</Label>
                              <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                                <div className="text-sm">{data.analysis}</div>
                              </div>
                            </div>
                          )}
                          
                          {data.extractedText && (
                            <div>
                              <Label className="text-sm font-medium">Extracted Text</Label>
                              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                                <div className="text-sm font-mono">{data.extractedText}</div>
                              </div>
                            </div>
                          )}
                          
                          {data.metadata && Object.keys(data.metadata).length > 0 && (
                            <div>
                              <Label className="text-sm font-medium">Metadata</Label>
                              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {Object.entries(data.metadata).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className="font-medium text-muted-foreground">{key}:</span>
                                      <span className="font-mono">{String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileImage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No image data available</p>
                    <p className="text-sm">Upload files with your claim to see extracted data and analysis</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No assessment completed yet</p>
              <p className="text-sm">Fill out the claim form and click "Assess Claim" to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 