"use client"

import { useWebSocketContext } from "@/lib/websocket-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

export function WebSocketStatus() {
  const { isConnected, isConnecting, connect, disconnect } = useWebSocketContext()
  
  const connectionState = isConnecting ? 'connecting' : isConnected ? 'connected' : 'disconnected'

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500'
      case 'disconnected':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected':
        return <Wifi className="h-3 w-3" />
      case 'connecting':
        return <RefreshCw className="h-3 w-3 animate-spin" />
      case 'disconnected':
        return <WifiOff className="h-3 w-3" />
      default:
        return <WifiOff className="h-3 w-3" />
    }
  }

  const handleToggleConnection = () => {
    if (connectionState === 'connected') {
      disconnect()
    } else {
      connect()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={cn(
          "flex items-center gap-1 text-white border-0",
          getStatusColor()
        )}
      >
        {getStatusIcon()}
        <span className="text-xs capitalize">{connectionState}</span>
      </Badge>
      
      {connectionState === 'disconnected' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleConnection}
          className="h-6 px-2 text-xs"
        >
          Reconnect
        </Button>
      )}
    </div>
  )
} 