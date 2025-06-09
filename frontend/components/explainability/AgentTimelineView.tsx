'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  IconMessageCircle,
  IconArrowRight,
  IconBell,
  IconClock,
  IconFilter,
  IconRefresh,
  IconChevronDown,
  IconChevronUp
} from '@tabler/icons-react'

import { AgentCommunication } from './ExplainabilityPanel'

interface AgentTimelineViewProps {
  communications: AgentCommunication[]
  onCommunicationClick?: (communication: AgentCommunication) => void
  className?: string
}

export function AgentTimelineView({ 
  communications, 
  onCommunicationClick,
  className = "" 
}: AgentTimelineViewProps) {
  const [filter, setFilter] = useState<'all' | 'request' | 'response' | 'notification'>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const getMessageIcon = (type: AgentCommunication['type']) => {
    switch (type) {
      case 'request':
        return <IconMessageCircle className="h-4 w-4 text-blue-600" />
      case 'response':
        return <IconArrowRight className="h-4 w-4 text-green-600" />
      case 'notification':
        return <IconBell className="h-4 w-4 text-orange-600" />
      default:
        return <IconMessageCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getMessageTypeColor = (type: AgentCommunication['type']) => {
    switch (type) {
      case 'request':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'response':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'notification':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAgentColor = (agentName: string) => {
    const colors = [
      'bg-purple-100 text-purple-800',
      'bg-indigo-100 text-indigo-800',
      'bg-pink-100 text-pink-800',
      'bg-cyan-100 text-cyan-800',
      'bg-emerald-100 text-emerald-800'
    ]
    const hash = agentName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString(),
      relative: getRelativeTime(date)
    }
  }

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const filteredCommunications = communications
    .filter(comm => filter === 'all' || comm.type === filter)
    .sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const isExpanded = (id: string) => expandedItems.includes(id)

  const handleRefresh = () => {
    // Trigger refresh of communications data
    console.log('Refreshing communications...')
  }

  if (!communications || communications.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <IconMessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <div className="text-muted-foreground">
            No agent communications available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <IconMessageCircle className="h-5 w-5" />
            <span>Agent Communications</span>
            <Badge variant="outline">
              {filteredCommunications.length} messages
            </Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              <IconRefresh className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 pt-2">
          <IconFilter className="h-4 w-4 text-muted-foreground" />
          <div className="flex space-x-1">
            {(['all', 'request', 'response', 'notification'] as const).map((type) => (
              <Button
                key={type}
                variant={filter === type ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(type)}
                className="h-7 px-2 text-xs"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
          
          <div className="ml-4 flex items-center space-x-1">
            <IconClock className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="h-7 px-2 text-xs"
            >
              {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {filteredCommunications.map((comm, index) => {
              const timestamp = formatTimestamp(comm.timestamp)
              const expanded = isExpanded(comm.id)
              
              return (
                <div
                  key={comm.id}
                  className="relative border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    toggleExpanded(comm.id)
                    onCommunicationClick?.(comm)
                  }}
                >
                  {/* Timeline connector */}
                  {index < filteredCommunications.length - 1 && (
                    <div className="absolute left-6 top-12 w-px h-6 bg-border" />
                  )}

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getMessageIcon(comm.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={getAgentColor(comm.fromAgent)} variant="outline">
                            {comm.fromAgent}
                          </Badge>
                          <IconArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge className={getAgentColor(comm.toAgent)} variant="outline">
                            {comm.toAgent}
                          </Badge>
                          <Badge className={getMessageTypeColor(comm.type)} variant="outline">
                            {comm.type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{timestamp.relative}</span>
                          <span>{timestamp.time}</span>
                          {expanded ? (
                            <IconChevronUp className="h-3 w-3" />
                          ) : (
                            <IconChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className={`text-sm ${expanded ? '' : 'line-clamp-2'}`}>
                          {comm.message}
                        </p>

                        {expanded && (
                          <div className="space-y-2 pt-2 border-t">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="font-medium text-muted-foreground">Message ID:</span>
                                <div className="font-mono">{comm.id}</div>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Timestamp:</span>
                                <div>{timestamp.date} {timestamp.time}</div>
                              </div>
                            </div>
                            
                            {comm.confidence && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  Confidence:
                                </span>
                                <Badge variant="outline" className={
                                  comm.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                                  comm.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {Math.round(comm.confidence * 100)}%
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 