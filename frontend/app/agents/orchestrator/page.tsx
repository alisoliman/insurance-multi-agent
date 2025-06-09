"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, GitBranch, Play, CheckCircle, Clock, AlertTriangle, Users, Eye, FileText } from "lucide-react"

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
import { transformOrchestratorToExplainability } from "@/lib/explainability-utils"

const orchestratorFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
  incidentDate: z.string().min(1, "Incident date is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  amount: z.string().min(1, "Claim amount is required"),
  claimType: z.string().min(1, "Claim type is required"),
  useGraphflow: z.boolean().default(false),
})

type OrchestratorFormData = z.infer<typeof orchestratorFormSchema>



interface OrchestratorResult {
  workflow_id: string
  current_stage: string
  complexity: string
  started_at: string
  updated_at: string
  agent_decisions: Array<{
    agent_name: string
    decision: string
    confidence_score: number
    reasoning: string
    timestamp: string
    metadata: any
  }>
  requires_human_review: boolean
  error_message?: string
  claim_id?: string
}

interface GraphFlowResult {
  success: boolean
  messages: string[]
  workflow_completed: boolean
  workflow_type: "graphflow"
}

const sampleWorkflows = [
  {
    name: "Simple Auto Claim",
    data: {
      customerName: "John Smith",
      policyNumber: "AUTO-2024-001",
      incidentDate: "2024-01-15",
      description: "Minor fender bender in parking lot. No injuries reported. Damage to rear bumper and taillight.",
      amount: "2500",
      claimType: "auto",
      useGraphflow: false
    }
  },
  {
    name: "Complex Home Claim",
    data: {
      customerName: "Sarah Johnson",
      policyNumber: "HOME-2024-002",
      incidentDate: "2024-01-10",
      description: "Burst pipe in basement caused flooding. Damage to flooring, drywall, and personal belongings. Multiple rooms affected.",
      amount: "15000",
      claimType: "home",
      useGraphflow: true
    }
  },
  {
    name: "High-Value Suspicious Claim",
    data: {
      customerName: "Mike Wilson",
      policyNumber: "AUTO-2024-003",
      incidentDate: "2024-01-05",
      description: "Total loss vehicle fire. Suspicious circumstances. Multiple previous claims. Inconsistent witness statements.",
      amount: "45000",
      claimType: "auto",
      useGraphflow: true
    }
  }
]

export default function OrchestratorAgentDemo() {
  const [isLoading, setIsLoading] = useState(false)
  const [orchestratorResult, setOrchestratorResult] = useState<OrchestratorResult | null>(null)
  const [graphFlowResult, setGraphFlowResult] = useState<GraphFlowResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showExplainability, setShowExplainability] = useState(false)
  const [currentClaimData, setCurrentClaimData] = useState<OrchestratorFormData | null>(null)

  const form = useForm<OrchestratorFormData>({
    resolver: zodResolver(orchestratorFormSchema),
    defaultValues: {
      customerName: "",
      policyNumber: "",
      incidentDate: "",
      description: "",
      amount: "",
      claimType: "",
      useGraphflow: false,
    },
  })

  const loadSampleWorkflow = (sampleData: OrchestratorFormData) => {
    form.reset(sampleData)
    setOrchestratorResult(null)
    setGraphFlowResult(null)
    setError(null)
    setShowExplainability(false)
    setCurrentClaimData(null)
  }

  const onSubmit = async (data: OrchestratorFormData) => {
    setIsLoading(true)
    setError(null)
    setOrchestratorResult(null)
    setGraphFlowResult(null)
    setShowExplainability(false)

    try {
      const response = await fetch("http://localhost:8000/api/agents/orchestrator/process-workflow", {
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
          use_graphflow: data.useGraphflow,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        if (result.workflow_type === "graphflow" && result.result) {
          // Handle GraphFlow response
          setGraphFlowResult({
            success: result.result.success,
            messages: result.result.messages,
            workflow_completed: result.result.workflow_completed,
            workflow_type: "graphflow"
          })
          setCurrentClaimData(data)
          toast.success("GraphFlow workflow completed!")
        } else if (result.workflow_state) {
          // Handle simple workflow response
          setOrchestratorResult(result.workflow_state)
          setCurrentClaimData(data)
          toast.success("Workflow orchestration completed!")
        } else {
          throw new Error("Unknown workflow response format")
        }
      } else {
        throw new Error(result.error || "Workflow orchestration failed")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      toast.error("Workflow failed: " + errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_progress":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case "completed":
      case "processed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in_progress":
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "failed":
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      case "human_review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleIntervention = (interventionId: string, action: string) => {
    toast.info(`Intervention ${action} for ${interventionId}`)
    // In a real implementation, this would trigger backend actions
  }



  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Orchestrator Agent Demo</h1>
        <p className="text-muted-foreground">
          Test the workflow orchestration agent that coordinates between Assessment and Communication agents.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GitBranch className="h-5 w-5" />
              <span>Workflow Orchestration</span>
            </CardTitle>
            <CardDescription>
              Configure claim data and workflow type to test the orchestrator agent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sample Workflows */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Quick Test with Sample Workflows:</h4>
              <div className="space-y-2">
                {sampleWorkflows.map((sample, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => loadSampleWorkflow(sample.data)}
                    className="text-xs justify-start w-full"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{sample.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {sample.data.useGraphflow ? "GraphFlow" : "Simple"}
                      </Badge>
                    </div>
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
                        Detailed description helps the orchestrator choose the optimal workflow.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="useGraphflow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workflow Type</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select workflow type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="false">
                            <div>
                              <div className="font-medium">Simple Workflow</div>
                              <div className="text-xs text-muted-foreground">Basic sequential processing</div>
                            </div>
                          </SelectItem>
                          <SelectItem value="true">
                            <div>
                              <div className="font-medium">GraphFlow Workflow</div>
                              <div className="text-xs text-muted-foreground">Advanced graph-based orchestration</div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Orchestrating Workflow...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Workflow
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
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Workflow Execution</span>
                </CardTitle>
                <CardDescription>
                  Real-time workflow orchestration and agent coordination results.
                </CardDescription>
              </div>
              {(orchestratorResult || graphFlowResult) && currentClaimData && (
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
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Orchestrating workflow execution...</span>
                </div>
                <Progress value={33} className="w-full" />
              </div>
            )}

            {(orchestratorResult || graphFlowResult) && currentClaimData && (
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
                  {orchestratorResult && (
                    <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStepColor(orchestratorResult.current_stage)}>
                      {orchestratorResult.current_stage.toUpperCase().replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ID: {orchestratorResult.workflow_id}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {orchestratorResult.complexity}
                    </Badge>
                    {orchestratorResult.requires_human_review && (
                      <Badge variant="destructive" className="text-xs">
                        Human Review Required
                      </Badge>
                    )}
                  </div>
                </div>

                {orchestratorResult.agent_decisions && orchestratorResult.agent_decisions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Agent Decisions</h4>
                      <span className="text-sm text-muted-foreground">
                        {orchestratorResult.agent_decisions.length} agent{orchestratorResult.agent_decisions.length !== 1 ? 's' : ''} processed
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {orchestratorResult.agent_decisions.map((decision, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getStepIcon("completed")}
                              <span className="font-medium text-sm capitalize">{decision.agent_name} Agent</span>
                              <Badge variant="outline" className="text-xs">
                                {decision.decision}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                {(decision.confidence_score * 100).toFixed(0)}% confidence
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground mb-2">
                            Processed: {new Date(decision.timestamp).toLocaleString()}
                          </div>
                          
                          {decision.reasoning && (
                            <div className="text-xs bg-muted p-2 rounded mt-2">
                              <div className="font-medium mb-1">Reasoning:</div>
                              <span>{decision.reasoning}</span>
                            </div>
                          )}
                          
                          {decision.metadata && decision.metadata.assessment && (
                            <div className="text-xs bg-blue-50 p-2 rounded mt-2">
                              <div className="font-medium mb-1">Assessment:</div>
                              <div className="max-h-32 overflow-y-auto">
                                <pre className="whitespace-pre-wrap text-xs">
                                  {decision.metadata.assessment}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Workflow Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Started:</span> {new Date(orchestratorResult.started_at).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span> {new Date(orchestratorResult.updated_at).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Current Stage:</span> {orchestratorResult.current_stage.replace('_', ' ')}
                    </div>
                    <div>
                      <span className="font-medium">Complexity:</span> {orchestratorResult.complexity}
                    </div>
                  </div>
                  
                  {orchestratorResult.error_message && (
                    <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
                      <div className="font-medium mb-1">Error:</div>
                      {orchestratorResult.error_message}
                    </div>
                  )}
                </div>
              </div>
            )}

            {graphFlowResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      GRAPHFLOW COMPLETED
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Workflow Type: {graphFlowResult.workflow_type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {graphFlowResult.messages.length} messages
                    </Badge>
                    {graphFlowResult.workflow_completed && (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Workflow Messages</h4>
                  <div className="space-y-2">
                    {graphFlowResult.messages.map((message, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {index === graphFlowResult.messages.length - 1 ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-blue-500" />
                            )}
                            <span className="font-medium text-sm">Step {index + 1}</span>
                            <Badge variant="outline" className="text-xs">
                              {index === 0 ? "Initial Request" : 
                               index === graphFlowResult.messages.length - 1 ? "Completion" : 
                               "Processing"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-xs bg-muted p-2 rounded mt-2">
                          <div className="max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-xs">
                              {message}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">GraphFlow Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Workflow Type:</span> GraphFlow
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {graphFlowResult.workflow_completed ? "Completed" : "In Progress"}
                    </div>
                    <div>
                      <span className="font-medium">Messages:</span> {graphFlowResult.messages.length}
                    </div>
                    <div>
                      <span className="font-medium">Success:</span> {graphFlowResult.success ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              </div>
                  )}
                </TabsContent>

                <TabsContent value="explainability" className="mt-4">
                  {orchestratorResult && (
                    <ExplainabilityPanel
                      data={transformOrchestratorToExplainability(orchestratorResult, currentClaimData)}
                      onIntervention={handleIntervention}
                    />
                  )}
                </TabsContent>
              </Tabs>
            )}

            {!orchestratorResult && !graphFlowResult && !isLoading && !error && (
              <div className="text-center py-8 text-muted-foreground">
                <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a workflow to see the orchestration in action</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 