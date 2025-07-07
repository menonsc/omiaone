import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  permissionsService, 
  Role, 
  UserRole, 
  UserPermissions, 
  PermissionLog 
} from '../services/permissions'
import { useAuthStore } from '../store/authStore'

// Chaves para queries do React Query
export const permissionsKeys = {
  all: ['permissions'] as const,
  userPermissions: (userId: string) => [...permissionsKeys.all, 'user', userId] as const,
  userRoles: (userId: string) => [...permissionsKeys.all, 'userRoles', userId] as const,
  allRoles: () => [...permissionsKeys.all, 'allRoles'] as const,
  permissionLogs: (filters: any) => [...permissionsKeys.all, 'logs', filters] as const,
  permissionCheck: (userId: string, resource: string, action: string) => 
    [...permissionsKeys.all, 'check', userId, resource, action] as const,
  multipleChecks: (userId: string, checks: Array<{resource: string, action: string}>) =>
    [...permissionsKeys.all, 'multipleChecks', userId, checks] as const
}

// Hook para obter permissões do usuário atual
export const useCurrentUserPermissions = () => {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: permissionsKeys.userPermissions(user?.id || ''),
    queryFn: () => user?.id ? permissionsService.getUserPermissions(user.id) : null,
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2
  })
}

// Hook para obter permissões de um usuário específico
export const useUserPermissions = (userId: string) => {
  return useQuery({
    queryKey: permissionsKeys.userPermissions(userId),
    queryFn: () => permissionsService.getUserPermissions(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2
  })
}

// Hook para verificar uma permissão específica
export const usePermissionCheck = (
  resource: string, 
  action: string, 
  userId?: string
) => {
  const { user } = useAuthStore()
  const targetUserId = userId || user?.id || ''
  
  return useQuery({
    queryKey: permissionsKeys.permissionCheck(targetUserId, resource, action),
    queryFn: () => permissionsService.checkPermission(targetUserId, resource, action),
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000,
    retry: 1
  })
}

// Hook para verificar múltiplas permissões
export const useMultiplePermissionChecks = (
  checks: Array<{ resource: string; action: string }>,
  userId?: string
) => {
  const { user } = useAuthStore()
  const targetUserId = userId || user?.id || ''
  
  return useQuery({
    queryKey: permissionsKeys.multipleChecks(targetUserId, checks),
    queryFn: () => permissionsService.checkMultiplePermissions(targetUserId, checks),
    enabled: !!targetUserId && checks.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1
  })
}

// Hook para obter roles de um usuário
export const useUserRoles = (userId?: string) => {
  const { user } = useAuthStore()
  const targetUserId = userId || user?.id || ''
  
  return useQuery({
    queryKey: permissionsKeys.userRoles(targetUserId),
    queryFn: () => permissionsService.getUserRoles(targetUserId),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}

// Hook para obter todos os roles disponíveis
export const useAllRoles = () => {
  return useQuery({
    queryKey: permissionsKeys.allRoles(),
    queryFn: () => permissionsService.getAllRoles(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000
  })
}

// Hook para obter logs de permissões
export const usePermissionLogs = (filters: {
  userId?: string
  resource?: string
  action?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
} = {}) => {
  return useQuery({
    queryKey: permissionsKeys.permissionLogs(filters),
    queryFn: () => permissionsService.getPermissionLogs(filters),
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000
  })
}

// Mutations para gerenciar roles

// Atribuir role a usuário
export const useAssignRole = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: ({ 
      userId, 
      roleId, 
      expiresAt 
    }: { 
      userId: string
      roleId: string
      expiresAt?: string 
    }) => permissionsService.assignRole(userId, roleId, user?.id || '', expiresAt),
    
    onSuccess: (_, { userId }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: permissionsKeys.userPermissions(userId) })
      queryClient.invalidateQueries({ queryKey: permissionsKeys.userRoles(userId) })
      
      // Limpar cache de verificações de permissão
      queryClient.removeQueries({ 
        queryKey: [...permissionsKeys.all, 'check', userId],
        exact: false 
      })
      queryClient.removeQueries({ 
        queryKey: [...permissionsKeys.all, 'multipleChecks', userId],
        exact: false 
      })
    }
  })
}

// Revogar role de usuário
export const useRevokeRole = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string, roleId: string }) => 
      permissionsService.revokeRole(userId, roleId),
    
    onSuccess: (_, { userId }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: permissionsKeys.userPermissions(userId) })
      queryClient.invalidateQueries({ queryKey: permissionsKeys.userRoles(userId) })
      
      // Limpar cache de verificações de permissão
      queryClient.removeQueries({ 
        queryKey: [...permissionsKeys.all, 'check', userId],
        exact: false 
      })
      queryClient.removeQueries({ 
        queryKey: [...permissionsKeys.all, 'multipleChecks', userId],
        exact: false 
      })
    }
  })
}

// Criar novo role
export const useCreateRole = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>) => 
      permissionsService.createRole(roleData),
    
    onSuccess: () => {
      // Invalidar lista de roles
      queryClient.invalidateQueries({ queryKey: permissionsKeys.allRoles() })
    }
  })
}

// Atualizar role
export const useUpdateRole = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ roleId, updates }: { roleId: string, updates: Partial<Role> }) => 
      permissionsService.updateRole(roleId, updates),
    
    onSuccess: () => {
      // Invalidar todas as queries de permissões (mudança global)
      queryClient.invalidateQueries({ queryKey: permissionsKeys.all })
    }
  })
}

// Deletar role
export const useDeleteRole = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (roleId: string) => permissionsService.deleteRole(roleId),
    
    onSuccess: () => {
      // Invalidar todas as queries de permissões
      queryClient.invalidateQueries({ queryKey: permissionsKeys.all })
    }
  })
}

// Hooks compostos para casos de uso comuns

// Hook para verificar se usuário é admin
export const useIsAdmin = (userId?: string) => {
  const { user } = useAuthStore()
  const targetUserId = userId || user?.id || ''
  
  const { data: permissions } = useUserPermissions(targetUserId)
  
  return {
    isAdmin: permissions?.roles.includes('admin') || permissions?.roles.includes('super_admin'),
    isSuperAdmin: permissions?.roles.includes('super_admin'),
    roles: permissions?.roles || []
  }
}

// Hook para verificar múltiplas permissões com labels
export const usePermissionsWithLabels = (
  checks: Array<{ resource: string; action: string; label?: string }>
) => {
  const { data: results } = useMultiplePermissionChecks(checks)
  
  return checks.map(({ resource, action, label }) => ({
    resource,
    action,
    label: label || permissionsService.formatPermission(resource, action),
    granted: results?.[`${resource}.${action}`] || false
  }))
}

// Hook para obter estatísticas de permissões do usuário
export const useUserPermissionStats = (userId?: string) => {
  const { user } = useAuthStore()
  const targetUserId = userId || user?.id || ''
  
  const { data: permissions } = useUserPermissions(targetUserId)
  const { data: roles } = useUserRoles(targetUserId)
  
  if (!permissions || !roles) {
    return {
      totalPermissions: 0,
      totalRoles: 0,
      highestRole: null,
      resourcesAccess: []
    }
  }
  
  const totalPermissions = Object.values(permissions.permissions)
    .reduce((acc, actions) => acc + actions.length, 0)
  
  const highestRole = roles.reduce((highest, current) => {
    if (!highest || (current.role && current.role.hierarchy_level < highest.hierarchy_level)) {
      return current.role || null
    }
    return highest
  }, null as Role | null)
  
  const resourcesAccess = Object.entries(permissions.permissions).map(([resource, actions]) => ({
    resource,
    resourceLabel: permissionsService.getResourceLabel(resource),
    actions: actions.length,
    permissions: actions.map(action => ({
      action,
      label: permissionsService.getActionLabel(action)
    }))
  }))
  
  return {
    totalPermissions,
    totalRoles: roles.length,
    highestRole,
    resourcesAccess
  }
}

// Hook para forçar refresh de permissões
export const useRefreshPermissions = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return {
    refreshUserPermissions: (userId?: string) => {
      const targetUserId = userId || user?.id || ''
      queryClient.invalidateQueries({ queryKey: permissionsKeys.userPermissions(targetUserId) })
      
      // Limpar cache do serviço também
      permissionsService.clearUserCache(targetUserId)
    },
    
    refreshAllPermissions: () => {
      queryClient.invalidateQueries({ queryKey: permissionsKeys.all })
      permissionsService.clearAllCache()
    }
  }
} 