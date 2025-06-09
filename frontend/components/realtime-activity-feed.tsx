"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useWebSocketContext } from '@/lib/websocket-context';
import { Activity, Bot, Workflow, Zap } from 'lucide-react';

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString();
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'agent_activity':
      return <Bot className="h-4 w-4" />;
    case 'workflow':
      return <Workflow className="h-4 w-4" />;
    case 'system':
      return <Zap className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'done':
    case 'success':
      return 'bg-green-500';
    case 'in-progress':
    case 'processing':
      return 'bg-blue-500';
    case 'error':
    case 'failed':
      return 'bg-red-500';
    case 'warning':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

const ActivityItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  badge?: string;
}> = ({ icon, title, description, timestamp, status, badge }) => (
  <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
    <div className="flex-shrink-0 mt-1">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground truncate">
          {title}
        </p>
        <div className="flex items-center space-x-2">
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
          {status && (
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
          )}
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(timestamp)}
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        {description}
      </p>
    </div>
  </div>
);

export const RealtimeActivityFeed: React.FC = () => {
  const { 
    agentActivities, 
    workflowUpdates, 
    systemStatuses,
    isConnected,
    isConnecting 
  } = useWebSocketContext();

  // Combine all activities and sort by timestamp
  const allActivities = [
    ...agentActivities.map(activity => ({
      id: activity.id,
      type: 'agent_activity',
      timestamp: activity.timestamp,
      title: `${activity.agent_name} Activity`,
      description: activity.activity,
      status: 'active',
      badge: activity.agent_name
    })),
    ...workflowUpdates.map(update => ({
      id: update.id,
      type: 'workflow',
      timestamp: update.timestamp,
      title: `Workflow: ${update.claim_id}`,
      description: `${update.stage} - ${update.status}`,
      status: update.status,
      badge: update.stage
    })),
    ...systemStatuses.map(status => ({
      id: status.id,
      type: 'system',
      timestamp: status.timestamp,
      title: 'System Status',
      description: status.message,
      status: status.status,
      badge: status.status
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const connectionStatus = isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected';
  const connectionColor = isConnecting ? 'bg-yellow-500' : isConnected ? 'bg-green-500' : 'bg-red-500';

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Real-time Activity</CardTitle>
            <CardDescription>
              Live updates from agents, workflows, and system events
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${connectionColor}`} />
            <span className="text-sm text-muted-foreground">
              {connectionStatus}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {allActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Activity className="h-8 w-8 mb-2" />
              <p className="text-sm">No recent activity</p>
              {!isConnected && (
                <p className="text-xs mt-1">Connect to see real-time updates</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {allActivities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ActivityItem
                    icon={getActivityIcon(activity.type)}
                    title={activity.title}
                    description={activity.description}
                    timestamp={activity.timestamp}
                    status={activity.status}
                    badge={activity.badge}
                  />
                  {index < allActivities.length - 1 && (
                    <Separator className="mx-3" />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}; 