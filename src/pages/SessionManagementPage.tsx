import React, { useState } from 'react'
import { Monitor, Smartphone, Tablet, MapPin, Clock, Shield, AlertTriangle, Trash2, LogOut } from 'lucide-react'
import useSessionManager from '../hooks/useSessionManager'
import { useUIStore } from '../store/uiStore'

export default function SessionManagementPage() {
  const [isRevoking, setIsRevoking] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  const {
    sessions,
    isLoading,
    settings,
    currentSessionId,
    revokeSession,
    revokeAllOtherSessions,
    updateSettings,
    getCurrentSessionInfo,
    getSuspiciousSessions,
    hasMultipleSessions,
    hasSuspiciousSessions,
    refreshSessions
  } = useSessionManager()
  
  const { addNotification } = useUIStore()

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-5 h-5" />
      case 'tablet': return <Tablet className="w-5 h-5" />
      default: return <Monitor className="w-5 h-5" />
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    if (sessionId === currentSessionId) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Não é possível revogar a sessão atual'
      })
      return
    }

    setIsRevoking(true)
    try {
      const success = await revokeSession(sessionId)
      if (success) {
        addNotification({
          type: 'success',
          title: 'Sessão Revogada',
          message: 'A sessão foi revogada com sucesso'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Erro',
          message: 'Falha ao revogar a sessão'
        })
      }
    } finally {
      setIsRevoking(false)
    }
  }

  const handleRevokeAllOthers = async () => {
    if (!hasMultipleSessions) return

    setIsRevoking(true)
    try {
      const success = await revokeAllOtherSessions()
      if (success) {
        addNotification({
          type: 'success',
          title: 'Sessões Revogadas',
          message: 'Todas as outras sessões foram revogadas'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Erro',
          message: 'Falha ao revogar outras sessões'
        })
      }
    } finally {
      setIsRevoking(false)
    }
  }

  const handleUpdateInactivityTimeout = (minutes: number) => {
    updateSettings({ inactivityTimeout: minutes })
    addNotification({
      type: 'success',
      title: 'Configuração Salva',
      message: `Timeout de inatividade definido para ${minutes} minutos`
    })
  }

  const handleUpdateMaxSessions = (max: number) => {
    updateSettings({ maxSessions: max })
    addNotification({
      type: 'success',
      title: 'Configuração Salva',
      message: `Máximo de sessões definido para ${max}`
    })
  }

  const suspiciousSessions = getSuspiciousSessions()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gerenciar Sessões
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize e controle suas sessões ativas em diferentes dispositivos
          </p>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Shield className="w-4 h-4" />
          <span>Configurações</span>
        </button>
      </div>

      {/* Alertas de Segurança */}
      {hasSuspiciousSessions && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Sessões Suspeitas Detectadas
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Foram detectadas {suspiciousSessions.length} sessões que podem ser suspeitas. 
                Verifique se você reconhece todos os dispositivos e locais.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configurações de Sessão */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Configurações de Segurança
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timeout de Inatividade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timeout de Inatividade (minutos)
              </label>
              <select
                value={settings.inactivityTimeout}
                onChange={(e) => handleUpdateInactivityTimeout(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={60}>1 hora</option>
                <option value={120}>2 horas</option>
                <option value={240}>4 horas</option>
              </select>
            </div>

            {/* Máximo de Sessões */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Máximo de Sessões Simultâneas
              </label>
              <select
                value={settings.maxSessions}
                onChange={(e) => handleUpdateMaxSessions(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value={3}>3 sessões</option>
                <option value={5}>5 sessões</option>
                <option value={10}>10 sessões</option>
                <option value={20}>20 sessões</option>
              </select>
            </div>
          </div>

          {/* Ações de Segurança */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleRevokeAllOthers}
              disabled={!hasMultipleSessions || isRevoking}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Encerrar Outras Sessões</span>
            </button>
            
            <button
              onClick={refreshSessions}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Atualizar Lista</span>
            </button>
          </div>
        </div>
      )}

      {/* Lista de Sessões */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sessões Ativas ({sessions.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando sessões...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">Nenhuma sessão ativa encontrada</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isCurrent = session.id === currentSessionId
              const isSuspicious = suspiciousSessions.some(s => s.id === session.id)
              
              return (
                <div key={session.id} className={`p-6 ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Ícone do Dispositivo */}
                      <div className={`p-2 rounded-lg ${isCurrent ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        {getDeviceIcon(session.device_info.type)}
                      </div>

                      {/* Informações da Sessão */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {session.device_info.browser} em {session.device_info.os}
                          </h3>
                          {isCurrent && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                              Sessão Atual
                            </span>
                          )}
                          {isSuspicious && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Suspeita
                            </span>
                          )}
                        </div>

                        <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{session.ip_address}</span>
                            {session.location && (
                              <span>• {session.location.city}, {session.location.country}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>Última atividade: {new Date(session.last_activity).toLocaleString()}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Monitor className="w-4 h-4" />
                            <span>Criada em: {new Date(session.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    {!isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={isRevoking}
                        className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Encerrar esta sessão"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Encerrar</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Informações de Segurança */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Dicas de Segurança
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Sempre termine suas sessões em dispositivos públicos ou compartilhados</li>
          <li>• Monitore regularmente suas sessões ativas para detectar atividade suspeita</li>
          <li>• Use "Lembre-se de mim" apenas em dispositivos pessoais</li>
          <li>• Configure um timeout de inatividade apropriado para seu ambiente</li>
        </ul>
      </div>
    </div>
  )
} 