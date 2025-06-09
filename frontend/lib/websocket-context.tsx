"use client";

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { toast } from 'sonner';

export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

interface AgentActivity {
  id: string;
  agent_name: string;
  activity: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface WorkflowUpdate {
  id: string;
  claim_id: string;
  stage: string;
  status: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface SystemStatus {
  id: string;
  status: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connectionAttempts: number;
  sendMessage: (message: WebSocketMessage) => void;
  connect: () => void;
  disconnect: () => void;
  
  // Subscription management
  subscribe: (eventTypes: string[]) => void;
  unsubscribe: (eventTypes: string[]) => void;
  subscriptions: string[];
  
  // Agent processing
  processWithAgent: (agentType: string, message: string) => Promise<string>;
  
  // Workflow management
  startWorkflow: (claimData: Record<string, unknown>) => Promise<void>;
  
  // Real-time data
  agentActivities: AgentActivity[];
  workflowUpdates: WorkflowUpdate[];
  systemStatuses: SystemStatus[];
  
  // Connection stats
  connectionStats: Record<string, unknown> | null;
  refreshConnectionStats: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  url = 'ws://localhost:8000/api/ws/ws/dashboard' 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [workflowUpdates, setWorkflowUpdates] = useState<WorkflowUpdate[]>([]);
  const [systemStatuses, setSystemStatuses] = useState<SystemStatus[]>([]);
  const [connectionStats, setConnectionStats] = useState<Record<string, unknown> | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const requestCounterRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const handleMessage = (message: WebSocketMessage) => {
    console.log('WebSocket message received:', message);

    switch (message.type) {
      case 'connection_established':
        toast.success('Connected to real-time updates');
        break;

      case 'subscription_confirmed':
        if (message.events && Array.isArray(message.events)) {
          const events = message.events as string[];
          setSubscriptions(prev => [...new Set([...prev, ...events])]);
          toast.success(`Subscribed to: ${events.join(', ')}`);
        }
        break;

      case 'unsubscription_confirmed':
        if (message.events && Array.isArray(message.events)) {
          const events = message.events as string[];
          setSubscriptions(prev => prev.filter(sub => !events.includes(sub)));
          toast.info(`Unsubscribed from: ${events.join(', ')}`);
        }
        break;

      case 'agent_activity':
        const activity: AgentActivity = {
          id: `activity_${Date.now()}_${Math.random()}`,
          agent_name: String(message.agent_name || 'unknown'),
          activity: String(message.activity || 'activity'),
          data: (message.data as Record<string, unknown>) || {},
          timestamp: String(message.timestamp || new Date().toISOString())
        };
        setAgentActivities(prev => [activity, ...prev.slice(0, 49)]);
        toast.info(`Agent Activity: ${activity.agent_name} - ${activity.activity}`);
        break;

      case 'workflow_update':
        const workflowUpdate: WorkflowUpdate = {
          id: `workflow_${Date.now()}_${Math.random()}`,
          claim_id: String(message.claim_id || 'unknown'),
          stage: String(message.stage || 'stage'),
          status: String(message.status || 'status'),
          data: (message.data as Record<string, unknown>) || {},
          timestamp: String(message.timestamp || new Date().toISOString())
        };
        setWorkflowUpdates(prev => [workflowUpdate, ...prev.slice(0, 49)]);
        toast.info(`Workflow Update: ${workflowUpdate.claim_id} - ${workflowUpdate.stage} (${workflowUpdate.status})`);
        break;

      case 'system_status':
        const systemStatus: SystemStatus = {
          id: `system_${Date.now()}_${Math.random()}`,
          status: String(message.status || 'info'),
          message: String(message.message || 'status update'),
          data: (message.data as Record<string, unknown>) || {},
          timestamp: String(message.timestamp || new Date().toISOString())
        };
        setSystemStatuses(prev => [systemStatus, ...prev.slice(0, 49)]);
        
        if (systemStatus.status === 'error') {
          toast.error(`System: ${systemStatus.message}`);
        } else if (systemStatus.status === 'warning') {
          toast.warning(`System: ${systemStatus.message}`);
        } else {
          toast.info(`System: ${systemStatus.message}`);
        }
        break;

      case 'agent_response':
        toast.success(`Agent Response: ${message.agent_name || 'Agent'}`);
        break;

      case 'agent_error':
        toast.error(`Agent Error: ${message.message || 'Unknown error'}`);
        break;

      case 'workflow_started':
        toast.info(`Workflow started for claim: ${message.claim_id || 'Unknown'}`);
        break;

      case 'workflow_progress':
        const progress = typeof message.progress === 'number' ? Math.round(message.progress) : 0;
        toast.info(`Workflow progress: ${message.stage || 'Stage'} (${progress}%)`);
        break;

      case 'workflow_completed':
        toast.success(`Workflow completed for claim: ${message.claim_id || 'Unknown'}`);
        break;

      case 'workflow_error':
        toast.error(`Workflow error: ${message.message || 'Unknown error'}`);
        break;

      case 'stats':
        setConnectionStats((message.data as Record<string, unknown>) || null);
        break;

      case 'pong':
        console.log('Pong received');
        break;

      case 'error':
        toast.error(`WebSocket Error: ${message.message || 'Unknown error'}`);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const connect = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    
    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionAttempts(0);
        console.log('WebSocket connected');
        
        // Auto-subscribe to common events after connection
        setTimeout(() => {
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: 'subscribe',
              events: ['agent_activity', 'workflow_updates', 'system_status']
            }));
          }
        }, 100);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        socketRef.current = null;
        console.log('WebSocket disconnected');
        toast.error('Disconnected from real-time updates');

        // Auto-reconnect after 3 seconds if not manually disconnected
        if (connectionAttempts < 5) {
          setConnectionAttempts(prev => prev + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
        toast.error('WebSocket connection error');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect');
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  };

  const subscribe = (eventTypes: string[]) => {
    sendMessage({
      type: 'subscribe',
      events: eventTypes
    });
  };

  const unsubscribe = (eventTypes: string[]) => {
    sendMessage({
      type: 'unsubscribe',
      events: eventTypes
    });
  };

  const processWithAgent = async (agentType: string, message: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      requestCounterRef.current += 1;
      const requestId = `req_${requestCounterRef.current}`;
      
      sendMessage({
        type: 'agent_process',
        agent_type: agentType,
        message: message,
        request_id: requestId
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Agent processing timeout'));
      }, 30000);
    });
  };

  const startWorkflow = async (claimData: Record<string, unknown>): Promise<void> => {
    requestCounterRef.current += 1;
    const requestId = `workflow_${requestCounterRef.current}`;
    
    sendMessage({
      type: 'workflow_start',
      claim_data: claimData,
      request_id: requestId
    });
  };

  const refreshConnectionStats = () => {
    sendMessage({
      type: 'get_stats'
    });
  };

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  // Ping every 30 seconds to keep connection alive
  useEffect(() => {
    if (isConnected) {
      const pingInterval = setInterval(() => {
        sendMessage({ type: 'ping' });
      }, 30000);

      return () => clearInterval(pingInterval);
    }
  }, [isConnected]);

  const contextValue: WebSocketContextType = {
    isConnected,
    isConnecting,
    connectionAttempts,
    sendMessage,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    subscriptions,
    processWithAgent,
    startWorkflow,
    agentActivities,
    workflowUpdates,
    systemStatuses,
    connectionStats,
    refreshConnectionStats
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}; 