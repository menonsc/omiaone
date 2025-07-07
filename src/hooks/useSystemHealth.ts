import { useState, useEffect, useCallback } from 'react'
import { healthCheckService, SystemHealth, EndpointStatus } from '../services/healthCheckService'

export interface UseSystemHealthOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  saveHistory?: boolean
}

export interface UseSystemHealthReturn {
  systemHealth: SystemHealth | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  refresh: () => Promise<void>
  startMonitoring: (interval?: number) => void
  stopMonitoring: () => void
  toggleAutoRefresh: () => void
  autoRefresh: boolean
}

export const useSystemHealth = (options: UseSystemHealthOptions = {}): UseSystemHealthReturn => {
  const {
    autoRefresh: defaultAutoRefresh = false,
    refreshInterval = 30000,
    saveHistory = true
  } = options

  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(defaultAutoRefresh)

  // Callback para atualizar o estado quando o health check service emite uma atualização
  const handleHealthUpdate = useCallback((health: SystemHealth) => {
    setSystemHealth(health)
    setIsLoading(false)
    setIsRefreshing(false)
    setError(null)

    // Salvar histórico se habilitado
    if (saveHistory) {
      healthCheckService.saveStatusHistory(health).catch(console.error)
    }
  }, [saveHistory])

  // Callback para lidar com erros
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setIsLoading(false)
    setIsRefreshing(false)
  }, [])

  // Função para fazer refresh manual
  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    setError(null)
    
    try {
      const health = await healthCheckService.checkAllEndpoints()
      handleHealthUpdate(health)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao verificar status'
      handleError(errorMessage)
    }
  }, [handleHealthUpdate, handleError])

  // Função para iniciar monitoramento
  const startMonitoring = useCallback((interval: number = refreshInterval) => {
    healthCheckService.startMonitoring(interval)
    setAutoRefresh(true)
  }, [refreshInterval])

  // Função para parar monitoramento
  const stopMonitoring = useCallback(() => {
    healthCheckService.stopMonitoring()
    setAutoRefresh(false)
  }, [])

  // Função para alternar auto refresh
  const toggleAutoRefresh = useCallback(() => {
    if (autoRefresh) {
      stopMonitoring()
    } else {
      startMonitoring()
    }
  }, [autoRefresh, startMonitoring, stopMonitoring])

  // Effect principal para configurar listeners e inicialização
  useEffect(() => {
    // Adicionar listeners
    healthCheckService.addListener(handleHealthUpdate)

    // Inicialização
    if (autoRefresh) {
      startMonitoring()
    } else {
      // Fazer primeira verificação mesmo sem auto refresh
      refresh()
    }

    // Cleanup
    return () => {
      healthCheckService.removeListener(handleHealthUpdate)
      if (!autoRefresh) {
        healthCheckService.stopMonitoring()
      }
    }
  }, []) // Só executa uma vez

  // Effect para controlar auto refresh
  useEffect(() => {
    if (autoRefresh) {
      healthCheckService.startMonitoring(refreshInterval)
    } else {
      healthCheckService.stopMonitoring()
    }
  }, [autoRefresh, refreshInterval])

  return {
    systemHealth,
    isLoading,
    isRefreshing,
    error,
    refresh,
    startMonitoring,
    stopMonitoring,
    toggleAutoRefresh,
    autoRefresh
  }
}

// Hook para obter estatísticas do sistema
export const useSystemStats = (systemHealth: SystemHealth | null) => {
  return {
    totalEndpoints: systemHealth?.endpoints.length || 0,
    onlineEndpoints: systemHealth?.endpoints.filter(e => e.status === 'online').length || 0,
    offlineEndpoints: systemHealth?.endpoints.filter(e => e.status === 'offline').length || 0,
    degradedEndpoints: systemHealth?.endpoints.filter(e => e.status === 'degraded').length || 0,
    averageResponseTime: systemHealth ? (() => {
      const validEndpoints = systemHealth.endpoints.filter(e => e.responseTime)
      if (validEndpoints.length === 0) return 0
      return Math.round(validEndpoints.reduce((sum, e) => sum + (e.responseTime || 0), 0) / validEndpoints.length)
    })() : 0,
    healthyCategories: systemHealth ? Object.keys(
      systemHealth.endpoints.reduce((groups, endpoint) => {
        const category = endpoint.category
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(endpoint)
        return groups
      }, {} as Record<string, EndpointStatus[]>)
    ).filter(category => {
      const endpoints = systemHealth.endpoints.filter(e => e.category === category)
      return endpoints.every(e => e.status === 'online')
    }) : [],
    lastUpdate: systemHealth?.lastUpdate
  }
}

// Hook para filtrar endpoints por categoria
export const useEndpointsByCategory = (systemHealth: SystemHealth | null) => {
  if (!systemHealth) return {}
  
  return systemHealth.endpoints.reduce((groups, endpoint) => {
    const category = endpoint.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(endpoint)
    return groups
  }, {} as Record<string, EndpointStatus[]>)
}

// Hook para obter endpoints com problemas
export const useProblematicEndpoints = (systemHealth: SystemHealth | null) => {
  if (!systemHealth) return []
  
  return systemHealth.endpoints.filter(endpoint => 
    endpoint.status === 'offline' || endpoint.status === 'degraded'
  )
}

// Hook para notificações de status
export const useSystemHealthNotifications = (systemHealth: SystemHealth | null) => {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'error' | 'warning' | 'info'
    message: string
    timestamp: string
  }>>([])

  useEffect(() => {
    if (!systemHealth) return

    const newNotifications: Array<{
      id: string
      type: 'error' | 'warning' | 'info'
      message: string
      timestamp: string
    }> = []

    // Verificar status geral
    if (systemHealth.overall === 'unhealthy') {
      newNotifications.push({
        id: `overall-${Date.now()}`,
        type: 'error',
        message: 'Múltiplos serviços estão fora do ar',
        timestamp: systemHealth.lastUpdate
      })
    } else if (systemHealth.overall === 'degraded') {
      newNotifications.push({
        id: `overall-${Date.now()}`,
        type: 'warning',
        message: 'Alguns serviços estão com problemas',
        timestamp: systemHealth.lastUpdate
      })
    }

    // Verificar endpoints críticos offline
    const criticalOffline = systemHealth.endpoints.filter(e => 
      e.status === 'offline' && ['Banco de Dados', 'Inteligência Artificial'].includes(e.category)
    )

    criticalOffline.forEach(endpoint => {
      newNotifications.push({
        id: `critical-${endpoint.id}-${Date.now()}`,
        type: 'error',
        message: `Serviço crítico offline: ${endpoint.name}`,
        timestamp: endpoint.lastCheck
      })
    })

    // Verificar tempo de resposta alto
    const slowEndpoints = systemHealth.endpoints.filter(e => 
      e.responseTime && e.responseTime > 5000
    )

    slowEndpoints.forEach(endpoint => {
      newNotifications.push({
        id: `slow-${endpoint.id}-${Date.now()}`,
        type: 'warning',
        message: `Serviço lento: ${endpoint.name} (${endpoint.responseTime}ms)`,
        timestamp: endpoint.lastCheck
      })
    })

    setNotifications(newNotifications)
  }, [systemHealth])

  return notifications
} 