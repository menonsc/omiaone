import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { vi } from 'vitest'
import {
  useCurrentUserPermissions,
  usePermissionCheck,
  useUserRoles,
  useAllRoles,
  useIsAdmin,
  useAssignRole,
  useRevokeRole
} from '../usePermissionsQueries'
import { permissionsService } from '../../services/permissions'

// Mock do serviço de permissões
vi.mock('../../services/permissions', () => ({
  permissionsService: {
    getUserPermissions: vi.fn(),
    checkPermission: vi.fn(),
    getUserRoles: vi.fn(),
    getAllRoles: vi.fn(),
    assignRole: vi.fn(),
    revokeRole: vi.fn(),
    clearUserCache: vi.fn(),
    clearAllCache: vi.fn()
  }
}))

// Mock do auth store
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user123', email: 'test@example.com' }
  })
}))

const mockPermissions = {
  permissions: {
    users: ['read', 'create'],
    documents: ['read', 'update']
  },
  roles: ['user', 'moderator'],
  checked_at: '2024-01-01T00:00:00Z'
}

const mockRoles = [
  {
    id: '1',
    name: 'admin',
    display_name: 'Administrador',
    description: 'Administrador do sistema',
    permissions: { users: ['read', 'create', 'update', 'delete'] } as Record<string, string[]>,
    hierarchy_level: 2,
    is_system_role: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'user',
    display_name: 'Usuário',
    description: 'Usuário padrão',
    permissions: { documents: ['read'] } as Record<string, string[]>,
    hierarchy_level: 4,
    is_system_role: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockUserRoles = [
  {
    id: '1',
    user_id: 'user123',
    role_id: '2',
    assigned_by: 'admin',
    assigned_at: '2024-01-01T00:00:00Z',
    expires_at: undefined,
    is_active: true,
    role: mockRoles[1]
  }
]

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0
      }
    }
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('usePermissionsQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useCurrentUserPermissions', () => {
    test('should fetch current user permissions', async () => {
      const mockGetUserPermissions = vi.mocked(permissionsService.getUserPermissions)
      mockGetUserPermissions.mockResolvedValue(mockPermissions as any)

      const { result } = renderHook(() => useCurrentUserPermissions(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockPermissions)
      expect(mockGetUserPermissions).toHaveBeenCalledWith('user123')
    })

    test('should not fetch when user is not available', async () => {
      // Mock auth store sem usuário
      vi.doMock('../../store/authStore', () => ({
        useAuthStore: () => ({ user: null })
      }))

      const mockGetUserPermissions = vi.mocked(permissionsService.getUserPermissions)
      mockGetUserPermissions.mockClear() // Limpar chamadas anteriores

      const { result } = renderHook(() => useCurrentUserPermissions(), {
        wrapper: createWrapper()
      })

      // Aguardar um pouco mais para garantir que o hook não vai fazer a chamada
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(result.current.fetchStatus).toBe('idle')
      expect(mockGetUserPermissions).not.toHaveBeenCalled()
    })
  })

  describe('usePermissionCheck', () => {
    test('should check specific permission', async () => {
      const mockCheckPermission = vi.mocked(permissionsService.checkPermission)
      mockCheckPermission.mockResolvedValue(true as any)

      const { result } = renderHook(
        () => usePermissionCheck('users', 'read'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBe(true)
      expect(mockCheckPermission).toHaveBeenCalledWith('user123', 'users', 'read')
    })

    test('should use provided userId', async () => {
      const mockCheckPermission = vi.mocked(permissionsService.checkPermission)
      mockCheckPermission.mockResolvedValue(false as any)

      const { result } = renderHook(
        () => usePermissionCheck('users', 'delete', 'other-user'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBe(false)
      expect(mockCheckPermission).toHaveBeenCalledWith('other-user', 'users', 'delete')
    })
  })

  describe('useUserRoles', () => {
    test('should fetch user roles', async () => {
      const mockGetUserRoles = vi.mocked(permissionsService.getUserRoles)
      mockGetUserRoles.mockResolvedValue(mockUserRoles as any)

      const { result } = renderHook(() => useUserRoles(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockUserRoles)
      expect(mockGetUserRoles).toHaveBeenCalledWith('user123')
    })
  })

  describe('useAllRoles', () => {
    test('should fetch all available roles', async () => {
      const mockGetAllRoles = vi.mocked(permissionsService.getAllRoles)
      mockGetAllRoles.mockResolvedValue(mockRoles as any)

      const { result } = renderHook(() => useAllRoles(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockRoles)
      expect(mockGetAllRoles).toHaveBeenCalled()
    })
  })

  describe('useIsAdmin', () => {
    test('should identify admin user', async () => {
      const mockPermissionsWithAdmin = {
        ...mockPermissions,
        roles: ['admin', 'user']
      }

      const mockGetUserPermissions = vi.mocked(permissionsService.getUserPermissions)
      mockGetUserPermissions.mockResolvedValue(mockPermissionsWithAdmin as any)

      const { result } = renderHook(() => useIsAdmin(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true)
        expect(result.current.isSuperAdmin).toBe(false)
      })
    })

    test('should identify super admin user', async () => {
      const mockPermissionsWithSuperAdmin = {
        ...mockPermissions,
        roles: ['super_admin']
      }

      const mockGetUserPermissions = vi.mocked(permissionsService.getUserPermissions)
      mockGetUserPermissions.mockResolvedValue(mockPermissionsWithSuperAdmin as any)

      const { result } = renderHook(() => useIsAdmin(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true)
        expect(result.current.isSuperAdmin).toBe(true)
      })
    })

    test('should identify regular user', async () => {
      const mockGetUserPermissions = vi.mocked(permissionsService.getUserPermissions)
      mockGetUserPermissions.mockResolvedValue(mockPermissions as any)

      const { result } = renderHook(() => useIsAdmin(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(false)
        expect(result.current.isSuperAdmin).toBe(false)
      })
    })
  })

  describe('Mutation Hooks', () => {
    describe('useAssignRole', () => {
      test('should assign role to user', async () => {
        const mockAssignRole = vi.mocked(permissionsService.assignRole)
        mockAssignRole.mockResolvedValue(true as any)

        const { result } = renderHook(() => useAssignRole(), {
          wrapper: createWrapper()
        })

        const assignRoleData = {
          userId: 'user456',
          roleId: 'role123',
          expiresAt: '2024-12-31T23:59:59Z'
        }

        await waitFor(() => {
          result.current.mutate(assignRoleData)
        })

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(mockAssignRole).toHaveBeenCalledWith(
          'user456',
          'role123',
          'user123', // current user ID
          '2024-12-31T23:59:59Z'
        )
      })
    })

    describe('useRevokeRole', () => {
      test('should revoke role from user', async () => {
        const mockRevokeRole = vi.mocked(permissionsService.revokeRole)
        mockRevokeRole.mockResolvedValue(true as any)

        const { result } = renderHook(() => useRevokeRole(), {
          wrapper: createWrapper()
        })

        const revokeRoleData = {
          userId: 'user456',
          roleId: 'role123'
        }

        await waitFor(() => {
          result.current.mutate(revokeRoleData)
        })

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(mockRevokeRole).toHaveBeenCalledWith('user456', 'role123')
      })
    })
  })

  describe('Cache Invalidation', () => {
    test('useAssignRole should invalidate related queries', async () => {
      const mockAssignRole = vi.mocked(permissionsService.assignRole)
      const mockClearUserCache = vi.mocked(permissionsService.clearUserCache)
      
      mockAssignRole.mockResolvedValue(true as any)

      const queryClient = new QueryClient()
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')
      const removeQueriesSpy = vi.spyOn(queryClient, 'removeQueries')

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )

      const { result } = renderHook(() => useAssignRole(), { wrapper })

      await waitFor(() => {
        result.current.mutate({
          userId: 'user456',
          roleId: 'role123'
        })
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Verificar se as queries foram invalidadas
      expect(invalidateQueriesSpy).toHaveBeenCalled()
      expect(removeQueriesSpy).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    test('should handle permission check errors', async () => {
      const mockCheckPermission = vi.mocked(permissionsService.checkPermission)
      mockCheckPermission.mockRejectedValue(new Error('Permission check failed'))

      const { result } = renderHook(
        () => usePermissionCheck('users', 'read'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
    })

    test('should handle mutation errors', async () => {
      const mockAssignRole = vi.mocked(permissionsService.assignRole)
      mockAssignRole.mockRejectedValue(new Error('Failed to assign role'))

      const { result } = renderHook(() => useAssignRole(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        result.current.mutate({
          userId: 'user456',
          roleId: 'role123'
        })
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })
}) 