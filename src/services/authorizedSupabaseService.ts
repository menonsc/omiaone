// Wrapper Autorizado para Serviços Supabase
// Inclui verificação de autorização em todas as operações

import { supabase } from './supabase'
import AuthorizationMiddleware, { RATE_LIMITS } from './authorizationMiddleware'

// Configurações de autorização por recurso
const RESOURCE_PERMISSIONS = {
  profiles: {
    read: 'users.read',
    create: 'users.create', 
    update: 'users.update',
    delete: 'users.delete'
  },
  agents: {
    read: 'agents.read',
    create: 'agents.create',
    update: 'agents.update', 
    delete: 'agents.delete'
  },
  documents: {
    read: 'documents.read',
    create: 'documents.create',
    update: 'documents.update',
    delete: 'documents.delete'
  },
  chat_sessions: {
    read: 'chat.read',
    create: 'chat.create',
    update: 'chat.update',
    delete: 'chat.delete'
  },
  messages: {
    read: 'chat.read',
    create: 'chat.create',
    update: 'chat.update'
  },
  email_campaigns: {
    read: 'email_marketing.read',
    create: 'email_marketing.create',
    update: 'email_marketing.update',
    delete: 'email_marketing.delete'
  },
  integrations: {
    read: 'integrations.read',
    create: 'integrations.create',
    update: 'integrations.update',
    delete: 'integrations.delete'
  },
  analytics_events: {
    read: 'analytics.read',
    create: 'analytics.create'
  },
  system_logs: {
    read: 'system.logs'
  }
}

class AuthorizedSupabaseService {
  private authMiddleware = new AuthorizationMiddleware()

  // Wrapper genérico para operações autorizadas
  private async authorizedOperation<T>(
    operation: () => Promise<T>,
    resource: string,
    action: string,
    rateLimit = RATE_LIMITS.GENERAL
  ): Promise<T> {
    // Verificar autorização
    const authResult = await this.authMiddleware.authorize({
      resource,
      action,
      rateLimit,
      logAttempt: true
    })

    if (!authResult.authorized) {
      throw new Error(`Autorização negada: ${authResult.reason}`)
    }

    try {
      return await operation()
    } catch (error) {
      // Log do erro
      console.error(`Erro na operação ${resource}.${action}:`, error)
      throw error
    }
  }

  // =====================
  // PROFILES
  // =====================

  async getProfile(userId: string) {
    return this.authorizedOperation(
      () => supabase.from('profiles').select('*').eq('id', userId).single(),
      'users',
      'read'
    )
  }

  async updateProfile(userId: string, updates: any) {
    return this.authorizedOperation(
      () => supabase.from('profiles').update(updates).eq('id', userId),
      'users',
      'update',
      RATE_LIMITS.SENSITIVE
    )
  }

  async getAllProfiles() {
    return this.authorizedOperation(
      () => supabase.from('profiles').select('*'),
      'users',
      'read'
    )
  }

  // =====================
  // AGENTS
  // =====================

  async getAgents() {
    return this.authorizedOperation(
      () => supabase.from('agents').select('*').order('created_at', { ascending: false }),
      'agents',
      'read'
    )
  }

  async getAgent(agentId: string) {
    return this.authorizedOperation(
      () => supabase.from('agents').select('*').eq('id', agentId).single(),
      'agents',
      'read'
    )
  }

  async createAgent(agentData: any) {
    return this.authorizedOperation(
      () => supabase.from('agents').insert(agentData).select().single(),
      'agents',
      'create',
      RATE_LIMITS.SENSITIVE
    )
  }

  async updateAgent(agentId: string, updates: any) {
    return this.authorizedOperation(
      () => supabase.from('agents').update(updates).eq('id', agentId).select().single(),
      'agents',
      'update',
      RATE_LIMITS.SENSITIVE
    )
  }

  async deleteAgent(agentId: string) {
    return this.authorizedOperation(
      () => supabase.from('agents').delete().eq('id', agentId),
      'agents',
      'delete',
      RATE_LIMITS.SENSITIVE
    )
  }

  // =====================
  // DOCUMENTS
  // =====================

  async getDocuments() {
    return this.authorizedOperation(
      () => supabase.from('documents').select('*').order('created_at', { ascending: false }),
      'documents',
      'read'
    )
  }

  async getDocument(documentId: string) {
    return this.authorizedOperation(
      () => supabase.from('documents').select('*').eq('id', documentId).single(),
      'documents',
      'read'
    )
  }

  async uploadDocument(documentData: any) {
    return this.authorizedOperation(
      () => supabase.from('documents').insert(documentData).select().single(),
      'documents',
      'create',
      RATE_LIMITS.FILE_UPLOAD
    )
  }

  async deleteDocument(documentId: string) {
    return this.authorizedOperation(
      () => supabase.from('documents').delete().eq('id', documentId),
      'documents',
      'delete',
      RATE_LIMITS.SENSITIVE
    )
  }

  async searchDocuments(query: string, limit = 10) {
    return this.authorizedOperation(
      () => supabase.rpc('search_documents', { query_text: query, max_results: limit }),
      'documents',
      'read'
    )
  }

  // =====================
  // CHAT SESSIONS
  // =====================

  async getChatSessions(userId: string) {
    return this.authorizedOperation(
      () => supabase
        .from('chat_sessions')
        .select('*, agents(name, type)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
      'chat',
      'read'
    )
  }

  async createChatSession(userId: string, agentId: string, title?: string) {
    return this.authorizedOperation(
      () => supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          agent_id: agentId,
          title: title || 'Nova Conversa'
        })
        .select()
        .single(),
      'chat',
      'create',
      RATE_LIMITS.SENSITIVE
    )
  }

  async deleteChatSession(sessionId: string) {
    return this.authorizedOperation(
      () => supabase.from('chat_sessions').delete().eq('id', sessionId),
      'chat',
      'delete',
      RATE_LIMITS.SENSITIVE
    )
  }

  // =====================
  // MESSAGES
  // =====================

  async getMessages(sessionId: string) {
    return this.authorizedOperation(
      () => supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true }),
      'chat',
      'read'
    )
  }

  async saveMessage(sessionId: string, role: string, content: string, tokensUsed?: number) {
    return this.authorizedOperation(
      () => supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          role,
          content,
          tokens_used: tokensUsed
        })
        .select()
        .single(),
      'chat',
      'create',
      RATE_LIMITS.API_CALLS
    )
  }

  async updateMessageFeedback(messageId: string, score: number) {
    return this.authorizedOperation(
      () => supabase
        .from('messages')
        .update({ feedback_score: score })
        .eq('id', messageId),
      'chat',
      'update'
    )
  }

  // =====================
  // EMAIL MARKETING
  // =====================

  async getEmailCampaigns() {
    return this.authorizedOperation(
      () => supabase
        .from('email_campaigns')
        .select('*, email_campaign_stats(*)')
        .order('created_at', { ascending: false }),
      'email_marketing',
      'read'
    )
  }

  async createEmailCampaign(campaignData: any) {
    return this.authorizedOperation(
      () => supabase.from('email_campaigns').insert(campaignData).select().single(),
      'email_marketing',
      'create',
      RATE_LIMITS.SENSITIVE
    )
  }

  async getEmailTemplates() {
    return this.authorizedOperation(
      () => supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      'email_marketing',
      'read'
    )
  }

  async getEmailContacts() {
    return this.authorizedOperation(
      () => supabase
        .from('email_contacts')
        .select('*')
        .order('created_at', { ascending: false }),
      'email_marketing',
      'read'
    )
  }

  // =====================
  // INTEGRATIONS
  // =====================

  async getIntegrations() {
    return this.authorizedOperation(
      () => supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false }),
      'integrations',
      'read'
    )
  }

  async createIntegration(integrationData: any) {
    return this.authorizedOperation(
      () => supabase.from('integrations').insert(integrationData).select().single(),
      'integrations',
      'create',
      RATE_LIMITS.SENSITIVE
    )
  }

  async updateIntegration(integrationId: string, updates: any) {
    return this.authorizedOperation(
      () => supabase.from('integrations').update(updates).eq('id', integrationId),
      'integrations',
      'update',
      RATE_LIMITS.SENSITIVE
    )
  }

  async deleteIntegration(integrationId: string) {
    return this.authorizedOperation(
      () => supabase.from('integrations').delete().eq('id', integrationId),
      'integrations',
      'delete',
      RATE_LIMITS.SENSITIVE
    )
  }

  // =====================
  // ANALYTICS (APENAS ADMINS)
  // =====================

  async getAnalyticsEvents(filters: any = {}) {
    return this.authorizedOperation(
      () => {
        let query = supabase.from('analytics_events').select('*')
        
        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom)
        }
        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo)
        }
        if (filters.eventType) {
          query = query.eq('event_type', filters.eventType)
        }
        
        return query.order('created_at', { ascending: false }).limit(filters.limit || 100)
      },
      'analytics',
      'read'
    )
  }

  async getDashboardMetrics(days = 30) {
    return this.authorizedOperation(
      () => supabase.rpc('aggregate_daily_metrics', { target_date: new Date() }),
      'analytics',
      'read'
    )
  }

  async getSystemLogs(filters: any = {}) {
    return this.authorizedOperation(
      () => supabase.rpc('search_system_logs', {
        search_query: filters.search || '',
        log_level_filter: filters.logLevel || '',
        component_filter: filters.component || '',
        date_from: filters.dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        date_to: filters.dateTo || new Date(),
        limit_count: filters.limit || 100
      }),
      'system',
      'logs'
    )
  }

  async getSystemAlerts(filters: any = {}) {
    return this.authorizedOperation(
      () => {
        let query = supabase.from('system_alerts').select('*')
        
        if (filters.status) {
          query = query.eq('status', filters.status)
        }
        if (filters.severity) {
          query = query.eq('severity', filters.severity)
        }
        
        return query.order('created_at', { ascending: false }).limit(filters.limit || 50)
      },
      'analytics',
      'read'
    )
  }

  // =====================
  // RBAC SYSTEM (APENAS SUPER ADMINS)
  // =====================

  async getAllRoles() {
    return this.authorizedOperation(
      () => supabase.from('roles').select('*').order('hierarchy_level', { ascending: true }),
      'system',
      'manage_all'
    )
  }

  async createRole(roleData: any) {
    return this.authorizedOperation(
      () => supabase.from('roles').insert(roleData).select().single(),
      'system',
      'manage_all',
      RATE_LIMITS.SENSITIVE
    )
  }

  async updateRole(roleId: string, updates: any) {
    return this.authorizedOperation(
      () => supabase.from('roles').update(updates).eq('id', roleId),
      'system',
      'manage_all',
      RATE_LIMITS.SENSITIVE
    )
  }

  async deleteRole(roleId: string) {
    return this.authorizedOperation(
      () => supabase.from('roles').delete().eq('id', roleId),
      'system',
      'manage_all',
      RATE_LIMITS.SENSITIVE
    )
  }

  async getUserRoles(userId: string) {
    return this.authorizedOperation(
      () => supabase
        .from('user_roles')
        .select('*, roles(*)')
        .eq('user_id', userId)
        .eq('is_active', true),
      'users',
      'read'
    )
  }

  async assignRole(userId: string, roleId: string, assignedBy: string, expiresAt?: string) {
    return this.authorizedOperation(
      () => supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: assignedBy,
          expires_at: expiresAt
        }),
      'users',
      'update',
      RATE_LIMITS.SENSITIVE
    )
  }

  async revokeRole(userId: string, roleId: string) {
    return this.authorizedOperation(
      () => supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role_id', roleId),
      'users',
      'update',
      RATE_LIMITS.SENSITIVE
    )
  }

  // =====================
  // ACTIVITY LOGS
  // =====================

  async logActivity(userId: string, action: string, resourceType?: string, resourceId?: string, details?: any) {
    // Atividade logs sempre permitidos (para auditoria)
    return supabase.from('activity_logs').insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details || {},
      ip_address: '0.0.0.0' // Será obtido no backend
    })
  }

  async getActivityLogs(userId: string, limit = 100) {
    return this.authorizedOperation(
      () => supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
      'system',
      'logs'
    )
  }

  // =====================
  // BULK OPERATIONS
  // =====================

  async bulkDelete(table: string, ids: string[], resource: string) {
    return this.authorizedOperation(
      () => supabase.from(table).delete().in('id', ids),
      resource,
      'delete',
      RATE_LIMITS.BULK_OPERATIONS
    )
  }

  async bulkUpdate(table: string, updates: any, condition: any, resource: string) {
    return this.authorizedOperation(
      () => {
        let query = supabase.from(table).update(updates)
        Object.entries(condition).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
        return query
      },
      resource,
      'update',
      RATE_LIMITS.BULK_OPERATIONS
    )
  }

  // =====================
  // REAL-TIME SUBSCRIPTIONS (COM AUTORIZAÇÃO)
  // =====================

  async subscribeToTable(table: string, resource: string, callback: (payload: any) => void) {
    // Verificar autorização antes de subscrever
    const authResult = await this.authMiddleware.authorize({
      resource,
      action: 'read',
      logAttempt: false // Não logar para subscriptions
    })

    if (!authResult.authorized) {
      throw new Error(`Autorização negada para subscription: ${authResult.reason}`)
    }

    return supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe()
  }
}

// Singleton instance
export const authorizedSupabase = new AuthorizedSupabaseService()

export default AuthorizedSupabaseService 