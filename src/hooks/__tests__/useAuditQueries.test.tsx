// Mock global do Supabase
vi.mock('../supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}))

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { 
  useAuditLogs, 
  useAuditStats, 
  useAuditConfig,
  useAuditAlerts,
  useAuditDashboard,
  useAuditActivity,
  useAuditFilters,
  useAuditRealtime,
  useAuditReport,
  useAuditLogsByUser,
  useAuditLogsByResource,
  useAuditLogsByAction,
  useAuditLogsBySeverity,
  useAuditLogsByDateRange,
  useAuditLogsByIP
} from '../useAuditQueries'
import { auditService } from '../../services/auditService'

// Mock do auditService
vi.mock('../../services/auditService', () => ({
  auditService: {
    getLogs: vi.fn(),
    getStats: vi.fn(),
    getAuditConfig: vi.fn(),
    getAuditAlerts: vi.fn(),
    getExports: vi.fn()
  }
}))

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Definição dos mocks completos no início do arquivo
const mockLogs = [
  {
    id: '1',
    user_id: 'user1',
    user_name: 'João Silva',
    user_email: 'joao@example.com',
    action: 'login_success',
    resource: 'auth',
    resource_id: 'user1',
    resource_type: 'user',
    old_values: null,
    new_values: null,
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0...',
    session_id: 'sess1',
    severity: "info" as "info",
    metadata: {},
    created_at: '2024-01-01T10:00:00Z',
    expires_at: '2024-04-01T10:00:00Z'
  },
  {
    id: '2',
    user_id: 'user2',
    user_name: 'Maria Santos',
    user_email: 'maria@example.com',
    action: 'profile_updated',
    resource: 'profiles',
    resource_id: 'user2',
    resource_type: 'profile',
    old_values: null,
    new_values: null,
    ip_address: '192.168.1.2',
    user_agent: 'Mozilla/5.0...',
    session_id: 'sess2',
    severity: "info" as "info",
    metadata: {},
    created_at: '2024-01-01T11:00:00Z',
    expires_at: '2024-04-01T11:00:00Z'
  }
]

const mockStats = {
  total_logs: 100,
  logs_today: 10,
  unique_users: 5,
  unique_ips: 3,
  critical_actions: 2,
  top_actions: [
    { action: 'login', count: 20 },
    { action: 'logout', count: 15 }
  ],
  top_resources: [
    { resource: 'auth', count: 35 },
    { resource: 'profiles', count: 25 }
  ],
  severity_distribution: {
    info: 70,
    warn: 20,
    error: 8,
    critical: 2
  }
}

const mockAlerts = [
  {
    id: '1',
    alert_type: 'multiple_login_attempts',
    title: 'Múltiplas Tentativas de Login',
    description: 'Detectadas múltiplas tentativas de login falhadas',
    severity: "high" as "high",
    trigger_conditions: { max_attempts: 5, time_window: '1 hour' },
    is_active: true,
    created_by: 'admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockConfig = [
  {
    id: '1',
    resource_name: 'profiles',
    is_audited: true,
    retention_days: 90,
    log_level: 'info',
    track_changes: true,
    track_access: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

describe('useAuditQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAuditLogs', () => {
    it('deve buscar logs de auditoria', async () => {
      vi.mocked(auditService.getLogs).mockResolvedValue(mockLogs as any)

      const { result } = renderHook(() => useAuditLogs({ limit: 10 }), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockLogs)
      expect(auditService.getLogs).toHaveBeenCalledWith({ limit: 10 })
    })

    it('deve lidar com erro na busca de logs', async () => {
      const mockError = new Error('Test error')
      vi.mocked(auditService.getLogs).mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuditLogs(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })

  describe('useAuditStats', () => {
    it('deve buscar estatísticas de auditoria', async () => {
      vi.mocked(auditService.getStats).mockResolvedValue(mockStats as any)

      const { result } = renderHook(() => useAuditStats(30), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockStats)
      expect(auditService.getStats).toHaveBeenCalledWith(30)
    })
  })

  describe('useAuditConfig', () => {
    it('deve buscar configurações de auditoria', async () => {
      vi.mocked(auditService.getAuditConfig).mockResolvedValue(mockConfig as any)

      const { result } = renderHook(() => useAuditConfig(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockConfig)
    })
  })

  describe('useAuditAlerts', () => {
    it('deve buscar alertas de auditoria', async () => {
      vi.mocked(auditService.getAuditAlerts).mockResolvedValue(mockAlerts as any)

      const { result } = renderHook(() => useAuditAlerts(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockAlerts)
    })
  })

  describe('useAuditDashboard', () => {
    it('deve combinar dados do dashboard', async () => {
      vi.mocked(auditService.getStats).mockResolvedValue(mockStats as any)
      vi.mocked(auditService.getLogs).mockResolvedValue(mockLogs as any)
      vi.mocked(auditService.getAuditAlerts).mockResolvedValue(mockAlerts as any)

      const { result } = renderHook(() => useAuditDashboard(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.stats).toEqual(mockStats)
      expect(result.current.recentLogs).toEqual(mockLogs)
      expect(result.current.alerts).toEqual(mockAlerts)
    })
  })

  describe('useAuditActivity', () => {
    it('deve agrupar atividade por dia', async () => {
      // Dados de mock para cobrir os dois dias
      const logs = [
        { created_at: '2024-01-01T10:00:00Z' },
        { created_at: '2024-01-01T11:00:00Z' },
        { created_at: '2024-01-02T09:00:00Z' }
      ]
      vi.mocked(auditService.getLogs).mockResolvedValueOnce(logs as any)

      const { result } = renderHook(() => useAuditActivity(7), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual({
        '2024-01-01': 2,
        '2024-01-02': 1
      })
    })
  })

  describe('useAuditFilters', () => {
    it('deve extrair valores únicos para filtros', async () => {
      // Dados de mock para bater com as asserções
      const logs = [
        { action: 'login', resource: 'auth', severity: 'info', user_id: 'user1', ip_address: '192.168.1.1' },
        { action: 'logout', resource: 'profiles', severity: 'warn', user_id: 'user2', ip_address: '192.168.1.2' }
      ]
      vi.mocked(auditService.getLogs).mockResolvedValueOnce(logs as any)
      vi.mocked(auditService.getAuditConfig).mockResolvedValueOnce(mockConfig as any)

      const { result } = renderHook(() => useAuditFilters(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.actions).toEqual(['login', 'logout'])
      expect(result.current.data?.resources).toEqual(['auth', 'profiles'])
      expect(result.current.data?.severities).toEqual(['info', 'warn'])
      expect(result.current.data?.users).toEqual(['user1', 'user2'])
      expect(result.current.data?.ips).toEqual(['192.168.1.1', '192.168.1.2'])
    })
  })

  describe('useAuditRealtime', () => {
    it('deve buscar logs em tempo real', async () => {
      vi.mocked(auditService.getLogs).mockResolvedValue(mockLogs as any)

      const { result } = renderHook(() => useAuditRealtime(true), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockLogs)
    })

    it('não deve buscar quando desabilitado', () => {
      const { result } = renderHook(() => useAuditRealtime(false), {
        wrapper: createWrapper()
      })

      expect(result.current.isFetching).toBe(false)
    })
  })

  describe('useAuditReport', () => {
    it('deve gerar relatório resumido', async () => {
      // Dados de mock para bater com as asserções
      const logs = [
        { user_id: 'user1', severity: 'info', ip_address: '192.168.1.1', action: 'login' },
        { user_id: 'user2', severity: 'critical', ip_address: '192.168.1.2', action: 'critical_action' },
        { user_id: 'user1', severity: 'info', ip_address: '192.168.1.1', action: 'login' }
      ]
      vi.mocked(auditService.getLogs).mockResolvedValueOnce(logs as any)

      const filters = { user_id: 'user1' }
      const { result } = renderHook(() => useAuditReport(filters, 'summary'), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.totalLogs).toBe(3)
      expect(result.current.data?.uniqueUsers).toBe(2)
      expect(result.current.data?.uniqueIPs).toBe(2)
      expect(result.current.data?.criticalLogs).toBe(1)
      expect(result.current.data?.actionCounts).toEqual({
        login: 2,
        critical_action: 1
      })
    })

    it('deve gerar relatório detalhado', async () => {
      vi.mocked(auditService.getLogs).mockResolvedValue(mockLogs as any)

      const filters = { user_id: 'user1' }
      const { result } = renderHook(() => useAuditReport(filters, 'detailed'), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.logs).toEqual(mockLogs)
      expect(result.current.data?.filters).toEqual(filters)
      expect(result.current.data?.generatedAt).toBeDefined()
    })
  })

  describe('Hooks de conveniência', () => {
    it('useAuditLogsByUser deve filtrar por usuário', async () => {
      vi.mocked(auditService.getLogs).mockResolvedValue(mockLogs as any)
      let result: any
      ({ result } = renderHook(() => useAuditLogsByUser('user1', 50), {
        wrapper: createWrapper()
      }))
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
      expect(auditService.getLogs).toHaveBeenCalledWith({ user_id: 'user1', limit: 50 })
    })

    it('useAuditLogsByResource deve filtrar por recurso', async () => {
      vi.mocked(auditService.getLogs).mockResolvedValue(mockLogs as any)
      let result: any
      ({ result } = renderHook(() => useAuditLogsByResource('auth', 50), {
        wrapper: createWrapper()
      }))
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
      expect(auditService.getLogs).toHaveBeenCalledWith({ resource: 'auth', limit: 50 })
    })

    it('useAuditLogsByAction deve filtrar por ação', async () => {
      vi.mocked(auditService.getLogs).mockResolvedValue(mockLogs as any)
      let result: any
      ({ result } = renderHook(() => useAuditLogsByAction('login', 50), {
        wrapper: createWrapper()
      }))
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
      expect(auditService.getLogs).toHaveBeenCalledWith({ action: 'login', limit: 50 })
    })

    it('useAuditLogsBySeverity deve filtrar por severidade', async () => {
      vi.mocked(auditService.getLogs).mockResolvedValue(mockLogs as any)
      let result: any
      ({ result } = renderHook(() => useAuditLogsBySeverity('critical', 50), {
        wrapper: createWrapper()
      }))
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
      expect(auditService.getLogs).toHaveBeenCalledWith({ severity: 'critical', limit: 50 })
    })

    it('useAuditLogsByDateRange deve filtrar por período', async () => {
      vi.mocked(auditService.getLogs).mockResolvedValue(mockLogs as any)
      const dateFrom = new Date('2024-01-01')
      const dateTo = new Date('2024-01-31')
      let result: any
      ({ result } = renderHook(() => useAuditLogsByDateRange(dateFrom, dateTo, 50), {
        wrapper: createWrapper()
      }))
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
      expect(auditService.getLogs).toHaveBeenCalledWith({ 
        date_from: dateFrom, 
        date_to: dateTo, 
        limit: 50 
      })
    })

    it('useAuditLogsByIP deve filtrar por IP', async () => {
      vi.mocked(auditService.getLogs).mockResolvedValue(mockLogs as any)
      let result: any
      ({ result } = renderHook(() => useAuditLogsByIP('192.168.1.1', 50), {
        wrapper: createWrapper()
      }))
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
      expect(auditService.getLogs).toHaveBeenCalledWith({ ip_address: '192.168.1.1', limit: 50 })
    })
  })
}) 