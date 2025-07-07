import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  Role, 
  UserRole, 
  UserPermissions, 
  permissionsService 
} from '../services/permissions'

// Estender UserPermissions para incluir cache info
interface CachedUserPermissions extends UserPermissions {
  cached_at?: string
}

interface PermissionsState {
  // Cache de permissões
  userPermissions: Record<string, CachedUserPermissions>
  userRoles: Record<string, UserRole[]>
  allRoles: Role[]
  
  // Estado de UI
  isLoading: boolean
  error: string | null
  
  // Configurações
  cacheExpiry: number // em milissegundos
  enableAutoRefresh: boolean
  
  // Actions para permissões
  setUserPermissions: (userId: string, permissions: UserPermissions) => void
  setUserRoles: (userId: string, roles: UserRole[]) => void
  setAllRoles: (roles: Role[]) => void
  
  // Actions para verificações rápidas
  hasPermission: (userId: string, resource: string, action: string) => boolean | null
  hasAnyRole: (userId: string, roleNames: string[]) => boolean
  hasRole: (userId: string, roleName: string) => boolean
  isAdmin: (userId: string) => boolean
  isSuperAdmin: (userId: string) => boolean
  
  // Actions para cache
  clearUserCache: (userId: string) => void
  clearAllCache: () => void
  isPermissionsCacheValid: (userId: string) => boolean
  
  // Actions para buscar dados
  fetchUserPermissions: (userId: string, forceRefresh?: boolean) => Promise<UserPermissions | null>
  fetchUserRoles: (userId: string) => Promise<UserRole[]>
  fetchAllRoles: () => Promise<Role[]>
  
  // Actions para atualizar dados
  assignRole: (userId: string, roleId: string, assignedBy: string, expiresAt?: string) => Promise<boolean>
  revokeRole: (userId: string, roleId: string) => Promise<boolean>
  
  // Estado e configurações
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setConfig: (config: { cacheExpiry?: number; enableAutoRefresh?: boolean }) => void
}

export const usePermissionsStore = create<PermissionsState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      userPermissions: {},
      userRoles: {},
      allRoles: [],
      isLoading: false,
      error: null,
      cacheExpiry: 5 * 60 * 1000, // 5 minutos
      enableAutoRefresh: true,
      
      // Actions para atualizar cache
      setUserPermissions: (userId, permissions) => {
        set((state) => ({
          userPermissions: {
            ...state.userPermissions,
            [userId]: {
              ...permissions,
              cached_at: new Date().toISOString()
            }
          }
        }))
      },
      
      setUserRoles: (userId, roles) => {
        set((state) => ({
          userRoles: {
            ...state.userRoles,
            [userId]: roles
          }
        }))
      },
      
      setAllRoles: (roles) => {
        set({ allRoles: roles })
      },
      
      // Verificações rápidas usando cache
      hasPermission: (userId, resource, action) => {
        const state = get()
        const permissions = state.userPermissions[userId]
        
        if (!permissions || !state.isPermissionsCacheValid(userId)) {
          return null // Cache inválido, precisa buscar
        }
        
        const resourceActions = permissions.permissions[resource]
        return resourceActions ? resourceActions.includes(action) : false
      },
      
      hasAnyRole: (userId, roleNames) => {
        const state = get()
        const permissions = state.userPermissions[userId]
        
        if (!permissions || !state.isPermissionsCacheValid(userId)) {
          return false
        }
        
        return roleNames.some(roleName => permissions.roles.includes(roleName))
      },
      
      hasRole: (userId, roleName) => {
        const state = get()
        const permissions = state.userPermissions[userId]
        
        if (!permissions || !state.isPermissionsCacheValid(userId)) {
          return false
        }
        
        return permissions.roles.includes(roleName)
      },
      
      isAdmin: (userId) => {
        const state = get()
        return state.hasAnyRole(userId, ['admin', 'super_admin'])
      },
      
      isSuperAdmin: (userId) => {
        const state = get()
        return state.hasRole(userId, 'super_admin')
      },
      
      // Cache management
      clearUserCache: (userId) => {
        set((state) => {
          const newUserPermissions = { ...state.userPermissions }
          const newUserRoles = { ...state.userRoles }
          delete newUserPermissions[userId]
          delete newUserRoles[userId]
          
          return {
            userPermissions: newUserPermissions,
            userRoles: newUserRoles
          }
        })
        
        // Limpar cache do serviço também
        permissionsService.clearUserCache(userId)
      },
      
      clearAllCache: () => {
        set({
          userPermissions: {},
          userRoles: {}
        })
        
        // Limpar cache do serviço também
        permissionsService.clearAllCache()
      },
      
      isPermissionsCacheValid: (userId) => {
        const state = get()
        const permissions = state.userPermissions[userId]
        
        if (!permissions || !permissions.cached_at) {
          return false
        }
        
        const cachedAt = new Date(permissions.cached_at).getTime()
        const now = Date.now()
        
        return (now - cachedAt) < state.cacheExpiry
      },
      
      // Actions para buscar dados
      fetchUserPermissions: async (userId, forceRefresh = false) => {
        const state = get()
        
        // Verificar cache primeiro
        if (!forceRefresh && state.isPermissionsCacheValid(userId)) {
          return state.userPermissions[userId]
        }
        
        try {
          set({ isLoading: true, error: null })
          
          const permissions = await permissionsService.getUserPermissions(userId, forceRefresh)
          
          if (permissions) {
            state.setUserPermissions(userId, permissions)
            return permissions
          }
          
          return null
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar permissões'
          set({ error: errorMessage })
          console.error('Erro ao buscar permissões:', error)
          return null
        } finally {
          set({ isLoading: false })
        }
      },
      
      fetchUserRoles: async (userId) => {
        try {
          set({ isLoading: true, error: null })
          
          const roles = await permissionsService.getUserRoles(userId)
          
          if (roles) {
            get().setUserRoles(userId, roles)
          }
          
          return roles
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar roles'
          set({ error: errorMessage })
          console.error('Erro ao buscar roles:', error)
          return []
        } finally {
          set({ isLoading: false })
        }
      },
      
      fetchAllRoles: async () => {
        try {
          set({ isLoading: true, error: null })
          
          const roles = await permissionsService.getAllRoles()
          
          if (roles) {
            set({ allRoles: roles })
          }
          
          return roles
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar roles'
          set({ error: errorMessage })
          console.error('Erro ao buscar todos os roles:', error)
          return []
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Actions para modificar dados
      assignRole: async (userId, roleId, assignedBy, expiresAt) => {
        try {
          set({ isLoading: true, error: null })
          
          const success = await permissionsService.assignRole(userId, roleId, assignedBy, expiresAt)
          
          if (success) {
            // Limpar cache do usuário para forçar refresh
            get().clearUserCache(userId)
          }
          
          return success
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao atribuir role'
          set({ error: errorMessage })
          console.error('Erro ao atribuir role:', error)
          return false
        } finally {
          set({ isLoading: false })
        }
      },
      
      revokeRole: async (userId, roleId) => {
        try {
          set({ isLoading: true, error: null })
          
          const success = await permissionsService.revokeRole(userId, roleId)
          
          if (success) {
            // Limpar cache do usuário para forçar refresh
            get().clearUserCache(userId)
          }
          
          return success
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao revogar role'
          set({ error: errorMessage })
          console.error('Erro ao revogar role:', error)
          return false
        } finally {
          set({ isLoading: false })
        }
      },
      
      // State management
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      setConfig: (config) => set((state) => ({ 
        ...state, 
        ...config 
      }))
    }),
    {
      name: 'permissions-storage',
      // Persistir apenas alguns campos para evitar dados obsoletos
      partialize: (state) => ({
        allRoles: state.allRoles,
        cacheExpiry: state.cacheExpiry,
        enableAutoRefresh: state.enableAutoRefresh
      })
    }
  )
)

// Seletores para facilitar o uso
export const permissionsSelectors = {
  // Obter permissões de um usuário
  getUserPermissions: (userId: string) => (state: PermissionsState) => 
    state.userPermissions[userId],
  
  // Obter roles de um usuário
  getUserRoles: (userId: string) => (state: PermissionsState) => 
    state.userRoles[userId] || [],
  
  // Verificar se usuário tem permissão específica
  hasPermission: (userId: string, resource: string, action: string) => 
    (state: PermissionsState) => state.hasPermission(userId, resource, action),
  
  // Verificar se usuário é admin
  isAdmin: (userId: string) => (state: PermissionsState) => 
    state.isAdmin(userId),
  
  // Verificar se usuário é super admin
  isSuperAdmin: (userId: string) => (state: PermissionsState) => 
    state.isSuperAdmin(userId),
  
  // Obter roles ordenados por hierarquia
  getRolesByHierarchy: () => (state: PermissionsState) => 
    [...state.allRoles].sort((a, b) => a.hierarchy_level - b.hierarchy_level),
  
  // Obter estatísticas de cache
  getCacheStats: () => (state: PermissionsState) => ({
    totalUsersCached: Object.keys(state.userPermissions).length,
    totalRolesCached: state.allRoles.length,
    cacheExpiry: state.cacheExpiry,
    enableAutoRefresh: state.enableAutoRefresh
  })
}

// Hook para usar seletores
export const usePermissionsSelector = <T>(selector: (state: PermissionsState) => T) => {
  return usePermissionsStore(selector)
}

// Hook para verificar permissão com cache local
export const useHasPermission = (userId: string, resource: string, action: string) => {
  return usePermissionsStore(permissionsSelectors.hasPermission(userId, resource, action))
}

// Hook para verificar se é admin
export const useIsAdminCached = (userId: string) => {
  return usePermissionsStore(permissionsSelectors.isAdmin(userId))
}

// Hook para obter roles do usuário
export const useUserRolesCached = (userId: string) => {
  return usePermissionsStore(permissionsSelectors.getUserRoles(userId))
} 