import { supabase } from './supabase'
import { auditService } from './auditService'
import {
  User,
  UserFilters,
  UserListResponse,
  UserUpdateData,
  UserAction,
  BulkUpdateRequest,
  ResetPasswordRequest,
  ImpersonateRequest,
  UserHistory,
  UserStats,
  UserExportRequest,
  UserExportResponse,
  UserSession,
  UserActivity,
  UserPermissions,
  UserRole
} from '../types/userManagement'

class UserManagementService {
  private static instance: UserManagementService

  static getInstance(): UserManagementService {
    if (!UserManagementService.instance) {
      UserManagementService.instance = new UserManagementService()
    }
    return UserManagementService.instance
  }

  // Listagem paginada com filtros
  async getUsers(params: {
    page?: number
    limit?: number
    search?: string
    filters?: UserFilters
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<UserListResponse> {
    const {
      page = 0,
      limit = 20,
      search = '',
      filters = {},
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params

    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })

      // Aplicar busca
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      // Aplicar filtros
      if (filters.role) {
        query = query.eq('role', filters.role)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }
      if (filters.isEmailVerified !== undefined) {
        query = query.eq('is_email_verified', filters.isEmailVerified)
      }

      // Aplicar ordenação e paginação
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(page * limit, (page + 1) * limit - 1)

      const { data: users, error, count } = await query

      if (error) {
        throw new Error(`Erro ao buscar usuários: ${error.message}`)
      }

      // Enriquecer dados dos usuários
      const enrichedUsers = await this.enrichUserData(users || [])

      return {
        users: enrichedUsers,
        total: count || 0,
        page,
        limit,
        nextPage: (page + 1) * limit < (count || 0) ? page + 1 : undefined,
        hasMore: (page + 1) * limit < (count || 0)
      }
    } catch (error) {
      console.error('Erro no getUsers:', error)
      throw error
    }
  }

  // Enriquecer dados dos usuários com informações adicionais
  private async enrichUserData(users: any[]): Promise<User[]> {
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        // Buscar último acesso
        const { data: lastAccess } = await supabase
          .from('activity_logs')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Buscar contagem de logins
        const { count: loginCount } = await supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('action', 'login_success')

        // Buscar tentativas falhadas
        const { count: failedAttempts } = await supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('action', 'login_failed')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24h

        return {
          ...user,
          last_access: lastAccess?.created_at,
          login_count: loginCount || 0,
          failed_login_attempts: failedAttempts || 0
        }
      })
    )

    return enrichedUsers
  }

  // Atualizar usuário
  async updateUser(userId: string, updates: UserUpdateData): Promise<User> {
    try {
      const { data: oldUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!oldUser) {
        throw new Error('Usuário não encontrado')
      }

      const { data: user, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`Erro ao atualizar usuário: ${error.message}`)
      }

      // Log da auditoria
      await auditService.logUpdate('profiles', userId, oldUser, user)

      return user
    } catch (error) {
      console.error('Erro no updateUser:', error)
      throw error
    }
  }

  // Excluir usuário
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!user) {
        throw new Error('Usuário não encontrado')
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) {
        throw new Error(`Erro ao excluir usuário: ${error.message}`)
      }

      // Log da auditoria
      await auditService.logDelete('profiles', userId, user)

      return true
    } catch (error) {
      console.error('Erro no deleteUser:', error)
      throw error
    }
  }

  // Ações em massa
  async bulkUpdateUsers(action: UserAction, userIds: string[], reason?: string): Promise<boolean> {
    try {
      const updates: Record<string, any> = {}
      const now = new Date().toISOString()

      switch (action) {
        case 'activate':
          updates.status = 'active'
          break
        case 'deactivate':
          updates.status = 'inactive'
          break
        case 'suspend':
          updates.status = 'suspended'
          break
        case 'unsuspend':
          updates.status = 'active'
          break
        case 'delete':
          // Excluir usuários
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .in('id', userIds)

          if (deleteError) {
            throw new Error(`Erro ao excluir usuários: ${deleteError.message}`)
          }

          // Log da auditoria para cada usuário excluído
          for (const userId of userIds) {
            await auditService.logDelete('profiles', userId, { id: userId })
          }

          return true
      }

      // Atualizar usuários
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: now
        })
        .in('id', userIds)

      if (error) {
        throw new Error(`Erro na ação em massa: ${error.message}`)
      }

      // Log da auditoria para cada usuário atualizado
      for (const userId of userIds) {
        await auditService.logUpdate('profiles', userId, {}, updates)
      }

      return true
    } catch (error) {
      console.error('Erro no bulkUpdateUsers:', error)
      throw error
    }
  }

  // Reset de senha
  async resetPassword(userId: string, sendEmail: boolean = true): Promise<boolean> {
    try {
      const { data: user } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single()

      if (!user) {
        throw new Error('Usuário não encontrado')
      }

      // Gerar token temporário
      const resetToken = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: user.email
      })

      if (resetToken.error) {
        throw new Error(`Erro ao gerar token: ${resetToken.error.message}`)
      }

      // Enviar email se solicitado
      if (sendEmail) {
        // Aqui você pode integrar com seu serviço de email
        console.log('Email de reset enviado para:', user.email)
      }

      // Log da auditoria
      await auditService.logCreate('password_reset', userId, {
        user_id: userId,
        email: user.email,
        reset_token: resetToken.data.properties.action_link,
        created_at: new Date().toISOString()
      })

      return true
    } catch (error) {
      console.error('Erro no resetPassword:', error)
      throw error
    }
  }

  // Impersonação de usuário
  async impersonateUser(userId: string, reason?: string, duration?: number): Promise<{ sessionId: string }> {
    try {
      const { data: user } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('id', userId)
        .single()

      if (!user) {
        throw new Error('Usuário não encontrado')
      }

      // Verificar se o usuário atual tem permissão para impersonar
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error('Usuário não autenticado')
      }

      // Criar sessão temporária
      const { data: session, error } = await supabase.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        user_metadata: {
          impersonated_by: currentUser.id,
          impersonation_reason: reason,
          impersonation_start: new Date().toISOString(),
          impersonation_duration: duration || 60 // 60 minutos padrão
        }
      })

      if (error) {
        throw new Error(`Erro na impersonação: ${error.message}`)
      }

      // Log da auditoria
      await auditService.logCreate('impersonation', userId, {
        impersonated_user_id: userId,
        impersonated_by: currentUser.id,
        reason,
        duration,
        session_id: session.user.id,
        created_at: new Date().toISOString()
      })

      return { sessionId: session.user.id }
    } catch (error) {
      console.error('Erro no impersonateUser:', error)
      throw error
    }
  }

  // Buscar histórico do usuário
  async getUserHistory(userId: string, limit: number = 50): Promise<UserHistory[]> {
    try {
      const { data: history, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`Erro ao buscar histórico: ${error.message}`)
      }

      return history || []
    } catch (error) {
      console.error('Erro no getUserHistory:', error)
      throw error
    }
  }

  // Buscar sessões do usuário
  async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_activity', { ascending: false })

      if (error) {
        throw new Error(`Erro ao buscar sessões: ${error.message}`)
      }

      return sessions || []
    } catch (error) {
      console.error('Erro no getUserSessions:', error)
      throw error
    }
  }

  // Buscar atividades do usuário
  async getUserActivities(userId: string, limit: number = 50): Promise<UserActivity[]> {
    try {
      const { data: activities, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`Erro ao buscar atividades: ${error.message}`)
      }

      return activities || []
    } catch (error) {
      console.error('Erro no getUserActivities:', error)
      throw error
    }
  }

  // Buscar permissões do usuário
  async getUserPermissions(userId: string): Promise<UserPermissions | null> {
    try {
      const { data: permissions, error } = await supabase
        .rpc('get_user_permissions', { user_id_param: userId })

      if (error) {
        throw new Error(`Erro ao buscar permissões: ${error.message}`)
      }

      return permissions
    } catch (error) {
      console.error('Erro no getUserPermissions:', error)
      throw error
    }
  }

  // Buscar roles do usuário
  async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          roles (
            id,
            name,
            display_name,
            description
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        throw new Error(`Erro ao buscar roles: ${error.message}`)
      }

      return roles || []
    } catch (error) {
      console.error('Erro no getUserRoles:', error)
      throw error
    }
  }

  // Estatísticas de usuários
  async getUserStats(): Promise<UserStats> {
    try {
      const { data: stats, error } = await supabase
        .rpc('get_user_stats')

      if (error) {
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`)
      }

      return stats
    } catch (error) {
      console.error('Erro no getUserStats:', error)
      throw error
    }
  }

  // Exportar usuários
  async exportUsers(request: UserExportRequest): Promise<UserExportResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const { data: exportData, error } = await supabase
        .rpc('export_users', {
          p_user_id: user.id,
          p_format: request.format,
          p_filters: JSON.stringify(request.filters || {}),
          p_search: request.search || '',
          p_include_history: request.include_history || false,
          p_include_stats: request.include_stats || false
        })

      if (error) {
        throw new Error(`Erro na exportação: ${error.message}`)
      }

      return exportData
    } catch (error) {
      console.error('Erro no exportUsers:', error)
      throw error
    }
  }

  // Revogar sessão
  async revokeSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('session_id', sessionId)

      if (error) {
        throw new Error(`Erro ao revogar sessão: ${error.message}`)
      }

      // Log da auditoria
      await auditService.logCreate('session_revoked', sessionId, {
        session_id: sessionId,
        revoked_at: new Date().toISOString()
      })

      return true
    } catch (error) {
      console.error('Erro no revokeSession:', error)
      throw error
    }
  }

  // Revogar todas as sessões do usuário (exceto a atual)
  async revokeAllUserSessions(userId: string, currentSessionId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)

      if (currentSessionId) {
        query = query.neq('session_id', currentSessionId)
      }

      const { error } = await query

      if (error) {
        throw new Error(`Erro ao revogar sessões: ${error.message}`)
      }

      // Log da auditoria
      await auditService.logCreate('all_sessions_revoked', userId, {
        user_id: userId,
        current_session_id: currentSessionId,
        revoked_at: new Date().toISOString()
      })

      return true
    } catch (error) {
      console.error('Erro no revokeAllUserSessions:', error)
      throw error
    }
  }
}

export const userManagementService = UserManagementService.getInstance() 