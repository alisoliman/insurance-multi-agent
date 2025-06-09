'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  IconCircle,
  IconSquare,
  IconDiamond,
  IconArrowRight,
  IconZoomIn,
  IconZoomOut,
  IconRefresh
} from '@tabler/icons-react'

import { DecisionNode } from './ExplainabilityPanel'

interface DecisionTreeVisualizationProps {
  nodes: DecisionNode[]
  highlightPath?: boolean
  onNodeClick?: (node: DecisionNode) => void
}

interface TreeNodeProps {
  node: DecisionNode
  level: number
  isHighlighted?: boolean
  onNodeClick?: (node: DecisionNode) => void
}

function TreeNode({ node, level, isHighlighted = false, onNodeClick }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2) // Auto-expand first 2 levels

  const getNodeIcon = (type: DecisionNode['type']) => {
    switch (type) {
      case 'condition':
        return <IconDiamond className="h-4 w-4" />
      case 'action':
        return <IconSquare className="h-4 w-4" />
      case 'outcome':
        return <IconCircle className="h-4 w-4" />
      default:
        return <IconCircle className="h-4 w-4" />
    }
  }

  const getNodeColor = (type: DecisionNode['type']) => {
    const baseColors = {
      condition: 'border-blue-300 bg-blue-50',
      action: 'border-orange-300 bg-orange-50',
      outcome: 'border-green-300 bg-green-50'
    }
    
    if (isHighlighted) {
      return `${baseColors[type]} ring-2 ring-blue-500 ring-opacity-50`
    }
    
    return baseColors[type]
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`
                relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                hover:shadow-md ${getNodeColor(node.type)}
                ${level > 0 ? 'ml-8' : ''}
              `}
              onClick={() => {
                setIsExpanded(!isExpanded)
                onNodeClick?.(node)
              }}
            >
              <div className="flex items-center space-x-2">
                {getNodeIcon(node.type)}
                <span className="font-medium text-sm">{node.label}</span>
                <Badge className={getConfidenceColor(node.confidence)} variant="outline">
                  {Math.round(node.confidence * 100)}%
                </Badge>
              </div>
              
              {node.children && node.children.length > 0 && (
                <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-full bg-white border"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsExpanded(!isExpanded)
                    }}
                  >
                    <IconArrowRight 
                      className={`h-3 w-3 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`} 
                    />
                  </Button>
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">{node.type.charAt(0).toUpperCase() + node.type.slice(1)}</div>
              <div className="text-sm">Confidence: {Math.round(node.confidence * 100)}%</div>
              {node.metadata && (
                <div className="text-xs text-muted-foreground">
                  {Object.entries(node.metadata).map(([key, value]) => (
                    <div key={key}>{key}: {String(value)}</div>
                  ))}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Connection line to parent */}
      {level > 0 && (
        <div className="absolute left-0 top-1/2 w-8 h-px bg-gray-300 transform -translate-y-1/2" />
      )}

      {/* Children */}
      {isExpanded && node.children && node.children.length > 0 && (
        <div className="mt-4 space-y-3">
          {node.children.map((child, index) => (
            <div key={child.id} className="relative">
              {/* Vertical line from parent */}
              {index === 0 && (
                <div className="absolute left-4 -top-4 w-px h-4 bg-gray-300" />
              )}
              
              {/* Horizontal line to child */}
              <div className="absolute left-4 top-1/2 w-4 h-px bg-gray-300 transform -translate-y-1/2" />
              
              <TreeNode
                node={child}
                level={level + 1}
                isHighlighted={isHighlighted}
                onNodeClick={onNodeClick}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function DecisionTreeVisualization({ 
  nodes, 
  highlightPath = false, 
  onNodeClick 
}: DecisionTreeVisualizationProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [selectedNode, setSelectedNode] = useState<DecisionNode | null>(null)

  const handleNodeClick = (node: DecisionNode) => {
    setSelectedNode(node)
    onNodeClick?.(node)
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5))
  }

  const handleReset = () => {
    setZoomLevel(1)
    setSelectedNode(null)
  }

  if (!nodes || nodes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            No decision tree data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Decision Flow</span>
            {selectedNode && (
              <Badge variant="outline">
                Selected: {selectedNode.label}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
            >
              <IconZoomOut className="h-4 w-4" />
            </Button>
            
            <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2}
            >
              <IconZoomIn className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              <IconRefresh className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 mb-6 p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-1">
            <IconDiamond className="h-4 w-4 text-blue-600" />
            <span className="text-xs">Condition</span>
          </div>
          <div className="flex items-center space-x-1">
            <IconSquare className="h-4 w-4 text-orange-600" />
            <span className="text-xs">Action</span>
          </div>
          <div className="flex items-center space-x-1">
            <IconCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs">Outcome</span>
          </div>
        </div>

        {/* Tree Visualization */}
        <div 
          className="overflow-auto max-h-96"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
        >
          <div className="space-y-4">
            {nodes.map((rootNode) => (
              <TreeNode
                key={rootNode.id}
                node={rootNode}
                level={0}
                isHighlighted={highlightPath && selectedNode?.id === rootNode.id}
                onNodeClick={handleNodeClick}
              />
            ))}
          </div>
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              {getNodeIcon(selectedNode.type)}
              <span className="font-medium">{selectedNode.label}</span>
              <Badge className={getConfidenceColor(selectedNode.confidence)}>
                {Math.round(selectedNode.confidence * 100)}% confidence
              </Badge>
            </div>
            
            {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
              <div className="text-sm space-y-1">
                {Object.entries(selectedNode.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  function getNodeIcon(type: DecisionNode['type']) {
    switch (type) {
      case 'condition':
        return <IconDiamond className="h-4 w-4 text-blue-600" />
      case 'action':
        return <IconSquare className="h-4 w-4 text-orange-600" />
      case 'outcome':
        return <IconCircle className="h-4 w-4 text-green-600" />
      default:
        return <IconCircle className="h-4 w-4 text-gray-600" />
    }
  }

  function getConfidenceColor(confidence: number) {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }
} 