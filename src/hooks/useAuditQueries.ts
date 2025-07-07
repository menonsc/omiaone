import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auditService, AuditFilters, AuditLog, AuditConfig, AuditAlert, AuditExport } from '../services/auditService'

// =====================================================
// QUERIES PARA LOGS DE AUDITORIA
// =====================================================

export const useAuditLogs = (filters: AuditFilters = {}) => {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditService.getLogs(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}

export const useAuditLog = (logId: string) => {
  return useQuery({
    queryKey: ['audit-log', logId],
    queryFn: () => auditService.getLogById(logId),
    enabled: !!logId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export const useAuditStats = (days: number = 30) => {
  return useQuery({
    queryKey: ['audit-stats', days],
    queryFn: () => auditService.getStats(days),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  })
}

// =====================================================
// QUERIES PARA CONFIGURAÇÕES DE AUDITORIA
// =====================================================

export const useAuditConfig = () => {
  return useQuery({
    queryKey: ['audit-config'],
    queryFn: () => auditService.getAuditConfig(),
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
  })
}

export const useUpdateAuditConfig = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ resourceName, updates }: { resourceName: string; updates: Partial<AuditConfig> }) =>
      auditService.updateAuditConfig(resourceName, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-config'] })
    },
  })
}

// =====================================================
// QUERIES PARA ALERTAS DE AUDITORIA
// =====================================================

export const useAuditAlerts = () => {
  return useQuery({
    queryKey: ['audit-alerts'],
    queryFn: () => auditService.getAuditAlerts(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
  })
}

export const useCreateAuditAlert = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (alert: Omit<AuditAlert, 'id' | 'created_at' | 'updated_at'>) =>
      auditService.createAuditAlert(alert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-alerts'] })
    },
  })
}

export const useUpdateAuditAlert = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ alertId, updates }: { alertId: string; updates: Partial<AuditAlert> }) =>
      auditService.updateAuditAlert(alertId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-alerts'] })
    },
  })
}

export const useDeleteAuditAlert = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (alertId: string) => auditService.deleteAuditAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-alerts'] })
    },
  })
}

// =====================================================
// QUERIES PARA EXPORTAÇÕES
// =====================================================

export const useAuditExports = () => {
  return useQuery({
    queryKey: ['audit-exports'],
    queryFn: () => auditService.getExports(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}

export const useAuditExport = (exportId: string) => {
  return useQuery({
    queryKey: ['audit-export', exportId],
    queryFn: () => auditService.getExportById(exportId),
    enabled: !!exportId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export const useCreateAuditExport = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (params: { export_type: 'csv' | 'pdf' | 'json'; filters: Record<string, any> }) =>
      auditService.createExport(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-exports'] })
    },
  })
}

// =====================================================
// HOOKS DE CONVENIÊNCIA
// =====================================================

export const useAuditLogsByUser = (userId: string, limit: number = 50) => {
  return useAuditLogs({ user_id: userId, limit })
}

export const useAuditLogsByResource = (resource: string, limit: number = 50) => {
  return useAuditLogs({ resource, limit })
}

export const useAuditLogsByAction = (action: string, limit: number = 50) => {
  return useAuditLogs({ action, limit })
}

export const useAuditLogsBySeverity = (severity: string, limit: number = 50) => {
  return useAuditLogs({ severity, limit })
}

export const useAuditLogsByDateRange = (dateFrom: Date, dateTo: Date, limit: number = 50) => {
  return useAuditLogs({ date_from: dateFrom, date_to: dateTo, limit })
}

export const useAuditLogsByIP = (ipAddress: string, limit: number = 50) => {
  return useAuditLogs({ ip_address: ipAddress, limit })
}

// =====================================================
// HOOKS PARA DASHBOARD
// =====================================================

export const useAuditDashboard = () => {
  const stats = useAuditStats(30)
  const recentLogs = useAuditLogs({ limit: 10 })
  const alerts = useAuditAlerts()
  
  return {
    stats: stats.data,
    recentLogs: recentLogs.data,
    alerts: alerts.data,
    isLoading: stats.isLoading || recentLogs.isLoading || alerts.isLoading,
    error: stats.error || recentLogs.error || alerts.error,
  }
}

export const useAuditActivity = (days: number = 7) => {
  return useQuery({
    queryKey: ['audit-activity', days],
    queryFn: async () => {
      const logs = await auditService.getLogs({ 
        date_from: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        limit: 1000
      })
      
      // Agrupar por dia
      const activityByDay: Record<string, number> = {}
      logs.forEach(log => {
        const date = new Date(log.created_at).toISOString().split('T')[0]
        activityByDay[date] = (activityByDay[date] || 0) + 1
      })
      
      return activityByDay
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

// =====================================================
// HOOKS PARA FILTROS AVANÇADOS
// =====================================================

export const useAuditFilters = () => {
  const config = useAuditConfig()
  
  return useQuery({
    queryKey: ['audit-filters'],
    queryFn: async () => {
      const logs = await auditService.getLogs({ limit: 1000 })
      
      // Extrair valores únicos para filtros
      const actions = [...new Set(logs.map(log => log.action))].sort()
      const resources = [...new Set(logs.map(log => log.resource))].sort()
      const severities = [...new Set(logs.map(log => log.severity))].sort()
      const users = [...new Set(logs.map(log => log.user_id).filter(Boolean))].sort()
      const ips = [...new Set(logs.map(log => log.ip_address).filter(Boolean))].sort()
      
      return {
        actions,
        resources,
        severities,
        users,
        ips,
        config: config.data
      }
    },
    enabled: !!config.data,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}

// =====================================================
// HOOKS PARA MONITORAMENTO EM TEMPO REAL
// =====================================================

export const useAuditRealtime = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['audit-realtime'],
    queryFn: async () => {
      // Buscar logs das últimas 5 minutos
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      return auditService.getLogs({ 
        date_from: fiveMinutesAgo,
        limit: 100
      })
    },
    enabled,
    refetchInterval: enabled ? 30 * 1000 : false, // 30 segundos
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  })
}

// =====================================================
// HOOKS PARA RELATÓRIOS
// =====================================================

export const useAuditReport = (filters: AuditFilters, reportType: 'summary' | 'detailed' = 'summary') => {
  return useQuery({
    queryKey: ['audit-report', filters, reportType],
    queryFn: async () => {
      const logs = await auditService.getLogs(filters)
      
      if (reportType === 'summary') {
        // Relatório resumido
        const totalLogs = logs.length
        const uniqueUsers = new Set(logs.map(log => log.user_id).filter(Boolean)).size
        const uniqueIPs = new Set(logs.map(log => log.ip_address).filter(Boolean)).size
        const criticalLogs = logs.filter(log => log.severity === 'critical').length
        
        const actionCounts: Record<string, number> = {}
        const resourceCounts: Record<string, number> = {}
        const severityCounts: Record<string, number> = {}
        
        logs.forEach(log => {
          actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
          resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1
          severityCounts[log.severity] = (severityCounts[log.severity] || 0) + 1
        })
        
        return {
          totalLogs,
          uniqueUsers,
          uniqueIPs,
          criticalLogs,
          actionCounts,
          resourceCounts,
          severityCounts,
          logs
        }
      } else {
        // Relatório detalhado
        return {
          logs,
          filters,
          generatedAt: new Date().toISOString()
        }
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
} 