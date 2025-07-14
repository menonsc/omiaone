import { supabase } from './supabase'

// Tipos para o sistema RBAC
export interface Role {
  id: string
  name: string
  display_name: string
  description?: string
  permissions: Record<string, string[]>
  hierarchy_level: number
  is_system_role: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  assigned_by?: string
  assigned_at: string
  expires_at?: string
  is_active: boolean
  role?: Role
}

export interface PermissionCheck {
  resource: string
  action: string
  granted: boolean
  role_used?: string
  checked_at: string
}

export interface UserPermissions {
  permissions: Record<string, string[]>
  roles: string[]
  checked_at: string
}

export interface PermissionLog {
  id: string
  user_id: string
  action: string
  resource: string
  resource_id?: string
  permission_checked: string
  granted: boolean
  role_used?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Mapeamento de recursos para permissões legíveis
export const RESOURCE_LABELS: Record<string, string> = {
  users: 'Usuários',
  roles: 'Papéis',
  agents: 'Agentes de IA',
  documents: 'Documentos',
  chat: 'Chat',
  whatsapp: 'WhatsApp',
  email_marketing: 'Email Marketing',
  integrations: 'Integrações',
  analytics: 'Analytics',
  system: 'Sistema',
  flow_builder: 'Flow Builder'
}

export const ACTION_LABELS: Record<string, string> = {
  create: 'Criar',
  read: 'Visualizar',
  update: 'Editar',
  delete: 'Deletar',
  manage_roles: 'Gerenciar Papéis',
  manage_public: 'Gerenciar Públicos',
  manage_all: 'Gerenciar Todos',
  moderate: 'Moderar',
  manage_instances: 'Gerenciar Instâncias',
  send_campaigns: 'Enviar Campanhas',
  configure: 'Configurar',
  export: 'Exportar',
  maintain: 'Manter',
  backup: 'Backup',
  logs: 'Logs',
  execute: 'Executar',
  manage_templates: 'Gerenciar Templates',
  manage_triggers: 'Gerenciar Triggers',
  import: 'Importar'
}

class PermissionsService {
  private permissionsCache: Map<string, UserPermissions> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

  // Verificar se o cache está válido
  private isCacheValid(userId: string): boolean {
    const expiry = this.cacheExpiry.get(userId)
    return expiry ? Date.now() < expiry : false
  }

  // Limpar cache de um usuário
  clearUserCache(userId: string) {
    this.permissionsCache.delete(userId)
    this.cacheExpiry.delete(userId)
  }

  // Limpar todo o cache
  clearAllCache() {
    this.permissionsCache.clear()
    this.cacheExpiry.clear()
  }

  // Obter todas as permissões do usuário
  async getUserPermissions(userId: string, forceRefresh = false): Promise<UserPermissions | null> {
    // Verificar cache primeiro
    if (!forceRefresh && this.isCacheValid(userId)) {
      const cached = this.permissionsCache.get(userId)
      if (cached) return cached
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_permissions', { user_id_param: userId })

      if (error) {
        console.error('Erro ao buscar permissões:', error)
        return null
      }

      if (data) {
        // Atualizar cache
        this.permissionsCache.set(userId, data)
        this.cacheExpiry.set(userId, Date.now() + this.CACHE_DURATION)
        return data
      }

      return null
    } catch (error) {
      console.error('Erro ao buscar permissões:', error)
      return null
    }
  }

  // Verificar permissão específica
  async checkPermission(
    userId: string, 
    resource: string, 
    action: string,
    logCheck = true
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('check_user_permission', {
          user_id_param: userId,
          resource_param: resource,
          action_param: action
        })

      if (error) {
        console.error('Erro ao verificar permissão:', error)
        return false
      }

      const granted = Boolean(data)

      // Log da verificação de permissão (opcional)
      if (logCheck) {
        this.logPermissionCheck(userId, action, resource, undefined, granted)
      }

      return granted
    } catch (error) {
      console.error('Erro ao verificar permissão:', error)
      return false
    }
  }

  // Verificar múltiplas permissões
  async checkMultiplePermissions(
    userId: string,
    checks: Array<{ resource: string; action: string }>
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    // Executar verificações em paralelo
    const promises = checks.map(async ({ resource, action }) => {
      const key = `${resource}.${action}`
      const granted = await this.checkPermission(userId, resource, action, false)
      results[key] = granted
      return { key, granted }
    })

    await Promise.all(promises)
    return results
  }

  // Verificar se usuário tem qualquer uma das permissões (OR)
  async hasAnyPermission(
    userId: string,
    checks: Array<{ resource: string; action: string }>
  ): Promise<boolean> {
    const results = await this.checkMultiplePermissions(userId, checks)
    return Object.values(results).some(granted => granted)
  }

  // Verificar se usuário tem todas as permissões (AND)
  async hasAllPermissions(
    userId: string,
    checks: Array<{ resource: string; action: string }>
  ): Promise<boolean> {
    const results = await this.checkMultiplePermissions(userId, checks)
    return Object.values(results).every(granted => granted)
  }

  // Obter roles do usuário
  async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('role.hierarchy_level')

      if (error) {
        console.error('Erro ao buscar roles:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar roles:', error)
      return []
    }
  }

  // Atribuir role a usuário
  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    expiresAt?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: assignedBy,
          expires_at: expiresAt,
          is_active: true
        })

      if (error) {
        console.error('Erro ao atribuir role:', error)
        return false
      }

      // Limpar cache do usuário
      this.clearUserCache(userId)
      return true
    } catch (error) {
      console.error('Erro ao atribuir role:', error)
      return false
    }
  }

  // Remover role de usuário
  async revokeRole(userId: string, roleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role_id', roleId)

      if (error) {
        console.error('Erro ao revogar role:', error)
        return false
      }

      // Limpar cache do usuário
      this.clearUserCache(userId)
      return true
    } catch (error) {
      console.error('Erro ao revogar role:', error)
      return false
    }
  }

  // Obter todos os roles disponíveis
  async getAllRoles(): Promise<Role[]> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('hierarchy_level')

      if (error) {
        console.error('Erro ao buscar roles:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar roles:', error)
      return []
    }
  }

  // Criar novo role
  async createRole(roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role | null> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert(roleData)
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar role:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao criar role:', error)
      return null
    }
  }

  // Atualizar role
  async updateRole(roleId: string, updates: Partial<Role>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('roles')
        .update(updates)
        .eq('id', roleId)

      if (error) {
        console.error('Erro ao atualizar role:', error)
        return false
      }

      // Limpar cache de todos os usuários (as permissões podem ter mudado)
      this.clearAllCache()
      return true
    } catch (error) {
      console.error('Erro ao atualizar role:', error)
      return false
    }
  }

  // Deletar role
  async deleteRole(roleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('roles')
        .update({ is_active: false })
        .eq('id', roleId)

      if (error) {
        console.error('Erro ao deletar role:', error)
        return false
      }

      // Limpar cache de todos os usuários
      this.clearAllCache()
      return true
    } catch (error) {
      console.error('Erro ao deletar role:', error)
      return false
    }
  }

  // Log de verificação de permissão
  private async logPermissionCheck(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    granted?: boolean,
    roleUsed?: string
  ) {
    try {
      await supabase.rpc('log_permission_check', {
        user_id_param: userId,
        action_param: action,
        resource_param: resource,
        resource_id_param: resourceId,
        granted_param: granted,
        role_used_param: roleUsed
      })
    } catch (error) {
      console.error('Erro ao registrar log de permissão:', error)
    }
  }

  // Obter logs de permissões (para auditoria)
  async getPermissionLogs(
    filters: {
      userId?: string
      resource?: string
      action?: string
      dateFrom?: Date
      dateTo?: Date
      limit?: number
    } = {}
  ): Promise<PermissionLog[]> {
    try {
      let query = supabase
        .from('permission_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }

      if (filters.resource) {
        query = query.eq('resource', filters.resource)
      }

      if (filters.action) {
        query = query.eq('action', filters.action)
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString())
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString())
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar logs de permissões:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs de permissões:', error)
      return []
    }
  }

  // Utilitários para UI

  // Obter label amigável para recurso
  getResourceLabel(resource: string): string {
    return RESOURCE_LABELS[resource] || resource
  }

  // Obter label amigável para ação
  getActionLabel(action: string): string {
    return ACTION_LABELS[action] || action
  }

  // Formatar permissão para exibição
  formatPermission(resource: string, action: string): string {
    return `${this.getActionLabel(action)} ${this.getResourceLabel(resource)}`
  }

  // Obter cor baseada no nível hierárquico
  getRoleColor(hierarchyLevel: number): string {
    switch (hierarchyLevel) {
      case 1: return 'text-red-600 bg-red-50' // Super Admin
      case 2: return 'text-orange-600 bg-orange-50' // Admin
      case 3: return 'text-blue-600 bg-blue-50' // Moderator
      case 4: return 'text-green-600 bg-green-50' // User
      default: return 'text-gray-600 bg-gray-50'
    }
  }
}

// Instância singleton do serviço
export const permissionsService = new PermissionsService()

// Hook para usar o serviço (será implementado no próximo arquivo)
export const usePermissions = () => permissionsService 