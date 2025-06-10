"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, GitBranch, CheckCircle, Clock, AlertTriangle, Activity, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExplainabilityPanel } from "@/components/explainability/ExplainabilityPanel"
import { transformOrchestratorToExplainability } from "@/lib/explainability-utils"

const orchestratorFormSchema = z.object({
  claimId: z.string().min(1, "Claim ID is required"),
  workflowType: z.string().min(1, "Workflow type is required"),
  priority: z.string().min(1, "Priority is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
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
    metadata: Record<string, unknown>
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

export default function OrchestratorAgentDemo() {
  const [isLoading, setIsLoading] = useState(false)
  const [orchestratorResult, setOrchestratorResult] = useState<OrchestratorResult | null>(null)
  const [graphFlowResult, setGraphFlowResult] = useState<GraphFlowResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentClaimData, setCurrentClaimData] = useState<OrchestratorFormData | null>(null)

  const form = useForm<OrchestratorFormData>({
    resolver: zodResolver(orchestratorFormSchema),
    defaultValues: {
      claimId: "",
      workflowType: "",
      priority: "",
      description: "",
    },
  })

  const loadSampleWorkflow = (sampleData: OrchestratorFormData) => {
    form.reset(sampleData)
    setOrchestratorResult(null)
    setGraphFlowResult(null)
    setError(null)
    setCurrentClaimData(null)
  }

  const onSubmit = async (data: OrchestratorFormData) => {
    setIsLoading(true)
    setError(null)
    setOrchestratorResult(null)
    setGraphFlowResult(null)

    try {
      const response = await fetch("http://localhost:8000/api/agents/orchestrator/process-workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          claim_data: {
            claim_id: data.claimId,
            policy_number: "POL-" + data.claimId.split("-")[1] || "12345", // Generate policy number from claim ID
            incident_date: new Date().toISOString().split('T')[0], // Use current date
            description: data.description,
            amount: 5000, // Default amount for demo
          },
          use_graphflow: data.workflowType === "graphflow",
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

  const transformFormDataToClaimData = (formData: OrchestratorFormData) => {
    return {
      customerName: "Demo Customer", // Default for demo
      policyNumber: "POL-" + formData.claimId.split("-")[1] || "12345",
      incidentDate: new Date().toISOString().split('T')[0],
      description: formData.description,
      amount: "5000", // Default amount for demo
      claimType: "auto", // Default type for demo
      useGraphflow: formData.workflowType === "graphflow"
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5" />
            <span>Workflow Orchestrator</span>
          </CardTitle>
          <CardDescription>
            Configure workflow parameters or use sample scenarios to test the orchestrator agent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sample Scenarios */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Quick Test with Sample Scenarios:</h4>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadSampleWorkflow({
                  claimId: "CLM-2024-001",
                  workflowType: "standard",
                  priority: "medium",
                  description: "Standard auto insurance claim processing workflow"
                })}
                className="justify-start text-left h-auto p-3"
              >
                <div>
                  <div className="font-medium">Standard Auto Claim</div>
                  <div className="text-xs text-muted-foreground">Medium priority workflow with assessment and communication agents</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadSampleWorkflow({
                  claimId: "CLM-2024-002",
                  workflowType: "complex",
                  priority: "high",
                  description: "Complex multi-vehicle accident requiring detailed investigation"
                })}
                className="justify-start text-left h-auto p-3"
              >
                <div>
                  <div className="font-medium">Complex Investigation</div>
                  <div className="text-xs text-muted-foreground">High priority workflow with extended agent coordination</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadSampleWorkflow({
                  claimId: "CLM-2024-003",
                  workflowType: "graphflow",
                  priority: "low",
                  description: "GraphFlow-based workflow for experimental processing"
                })}
                className="justify-start text-left h-auto p-3"
              >
                <div>
                  <div className="font-medium">GraphFlow Workflow</div>
                  <div className="text-xs text-muted-foreground">Experimental graph-based workflow processing</div>
                </div>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Manual Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="claimId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Claim ID</FormLabel>
                    <FormControl>
                      <Input placeholder="CLM-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workflowType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workflow Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select workflow type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="complex">Complex</SelectItem>
                        <SelectItem value="graphflow">GraphFlow</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the workflow requirements..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Workflow...
                  </>
                ) : (
                  <>
                    <GitBranch className="mr-2 h-4 w-4" />
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
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Workflow Results</span>
          </CardTitle>
          <CardDescription>
            Real-time workflow orchestration and agent coordination results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Orchestrating workflow...</p>
              </div>
            </div>
          )}

          {(orchestratorResult || graphFlowResult) && (
            <Tabs defaultValue="workflow" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="workflow">Workflow Details</TabsTrigger>
                <TabsTrigger value="explainability">Explainability</TabsTrigger>
              </TabsList>

              <TabsContent value="workflow" className="mt-4">
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
                              
                              {decision.metadata && typeof decision.metadata.assessment === 'string' && decision.metadata.assessment && (
                                <div className="text-xs bg-blue-50 p-2 rounded mt-2">
                                  <div className="font-medium mb-1">Assessment:</div>
                                  <div className="max-h-32 overflow-y-auto">
                                    <pre className="whitespace-pre-wrap text-xs">
                                      {String(decision.metadata.assessment)}
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
              </TabsContent>

              <TabsContent value="explainability" className="mt-4">
                {orchestratorResult && currentClaimData && (
                  <ExplainabilityPanel
                    data={transformOrchestratorToExplainability(orchestratorResult, transformFormDataToClaimData(currentClaimData))}
                    onIntervention={handleIntervention}
                  />
                )}
                {orchestratorResult && !currentClaimData && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Explainability data not available</p>
                  </div>
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
  )
} 