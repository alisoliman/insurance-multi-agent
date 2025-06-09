'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  IconShield,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconPlayerPause,
  IconPlayerPlay,
  IconUser,
  IconLock,
  IconLockOpen
} from '@tabler/icons-react'

import { InterventionPoint } from './ExplainabilityPanel'

interface InterventionControlsProps {
  interventionPoints: InterventionPoint[]
  onIntervention?: (interventionId: string, action: string, reason?: string) => void
  className?: string
}

export function InterventionControls({ 
  interventionPoints, 
  onIntervention,
  className = "" 
}: InterventionControlsProps) {
  const [selectedIntervention, setSelectedIntervention] = useState<string | null>(null)
  const [interventionReason, setInterventionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const getInterventionIcon = (point: InterventionPoint) => {
    if (!point.canOverride) {
      return <IconLock className="h-4 w-4 text-gray-500" />
    }
    if (point.requiresApproval) {
      return <IconShield className="h-4 w-4 text-orange-500" />
    }
    return <IconLockOpen className="h-4 w-4 text-green-500" />
  }

  const getInterventionColor = (point: InterventionPoint) => {
    if (!point.canOverride) {
      return 'bg-gray-100 text-gray-800 border-gray-200'
    }
    if (point.requiresApproval) {
      return 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return 'bg-green-100 text-green-800 border-green-200'
  }

  const handleIntervention = async (interventionId: string, action: string) => {
    if (!onIntervention) return

    setIsProcessing(true)
    try {
      await onIntervention(interventionId, action, interventionReason)
      setSelectedIntervention(null)
      setInterventionReason('')
    } catch (error) {
      console.error('Intervention failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const availableInterventions = interventionPoints.filter(point => point.canOverride)
  const lockedInterventions = interventionPoints.filter(point => !point.canOverride)

  if (!interventionPoints || interventionPoints.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <IconShield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <div className="text-muted-foreground">
            No intervention points available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <IconUser className="h-5 w-5" />
          <span>Human Intervention Controls</span>
          <Badge variant="outline">
            {availableInterventions.length} available
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Available Interventions */}
        {availableInterventions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Available Interventions</h4>
            {availableInterventions.map((point) => (
              <Card key={point.id} className="border-2 hover:border-blue-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      {getInterventionIcon(point)}
                      <div className="flex-1">
                        <div className="font-medium">{point.stage}</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {point.description}
                        </p>
                      </div>
                    </div>
                    <Badge className={getInterventionColor(point)} variant="outline">
                      {point.requiresApproval ? 'Requires Approval' : 'Direct Override'}
                    </Badge>
                  </div>

                  {selectedIntervention === point.id ? (
                    <div className="space-y-3 pt-3 border-t">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Intervention Reason (Optional)
                        </label>
                        <Textarea
                          value={interventionReason}
                          onChange={(e) => setInterventionReason(e.target.value)}
                          placeholder="Provide a reason for this intervention..."
                          className="min-h-[80px]"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleIntervention(point.id, 'approve')}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <IconCheck className="h-4 w-4 mr-1" />
                          Approve Override
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleIntervention(point.id, 'reject')}
                          disabled={isProcessing}
                        >
                          <IconX className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleIntervention(point.id, 'pause')}
                          disabled={isProcessing}
                        >
                          <IconPlayerPause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedIntervention(null)
                            setInterventionReason('')
                          }}
                          disabled={isProcessing}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedIntervention(point.id)}
                        className="w-full"
                      >
                        <IconShield className="h-4 w-4 mr-2" />
                        Initiate Intervention
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Locked Interventions */}
        {lockedInterventions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Restricted Interventions</h4>
            {lockedInterventions.map((point) => (
              <Card key={point.id} className="border border-gray-200 bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {getInterventionIcon(point)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-700">{point.stage}</div>
                      <p className="text-sm text-gray-500 mt-1">
                        {point.description}
                      </p>
                      <Badge className="mt-2 bg-gray-100 text-gray-600" variant="outline">
                        Override Not Permitted
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onIntervention?.('all', 'pause')}
              disabled={isProcessing}
            >
              <IconPlayerPause className="h-4 w-4 mr-2" />
              Pause All
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onIntervention?.('all', 'resume')}
              disabled={isProcessing}
            >
              <IconPlayerPlay className="h-4 w-4 mr-2" />
              Resume All
            </Button>
          </div>
        </div>

        {/* Warning Alert */}
        <Alert>
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Human interventions will be logged for audit purposes. Ensure you have 
            appropriate authorization before overriding agent decisions.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
} 