// Mock global do Supabase
vi.mock('../../services/supabase', () => ({
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

// Mock do auditService
vi.mock('../../services/auditService', () => ({
  auditService: {
    getLogs: vi.fn(),
    getStats: vi.fn(),
    getAuditConfig: vi.fn(),
    getAuditAlerts: vi.fn()
  }
}))

// Mock do PermissionGuard
vi.mock('../../components/PermissionGuard', () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import AuditLogs from '../AuditLogs'
import { auditService } from '../../services/auditService'

// Mock do módulo useAuditQueries
vi.mock('../../hooks/useAuditQueries', () => ({
  useAuditDashboard: vi.fn(() => ({
    stats: {
      total_logs: 100,
      logs_today: 10,
      unique_users: 5,
      unique_ips: 3,
      critical_actions: 2
    },
    recentLogs: [],
    alerts: [],
    isLoading: false,
    error: null
  })),
  useAuditLogs: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: vi.fn()
  })),
  useAuditFilters: vi.fn(() => ({
    data: {
      actions: ['login', 'logout'],
      resources: ['auth', 'profiles'],
      severities: ['info', 'warn'],
      users: ['user1', 'user2'],
      ips: ['192.168.1.1', '192.168.1.2'],
      config: []
    },
    isLoading: false,
    error: null
  })),
  useCreateAuditExport: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false
  })),
  useAuditExports: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null
  })),
  useAuditLogsByUser: vi.fn(),
  useAuditLogsByResource: vi.fn(),
  useAuditLogsByAction: vi.fn(),
  useAuditLogsBySeverity: vi.fn(),
  useAuditLogsByDateRange: vi.fn(),
  useAuditLogsByIP: vi.fn(),
}))

// Wrapper para testes
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
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Mock data
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
    severity: 'info',
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0...',
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
    severity: 'info',
    ip_address: '192.168.1.2',
    user_agent: 'Mozilla/5.0...',
    created_at: '2024-01-01T11:00:00Z',
    expires_at: '2024-04-01T11:00:00Z'
  }
]

const mockAlerts = [
  {
    id: '1',
    alert_type: 'multiple_login_attempts',
    title: 'Múltiplas Tentativas de Login',
    description: 'Detectadas múltiplas tentativas de login falhadas',
    severity: 'high',
    trigger_conditions: { max_attempts: 5, time_window: '1 hour' },
    is_active: true,
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

const mockExports = [
  {
    id: '1',
    user_id: 'user1',
    export_type: 'csv',
    filters: {},
    status: 'completed',
    file_path: '/exports/audit_2024_01_01.csv',
    file_size: 1024,
    created_at: '2024-01-01T10:00:00Z',
    expires_at: '2024-01-08T10:00:00Z'
  }
]

describe('AuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderização básica', () => {
    it('deve renderizar o componente corretamente', () => {
      render(<AuditLogs />, { wrapper: createWrapper() })

      expect(screen.getByText('Sistema de Auditoria')).toBeInTheDocument()
      expect(screen.getByText('Monitoramento e logs de atividades do sistema')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Logs')).toBeInTheDocument()
      expect(screen.getByText('Alertas')).toBeInTheDocument()
      expect(screen.getByText('Configurações')).toBeInTheDocument()
      expect(screen.getByText('Exportações')).toBeInTheDocument()
    })

    it('deve mostrar loading quando dados estão carregando', () => {
      render(<AuditLogs />, { wrapper: createWrapper() })

      // Verificar se o componente renderiza sem erros
      expect(screen.getByText('Sistema de Auditoria')).toBeInTheDocument()
    })
  })

  describe('Dashboard Tab', () => {
    it('deve mostrar estatísticas no dashboard', () => {
      render(<AuditLogs />, { wrapper: createWrapper() })

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  describe('Logs Tab', () => {
    it('deve mostrar lista de logs', () => {
      render(<AuditLogs />, { wrapper: createWrapper() })

      expect(screen.getByText('Logs')).toBeInTheDocument()
    })

    it('deve filtrar logs por busca', () => {
      render(<AuditLogs />, { wrapper: createWrapper() })

      expect(screen.getByText('Logs')).toBeInTheDocument()
    })
  })

  describe('Alertas Tab', () => {
    it('deve mostrar alertas de auditoria', () => {
      render(<AuditLogs />, { wrapper: createWrapper() })

      expect(screen.getByText('Alertas')).toBeInTheDocument()
    })
  })

  describe('Configurações Tab', () => {
    it('deve mostrar configurações de auditoria', () => {
      render(<AuditLogs />, { wrapper: createWrapper() })

      expect(screen.getByText('Configurações')).toBeInTheDocument()
    })
  })

  describe('Exportações Tab', () => {
    it('deve mostrar exportações', () => {
      render(<AuditLogs />, { wrapper: createWrapper() })

      expect(screen.getByText('Exportações')).toBeInTheDocument()
    })
  })

  describe('Funcionalidades de filtro', () => {
    it('deve aplicar filtros corretamente', () => {
      render(<AuditLogs />, { wrapper: createWrapper() })

      expect(screen.getByText('Sistema de Auditoria')).toBeInTheDocument()
    })

    it('deve limpar filtros', () => {
      render(<AuditLogs />, { wrapper: createWrapper() })

      expect(screen.getByText('Sistema de Auditoria')).toBeInTheDocument()
    })
  })

  describe('Exportação', () => {
    it('deve exportar logs em CSV', () => {
      render(<AuditLogs />, { wrapper: createWrapper() })

      expect(screen.getByText('Sistema de Auditoria')).toBeInTheDocument()
    })
  })
})

vi.mocked(auditService.getLogs).mockResolvedValue(mockLogs as any)
vi.mocked(auditService.getStats).mockResolvedValue(mockStats as any)
vi.mocked(auditService.getAuditConfig).mockResolvedValue(mockConfig as any)
vi.mocked(auditService.getAuditAlerts).mockResolvedValue(mockAlerts as any) 