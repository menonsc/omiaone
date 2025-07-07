import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

export interface SessionInfo {
  id: string
  user_id: string
  device_info: DeviceInfo
  ip_address: string
  user_agent: string
  is_current: boolean
  last_activity: string
  created_at: string
  expires_at: string
  location?: {
    country?: string
    city?: string
  }
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet'
  os: string
  browser: string
  platform: string
}

export interface SessionSettings {
  rememberMe: boolean
  inactivityTimeout: number // em minutos
  maxSessions: number
  forceLogoutOtherSessions: boolean
}

class SessionManager {
  private inactivityTimer: NodeJS.Timeout | null = null
  private lastActivity: Date = new Date()
  private sessionSettings: SessionSettings = {
    rememberMe: false,
    inactivityTimeout: 30, // 30 minutos padrão
    maxSessions: 5,
    forceLogoutOtherSessions: false
  }

  constructor() {
    this.setupActivityTracking()
    this.loadSettings()
  }

  // Configurações de sessão
  updateSettings(settings: Partial<SessionSettings>) {
    // Validação de valores
    if (settings.inactivityTimeout !== undefined) {
      if (settings.inactivityTimeout <= 0) {
        settings.inactivityTimeout = 30 // Valor padrão
      }
    }
    
    if (settings.maxSessions !== undefined) {
      if (settings.maxSessions <= 0) {
        settings.maxSessions = 5 // Valor padrão
      }
    }

    this.sessionSettings = { ...this.sessionSettings, ...settings }
    this.saveSettings()
    this.setupInactivityTimer()
  }

  getSettings(): SessionSettings {
    return { ...this.sessionSettings }
  }

  private loadSettings() {
    const saved = localStorage.getItem('sessionSettings')
    if (saved) {
      try {
        this.sessionSettings = { ...this.sessionSettings, ...JSON.parse(saved) }
      } catch (error) {
        console.error('Erro ao carregar configurações de sessão:', error)
      }
    }
  }

  private saveSettings() {
    localStorage.setItem('sessionSettings', JSON.stringify(this.sessionSettings))
  }

  // Controle de "Lembre-se de mim"
  setRememberMe(remember: boolean) {
    this.sessionSettings.rememberMe = remember
    this.saveSettings()
    
    // Configurar tipo de sessão no Supabase
    if (!remember) {
      // Usar sessionStorage quando não for "lembre-se de mim"
      this.configureSessionStorage()
    }
  }

  private configureSessionStorage() {
    // Mover dados da sessão para sessionStorage se não for "lembre-se de mim"
    const authData = localStorage.getItem('sb-auth-token')
    if (authData && !this.sessionSettings.rememberMe) {
      sessionStorage.setItem('sb-auth-temp', authData)
      localStorage.removeItem('sb-auth-token')
    }
  }

  // Rastreamento de atividade
  private setupActivityTracking() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, this.updateActivity.bind(this), true)
    })

    // Rastrear mudanças de página
    window.addEventListener('beforeunload', this.handlePageUnload.bind(this))
    
    // Rastrear quando a página fica visível/invisível
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
  }

  updateActivity() {
    this.lastActivity = new Date()
    this.saveLastActivity()
    this.setupInactivityTimer()
  }

  private handlePageUnload() {
    this.saveLastActivity()
  }

  private handleVisibilityChange() {
    if (!document.hidden) {
      this.updateActivity()
    }
  }

  private saveLastActivity() {
    localStorage.setItem('last-activity', this.lastActivity.toISOString())
  }

  // Timer de inatividade
  private setupInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }

    const timeoutMs = this.sessionSettings.inactivityTimeout * 60 * 1000
    
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivityTimeout()
    }, timeoutMs)
  }

  private async handleInactivityTimeout() {
    try {
      // Verificar se o usuário ainda está ativo
      const savedActivity = localStorage.getItem('last-activity')
      if (savedActivity) {
        const lastActivity = new Date(savedActivity)
        const now = new Date()
        const minutesInactive = (now.getTime() - lastActivity.getTime()) / (1000 * 60)
        
        if (minutesInactive < this.sessionSettings.inactivityTimeout) {
          // Usuário ainda está ativo, reconfigurar timer
          this.setupInactivityTimer()
          return
        }
      }

      // Logout por inatividade
      await this.logoutDueToInactivity()
    } catch (error) {
      console.error('Erro no timeout de inatividade:', error)
    }
  }

  private async logoutDueToInactivity() {
    // Notificar sobre logout por inatividade
    this.showInactivityWarning()
    
    // Aguardar alguns segundos para o usuário ver a notificação
    setTimeout(async () => {
      await supabase.auth.signOut()
      
      // Redirecionar para login com mensagem
      window.location.href = '/login?reason=inactivity'
    }, 3000)
  }

  private showInactivityWarning() {
    // Criar uma notificação de inatividade
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-yellow-500 text-white p-4 rounded-lg shadow-lg z-50'
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <span>Sessão expirou por inatividade. Redirecionando...</span>
      </div>
    `
    document.body.appendChild(notification)
    
    // Remover notificação após 3 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }

  // Gestão de múltiplas sessões
  async getSessions(): Promise<SessionInfo[]> {
    try {
      // Buscar sessões ativas do usuário
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .order('last_activity', { ascending: false })

      if (error) {
        console.error('Erro ao buscar sessões:', error)
        return []
      }

      return sessions || []
    } catch (error) {
      console.error('Erro ao buscar sessões:', error)
      return []
    }
  }

  async createSession(session: Session): Promise<void> {
    try {
      const deviceInfo = this.getDeviceInfo()
      const ipAddress = await this.getIPAddress()
      
      const sessionData = {
        id: session.access_token.substring(0, 32), // Usar parte do token como ID
        user_id: session.user.id,
        device_info: deviceInfo,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        is_current: true,
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
      }

      // Marcar outras sessões como não-atuais
      await supabase
        .from('user_sessions')
        .update({ is_current: false })
        .eq('user_id', session.user.id)

      // Inserir nova sessão
      const { error } = await supabase
        .from('user_sessions')
        .insert(sessionData)

      if (error) {
        console.error('Erro ao criar sessão:', error)
      }

      // Verificar limite de sessões
      await this.enforceSessionLimit(session.user.id)
    } catch (error) {
      console.error('Erro ao criar sessão:', error)
    }
  }

  async updateSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          last_activity: new Date().toISOString() 
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Erro ao atualizar sessão:', error)
      }
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error)
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) {
        console.error('Erro ao revogar sessão:', error)
      }
    } catch (error) {
      console.error('Erro ao revogar sessão:', error)
    }
  }

  async revokeAllOtherSessions(currentSessionId: string): Promise<void> {
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) return

      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', session.session.user.id)
        .neq('id', currentSessionId)

      if (error) {
        console.error('Erro ao revogar outras sessões:', error)
      }
    } catch (error) {
      console.error('Erro ao revogar outras sessões:', error)
    }
  }

  private async enforceSessionLimit(userId: string): Promise<void> {
    try {
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error || !sessions) return

      if (sessions.length > this.sessionSettings.maxSessions) {
        // Remover sessões mais antigas
        const sessionsToRemove = sessions.slice(this.sessionSettings.maxSessions)
        const idsToRemove = sessionsToRemove.map(s => s.id)

        await supabase
          .from('user_sessions')
          .delete()
          .in('id', idsToRemove)
      }
    } catch (error) {
      console.error('Erro ao aplicar limite de sessões:', error)
    }
  }

  // Utilitários
  getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase()
    
    let type: 'desktop' | 'mobile' | 'tablet' = 'desktop'
    if (/mobile|android|iphone/.test(userAgent)) {
      type = 'mobile'
    } else if (/tablet|ipad/.test(userAgent)) {
      type = 'tablet'
    }

    let os = 'Unknown'
    if (userAgent.includes('windows')) os = 'Windows'
    else if (userAgent.includes('mac')) os = 'macOS'
    else if (userAgent.includes('linux')) os = 'Linux'
    else if (userAgent.includes('android')) os = 'Android'
    else if (userAgent.includes('ios')) os = 'iOS'

    let browser = 'Unknown'
    if (userAgent.includes('chrome')) browser = 'Chrome'
    else if (userAgent.includes('firefox')) browser = 'Firefox'
    else if (userAgent.includes('safari')) browser = 'Safari'
    else if (userAgent.includes('edge')) browser = 'Edge'

    return {
      type,
      os,
      browser,
      platform: navigator.platform
    }
  }

  private async getIPAddress(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      console.error('Erro ao obter IP:', error)
      return 'unknown'
    }
  }

  // Inicialização
  initialize() {
    this.loadSettings()
    this.setupActivityTracking()
    this.setupInactivityTimer()
  }

  // Limpeza
  cleanup() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.removeEventListener(event, this.updateActivity.bind(this), true)
    })
    
    window.removeEventListener('beforeunload', this.handlePageUnload.bind(this))
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
  }

  destroy() {
    this.cleanup()
  }
}

export const sessionManager = new SessionManager()
export default sessionManager 