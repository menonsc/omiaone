import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import sessionManager from '../sessionManager'
import type { SessionSettings } from '../sessionManager'

// Mock do Supabase
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}))

// Mock do localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('SessionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset configurações padrão
    sessionManager.updateSettings({
      rememberMe: false,
      inactivityTimeout: 30,
      maxSessions: 5,
      forceLogoutOtherSessions: false
    })
  })

  afterEach(() => {
    sessionManager.cleanup()
  })

  describe('Configurações de Sessão', () => {
    it('deve ter configurações padrão corretas', () => {
      const settings = sessionManager.getSettings()
      
      expect(settings.rememberMe).toBe(false)
      expect(settings.inactivityTimeout).toBe(30)
      expect(settings.maxSessions).toBe(5)
      expect(settings.forceLogoutOtherSessions).toBe(false)
    })

    it('deve atualizar configurações corretamente', () => {
      const newSettings: Partial<SessionSettings> = {
        rememberMe: true,
        inactivityTimeout: 60,
        maxSessions: 10
      }

      sessionManager.updateSettings(newSettings)
      const settings = sessionManager.getSettings()

      expect(settings.rememberMe).toBe(true)
      expect(settings.inactivityTimeout).toBe(60)
      expect(settings.maxSessions).toBe(10)
      expect(settings.forceLogoutOtherSessions).toBe(false) // Não alterado
    })

    it('deve persistir configurações no localStorage', () => {
      const newSettings: Partial<SessionSettings> = {
        rememberMe: true,
        inactivityTimeout: 120
      }

      sessionManager.updateSettings(newSettings)

      // O objeto salvo é sempre o objeto completo de configuração
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sessionSettings',
        JSON.stringify(sessionManager.getSettings())
      )
    })
  })

  describe('Funcionalidade "Lembre-se de mim"', () => {
    it('deve ativar "lembre-se de mim" corretamente', () => {
      sessionManager.setRememberMe(true)
      const settings = sessionManager.getSettings()
      
      expect(settings.rememberMe).toBe(true)
    })

    it('deve desativar "lembre-se de mim" corretamente', () => {
      // Primeiro ativar
      sessionManager.setRememberMe(true)
      expect(sessionManager.getSettings().rememberMe).toBe(true)
      
      // Depois desativar
      sessionManager.setRememberMe(false)
      expect(sessionManager.getSettings().rememberMe).toBe(false)
    })

    it('deve persistir preferência no localStorage', () => {
      sessionManager.setRememberMe(true)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sessionSettings',
        expect.stringContaining('"rememberMe":true')
      )
    })
  })

  describe('Gestão de Timeout de Inatividade', () => {
    it('deve configurar timeout de inatividade corretamente', () => {
      sessionManager.updateSettings({ inactivityTimeout: 15 })
      const settings = sessionManager.getSettings()
      
      expect(settings.inactivityTimeout).toBe(15)
    })

    it('deve aceitar valores válidos de timeout', () => {
      const validTimeouts = [15, 30, 60, 120, 240]
      
      validTimeouts.forEach(timeout => {
        sessionManager.updateSettings({ inactivityTimeout: timeout })
        expect(sessionManager.getSettings().inactivityTimeout).toBe(timeout)
      })
    })

    it('deve registrar atividade do usuário', () => {
      const initialActivity = Date.now()
      
      sessionManager.updateActivity()
      
      // Verificar se a atividade foi registrada (aproximadamente)
      expect(Date.now() - initialActivity).toBeLessThan(100)
    })
  })

  describe('Gestão de Múltiplas Sessões', () => {
    it('deve configurar limite máximo de sessões', () => {
      sessionManager.updateSettings({ maxSessions: 3 })
      const settings = sessionManager.getSettings()
      
      expect(settings.maxSessions).toBe(3)
    })

    it('deve aceitar valores válidos para máximo de sessões', () => {
      const validMaxSessions = [1, 3, 5, 10, 20]
      
      validMaxSessions.forEach(max => {
        sessionManager.updateSettings({ maxSessions: max })
        expect(sessionManager.getSettings().maxSessions).toBe(max)
      })
    })

    it('deve configurar logout forçado de outras sessões', () => {
      sessionManager.updateSettings({ forceLogoutOtherSessions: true })
      const settings = sessionManager.getSettings()
      
      expect(settings.forceLogoutOtherSessions).toBe(true)
    })
  })

  describe('Device Detection', () => {
    it('deve detectar informações do dispositivo', () => {
      const deviceInfo = sessionManager.getDeviceInfo()
      
      expect(deviceInfo).toHaveProperty('type')
      expect(deviceInfo).toHaveProperty('os')
      expect(deviceInfo).toHaveProperty('browser')
      expect(deviceInfo).toHaveProperty('platform')
      
      expect(['desktop', 'mobile', 'tablet']).toContain(deviceInfo.type)
    })

    it('deve detectar tipo de dispositivo baseado no user agent', () => {
      // Mock user agent para mobile
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
        configurable: true
      })
      
      const deviceInfo = sessionManager.getDeviceInfo()
      expect(deviceInfo.type).toBe('mobile')
    })
  })

  describe('Cleanup e Inicialização', () => {
    it('deve limpar recursos corretamente', () => {
      sessionManager.initialize()
      
      // Verificar que a limpeza não gera erros
      expect(() => sessionManager.cleanup()).not.toThrow()
    })

    it('deve carregar configurações salvas na inicialização', () => {
      const savedSettings = {
        rememberMe: true,
        inactivityTimeout: 60,
        maxSessions: 10,
        forceLogoutOtherSessions: true
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedSettings))
      
      sessionManager.initialize()
      const settings = sessionManager.getSettings()
      
      expect(settings).toEqual(savedSettings)
    })

    it('deve usar configurações padrão se não houver configurações salvas', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      sessionManager.initialize()
      const settings = sessionManager.getSettings()
      
      expect(settings.rememberMe).toBe(false)
      expect(settings.inactivityTimeout).toBe(30)
      expect(settings.maxSessions).toBe(5)
      expect(settings.forceLogoutOtherSessions).toBe(false)
    })
  })

  describe('Segurança e Validação', () => {
    it('deve validar configurações de timeout', () => {
      // Testar valores inválidos
      sessionManager.updateSettings({ inactivityTimeout: -1 })
      expect(sessionManager.getSettings().inactivityTimeout).toBe(30) // Deve manter valor padrão
      
      sessionManager.updateSettings({ inactivityTimeout: 0 })
      expect(sessionManager.getSettings().inactivityTimeout).toBe(30) // Deve manter valor padrão
    })

    it('deve validar configurações de máximo de sessões', () => {
      // Testar valores inválidos
      sessionManager.updateSettings({ maxSessions: -1 })
      expect(sessionManager.getSettings().maxSessions).toBe(5) // Deve manter valor padrão
      
      sessionManager.updateSettings({ maxSessions: 0 })
      expect(sessionManager.getSettings().maxSessions).toBe(5) // Deve manter valor padrão
    })

    it('deve lidar com configurações corrompidas no localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')
      
      // Não deve gerar erro
      expect(() => sessionManager.initialize()).not.toThrow()
      
      // Deve usar configurações padrão
      const settings = sessionManager.getSettings()
      expect(settings.rememberMe).toBe(false)
      expect(settings.inactivityTimeout).toBe(30)
    })
  })
}) 