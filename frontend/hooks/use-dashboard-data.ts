"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  fetchAgentStatus,
  fetchActiveWorkflows,
  fetchRecentActivity,
  fetchActiveClaims,
  checkBackendHealth,
  type AgentStatusResponse,
  type WorkflowStage,
  type ActivityItem,
  type ClaimData
} from '@/lib/dashboard-api'

// Hook for agent status data
export function useAgentStatus(refreshInterval: number = 30000) {
  const [data, setData] = useState<AgentStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const result = await fetchAgentStatus()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refreshInterval])

  return { data, loading, error, refetch: fetchData }
}

// Hook for workflow data
export function useWorkflowData(refreshInterval: number = 15000) {
  const [data, setData] = useState<WorkflowStage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const result = await fetchActiveWorkflows()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workflow data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refreshInterval])

  return { data, loading, error, refetch: fetchData }
}

// Hook for activity feed data
export function useActivityFeed(refreshInterval: number = 10000) {
  const [data, setData] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const result = await fetchRecentActivity()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refreshInterval])

  return { data, loading, error, refetch: fetchData }
}

// Hook for active claims data
export function useActiveClaims(refreshInterval: number = 20000) {
  const [data, setData] = useState<ClaimData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const result = await fetchActiveClaims()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch claims data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refreshInterval])

  return { data, loading, error, refetch: fetchData }
}

// Hook for backend health monitoring
export function useBackendHealth(refreshInterval: number = 60000) {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkHealth = useCallback(async () => {
    try {
      const healthy = await checkBackendHealth()
      setIsHealthy(healthy)
      setLastChecked(new Date())
    } catch (err) {
      setIsHealthy(false)
      setLastChecked(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkHealth()
    
    if (refreshInterval > 0) {
      const interval = setInterval(checkHealth, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [checkHealth, refreshInterval])

  return { isHealthy, loading, lastChecked, refetch: checkHealth }
}

// Combined hook for all dashboard data
export function useDashboardData() {
  const agentStatus = useAgentStatus(30000)
  const workflowData = useWorkflowData(15000)
  const activityFeed = useActivityFeed(10000)
  const activeClaims = useActiveClaims(20000)
  const backendHealth = useBackendHealth(60000)

  const isLoading = agentStatus.loading || workflowData.loading || activityFeed.loading || activeClaims.loading
  const hasError = !!(agentStatus.error || workflowData.error || activityFeed.error || activeClaims.error)
  
  const errors = [
    agentStatus.error,
    workflowData.error,
    activityFeed.error,
    activeClaims.error
  ].filter(Boolean)

  const refetchAll = useCallback(() => {
    agentStatus.refetch()
    workflowData.refetch()
    activityFeed.refetch()
    activeClaims.refetch()
    backendHealth.refetch()
  }, [agentStatus, workflowData, activityFeed, activeClaims, backendHealth])

  return {
    agentStatus: agentStatus.data,
    workflowData: workflowData.data,
    activityFeed: activityFeed.data,
    activeClaims: activeClaims.data,
    backendHealth: backendHealth.isHealthy,
    isLoading,
    hasError,
    errors,
    refetchAll
  }
} 