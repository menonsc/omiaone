import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { analytics } from '../services/analytics'

// Keys para React Query
export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboardMetrics: (days: number) => [...analyticsKeys.all, 'dashboard', days] as const,
  systemLogs: (filters: any) => [...analyticsKeys.all, 'logs', filters] as const,
  systemAlerts: (filters: any) => [...analyticsKeys.all, 'alerts', filters] as const,
  performanceMetrics: (filters: any) => [...analyticsKeys.all, 'performance', filters] as const,
}

// Hook para métricas do dashboard
export const useDashboardMetrics = (days: number = 30) => {
  return useQuery({
    queryKey: analyticsKeys.dashboardMetrics(days),
    queryFn: () => analytics.getDashboardMetrics(days),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // 10 minutos
  })
}

// Hook para logs do sistema
export const useSystemLogs = (filters: {
  search?: string
  logLevel?: string
  component?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
} = {}) => {
  return useQuery({
    queryKey: analyticsKeys.systemLogs(filters),
    queryFn: () => analytics.getSystemLogs(filters),
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  })
}

// Hook para alertas do sistema
export const useSystemAlerts = (filters: {
  status?: string
  severity?: string
  component?: string
  limit?: number
} = {}) => {
  return useQuery({
    queryKey: analyticsKeys.systemAlerts(filters),
    queryFn: () => analytics.getSystemAlerts(filters),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 1 * 60 * 1000, // 1 minuto
  })
}

// Hook para métricas de performance
export const usePerformanceMetrics = (filters: {
  metricName?: string
  component?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
} = {}) => {
  return useQuery({
    queryKey: analyticsKeys.performanceMetrics(filters),
    queryFn: () => analytics.getPerformanceMetrics(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para reconhecer alerta
export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ alertId, userId }: { alertId: string; userId: string }) =>
      analytics.acknowledgeAlert(alertId, userId),
    onSuccess: () => {
      // Invalidar queries de alertas
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
    },
  })
}

// Hook para resolver alerta
export const useResolveAlert = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      alertId, 
      userId, 
      resolutionNotes 
    }: { 
      alertId: string
      userId: string
      resolutionNotes?: string 
    }) =>
      analytics.resolveAlert(alertId, userId, resolutionNotes),
    onSuccess: () => {
      // Invalidar queries de alertas
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
    },
  })
}

// Hook para criar alerta do sistema
export const useCreateSystemAlert = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alert: {
      alertType: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      title: string
      description?: string
      component?: string
      affectedUsers?: number
      alertData?: Record<string, any>
    }) => analytics.createSystemAlert(alert),
    onSuccess: () => {
      // Invalidar queries de alertas
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
    },
  })
}

// Hook para rastrear evento
export const useTrackEvent = () => {
  return useMutation({
    mutationFn: (event: {
      eventType: 'user_login' | 'user_logout' | 'page_view' | 'feature_usage' | 'api_call' | 'error_occurred' | 'integration_sync' | 'message_sent' | 'document_upload' | 'campaign_sent' | 'agent_interaction' | 'system_alert'
      eventName: string
      eventCategory?: string
      eventLabel?: string
      eventValue?: number
      eventData?: Record<string, any>
      userId?: string
      sessionId?: string
      pageLoadTime?: number
      apiResponseTime?: number
    }) => analytics.trackEvent(event),
  })
}

// Hook para log do sistema
export const useLogSystem = () => {
  return useMutation({
    mutationFn: (log: {
      logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
      severity: 'low' | 'medium' | 'high' | 'critical'
      component: string
      action: string
      message: string
      details?: Record<string, any>
      stackTrace?: string
      userId?: string
      sessionId?: string
      requestId?: string
    }) => analytics.logSystem(log),
  })
}

// Hook para métricas de performance
export const useTrackPerformanceMetric = () => {
  return useMutation({
    mutationFn: (metric: {
      metricName: string
      metricType: 'counter' | 'gauge' | 'histogram' | 'timer'
      value: number
      unit?: string
      component?: string
      tags?: Record<string, any>
    }) => analytics.trackPerformanceMetric(metric),
  })
}

// Hook composto para analytics administrativos
export const useAdminAnalytics = () => {
  const dashboardMetrics = useDashboardMetrics()
  const systemLogs = useSystemLogs({ limit: 50 })
  const systemAlerts = useSystemAlerts({ status: 'active', limit: 20 })
  const performanceMetrics = usePerformanceMetrics({ limit: 100 })

  return {
    dashboardMetrics,
    systemLogs,
    systemAlerts,
    performanceMetrics,
    isLoading: dashboardMetrics.isLoading || systemLogs.isLoading || systemAlerts.isLoading || performanceMetrics.isLoading,
    error: dashboardMetrics.error || systemLogs.error || systemAlerts.error || performanceMetrics.error
  }
}

// Hook para estatísticas em tempo real
export const useRealTimeStats = () => {
  const dashboardMetrics = useDashboardMetrics(1) // Apenas hoje
  const activeAlerts = useSystemAlerts({ status: 'active' })
  const recentErrors = useSystemLogs({ logLevel: 'error', limit: 10 })

  return {
    todayMetrics: dashboardMetrics.data,
    activeAlertsCount: activeAlerts.data?.length || 0,
    recentErrorsCount: recentErrors.data?.length || 0,
    isLoading: dashboardMetrics.isLoading || activeAlerts.isLoading || recentErrors.isLoading
  }
} 