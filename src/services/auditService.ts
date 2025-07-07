import { supabase } from './supabase'

export interface AuditLog {
  id: string
  user_id?: string
  user_name?: string
  user_email?: string
  action: string
  resource: string
  resource_id?: string
  resource_type?: string
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
  session_id?: string
  severity: 'debug' | 'info' | 'warn' | 'error' | 'critical'
  metadata?: Record<string, any>
  created_at: string
  expires_at: string
}

export interface AuditConfig {
  id: string
  resource_name: string
  is_audited: boolean
  retention_days: number
  log_level: string
  track_changes: boolean
  track_access: boolean
  created_at: string
  updated_at: string
}

export interface AuditAlert {
  id: string
  alert_type: string
  title: string
  description?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  trigger_conditions: Record<string, any>
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface AuditExport {
  id: string
  user_id: string
  export_type: 'csv' | 'pdf' | 'json'
  filters: Record<string, any>
  file_path?: string
  file_size?: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  expires_at: string
  created_at: string
}

export interface AuditFilters {
  user_id?: string
  action?: string
  resource?: string
  severity?: string
  date_from?: Date
  date_to?: Date
  ip_address?: string
  limit?: number
  offset?: number
}

export interface AuditStats {
  total_logs: number
  logs_today: number
  unique_users: number
  unique_ips: number
  critical_actions: number
  top_actions: Array<{ action: string; count: number }>
  top_resources: Array<{ resource: string; count: number }>
  severity_distribution: Record<string, number>
}

class AuditService {
  private static instance: AuditService

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService()
    }
    return AuditService.instance
  }

  // =====================================================
  // LOGS DE AUDITORIA
  // =====================================================

  async createLog(params: {
    action: string
    resource: string
    resource_id?: string
    resource_type?: string
    old_values?: any
    new_values?: any
    severity?: 'debug' | 'info' | 'warn' | 'error' | 'critical'
    metadata?: Record<string, any>
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_audit_log', {
        p_action: params.action,
        p_resource: params.resource,
        p_resource_id: params.resource_id,
        p_resource_type: params.resource_type,
        p_old_values: params.old_values ? JSON.stringify(params.old_values) : null,
        p_new_values: params.new_values ? JSON.stringify(params.new_values) : null,
        p_severity: params.severity || 'info',
        p_metadata: params.metadata ? JSON.stringify(params.metadata) : '{}'
      })

      if (error) {
        console.error('Erro ao criar log de auditoria:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao criar log de auditoria:', error)
      return null
    }
  }

  async getLogs(filters: AuditFilters = {}): Promise<AuditLog[]> {
    try {
      let query = supabase
        .from('audit_logs_view')
        .select('*')
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      if (filters.action) {
        query = query.eq('action', filters.action)
      }
      if (filters.resource) {
        query = query.eq('resource', filters.resource)
      }
      if (filters.severity) {
        query = query.eq('severity', filters.severity)
      }
      if (filters.ip_address) {
        query = query.eq('ip_address', filters.ip_address)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from.toISOString())
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to.toISOString())
      }

      // Limite e offset
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar logs de auditoria:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error)
      return []
    }
  }

  async getLogById(logId: string): Promise<AuditLog | null> {
    try {
      const { data, error } = await supabase
        .from('audit_logs_view')
        .select('*')
        .eq('id', logId)
        .single()

      if (error) {
        console.error('Erro ao buscar log de auditoria:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar log de auditoria:', error)
      return null
    }
  }

  async getStats(days: number = 30): Promise<AuditStats | null> {
    try {
      // Estatísticas básicas
      const { data: basicStats, error: basicError } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

      if (basicError) {
        console.error('Erro ao buscar estatísticas básicas:', basicError)
        return null
      }

      // Logs de hoje
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { data: todayLogs, error: todayError } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', today.toISOString())

      if (todayError) {
        console.error('Erro ao buscar logs de hoje:', todayError)
        return null
      }

      // Estatísticas detalhadas
      const { data: detailedStats, error: detailedError } = await supabase
        .from('audit_stats_view')
        .select('*')
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

      if (detailedError) {
        console.error('Erro ao buscar estatísticas detalhadas:', detailedError)
        return null
      }

      // Processar dados
      const totalLogs = basicStats?.length || 0
      const logsToday = todayLogs?.length || 0
      const uniqueUsers = new Set(basicStats?.map(log => log.user_id).filter(Boolean)).size
      const uniqueIps = new Set(basicStats?.map(log => log.ip_address).filter(Boolean)).size
      const criticalActions = basicStats?.filter(log => log.severity === 'critical').length || 0

      // Top ações
      const actionCounts: Record<string, number> = {}
      basicStats?.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
      })
      const topActions = Object.entries(actionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({ action, count }))

      // Top recursos
      const resourceCounts: Record<string, number> = {}
      basicStats?.forEach(log => {
        resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1
      })
      const topResources = Object.entries(resourceCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([resource, count]) => ({ resource, count }))

      // Distribuição de severidade
      const severityCounts: Record<string, number> = {}
      basicStats?.forEach(log => {
        severityCounts[log.severity] = (severityCounts[log.severity] || 0) + 1
      })

      return {
        total_logs: totalLogs,
        logs_today: logsToday,
        unique_users: uniqueUsers,
        unique_ips: uniqueIps,
        critical_actions: criticalActions,
        top_actions: topActions,
        top_resources: topResources,
        severity_distribution: severityCounts
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de auditoria:', error)
      return null
    }
  }

  // =====================================================
  // CONFIGURAÇÕES DE AUDITORIA
  // =====================================================

  async getAuditConfig(): Promise<AuditConfig[]> {
    try {
      const { data, error } = await supabase
        .from('audit_config')
        .select('*')
        .order('resource_name')

      if (error) {
        console.error('Erro ao buscar configurações de auditoria:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar configurações de auditoria:', error)
      return []
    }
  }

  async updateAuditConfig(
    resourceName: string,
    updates: Partial<AuditConfig>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('audit_config')
        .update(updates)
        .eq('resource_name', resourceName)

      if (error) {
        console.error('Erro ao atualizar configuração de auditoria:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao atualizar configuração de auditoria:', error)
      return false
    }
  }

  // =====================================================
  // ALERTAS DE AUDITORIA
  // =====================================================

  async getAuditAlerts(): Promise<AuditAlert[]> {
    try {
      const { data, error } = await supabase
        .from('audit_alerts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar alertas de auditoria:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar alertas de auditoria:', error)
      return []
    }
  }

  async createAuditAlert(alert: Omit<AuditAlert, 'id' | 'created_at' | 'updated_at'>): Promise<AuditAlert | null> {
    try {
      const { data, error } = await supabase
        .from('audit_alerts')
        .insert(alert)
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar alerta de auditoria:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao criar alerta de auditoria:', error)
      return null
    }
  }

  async updateAuditAlert(
    alertId: string,
    updates: Partial<AuditAlert>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('audit_alerts')
        .update(updates)
        .eq('id', alertId)

      if (error) {
        console.error('Erro ao atualizar alerta de auditoria:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao atualizar alerta de auditoria:', error)
      return false
    }
  }

  async deleteAuditAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('audit_alerts')
        .delete()
        .eq('id', alertId)

      if (error) {
        console.error('Erro ao deletar alerta de auditoria:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao deletar alerta de auditoria:', error)
      return false
    }
  }

  // =====================================================
  // EXPORTAÇÕES
  // =====================================================

  async createExport(params: {
    export_type: 'csv' | 'pdf' | 'json'
    filters: Record<string, any>
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('export_audit_logs', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_filters: JSON.stringify(params.filters),
        p_format: params.export_type
      })

      if (error) {
        console.error('Erro ao criar exportação:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao criar exportação:', error)
      return null
    }
  }

  async getExports(): Promise<AuditExport[]> {
    try {
      const { data, error } = await supabase
        .from('audit_exports')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar exportações:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar exportações:', error)
      return []
    }
  }

  async getExportById(exportId: string): Promise<AuditExport | null> {
    try {
      const { data, error } = await supabase
        .from('audit_exports')
        .select('*')
        .eq('id', exportId)
        .single()

      if (error) {
        console.error('Erro ao buscar exportação:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar exportação:', error)
      return null
    }
  }

  // =====================================================
  // MÉTODOS DE CONVENIÊNCIA
  // =====================================================

  // Log de login
  async logLogin(userId: string, success: boolean, metadata?: Record<string, any>): Promise<void> {
    await this.createLog({
      action: success ? 'login_success' : 'login_failed',
      resource: 'auth',
      resource_id: userId,
      resource_type: 'user',
      severity: success ? 'info' : 'warn',
      metadata: {
        ...metadata,
        success,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Log de logout
  async logLogout(userId: string, metadata?: Record<string, any>): Promise<void> {
    await this.createLog({
      action: 'logout',
      resource: 'auth',
      resource_id: userId,
      resource_type: 'user',
      severity: 'info',
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Log de criação de recurso
  async logCreate(resource: string, resourceId: string, data: any, metadata?: Record<string, any>): Promise<void> {
    await this.createLog({
      action: `${resource}_created`,
      resource,
      resource_id: resourceId,
      resource_type: resource,
      new_values: data,
      severity: 'info',
      metadata
    })
  }

  // Log de atualização de recurso
  async logUpdate(resource: string, resourceId: string, oldData: any, newData: any, metadata?: Record<string, any>): Promise<void> {
    await this.createLog({
      action: `${resource}_updated`,
      resource,
      resource_id: resourceId,
      resource_type: resource,
      old_values: oldData,
      new_values: newData,
      severity: 'info',
      metadata
    })
  }

  // Log de exclusão de recurso
  async logDelete(resource: string, resourceId: string, data: any, metadata?: Record<string, any>): Promise<void> {
    await this.createLog({
      action: `${resource}_deleted`,
      resource,
      resource_id: resourceId,
      resource_type: resource,
      old_values: data,
      severity: 'warn',
      metadata
    })
  }

  // Log de acesso a recurso
  async logAccess(resource: string, resourceId?: string, metadata?: Record<string, any>): Promise<void> {
    await this.createLog({
      action: `${resource}_accessed`,
      resource,
      resource_id: resourceId,
      resource_type: resource,
      severity: 'debug',
      metadata
    })
  }

  // Log de erro
  async logError(error: Error, context: string, metadata?: Record<string, any>): Promise<void> {
    await this.createLog({
      action: 'error_occurred',
      resource: 'system',
      resource_type: 'error',
      severity: 'error',
      metadata: {
        ...metadata,
        error_message: error.message,
        error_stack: error.stack,
        context,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Log de ação crítica
  async logCriticalAction(action: string, resource: string, resourceId?: string, metadata?: Record<string, any>): Promise<void> {
    await this.createLog({
      action,
      resource,
      resource_id: resourceId,
      resource_type: resource,
      severity: 'critical',
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    })
  }
}

export const auditService = AuditService.getInstance() 