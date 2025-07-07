import { supabase } from './supabase'
import { createYampiAPI } from './yampiAPI'
import { generateChatResponse } from './gemini'
import { mailgunService } from './mailgun'
import { EvolutionAPIService } from './evolutionAPI'

export interface EndpointStatus {
  id: string
  name: string
  category: string
  url?: string
  status: 'online' | 'offline' | 'degraded' | 'unknown'
  responseTime?: number
  lastCheck: string
  error?: string
  details?: Record<string, any>
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  endpoints: EndpointStatus[]
  lastUpdate: string
}

class HealthCheckService {
  private static instance: HealthCheckService
  private checkInterval: NodeJS.Timeout | null = null
  private listeners: Array<(health: SystemHealth) => void> = []

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService()
    }
    return HealthCheckService.instance
  }

  // Método para adicionar listeners
  addListener(callback: (health: SystemHealth) => void) {
    this.listeners.push(callback)
  }

  removeListener(callback: (health: SystemHealth) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback)
  }

  private notifyListeners(health: SystemHealth) {
    this.listeners.forEach(listener => listener(health))
  }

  async checkAllEndpoints(): Promise<SystemHealth> {
    const startTime = Date.now()
    
    const endpoints = await Promise.all([
      this.checkSitePages(),
      this.checkSiteApplication(),
      this.checkSiteTracking(),
      this.checkWhatsAppAPI(),
      this.checkAIAPI(),
      this.checkEmailAPI(),
      this.checkDatabaseAPI(),
      this.checkYampiAPI(),
      this.checkServerStatus()
    ])

    const flatEndpoints = endpoints.flat()
    const overall = this.calculateOverallHealth(flatEndpoints)
    
    const health: SystemHealth = {
      overall,
      endpoints: flatEndpoints,
      lastUpdate: new Date().toISOString()
    }

    this.notifyListeners(health)
    return health
  }

  private calculateOverallHealth(endpoints: EndpointStatus[]): 'healthy' | 'degraded' | 'unhealthy' {
    const totalEndpoints = endpoints.length
    const onlineEndpoints = endpoints.filter(e => e.status === 'online').length
    const offlineEndpoints = endpoints.filter(e => e.status === 'offline').length
    
    if (offlineEndpoints === 0) return 'healthy'
    if (offlineEndpoints / totalEndpoints > 0.5) return 'unhealthy'
    return 'degraded'
  }

  // Site - Páginas Publicadas
  private async checkSitePages(): Promise<EndpointStatus[]> {
    const pages = [
      { id: 'site-home', name: 'Página Inicial', url: window.location.origin },
      { id: 'site-login', name: 'Login', url: `${window.location.origin}/login` },
      { id: 'site-signup', name: 'Cadastro', url: `${window.location.origin}/signup` },
    ]

    return Promise.all(pages.map(async (page) => {
      const startTime = Date.now()
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const response = await fetch(page.url, { 
          method: 'HEAD',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        const responseTime = Date.now() - startTime
        
        return {
          id: page.id,
          name: page.name,
          category: 'Site',
          url: page.url,
          status: response.ok ? 'online' : 'offline',
          responseTime,
          lastCheck: new Date().toISOString(),
          details: {
            httpStatus: response.status,
            statusText: response.statusText
          }
        }
      } catch (error) {
        return {
          id: page.id,
          name: page.name,
          category: 'Site',
          url: page.url,
          status: 'offline',
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }
    }))
  }

  // Site - Páginas de Aplicação
  private async checkSiteApplication(): Promise<EndpointStatus[]> {
    const appPages = [
      { id: 'app-dashboard', name: 'Dashboard', route: '/dashboard' },
      { id: 'app-chat', name: 'Chat IA', route: '/chat' },
      { id: 'app-whatsapp', name: 'WhatsApp', route: '/whatsapp' },
      { id: 'app-analytics', name: 'Analytics', route: '/analytics' },
    ]

    return appPages.map(page => {
      const isCurrentPage = window.location.pathname === page.route
      
      return {
        id: page.id,
        name: page.name,
        category: 'Aplicação',
        url: `${window.location.origin}${page.route}`,
        status: 'online', // Assumindo que se conseguimos executar este código, a aplicação está online
        responseTime: isCurrentPage ? 0 : undefined,
        lastCheck: new Date().toISOString(),
        details: {
          route: page.route,
          isCurrentPage
        }
      }
    })
  }

  // Site - Trackeamento
  private async checkSiteTracking(): Promise<EndpointStatus[]> {
    const trackingServices = [
      { id: 'tracking-analytics', name: 'Analytics Interno', check: () => this.checkInternalAnalytics() },
      { id: 'tracking-performance', name: 'Performance Monitor', check: () => this.checkPerformanceTracking() },
      { id: 'tracking-errors', name: 'Error Tracking', check: () => this.checkErrorTracking() },
    ]

    return Promise.all(trackingServices.map(async (service) => {
      const startTime = Date.now()
      try {
        const result = await service.check()
        return {
          id: service.id,
          name: service.name,
          category: 'Trackeamento',
          status: result.status,
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          details: result.details
        }
      } catch (error) {
        return {
          id: service.id,
          name: service.name,
          category: 'Trackeamento',
          status: 'offline',
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }
    }))
  }

  // API WhatsApp
  private async checkWhatsAppAPI(): Promise<EndpointStatus[]> {
    const apiUrl = import.meta.env.VITE_EVOLUTION_API_URL
    const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY
    
    if (!apiUrl || !apiKey) {
      return [{
        id: 'whatsapp-api',
        name: 'Evolution API',
        category: 'WhatsApp',
        status: 'offline',
        lastCheck: new Date().toISOString(),
        error: 'Configuração da API não encontrada'
      }]
    }

    const startTime = Date.now()
    try {
      const evolutionAPI = new EvolutionAPIService({
        baseURL: apiUrl,
        apiKey: apiKey,
        instanceName: 'default'
      })

      const response = await evolutionAPI.getInstanceInfo()
      const responseTime = Date.now() - startTime
      
      return [{
        id: 'whatsapp-api',
        name: 'Evolution API',
        category: 'WhatsApp',
        url: apiUrl,
        status: 'online',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          instancesActive: Array.isArray(response) ? response.length : 0
        }
      }]
    } catch (error) {
      return [{
        id: 'whatsapp-api',
        name: 'Evolution API',
        category: 'WhatsApp',
        url: apiUrl,
        status: 'offline',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }]
    }
  }

  // API Inteligência Artificial
  private async checkAIAPI(): Promise<EndpointStatus[]> {
    const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY
    
    if (!apiKey) {
      return [{
        id: 'ai-api',
        name: 'Google Gemini AI',
        category: 'Inteligência Artificial',
        status: 'offline',
        lastCheck: new Date().toISOString(),
        error: 'Chave da API não configurada'
      }]
    }

    const startTime = Date.now()
    try {
      const response = await generateChatResponse({
        message: 'teste',
        systemPrompt: 'Responda apenas "ok"',
        temperature: 0.1,
        maxTokens: 10
      })
      
      const responseTime = Date.now() - startTime
      
      return [{
        id: 'ai-api',
        name: 'Google Gemini AI',
        category: 'Inteligência Artificial',
        status: 'online',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          tokensUsed: response.tokensUsed,
          responseLength: response.content.length
        }
      }]
    } catch (error) {
      return [{
        id: 'ai-api',
        name: 'Google Gemini AI',
        category: 'Inteligência Artificial',
        status: 'offline',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }]
    }
  }

  // API Email
  private async checkEmailAPI(): Promise<EndpointStatus[]> {
    // Usar instância do mailgunService já criada
    const startTime = Date.now()
    
    try {
      // Teste simples de validação de email
      const isValid = await mailgunService.validateEmail('test@example.com')
      const responseTime = Date.now() - startTime
      
      return [{
        id: 'email-api',
        name: 'Mailgun API',
        category: 'Email',
        status: 'online',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          validationWorking: isValid !== undefined
        }
      }]
    } catch (error) {
      return [{
        id: 'email-api',
        name: 'Mailgun API',
        category: 'Email',
        status: 'offline',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }]
    }
  }

  // API Banco de Dados
  private async checkDatabaseAPI(): Promise<EndpointStatus[]> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .single()
      
      const responseTime = Date.now() - startTime
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, que é ok para nosso teste
        throw error
      }
      
      return [{
        id: 'database-api',
        name: 'Supabase Database',
        category: 'Banco de Dados',
        url: import.meta.env.VITE_SUPABASE_URL,
        status: 'online',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          connectionWorking: true
        }
      }]
    } catch (error) {
      return [{
        id: 'database-api',
        name: 'Supabase Database',
        category: 'Banco de Dados',
        url: import.meta.env.VITE_SUPABASE_URL,
        status: 'offline',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }]
    }
  }

  // API Yampi
  private async checkYampiAPI(): Promise<EndpointStatus[]> {
    const startTime = Date.now()
    
    try {
      // 1. PRIMEIRO: Tentar buscar do banco de dados (store de integrações)
      let yampiConfig = null
      let configSource = ''
      
      try {
        const { data: integrations, error } = await supabase
          .from('integrations')
          .select('*')
          .eq('name', 'yampi')
          .eq('status', 'active')
          .single()

        if (!error && integrations?.credentials) {
          const creds = integrations.credentials
          if (creds.merchantAlias && creds.token) {
            yampiConfig = JSON.stringify({
              merchantAlias: creds.merchantAlias,
              token: creds.token,
              secretKey: creds.secretKey,
              apiKey: creds.apiKey
            })
            configSource = 'database (integrations table)'
            console.log('✅ Configuração Yampi encontrada no banco de dados')
          }
        }
      } catch (dbError) {
        console.warn('⚠️ Não foi possível buscar configuração Yampi no banco:', dbError)
      }

      // 2. FALLBACK: Buscar configuração em múltiplos locais do browser (código anterior)
      if (!yampiConfig) {
        // Tentar no localStorage
        yampiConfig = localStorage.getItem('yampi-config')
        configSource = 'localStorage yampi-config'
        
        // Se não encontrou no localStorage, tentar outras fontes
        if (!yampiConfig) {
          // Tentar no sessionStorage
          yampiConfig = sessionStorage.getItem('yampi-config')
          configSource = 'sessionStorage yampi-config'
        }
        
        // Se ainda não encontrou, tentar buscar do store/estado global
        if (!yampiConfig) {
          try {
            // Verificar se existe no estado da aplicação
            const integrationState = localStorage.getItem('integrations-store')
            if (integrationState) {
              const parsed = JSON.parse(integrationState)
              const yampiIntegration = parsed?.state?.integrations?.find((i: any) => i.name === 'yampi')
              if (yampiIntegration?.config) {
                yampiConfig = JSON.stringify(yampiIntegration.config)
                configSource = 'localStorage integrations-store'
              }
            }
          } catch (e) {
            console.warn('⚠️ Erro ao buscar configuração no integrations-store:', e)
          }
        }
      }
      
      if (!yampiConfig) {
        return [{
          id: 'yampi-api',
          name: 'Yampi E-commerce',
          category: 'E-commerce',
          status: 'offline',
          lastCheck: new Date().toISOString(),
          error: 'Configuração do Yampi não encontrada',
          details: {
            searchedSources: [
              'database (integrations table)',
              'localStorage yampi-config', 
              'sessionStorage yampi-config', 
              'localStorage integrations-store'
            ],
            configFound: false,
            note: 'Configure a integração Yampi em Configurações > Integrações'
          }
        }]
      }

      let config
      try {
        config = JSON.parse(yampiConfig)
      } catch (parseError) {
        return [{
          id: 'yampi-api',
          name: 'Yampi E-commerce',
          category: 'E-commerce',
          status: 'offline',
          lastCheck: new Date().toISOString(),
          error: 'Configuração do Yampi inválida (JSON malformado)',
          details: {
            configSource,
            parseError: parseError instanceof Error ? parseError.message : 'Erro desconhecido'
          }
        }]
      }

      // Validar se a configuração tem os campos necessários
      if (!config.merchantAlias || !config.token) {
        return [{
          id: 'yampi-api',
          name: 'Yampi E-commerce',
          category: 'E-commerce',
          status: 'offline',
          lastCheck: new Date().toISOString(),
          error: 'Configuração do Yampi incompleta',
          details: {
            configSource,
            hasMerchantAlias: !!config.merchantAlias,
            hasToken: !!config.token,
            hasSecretKey: !!config.secretKey,
            hasApiKey: !!config.apiKey,
            configKeys: Object.keys(config),
            note: 'Configure a integração Yampi em Configurações > Integrações'
          }
        }]
      }

      const yampiAPI = createYampiAPI(config)
      
      console.log('🧪 Iniciando teste de conexão Yampi...', {
        merchantAlias: config.merchantAlias,
        configSource,
        hasToken: !!config.token
      })
      
      const result = await yampiAPI.testConnection()
      const responseTime = Date.now() - startTime
      
      // Log detalhado do resultado
      console.log('📊 Resultado do teste Yampi:', result)
      
      return [{
        id: 'yampi-api',
        name: 'Yampi E-commerce',
        category: 'E-commerce',
        status: result.success ? 'online' : 'offline',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          configSource,
          merchantAlias: config.merchantAlias,
          storeName: result.store_name,
          testResult: result,
          configFoundIn: configSource.includes('database') ? 'Database (Supabase)' : 'Browser Storage'
        },
        error: result.error
      }]
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      console.error('❌ Erro no teste de conexão Yampi:', error)
      
      return [{
        id: 'yampi-api',
        name: 'Yampi E-commerce',
        category: 'E-commerce',
        status: 'offline',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: errorMessage,
        details: {
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
          stack: error instanceof Error ? error.stack : undefined,
          note: 'Configure a integração Yampi em Configurações > Integrações'
        }
      }]
    }
  }

  // Servidor
  private async checkServerStatus(): Promise<EndpointStatus[]> {
    const checks = [
      { id: 'server-memory', name: 'Memória', check: () => this.checkMemoryUsage() },
      { id: 'server-performance', name: 'Performance', check: () => this.checkPerformance() },
      { id: 'server-network', name: 'Rede', check: () => this.checkNetworkStatus() },
    ]

    return Promise.all(checks.map(async (check) => {
      const startTime = Date.now()
      try {
        const result = await check.check()
        return {
          id: check.id,
          name: check.name,
          category: 'Servidor',
          status: result.status,
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          details: result.details
        }
      } catch (error) {
        return {
          id: check.id,
          name: check.name,
          category: 'Servidor',
          status: 'offline',
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }
    }))
  }

  // Métodos auxiliares para checks específicos
  private async checkInternalAnalytics(): Promise<{ status: 'online' | 'offline' | 'degraded' | 'unknown', details: any }> {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('count')
      .limit(1)
    
    return {
      status: error ? 'offline' as const : 'online' as const,
      details: { analyticsWorking: !error }
    }
  }

  private async checkPerformanceTracking(): Promise<{ status: 'online' | 'offline' | 'degraded' | 'unknown', details: any }> {
    const performanceData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    return {
      status: 'online' as const,
      details: {
        loadTime: performanceData.loadEventEnd - performanceData.loadEventStart,
        domContentLoaded: performanceData.domContentLoadedEventEnd - performanceData.domContentLoadedEventStart
      }
    }
  }

  private async checkErrorTracking(): Promise<{ status: 'online' | 'offline' | 'degraded' | 'unknown', details: any }> {
    return {
      status: 'online' as const,
      details: { errorTrackingEnabled: true }
    }
  }

  private async checkMemoryUsage(): Promise<{ status: 'online' | 'offline' | 'degraded' | 'unknown', details: any }> {
    const memory = (performance as any).memory
    
    return {
      status: 'online' as const,
      details: {
        usedJSHeapSize: memory?.usedJSHeapSize || 0,
        totalJSHeapSize: memory?.totalJSHeapSize || 0,
        jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0
      }
    }
  }

  private async checkPerformance(): Promise<{ status: 'online' | 'offline' | 'degraded' | 'unknown', details: any }> {
    const timing = performance.timing
    const loadTime = timing.loadEventEnd - timing.navigationStart
    const status: 'online' | 'degraded' = loadTime < 5000 ? 'online' : 'degraded'
    
    return {
      status,
      details: {
        loadTime,
        performanceGrade: loadTime < 2000 ? 'excellent' : loadTime < 5000 ? 'good' : 'poor'
      }
    }
  }

  private async checkNetworkStatus(): Promise<{ status: 'online' | 'offline' | 'degraded' | 'unknown', details: any }> {
    const connection = (navigator as any).connection
    
    return {
      status: 'online' as const,
      details: {
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0
      }
    }
  }

  // Métodos para controle de monitoramento contínuo
  startMonitoring(intervalMs: number = 60000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
    
    this.checkInterval = setInterval(() => {
      this.checkAllEndpoints()
    }, intervalMs)
    
    // Executa o primeiro check imediatamente
    this.checkAllEndpoints()
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  // Método para salvar histórico de status
  async saveStatusHistory(health: SystemHealth) {
    try {
      const { error } = await supabase
        .from('system_logs')
        .insert({
          log_level: 'info',
          severity: health.overall === 'healthy' ? 'low' : health.overall === 'degraded' ? 'medium' : 'high',
          component: 'system_health',
          action: 'health_check',
          message: `System health check: ${health.overall}`,
          details: {
            overall: health.overall,
            endpointCount: health.endpoints.length,
            onlineCount: health.endpoints.filter(e => e.status === 'online').length,
            offlineCount: health.endpoints.filter(e => e.status === 'offline').length
          }
        })
      
      if (error) {
        console.error('Erro ao salvar histórico de status:', error)
      }
    } catch (error) {
      console.error('Erro ao salvar histórico de status:', error)
    }
  }
}

export const healthCheckService = HealthCheckService.getInstance() 