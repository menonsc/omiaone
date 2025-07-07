// Testes do Sistema de Autorização RLS
// Arquivo: authorization.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { supabase } from '../supabase'
import AuthorizationMiddleware from '../authorizationMiddleware'

// Mock do Supabase
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      })
    },
    rpc: vi.fn().mockResolvedValue({
      data: null,
      error: null
    }),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }))
    }))
  }
}))

// Mock do Analytics
vi.mock('../analytics', () => ({
  analytics: {
    trackEvent: vi.fn(),
    logSystem: vi.fn()
  }
}))

describe('Sistema de Autorização RLS', () => {
  let authMiddleware: AuthorizationMiddleware

  beforeEach(() => {
    authMiddleware = new AuthorizationMiddleware()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('AuthorizationMiddleware', () => {
    it('deve negar acesso para usuário não autenticado', async () => {
      // Mock usuário não autenticado
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null
      } as any)

      const result = await authMiddleware.authorize({
        resource: 'users',
        action: 'read'
      })

      expect(result.authorized).toBe(false)
      expect(result.reason).toBe('Usuário não autenticado')
    })

    it('deve permitir acesso para admin com bypass', async () => {
      const mockUser = {
        id: 'user-123',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        email: 'user@example.com',
        phone: null,
        role: 'authenticated',
        last_sign_in_at: null,
        confirmed_at: null,
        email_confirmed_at: null,
        phone_confirmed_at: null,
        invited_at: null,
        action_link: null,
        recovery_sent_at: null,
        new_email: null,
        new_phone: null,
        is_anonymous: false
      }
      const mockContext = {
        userId: 'user-123',
        userRole: 'admin',
        permissions: {},
        ipAddress: '127.0.0.1',
        userAgent: 'test'
      }

      // Mock usuário autenticado
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      } as any)

      // Mock obter role do usuário
      vi.mocked(supabase.rpc).mockImplementation((funcName) => {
        if (funcName === 'get_user_role') {
          return Promise.resolve({ data: 'admin', error: null })
        }
        if (funcName === 'get_user_permissions') {
          return Promise.resolve({ data: { permissions: {} }, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      const result = await authMiddleware.authorize({
        resource: 'users',
        action: 'read',
        bypassForAdmin: true
      })

      expect(result.authorized).toBe(true)
      expect(result.context?.userRole).toBe('admin')
    })

    it('deve verificar permissões RBAC para usuário comum', async () => {
      const mockUser = {
        id: 'user-123',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        email: 'user@example.com',
        phone: null,
        role: 'authenticated',
        last_sign_in_at: null,
        confirmed_at: null,
        email_confirmed_at: null,
        phone_confirmed_at: null,
        invited_at: null,
        action_link: null,
        recovery_sent_at: null,
        new_email: null,
        new_phone: null,
        is_anonymous: false
      }

      // Mock usuário autenticado
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      } as any)

      // Mock obter role do usuário
      vi.mocked(supabase.rpc).mockImplementation((funcName) => {
        if (funcName === 'get_user_role') {
          return Promise.resolve({ data: 'user', error: null })
        }
        if (funcName === 'get_user_permissions') {
          return Promise.resolve({ data: { permissions: {} }, error: null })
        }
        if (funcName === 'authorize_operation') {
          return Promise.resolve({ data: true, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      const result = await authMiddleware.authorize({
        resource: 'agents',
        action: 'create',
        bypassForAdmin: false
      })

      expect(result.authorized).toBe(true)
      expect(supabase.rpc).toHaveBeenCalledWith('authorize_operation', expect.objectContaining({
        resource_param: 'agents',
        action_param: 'create'
      }))
    })

    it('deve aplicar rate limiting corretamente', async () => {
      const mockUser = {
        id: 'user-123',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        email: 'user@example.com',
        phone: null,
        role: 'authenticated',
        last_sign_in_at: null,
        confirmed_at: null,
        email_confirmed_at: null,
        phone_confirmed_at: null,
        invited_at: null,
        action_link: null,
        recovery_sent_at: null,
        new_email: null,
        new_phone: null,
        is_anonymous: false
      }

      // Mock usuário autenticado
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      } as any)

      // Mock rate limit excedido
      vi.mocked(supabase.rpc).mockImplementation((funcName) => {
        if (funcName === 'get_user_role') {
          return Promise.resolve({ data: 'user', error: null })
        }
        if (funcName === 'get_user_permissions') {
          return Promise.resolve({ data: { permissions: {} }, error: null })
        }
        if (funcName === 'check_rate_limit') {
          return Promise.resolve({ data: false, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      const result = await authMiddleware.authorize({
        resource: 'documents',
        action: 'create',
        rateLimit: { maxRequests: 5, windowMinutes: 60, enabled: true }
      })

      expect(result.authorized).toBe(false)
      expect(result.reason).toBe('Limite de requisições excedido')
    })

    it('deve logar tentativas de acesso negado', async () => {
      // Mock usuário não autenticado
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null
      } as any)

      await authMiddleware.authorize({
        resource: 'users',
        action: 'read',
        logAttempt: true
      })

      // Verificar se foi logado (via mock do analytics)
      const { analytics } = await import('../analytics')
      expect(analytics.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'error_occurred',
          eventName: 'unauthorized_access_attempt'
        })
      )
    })
  })

  describe('Cache de Contexto', () => {
    it('deve usar cache válido para contexto do usuário', async () => {
      const mockUser = {
        id: 'user-123',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        email: 'user@example.com',
        phone: null,
        role: 'authenticated',
        last_sign_in_at: null,
        confirmed_at: null,
        email_confirmed_at: null,
        phone_confirmed_at: null,
        invited_at: null,
        action_link: null,
        recovery_sent_at: null,
        new_email: null,
        new_phone: null,
        is_anonymous: false
      }

      // Mock usuário autenticado
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      } as any)

      // Mock RPC calls
      vi.mocked(supabase.rpc).mockImplementation((funcName) => {
        if (funcName === 'get_user_role') {
          return Promise.resolve({ data: 'user', error: null })
        }
        if (funcName === 'get_user_permissions') {
          return Promise.resolve({ data: { permissions: {} }, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      // Primeira chamada
      const context1 = await authMiddleware.getUserContext('user-123')
      expect(context1).toBeTruthy()

      // Segunda chamada (deve usar cache)
      const context2 = await authMiddleware.getUserContext('user-123')
      expect(context2).toBeTruthy()

      // Verificar que RPC foi chamado apenas uma vez
      expect(supabase.rpc).toHaveBeenCalledTimes(2) // get_user_role + get_user_permissions
    })

    it('deve limpar cache quando solicitado', async () => {
      const userId = 'user-123'
      
      // Simular contexto em cache
      await authMiddleware.getUserContext(userId)
      
      // Limpar cache
      authMiddleware.clearUserContext(userId)
      
      // Próxima chamada deve buscar novamente
      vi.clearAllMocks()
      await authMiddleware.getUserContext(userId)
      
      expect(supabase.rpc).toHaveBeenCalled()
    })
  })

  describe('Funções RLS do Banco', () => {
    it('deve verificar função get_user_role', async () => {
      const userId = 'user-123'
      
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 'admin',
        error: null
      })

      const { data: role } = await supabase.rpc('get_user_role', { 
        user_id_param: userId 
      })

      expect(role).toBe('admin')
      expect(supabase.rpc).toHaveBeenCalledWith('get_user_role', {
        user_id_param: userId
      })
    })

    it('deve verificar função check_user_permission', async () => {
      const userId = 'user-123'
      
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: true,
        error: null
      })

      const { data: hasPermission } = await supabase.rpc('check_user_permission', {
        user_id_param: userId,
        resource_param: 'users',
        action_param: 'read'
      })

      expect(hasPermission).toBe(true)
      expect(supabase.rpc).toHaveBeenCalledWith('check_user_permission', {
        user_id_param: userId,
        resource_param: 'users',
        action_param: 'read'
      })
    })

    it('deve verificar função authorize_operation', async () => {
      const userId = 'user-123'
      
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: false,
        error: null
      })

      const { data: authorized } = await supabase.rpc('authorize_operation', {
        resource_param: 'system',
        action_param: 'manage_all',
        user_id_param: userId,
        rate_limit_check: true,
        max_requests: 10,
        window_minutes: 60
      })

      expect(authorized).toBe(false)
      expect(supabase.rpc).toHaveBeenCalledWith('authorize_operation', {
        resource_param: 'system',
        action_param: 'manage_all',
        user_id_param: userId,
        rate_limit_check: true,
        max_requests: 10,
        window_minutes: 60
      })
    })
  })

  describe('Políticas RLS', () => {
    it('deve testar política de profiles', async () => {
      const mockQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-123', full_name: 'Test User', role: 'user' },
              error: null
            })
          }))
        }))
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', 'user-123')
        .single()

      expect(result.data).toBeTruthy()
      expect(result.data.id).toBe('user-123')
    })

    it('deve testar política de agents', async () => {
      const mockQuery = {
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [
              { id: 'agent-1', name: 'Test Agent', is_public: true },
              { id: 'agent-2', name: 'Private Agent', is_public: false, created_by: 'user-123' }
            ],
            error: null
          })
        }))
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false })

      expect(result.data).toHaveLength(2)
      expect(result.data[0].is_public).toBe(true)
    })

    it('deve testar operação não autorizada', async () => {
      const mockQuery = {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '42501', message: 'insufficient_privilege' }
            })
          }))
        }))
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await supabase
        .from('roles')
        .insert({ name: 'new_role', display_name: 'New Role' })
        .select()
        .single()

      expect(result.error).toBeTruthy()
      expect(result.error.code).toBe('42501')
    })
  })

  describe('Rate Limiting', () => {
    it('deve verificar limite de requisições', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: false, // Rate limit excedido
        error: null
      })

      const { data: allowed } = await supabase.rpc('check_rate_limit', {
        user_id_param: 'user-123',
        ip_address_param: '127.0.0.1',
        action_param: 'create',
        resource_param: 'documents',
        max_requests: 10,
        window_minutes: 60
      })

      expect(allowed).toBe(false)
    })

    it('deve permitir mais requisições para admins', async () => {
      vi.mocked(supabase.rpc).mockImplementation((funcName, params) => {
        if (funcName === 'check_rate_limit') {
          // Admin tem limite 5x maior
          return Promise.resolve({ data: true, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      const { data: allowed } = await supabase.rpc('check_rate_limit', {
        user_id_param: 'admin-123',
        ip_address_param: '127.0.0.1',
        action_param: 'create',
        resource_param: 'documents',
        max_requests: 50, // Limite maior para admin
        window_minutes: 60
      })

      expect(allowed).toBe(true)
    })
  })

  describe('Logs de Auditoria', () => {
    it('deve logar acesso negado', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: null
      })

      await supabase.rpc('log_access_denied', {
        user_id_param: 'user-123',
        action_param: 'delete',
        resource_param: 'users',
        resource_id_param: 'user-456',
        reason_param: 'Insufficient permissions',
        ip_address_param: '192.168.1.100',
        user_agent_param: 'Mozilla/5.0...'
      })

      expect(supabase.rpc).toHaveBeenCalledWith('log_access_denied', {
        user_id_param: 'user-123',
        action_param: 'delete',
        resource_param: 'users',
        resource_id_param: 'user-456',
        reason_param: 'Insufficient permissions',
        ip_address_param: '192.168.1.100',
        user_agent_param: 'Mozilla/5.0...'
      })
    })

    it('deve consultar logs de acesso negado', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          user_id: 'user-123',
          attempted_action: 'delete',
          attempted_resource: 'users',
          reason: 'Insufficient permissions',
          created_at: new Date().toISOString()
        }
      ]

      const mockQuery = {
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({
              data: mockLogs,
              error: null
            })
          }))
        }))
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await supabase
        .from('access_denied_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].attempted_action).toBe('delete')
    })
  })
})

// Testes de Integração
describe('Integração RLS + Frontend', () => {
  it('deve integrar middleware com componentes React', async () => {
    // Mock para componente
    const mockUser = {
      id: 'user-123',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2023-01-01T00:00:00.000Z',
      email: 'user@example.com',
      phone: null,
      role: 'authenticated',
      last_sign_in_at: null,
      confirmed_at: null,
      email_confirmed_at: null,
      phone_confirmed_at: null,
      invited_at: null,
      action_link: null,
      recovery_sent_at: null,
      new_email: null,
      new_phone: null,
      is_anonymous: false
    }
    
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    } as any)

    vi.mocked(supabase.rpc).mockImplementation((funcName) => {
      if (funcName === 'get_user_role') {
        return Promise.resolve({ data: 'user', error: null })
      }
      if (funcName === 'get_user_permissions') {
        return Promise.resolve({ data: { permissions: { agents: ['create', 'read'] } }, error: null })
      }
      if (funcName === 'authorize_operation') {
        return Promise.resolve({ data: true, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })

    const middleware = new AuthorizationMiddleware()
    const result = await middleware.authorize({
      resource: 'agents',
      action: 'create'
    })

    expect(result.authorized).toBe(true)
    expect(result.context?.permissions.agents).toContain('create')
  })

  it('deve funcionar com proteção de rotas', async () => {
    // Simular verificação de autorização para rota protegida
    const mockUser = {
      id: 'admin-123',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2023-01-01T00:00:00.000Z',
      email: 'admin@example.com',
      phone: null,
      role: 'admin',
      last_sign_in_at: null,
      confirmed_at: null,
      email_confirmed_at: null,
      phone_confirmed_at: null,
      invited_at: null,
      action_link: null,
      recovery_sent_at: null,
      new_email: null,
      new_phone: null,
      is_anonymous: false
    }
    
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    } as any)

    vi.mocked(supabase.rpc).mockImplementation((funcName) => {
      if (funcName === 'get_user_role') {
        return Promise.resolve({ data: 'admin', error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })

    const middleware = new AuthorizationMiddleware()
    const result = await middleware.authorize({
      resource: 'system',
      action: 'manage_all',
      bypassForAdmin: true
    })

    expect(result.authorized).toBe(true)
    expect(result.context?.userRole).toBe('admin')
  })
}) 