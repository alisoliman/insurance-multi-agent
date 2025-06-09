"use client"

import { useState } from "react"
import { useWebSocketContext } from "@/lib/websocket-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Play, Send, Zap, Activity } from "lucide-react"

export function WebSocketTestPanel() {
  const { 
    isConnected, 
    processWithAgent, 
    sendMessage,
    subscriptions 
  } = useWebSocketContext()

  const [agentType, setAgentType] = useState<'assessment' | 'communication' | 'orchestrator'>('assessment')
  const [agentData, setAgentData] = useState('')
  const [workflowType, setWorkflowType] = useState('claim_processing')
  const [customMessage, setCustomMessage] = useState('')

  const handleAgentProcessing = async () => {
    if (!agentData.trim()) return
    
    try {
      const data = JSON.parse(agentData)
      await processWithAgent(agentType, JSON.stringify(data))
    } catch (error) {
      console.error('Invalid JSON data:', error)
      // You could show a toast here
    }
  }

  const handleWorkflowSimulation = async () => {
    // Send a workflow simulation message
    sendMessage({
      type: 'workflow_simulate',
      workflow_type: workflowType
    })
  }

  const handleSendMessage = async () => {
    if (!customMessage.trim()) return
    sendMessage({
      type: 'custom_message',
      message: customMessage
    })
    setCustomMessage('')
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          WebSocket Test Panel
        </CardTitle>
        <CardDescription>
          Test real-time agent processing and workflow simulation
        </CardDescription>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active subscriptions:</span>
          {subscriptions.map((sub) => (
            <Badge key={sub} variant="secondary" className="text-xs">
              {sub}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Agent Processing Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <h3 className="text-sm font-medium">Agent Processing</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agent-type">Agent Type</Label>
              <Select value={agentType} onValueChange={(value: 'assessment' | 'communication' | 'orchestrator') => setAgentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assessment">Assessment Agent</SelectItem>
                  <SelectItem value="communication">Communication Agent</SelectItem>
                  <SelectItem value="orchestrator">Orchestrator Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent-data">Agent Data (JSON)</Label>
              <Textarea
                id="agent-data"
                placeholder='{"claim_id": "12345", "data": "test"}'
                value={agentData}
                onChange={(e) => setAgentData(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleAgentProcessing}
            disabled={!isConnected || !agentData.trim()}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            Process with {agentType} Agent
          </Button>
        </div>

        <Separator />

        {/* Workflow Simulation Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <h3 className="text-sm font-medium">Workflow Simulation</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="workflow-type">Workflow Type</Label>
            <Select value={workflowType} onValueChange={setWorkflowType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claim_processing">Claim Processing</SelectItem>
                <SelectItem value="policy_review">Policy Review</SelectItem>
                <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                <SelectItem value="customer_onboarding">Customer Onboarding</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleWorkflowSimulation}
            disabled={!isConnected}
            className="w-full"
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            Simulate {workflowType.replace('_', ' ')} Workflow
          </Button>
        </div>

        <Separator />

        {/* Custom Message Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <h3 className="text-sm font-medium">Send Custom Message</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="custom-message">Message</Label>
            <Input
              id="custom-message"
              placeholder="Enter a custom message..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
          </div>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!isConnected || !customMessage.trim()}
            className="w-full"
            variant="secondary"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 