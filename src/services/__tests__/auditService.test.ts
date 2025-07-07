import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { auditService } from '../auditService'
import { supabase } from '../supabase'

// Dados de mock globais para uso nos testes
const mockLogs = [
  {
    id: '1',
    action: 'test_action',
    resource: 'test_resource',
    severity: 'info',
    created_at: '2024-01-01T00:00:00Z'
  }
]
const mockLog = {
  id: 'test-id',
  action: 'test_action',
  resource: 'test_resource',
  severity: 'info',
  created_at: '2024-01-01T00:00:00Z'
}
const mockConfig = [
  {
    id: '1',
    resource_name: 'profiles',
    is_audited: true,
    retention_days: 90
  }
]
const mockStats = {
  total_logs: 3,
  logs_today: 1,
  unique_users: 2,
  unique_ips: 2,
  critical_actions: 0,
  top_actions: [],
  top_resources: [],
  severity_distribution: { info: 2, warn: 1 }
}
const mockAlerts = [
  {
    id: '1',
    alert_type: 'multiple_login_attempts',
    title: 'Múltiplas Tentativas de Login',
    severity: 'high',
    is_active: true
  }
]
const mockAlert = {
  id: '1',
  alert_type: 'test_alert',
  title: 'Test Alert',
  severity: 'medium',
  is_active: true
}
const mockExports = [
  {
    id: '1',
    export_type: 'csv',
    status: 'completed',
    created_at: '2024-01-01T00:00:00Z'
  }
]

describe('AuditService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createLog', () => {
    it('deve criar um log de auditoria com sucesso', async () => {
      const mockLogId = 'test-log-id'
      const mockRpcResponse = { data: mockLogId, error: null, count: null, status: 200, statusText: 'OK' }
      
      vi.mocked(supabase.rpc).mockResolvedValue(mockRpcResponse as any)

      const result = await auditService.createLog({
        action: 'test_action',
        resource: 'test_resource',
        severity: 'info'
      })

      expect(supabase.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'test_action',
        p_resource: 'test_resource',
        p_resource_id: undefined,
        p_resource_type: undefined,
        p_old_values: null,
        p_new_values: null,
        p_severity: 'info',
        p_metadata: '{}'
      })
      expect(result).toBe(mockLogId)
    })

    it('deve retornar null em caso de erro', async () => {
      const mockError = { data: null, error: { message: 'Test error' }, count: null, status: 400, statusText: 'Bad Request' }
      
      vi.mocked(supabase.rpc).mockResolvedValue(mockError as any)

      const result = await auditService.createLog({
        action: 'test_action',
        resource: 'test_resource'
      })

      expect(result).toBeNull()
    })
  })

  describe('getLogs', () => {
    it('deve buscar logs com filtros', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockLogs, error: null })
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      
      const result = await auditService.getLogs({ action: 'test_action' })
      expect(result).toEqual(mockLogs)
      expect(supabase.from).toHaveBeenCalledWith('audit_logs')
    })
    
    it('deve retornar array vazio em caso de erro', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Test error' } })
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      
      const result = await auditService.getLogs({ action: 'test_action' })
      expect(result).toEqual([])
    })
  })

  describe('getLogById', () => {
    it('deve buscar um log específico por ID', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockLog, error: null })
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      
      const result = await auditService.getLogById('test-id')
      expect(result).toEqual(mockLog)
    })
    
    it('deve retornar null se log não encontrado', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      
      const result = await auditService.getLogById('test-id')
      expect(result).toBeNull()
    })
  })

  describe('getStats', () => {
    it('deve retornar estatísticas de auditoria', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockStats], error: null })
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      
      const result = await auditService.getStats(30)
      expect(result).toBeDefined()
      expect(result?.total_logs).toBe(3)
      expect(result?.unique_users).toBe(2)
      expect(result?.unique_ips).toBe(2)
      expect(supabase.from).toHaveBeenCalledWith('audit_logs')
    })
    
    it('deve retornar null em caso de erro', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Test error' } })
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      
      const result = await auditService.getStats(30)
      expect(result).toBeNull()
      expect(supabase.from).toHaveBeenCalledWith('audit_logs')
    })
  })

  describe('getAuditConfig', () => {
    it('deve buscar configurações de auditoria', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockConfig, error: null })
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      
      const result = await auditService.getAuditConfig()
      expect(result).toEqual(mockConfig)
      expect(supabase.from).toHaveBeenCalledWith('audit_config')
    })
  })

  describe('updateAuditConfig', () => {
    it('deve atualizar configuração de auditoria', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: true, error: null })
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      
      const result = await auditService.updateAuditConfig('1', { is_audited: false })
      expect(result).toBe(true)
    })
    
    it('deve retornar false em caso de erro', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Test error' } })
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      
      const result = await auditService.updateAuditConfig('1', { is_audited: false })
      expect(result).toBe(false)
      expect(supabase.from).toHaveBeenCalledWith('audit_config')
    })
  })

  describe('getAuditAlerts', () => {
    it('deve buscar alertas de auditoria', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockAlerts, error: null })
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      
      const result = await auditService.getAuditAlerts()
      expect(result).toEqual(mockAlerts)
      expect(supabase.from).toHaveBeenCalledWith('audit_alerts')
    })
  })

  describe('createAuditAlert', () => {
    it('deve criar um alerta de auditoria', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAlert, error: null })
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      
      const result = await auditService.createAuditAlert({
        alert_type: 'test_alert',
        title: 'Test Alert',
        severity: 'medium',
        trigger_conditions: {},
        is_active: true
      })
      expect(result).toEqual(mockAlert)
    })
  })

  describe('updateAuditAlert', () => {
    it('deve atualizar um alerta de auditoria', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: true, error: null })
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      
      const result = await auditService.updateAuditAlert('1', { is_active: false })
      expect(result).toBe(true)
    })
  })

  describe('deleteAuditAlert', () => {
    it('deve deletar um alerta de auditoria', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: true, error: null })
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      
      const result = await auditService.deleteAuditAlert('test-id')
      expect(result).toBe(true)
    })
  })

  describe('createExport', () => {
    it('deve criar uma exportação', async () => {
      const mockResponse = { data: { id: '1' }, error: null }
      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse as any)
      
      const result = await auditService.createExport({ export_type: 'csv', filters: { user_id: 'test-user' } })
      
      expect(supabase.rpc).toHaveBeenCalledWith('export_audit_logs', {
        p_user_id: undefined, // auth.uid() retorna undefined no teste
        p_filters: '{"user_id":"test-user"}',
      })
      expect(result).toEqual({ id: '1' })
    })
  })

  describe('getExports', () => {
    it('deve buscar exportações', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockExports, error: null })
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      
      const result = await auditService.getExports()
      expect(result).toEqual(mockExports)
      expect(supabase.from).toHaveBeenCalledWith('audit_exports')
    })
  })

  describe('Métodos de conveniência', () => {
    it('deve logar login com sucesso', async () => {
      const mockLogId = 'test-log-id'
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockLogId, error: null, count: null, status: 200, statusText: 'OK' } as any)

      await auditService.logLogin('test-user', true, { method: 'email' })

      expect(supabase.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'login_success',
        p_resource: 'auth',
        p_resource_id: 'test-user',
        p_resource_type: 'user',
        p_old_values: null,
        p_new_values: null,
        p_severity: 'info',
        p_metadata: expect.stringContaining('"success":true')
      })
    })

    it('deve logar login falhado', async () => {
      const mockLogId = 'test-log-id'
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockLogId, error: null, count: null, status: 200, statusText: 'OK' } as any)

      await auditService.logLogin('test-user', false, { method: 'email' })

      expect(supabase.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'login_failed',
        p_resource: 'auth',
        p_resource_id: 'test-user',
        p_resource_type: 'user',
        p_old_values: null,
        p_new_values: null,
        p_severity: 'warn',
        p_metadata: expect.stringContaining('"success":false')
      })
    })

    it('deve logar logout', async () => {
      const mockLogId = 'test-log-id'
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockLogId, error: null, count: null, status: 200, statusText: 'OK' } as any)

      await auditService.logLogout('test-user', { session_duration: 3600 })

      expect(supabase.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'logout',
        p_resource: 'auth',
        p_resource_id: 'test-user',
        p_resource_type: 'user',
        p_old_values: null,
        p_new_values: null,
        p_severity: 'info',
        p_metadata: expect.stringContaining('"session_duration":3600')
      })
    })

    it('deve logar criação de recurso', async () => {
      const mockLogId = 'test-log-id'
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockLogId, error: null, count: null, status: 200, statusText: 'OK' } as any)

      const testData = { name: 'Test Resource', type: 'test' }
      await auditService.logCreate('test_resource', 'test-id', testData)

      expect(supabase.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'test_resource_created',
        p_resource: 'test_resource',
        p_resource_id: 'test-id',
        p_resource_type: 'test_resource',
        p_old_values: null,
        p_new_values: JSON.stringify(testData),
        p_severity: 'info',
        p_metadata: '{}'
      })
    })

    it('deve logar atualização de recurso', async () => {
      const mockLogId = 'test-log-id'
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockLogId, error: null, count: null, status: 200, statusText: 'OK' } as any)

      const oldData = { name: 'Old Name' }
      const newData = { name: 'New Name' }
      await auditService.logUpdate('test_resource', 'test-id', oldData, newData)

      expect(supabase.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'test_resource_updated',
        p_resource: 'test_resource',
        p_resource_id: 'test-id',
        p_resource_type: 'test_resource',
        p_old_values: JSON.stringify(oldData),
        p_new_values: JSON.stringify(newData),
        p_severity: 'info',
        p_metadata: '{}'
      })
    })

    it('deve logar exclusão de recurso', async () => {
      const mockLogId = 'test-log-id'
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockLogId, error: null } as any)

      const testData = { name: 'Test Resource' }
      await auditService.logDelete('test_resource', 'test-id', testData)

      expect(supabase.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'test_resource_deleted',
        p_resource: 'test_resource',
        p_resource_id: 'test-id',
        p_resource_type: 'test_resource',
        p_old_values: JSON.stringify(testData),
        p_new_values: null,
        p_severity: 'warn',
        p_metadata: '{}'
      })
    })

    it('deve logar acesso a recurso', async () => {
      const mockLogId = 'test-log-id'
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockLogId, error: null } as any)

      await auditService.logAccess('test_resource', 'test-id')

      expect(supabase.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'test_resource_accessed',
        p_resource: 'test_resource',
        p_resource_id: 'test-id',
        p_resource_type: 'test_resource',
        p_old_values: null,
        p_new_values: null,
        p_severity: 'debug',
        p_metadata: '{}'
      })
    })

    it('deve logar erro', async () => {
      const mockLogId = 'test-log-id'
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockLogId, error: null } as any)

      const testError = new Error('Test error message')
      await auditService.logError(testError, 'test_context', { additional: 'data' })

      expect(supabase.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'error_occurred',
        p_resource: 'system',
        p_resource_id: undefined,
        p_resource_type: 'error',
        p_old_values: null,
        p_new_values: null,
        p_severity: 'error',
        p_metadata: expect.stringContaining('"error_message":"Test error message"')
      })
    })

    it('deve logar ação crítica', async () => {
      const mockLogId = 'test-log-id'
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockLogId, error: null } as any)

      await auditService.logCriticalAction('critical_action', 'test_resource', 'test-id')

      expect(supabase.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'critical_action',
        p_resource: 'test_resource',
        p_resource_id: 'test-id',
        p_resource_type: 'test_resource',
        p_old_values: null,
        p_new_values: null,
        p_severity: 'critical',
        p_metadata: expect.stringContaining('"timestamp"')
      })
    })
  })
}) 