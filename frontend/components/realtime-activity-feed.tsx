"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Activity, Bot, Workflow, Zap, CheckCircle } from 'lucide-react';

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

// Mock demo data for activity feed
const generateMockActivities = () => {
  const now = new Date();
  return [
    {
      id: 'act-1',
      type: 'workflow',
      timestamp: new Date(now.getTime() - 2 * 60000).toISOString(), // 2 mins ago
      title: 'Workflow: CLM-2024-001',
      description: 'Claim assessment completed - Requires Investigation',
      status: 'completed',
      badge: 'Assessment'
    },
    {
      id: 'act-2',
      type: 'agent_activity',
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(), // 5 mins ago
      title: 'Risk Analyst Activity',
      description: 'High-risk factors detected in claim documentation',
      status: 'active',
      badge: 'Risk Analyst'
    },
    {
      id: 'act-3',
      type: 'agent_activity',
      timestamp: new Date(now.getTime() - 8 * 60000).toISOString(), // 8 mins ago
      title: 'Policy Checker Activity',
      description: 'Policy coverage verified for collision damage',
      status: 'completed',
      badge: 'Policy Checker'
    },
    {
      id: 'act-4',
      type: 'agent_activity',
      timestamp: new Date(now.getTime() - 12 * 60000).toISOString(), // 12 mins ago
      title: 'Claim Assessor Activity',
      description: 'Document inconsistencies found - Invalid assessment',
      status: 'completed',
      badge: 'Claim Assessor'
    },
    {
      id: 'act-5',
      type: 'system',
      timestamp: new Date(now.getTime() - 15 * 60000).toISOString(), // 15 mins ago
      title: 'System Status',
      description: 'Multi-agent workflow initialized for new claim',
      status: 'success',
      badge: 'System'
    }
  ];
};

export const RealtimeActivityFeed: React.FC = () => {
  // Use mock data for demo purposes
  const allActivities = generateMockActivities();
  
  const connectionStatus = 'Demo Mode';
  const connectionColor = 'bg-blue-500';

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from agents, workflows, and system events
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