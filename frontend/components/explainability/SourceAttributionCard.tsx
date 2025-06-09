'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  IconFileText,
  IconScale,
  IconDatabase,
  IconHistory,
  IconExternalLink,
  IconCopy,
  IconCheck
} from '@tabler/icons-react'

import { SourceDocument } from './ExplainabilityPanel'

interface SourceAttributionCardProps {
  source: SourceDocument
  onViewSource?: (source: SourceDocument) => void
  className?: string
}

export function SourceAttributionCard({ 
  source, 
  onViewSource,
  className = "" 
}: SourceAttributionCardProps) {
  const [copied, setCopied] = React.useState(false)

  const getSourceIcon = (type: SourceDocument['type']) => {
    switch (type) {
      case 'policy':
        return <IconFileText className="h-4 w-4 text-blue-600" />
      case 'regulation':
        return <IconScale className="h-4 w-4 text-purple-600" />
      case 'precedent':
        return <IconHistory className="h-4 w-4 text-orange-600" />
      case 'data':
        return <IconDatabase className="h-4 w-4 text-green-600" />
      default:
        return <IconFileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getSourceTypeColor = (type: SourceDocument['type']) => {
    switch (type) {
      case 'policy':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'regulation':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'precedent':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'data':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.8) return 'text-green-600'
    if (relevance >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRelevanceLabel = (relevance: number) => {
    if (relevance >= 0.8) return 'High Relevance'
    if (relevance >= 0.6) return 'Medium Relevance'
    return 'Low Relevance'
  }

  const handleCopyExcerpt = async () => {
    try {
      await navigator.clipboard.writeText(source.excerpt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const handleViewSource = () => {
    if (source.url) {
      window.open(source.url, '_blank', 'noopener,noreferrer')
    }
    onViewSource?.(source)
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {getSourceIcon(source.type)}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-tight">
                {source.title}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getSourceTypeColor(source.type)} variant="outline">
                  {source.type.charAt(0).toUpperCase() + source.type.slice(1)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ID: {source.id}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-2">
            {source.url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewSource}
                className="h-8 w-8 p-0"
              >
                <IconExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Relevance Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Relevance Score</span>
            <span className={`font-medium ${getRelevanceColor(source.relevance)}`}>
              {Math.round(source.relevance * 100)}% - {getRelevanceLabel(source.relevance)}
            </span>
          </div>
          <Progress 
            value={source.relevance * 100} 
            className="h-2"
          />
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Relevant Excerpt</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyExcerpt}
              className="h-6 px-2 text-xs"
            >
              {copied ? (
                <>
                  <IconCheck className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <IconCopy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground leading-relaxed">
              &ldquo;{source.excerpt}&rdquo;
            </p>
          </div>
        </div>

        {/* Source Details */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Source Type:</span>
            <div className="flex items-center space-x-1 mt-1">
              {getSourceIcon(source.type)}
              <span className="capitalize">{source.type}</span>
            </div>
          </div>
          
          <div>
            <span className="font-medium text-muted-foreground">Confidence:</span>
            <div className={`mt-1 font-medium ${getRelevanceColor(source.relevance)}`}>
              {Math.round(source.relevance * 100)}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewSource}
            className="flex-1"
          >
            <IconFileText className="h-4 w-4 mr-2" />
            View Full Source
          </Button>
          
          {source.url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(source.url, '_blank')}
            >
              <IconExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 