// Mock global do Supabase
vi.mock('../supabase', () => ({
  supabase: {
    rpc: vi.fn(() => Promise.resolve({
      data: {
        permissions: ['users:read', 'users:write'],
        roles: ['user', 'admin']
      },
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    })),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              permissions: ['users:read', 'users:write'],
              roles: ['user', 'admin']
            },
            error: null,
            count: null,
            status: 200,
            statusText: 'OK'
          })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: [{
                permissions: ['users:read', 'users:write'],
                roles: ['user', 'admin']
              }],
              error: null,
              count: null,
              status: 200,
              statusText: 'OK'
            }))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: true,
              error: null,
              count: null,
              status: 201,
              statusText: 'Created'
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: true,
                error: null,
                count: null,
                status: 200,
                statusText: 'OK'
              }))
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: true,
            error: null,
            count: null,
            status: 200,
            statusText: 'OK'
          }))
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: [],
            error: null,
            count: null,
            status: 200,
            statusText: 'OK'
          }))
        }))
      }))
    }))
  }
}))

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { permissionsService, RESOURCE_LABELS, ACTION_LABELS } from '../permissions'

// Mock do Supabase
vi.mock('../supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: mockRole,
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  }
}))

const mockRole = {
  id: '1',
  name: 'test_role',
  display_name: 'Test Role',
  description: 'Role for testing',
  permissions: {
    users: ['read', 'create'],
    documents: ['read']
  },
  hierarchy_level: 4,
  is_system_role: false,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockUserPermissions = {
  permissions: {
    users: ['read', 'create'],
    documents: ['read', 'update']
  },
  roles: ['user', 'moderator'],
  checked_at: '2024-01-01T00:00:00Z'
}

describe('PermissionsService', () => {
  beforeEach(() => {
    permissionsService.clearAllCache()
    vi.clearAllMocks()
  })

  describe('Cache Management', () => {
    test('should clear user cache', () => {
      // Adicionar algo ao cache primeiro
      permissionsService['permissionsCache'].set('user123', mockUserPermissions)
      permissionsService['cacheExpiry'].set('user123', Date.now() + 5000)
      
      // Verificar se está no cache
      expect(permissionsService['permissionsCache'].has('user123')).toBe(true)
      
      // Limpar cache do usuário
      permissionsService.clearUserCache('user123')
      
      // Verificar se foi removido
      expect(permissionsService['permissionsCache'].has('user123')).toBe(false)
      expect(permissionsService['cacheExpiry'].has('user123')).toBe(false)
    })

    test('should clear all cache', () => {
      // Adicionar itens ao cache
      permissionsService['permissionsCache'].set('user1', mockUserPermissions)
      permissionsService['permissionsCache'].set('user2', mockUserPermissions)
      permissionsService['cacheExpiry'].set('user1', Date.now() + 5000)
      permissionsService['cacheExpiry'].set('user2', Date.now() + 5000)
      
      // Limpar todo o cache
      permissionsService.clearAllCache()
      
      // Verificar se está vazio
      expect(permissionsService['permissionsCache'].size).toBe(0)
      expect(permissionsService['cacheExpiry'].size).toBe(0)
    })

    test('should validate cache expiry', () => {
      const userId = 'user123'
      
      // Cache válido (futuro)
      permissionsService['cacheExpiry'].set(userId, Date.now() + 10000)
      expect(permissionsService['isCacheValid'](userId)).toBe(true)
      
      // Cache expirado (passado)
      permissionsService['cacheExpiry'].set(userId, Date.now() - 1000)
      expect(permissionsService['isCacheValid'](userId)).toBe(false)
      
      // Sem cache
      permissionsService['cacheExpiry'].delete(userId)
      expect(permissionsService['isCacheValid'](userId)).toBe(false)
    })
  })

  describe('Utility Functions', () => {
    test('should return correct resource labels', () => {
      expect(permissionsService.getResourceLabel('users')).toBe('Usuários')
      expect(permissionsService.getResourceLabel('documents')).toBe('Documentos')
      expect(permissionsService.getResourceLabel('unknown')).toBe('unknown')
    })

    test('should return correct action labels', () => {
      expect(permissionsService.getActionLabel('create')).toBe('Criar')
      expect(permissionsService.getActionLabel('read')).toBe('Visualizar')
      expect(permissionsService.getActionLabel('unknown')).toBe('unknown')
    })

    test('should format permissions correctly', () => {
      expect(permissionsService.formatPermission('users', 'create')).toBe('Criar Usuários')
      expect(permissionsService.formatPermission('documents', 'read')).toBe('Visualizar Documentos')
    })

    test('should return correct role colors', () => {
      expect(permissionsService.getRoleColor(1)).toContain('red') // Super Admin
      expect(permissionsService.getRoleColor(2)).toContain('orange') // Admin
      expect(permissionsService.getRoleColor(3)).toContain('blue') // Moderator
      expect(permissionsService.getRoleColor(4)).toContain('green') // User
      expect(permissionsService.getRoleColor(999)).toContain('gray') // Default
    })
  })

  describe('Constants', () => {
    test('should have all expected resource labels', () => {
      const expectedResources = [
        'users', 'roles', 'agents', 'documents', 'chat', 
        'whatsapp', 'email_marketing', 'integrations', 'analytics', 'system'
      ]
      
      expectedResources.forEach(resource => {
        expect(RESOURCE_LABELS[resource]).toBeDefined()
        expect(typeof RESOURCE_LABELS[resource]).toBe('string')
      })
    })

    test('should have all expected action labels', () => {
      const expectedActions = [
        'create', 'read', 'update', 'delete', 'manage_roles', 
        'manage_public', 'manage_all', 'moderate', 'manage_instances',
        'send_campaigns', 'configure', 'export', 'maintain', 'backup', 'logs'
      ]
      
      expectedActions.forEach(action => {
        expect(ACTION_LABELS[action]).toBeDefined()
        expect(typeof ACTION_LABELS[action]).toBe('string')
      })
    })
  })

  describe('Permission Logic', () => {
    test('should handle multiple permission checks', async () => {
      const checks = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'create' },
        { resource: 'documents', action: 'delete' }
      ]

      // Mock das verificações individuais
      const originalCheckPermission = permissionsService.checkPermission
      vi.spyOn(permissionsService, 'checkPermission')
        .mockResolvedValueOnce(true)  // users.read
        .mockResolvedValueOnce(true)  // users.create
        .mockResolvedValueOnce(false) // documents.delete

      const results = await permissionsService.checkMultiplePermissions('user123', checks)

      expect(results).toEqual({
        'users.read': true,
        'users.create': true,
        'documents.delete': false
      })

      expect(permissionsService.checkPermission).toHaveBeenCalledTimes(3)
    })

    test('should check hasAnyPermission correctly', async () => {
      const checks = [
        { resource: 'users', action: 'delete' },
        { resource: 'users', action: 'create' }
      ]

      vi.spyOn(permissionsService, 'checkMultiplePermissions')
        .mockResolvedValue({
          'users.delete': false,
          'users.create': true
        })

      const hasAny = await permissionsService.hasAnyPermission('user123', checks)
      expect(hasAny).toBe(true)
    })

    test('should check hasAllPermissions correctly', async () => {
      const checks = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'create' }
      ]

      // Caso onde tem todas as permissões
      vi.spyOn(permissionsService, 'checkMultiplePermissions')
        .mockResolvedValueOnce({
          'users.read': true,
          'users.create': true
        })

      let hasAll = await permissionsService.hasAllPermissions('user123', checks)
      expect(hasAll).toBe(true)

      // Caso onde não tem todas as permissões
      vi.spyOn(permissionsService, 'checkMultiplePermissions')
        .mockResolvedValueOnce({
          'users.read': true,
          'users.create': false
        })

      hasAll = await permissionsService.hasAllPermissions('user123', checks)
      expect(hasAll).toBe(false)
    })
  })

  describe('Error Handling', () => {
    test('should handle errors gracefully in checkPermission', async () => {
      const { supabase } = await import('../supabase')
      vi.mocked(supabase.rpc).mockRejectedValue(new Error('Database error'))

      const result = await permissionsService.checkPermission('user123', 'users', 'read')
      expect(result).toBe(false)
    })

    test('should handle null data in getUserPermissions', async () => {
      const { supabase } = await import('../supabase')
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null, count: null, status: 200, statusText: 'OK' } as any)

      const result = await permissionsService.getUserPermissions('user123')
      expect(result).toBe(null)
    })
  })
})

describe('Permission Constants Validation', () => {
  test('should have unique resource labels', () => {
    const values = Object.values(RESOURCE_LABELS)
    const uniqueValues = [...new Set(values)]
    expect(values.length).toBe(uniqueValues.length)
  })

  test('should have unique action labels', () => {
    const values = Object.values(ACTION_LABELS)
    const uniqueValues = [...new Set(values)]
    expect(values.length).toBe(uniqueValues.length)
  })

  test('should have non-empty labels', () => {
    Object.values(RESOURCE_LABELS).forEach(label => {
      expect(label.trim()).not.toBe('')
    })

    Object.values(ACTION_LABELS).forEach(label => {
      expect(label.trim()).not.toBe('')
    })
  })
}) 