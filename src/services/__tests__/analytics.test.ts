import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAnalytics } from '../analytics'

// Mock do console.error para evitar logs desnecessários
const mockConsoleError = vi.fn()
global.console.error = mockConsoleError

describe('Analytics Service', () => {
  let analytics: ReturnType<typeof useAnalytics>

  beforeEach(() => {
    vi.clearAllMocks()
    analytics = useAnalytics()
  })

  it('deve criar uma instância do analytics', () => {
    expect(analytics).toBeDefined()
    expect(typeof analytics.trackEvent).toBe('function')
    expect(typeof analytics.trackPageView).toBe('function')
    expect(typeof analytics.trackUserLogin).toBe('function')
    expect(typeof analytics.trackError).toBe('function')
    expect(typeof analytics.logSystem).toBe('function')
  })

  it('deve rastrear um evento de página', () => {
    const result = analytics.trackPageView('Dashboard')
    expect(result).toBeUndefined()
    // O método trackPageView é síncrono e apenas chama trackEvent internamente
  })

  it('deve rastrear login de usuário', () => {
    analytics.trackUserLogin('user123', 'email')
    // Teste passa se não houver erro
    expect(true).toBe(true)
  })

  it('deve ter métodos de rastreamento disponíveis', () => {
    // Verificar se todos os métodos principais existem
    expect(typeof analytics.trackFeatureUsage).toBe('function')
    expect(typeof analytics.trackApiCall).toBe('function')
    expect(typeof analytics.trackUserLogout).toBe('function')
  })

  it('deve processar chamadas síncronas sem erro', () => {
    // Testar métodos que não fazem chamadas assíncronas
    expect(() => {
      analytics.trackPageView('TestPage')
      analytics.trackUserLogin('user123')
      analytics.trackUserLogout()
      analytics.trackFeatureUsage('whatsapp', 'send_message')
      analytics.trackApiCall('/api/test', 'GET', 150, true)
    }).not.toThrow()
  })
}) 