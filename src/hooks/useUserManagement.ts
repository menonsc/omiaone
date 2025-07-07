import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { userManagementService } from '../services/userManagementService'
import {
  UserFilters,
  UserListResponse,
  UserUpdateData,
  UserAction,
  ResetPasswordRequest,
  ImpersonateRequest,
  UserHistory,
  UserStats,
  UserExportRequest,
  UserSession,
  UserActivity,
  UserPermissions,
  UserRole
} from '../types/userManagement'

export const useUserManagement = () => {
  const queryClient = useQueryClient()

  // Buscar usuários (para uso em queries infinitas)
  const getUsers = async (params: {
    page?: number
    limit?: number
    search?: string
    filters?: UserFilters
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<UserListResponse> => {
    return userManagementService.getUsers(params)
  }

  // Buscar usuário específico
  const getUser = async (userId: string) => {
    return userManagementService.getUsers({ 
      filters: {}, 
      search: userId,
      limit: 1 
    }).then(result => result.users[0])
  }

  // Atualizar usuário
  const updateUser = async (userId: string, updates: UserUpdateData) => {
    return userManagementService.updateUser(userId, updates)
  }

  // Excluir usuário
  const deleteUser = async (userId: string) => {
    return userManagementService.deleteUser(userId)
  }

  // Ações em massa
  const bulkUpdateUsers = async (action: UserAction, userIds: string[], reason?: string) => {
    return userManagementService.bulkUpdateUsers(action, userIds, reason)
  }

  // Reset de senha
  const resetPassword = async (userId: string, sendEmail: boolean = true) => {
    return userManagementService.resetPassword(userId, sendEmail)
  }

  // Impersonação
  const impersonateUser = async (userId: string, reason?: string, duration?: number) => {
    return userManagementService.impersonateUser(userId, reason, duration)
  }

  // Buscar histórico
  const getUserHistory = async (userId: string, limit: number = 50) => {
    return userManagementService.getUserHistory(userId, limit)
  }

  // Buscar sessões
  const getUserSessions = async (userId: string) => {
    return userManagementService.getUserSessions(userId)
  }

  // Buscar atividades
  const getUserActivities = async (userId: string, limit: number = 50) => {
    return userManagementService.getUserActivities(userId, limit)
  }

  // Buscar permissões
  const getUserPermissions = async (userId: string) => {
    return userManagementService.getUserPermissions(userId)
  }

  // Buscar roles
  const getUserRoles = async (userId: string) => {
    return userManagementService.getUserRoles(userId)
  }

  // Buscar estatísticas
  const getUserStats = async () => {
    return userManagementService.getUserStats()
  }

  // Exportar usuários
  const exportUsers = async (request: UserExportRequest) => {
    return userManagementService.exportUsers(request)
  }

  // Revogar sessão
  const revokeSession = async (sessionId: string) => {
    return userManagementService.revokeSession(sessionId)
  }

  // Revogar todas as sessões
  const revokeAllUserSessions = async (userId: string, currentSessionId?: string) => {
    return userManagementService.revokeAllUserSessions(userId, currentSessionId)
  }

  return {
    // Funções para uso em queries
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    bulkUpdateUsers,
    resetPassword,
    impersonateUser,
    getUserHistory,
    getUserSessions,
    getUserActivities,
    getUserPermissions,
    getUserRoles,
    getUserStats,
    exportUsers,
    revokeSession,
    revokeAllUserSessions
  }
}

// Hook para listagem infinita de usuários
export const useInfiniteUsers = (params: {
  search?: string
  filters?: UserFilters
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
}) => {
  return useInfiniteQuery({
    queryKey: ['users', params.search, params.filters, params.sortBy, params.sortOrder],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => userManagementService.getUsers({
      page: pageParam as number,
      limit: params.limit || 20,
      search: params.search,
      filters: params.filters,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder
    }),
    getNextPageParam: (lastPage: UserListResponse) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para usuário específico
export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userManagementService.getUsers({ 
      filters: {}, 
      search: userId,
      limit: 1 
    }).then(result => result.users[0]),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para histórico do usuário
export const useUserHistory = (userId: string, limit: number = 50) => {
  return useQuery({
    queryKey: ['user-history', userId, limit],
    queryFn: () => userManagementService.getUserHistory(userId, limit),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

// Hook para sessões do usuário
export const useUserSessions = (userId: string) => {
  return useQuery({
    queryKey: ['user-sessions', userId],
    queryFn: () => userManagementService.getUserSessions(userId),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  })
}

// Hook para atividades do usuário
export const useUserActivities = (userId: string, limit: number = 50) => {
  return useQuery({
    queryKey: ['user-activities', userId, limit],
    queryFn: () => userManagementService.getUserActivities(userId, limit),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

// Hook para permissões do usuário
export const useUserPermissions = (userId: string) => {
  return useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: () => userManagementService.getUserPermissions(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para roles do usuário
export const useUserRoles = (userId: string) => {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => userManagementService.getUserRoles(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para estatísticas de usuários
export const useUserStats = () => {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: () => userManagementService.getUserStats(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}

// Hooks de mutação
export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: UserUpdateData }) =>
      userManagementService.updateUser(userId, updates),
    onSuccess: (data, { userId }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
    }
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => userManagementService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
    }
  })
}

export const useBulkUpdateUsers = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ action, userIds, reason }: { action: UserAction; userIds: string[]; reason?: string }) =>
      userManagementService.bulkUpdateUsers(action, userIds, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
    }
  })
}

export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ userId, sendEmail }: { userId: string; sendEmail?: boolean }) =>
      userManagementService.resetPassword(userId, sendEmail ?? true)
  })
}

export const useImpersonateUser = () => {
  return useMutation({
    mutationFn: ({ userId, reason, duration }: { userId: string; reason?: string; duration?: number }) =>
      userManagementService.impersonateUser(userId, reason, duration)
  })
}

export const useExportUsers = () => {
  return useMutation({
    mutationFn: (request: UserExportRequest) => userManagementService.exportUsers(request)
  })
}

export const useRevokeSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => userManagementService.revokeSession(sessionId),
    onSuccess: (_, sessionId) => {
      // Invalidar queries de sessões que contenham esta sessão
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] })
    }
  })
}

export const useRevokeAllUserSessions = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, currentSessionId }: { userId: string; currentSessionId?: string }) =>
      userManagementService.revokeAllUserSessions(userId, currentSessionId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions', userId] })
    }
  })
} 