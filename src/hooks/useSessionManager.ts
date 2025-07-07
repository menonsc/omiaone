import { useState, useEffect, useCallback } from 'react'
import sessionManager, { type SessionSettings, type SessionInfo } from '../services/sessionManager'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../services/supabase'

export const useSessionManager = () => {
  const [settings, setSettings] = useState<SessionSettings>(sessionManager.getSettings())
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const { user } = useAuthStore()

  // Carregar sessões ativas
  const fetchSessions = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const sessionList = await sessionManager.getSessions()
      setSessions(sessionList)
      
      // Identificar sessão atual
      const current = sessionList.find(s => s.is_current)
      setCurrentSessionId(current?.id || null)
    } catch (error) {
      console.error('Erro ao buscar sessões:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Atualizar configurações
  const updateSettings = useCallback((newSettings: Partial<SessionSettings>) => {
    sessionManager.updateSettings(newSettings)
    setSettings(sessionManager.getSettings())
  }, [])

  // Revogar sessão específica
  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      await sessionManager.revokeSession(sessionId)
      await fetchSessions() // Recarregar lista
      return true
    } catch (error) {
      console.error('Erro ao revogar sessão:', error)
      return false
    }
  }, [fetchSessions])

  // Revogar todas as outras sessões
  const revokeAllOtherSessions = useCallback(async () => {
    if (!currentSessionId) return false
    
    try {
      await sessionManager.revokeAllOtherSessions(currentSessionId)
      await fetchSessions() // Recarregar lista
      return true
    } catch (error) {
      console.error('Erro ao revogar outras sessões:', error)
      return false
    }
  }, [currentSessionId, fetchSessions])

  // Ativar/desativar "Lembre-se de mim"
  const setRememberMe = useCallback((remember: boolean) => {
    sessionManager.setRememberMe(remember)
    updateSettings({ rememberMe: remember })
  }, [updateSettings])

  // Configurar timeout de inatividade
  const setInactivityTimeout = useCallback((minutes: number) => {
    updateSettings({ inactivityTimeout: minutes })
  }, [updateSettings])

  // Configurar máximo de sessões
  const setMaxSessions = useCallback((max: number) => {
    updateSettings({ maxSessions: max })
  }, [updateSettings])

  // Obter informações sobre a sessão atual
  const getCurrentSessionInfo = useCallback(() => {
    return sessions.find(s => s.is_current) || null
  }, [sessions])

  // Verificar se há sessões suspeitas
  const getSuspiciousSessions = useCallback(() => {
    if (!sessions.length) return []
    
    const current = getCurrentSessionInfo()
    if (!current) return []
    
    return sessions.filter(session => {
      // Sessões de IPs diferentes
      if (session.ip_address !== current.ip_address) return true
      
      // Sessões de dispositivos muito diferentes
      if (session.device_info.type !== current.device_info.type) return true
      
      // Sessões antigas (mais de 7 dias)
      const sessionAge = Date.now() - new Date(session.created_at).getTime()
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (sessionAge > sevenDays) return true
      
      return false
    })
  }, [sessions, getCurrentSessionInfo])

  // Configurar alertas de segurança
  const setupSecurityAlerts = useCallback(() => {
    const suspicious = getSuspiciousSessions()
    if (suspicious.length > 0) {
      // Notificar sobre sessões suspeitas
      console.warn('Sessões suspeitas detectadas:', suspicious)
      
      // Aqui você pode adicionar lógica para enviar notificações
      // ou alertas para o usuário
    }
  }, [getSuspiciousSessions])

  // Efeitos
  useEffect(() => {
    if (user) {
      fetchSessions()
    }
  }, [user, fetchSessions])

  useEffect(() => {
    setupSecurityAlerts()
  }, [sessions, setupSecurityAlerts])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      // Cleanup será feito pelo sessionManager quando necessário
    }
  }, [])

  return {
    // Estado
    settings,
    sessions,
    isLoading,
    currentSessionId,
    
    // Ações
    updateSettings,
    fetchSessions,
    revokeSession,
    revokeAllOtherSessions,
    setRememberMe,
    setInactivityTimeout,
    setMaxSessions,
    
    // Informações
    getCurrentSessionInfo,
    getSuspiciousSessions,
    
    // Utilitários
    refreshSessions: fetchSessions,
    hasMultipleSessions: sessions.length > 1,
    hasSuspiciousSessions: getSuspiciousSessions().length > 0
  }
}

export default useSessionManager 