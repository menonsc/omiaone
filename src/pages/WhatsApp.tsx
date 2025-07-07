import React from 'react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Plus, 
  Settings, 
  QrCode, 
  Power, 
  PowerOff, 
  Trash2, 
  Phone,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader,
  MessageSquare,
  Bot,
  Smartphone,
  Bell
} from 'lucide-react'
import { useWhatsAppStore } from '../store/whatsappStore'
import { useUIStore } from '../store/uiStore'
import { useChatStore } from '../store/chatStore'
import { 
  LoadingButton, 
  StatusBadge, 
  LoadingOverlay, 
  ListSkeleton,
  Spinner 
} from '../components/ui/feedback'

export default function WhatsApp() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQRCode, setSelectedQRCode] = useState<{qrCode: string, instanceName: string} | null>(null)
  const [newInstanceName, setNewInstanceName] = useState('')
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({})
  const [creatingInstance, setCreatingInstance] = useState(false)

  const {
    instances,
    isLoading,
    config,
    fetchInstances,
    createInstance,
    connectInstance,
    disconnectInstance,
    deleteInstance,
    updateConfig
  } = useWhatsAppStore()

  const { agents } = useChatStore()
  const { addNotification } = useUIStore()

  useEffect(() => {
    fetchInstances()
  }, [fetchInstances])

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Nome da instância é obrigatório'
      })
      return
    }

    setCreatingInstance(true)
    try {
      await createInstance(newInstanceName.trim())
      setNewInstanceName('')
      setShowCreateModal(false)
      addNotification({
        type: 'success',
        title: 'Sucesso',
        message: 'Instância criada com sucesso!'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao criar instância'
      })
    } finally {
      setCreatingInstance(false)
    }
  }

  const handleConnect = async (instanceId: string) => {
    console.log('🟢 CONECTAR clicado - instanceId:', instanceId)
    
    if (!instanceId || instanceId.trim() === '') {
      console.error('❌ ID da instância inválido:', instanceId)
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'ID da instância inválido'
      })
      return
    }

    setLoadingStates(prev => ({ ...prev, [`connect-${instanceId}`]: true }))
    try {
      await connectInstance(instanceId)
      addNotification({
        type: 'success',
        title: 'Sucesso',
        message: 'Conectando instância...'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao conectar instância'
      })
    } finally {
      setLoadingStates(prev => ({ ...prev, [`connect-${instanceId}`]: false }))
    }
  }

  const handleDisconnect = async (instanceId: string) => {
    console.log('🔴 DESCONECTAR clicado - instanceId:', instanceId)
    
    if (!instanceId || instanceId.trim() === '') {
      console.error('❌ ID da instância inválido:', instanceId)
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'ID da instância inválido'
      })
      return
    }

    setLoadingStates(prev => ({ ...prev, [`disconnect-${instanceId}`]: true }))
    try {
      await disconnectInstance(instanceId)
      addNotification({
        type: 'success',
        title: 'Sucesso',
        message: 'Instância desconectada'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao desconectar instância'
      })
    } finally {
      setLoadingStates(prev => ({ ...prev, [`disconnect-${instanceId}`]: false }))
    }
  }

  const handleDelete = async (instanceId: string) => {
    console.log('🗑️ EXCLUIR clicado - instanceId:', instanceId)
    
    if (!instanceId || instanceId.trim() === '') {
      console.error('❌ ID da instância inválido:', instanceId)
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'ID da instância inválido'
      })
      return
    }

    if (!confirm('Tem certeza que deseja excluir esta instância?')) return

    setLoadingStates(prev => ({ ...prev, [`delete-${instanceId}`]: true }))
    try {
      await deleteInstance(instanceId)
      addNotification({
        type: 'success',
        title: 'Sucesso',
        message: 'Instância excluída'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao excluir instância'
      })
    } finally {
      setLoadingStates(prev => ({ ...prev, [`delete-${instanceId}`]: false }))
    }
  }

  const handleShowQRCode = (qrCode: string, instanceName: string) => {
    setSelectedQRCode({ qrCode, instanceName })
    setShowQRModal(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'connecting':
      case 'qr_needed':
        return <Loader className="w-5 h-5 text-yellow-500 animate-spin" />
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado'
      case 'connecting':
        return 'Conectando...'
      case 'qr_needed':
        return 'QR Code necessário'
      default:
        return 'Desconectado'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'connecting':
      case 'qr_needed':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      default:
        return 'bg-red-50 text-red-700 border-red-200'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center">
            <MessageCircle className="w-8 h-8 mr-3 text-green-500" />
            WhatsApp Integration
          </h1>
          <p className="text-neutral-600 dark:text-gray-400 mt-2">
            Gerencie suas instâncias WhatsApp e configure respostas automáticas
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => window.location.href = '/whatsapp/conversations'}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ver Conversas</span>
          </button>
          
          <button
            onClick={() => {
              if (confirm('Tem certeza que deseja limpar todos os dados locais do WhatsApp?\n\nEsta ação vai:\n• Remover todas as instâncias da interface\n• Limpar configurações locais\n• Parar qualquer polling ativo\n\nVocê precisará buscar as instâncias novamente da API.')) {
                // Clear localStorage
                localStorage.removeItem('whatsapp_instances')
                localStorage.removeItem('whatsapp_store')
                localStorage.removeItem('whatsapp_config')
                
                // Clear sessionStorage
                sessionStorage.removeItem('whatsapp_instances')
                sessionStorage.removeItem('whatsapp_store')
                
                addNotification({
                  type: 'success',
                  title: 'Dados Limpos',
                  message: 'Dados locais limpos! A página será recarregada para parar qualquer polling ativo.'
                })
                
                // Reload page after a brief delay
                setTimeout(() => {
                  window.location.reload()
                }, 2000)
              }
            }}
            className="border border-orange-400 text-orange-600 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-orange-50 transition-colors"
            title="Limpar dados locais e parar polling infinito"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Limpar Dados</span>
          </button>
          
          <button
            onClick={() => {
              const types = ['success', 'error', 'warning', 'info'] as const
              const messages = [
                { title: 'Teste Sucesso', message: 'Esta é uma notificação de sucesso!' },
                { title: 'Teste Erro', message: 'Esta é uma notificação de erro!' },
                { title: 'Teste Aviso', message: 'Esta é uma notificação de aviso!' },
                { title: 'Teste Info', message: 'Esta é uma notificação informativa!' }
              ]
              
              const randomType = types[Math.floor(Math.random() * types.length)]
              const randomMessage = messages[Math.floor(Math.random() * messages.length)]
              
              addNotification({
                type: randomType,
                title: randomMessage.title,
                message: randomMessage.message
              })
            }}
            className="border border-blue-400 text-blue-600 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-50 transition-colors"
            title="Testar sistema de notificações"
          >
            <Bell className="w-4 h-4" />
            <span>Testar Notificação</span>
          </button>
          
          <button
            onClick={() => setShowConfigModal(true)}
            className="bg-neutral-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-neutral-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Instância</span>
          </button>
        </div>
      </div>

      {/* Configuration Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-neutral-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Bot className="w-8 h-8 text-primary-500" />
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">Resposta Automática</h3>
              <p className="text-sm text-neutral-500 dark:text-gray-400">
                {config.autoReply ? 'Ativada' : 'Desativada'}
              </p>
            </div>
          </div>
          {config.autoReply && config.agentId && (
            <div className="text-sm text-green-600 dark:text-green-400">
              ✓ Agente configurado
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-neutral-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-8 h-8 text-orange-500" />
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">Horário Comercial</h3>
              <p className="text-sm text-neutral-500 dark:text-gray-400">
                {config.businessHours?.enabled ? 'Configurado' : 'Não configurado'}
              </p>
            </div>
          </div>
          {config.businessHours?.enabled && (
            <div className="text-sm text-blue-600 dark:text-blue-400">
              {config.businessHours.start} - {config.businessHours.end}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-neutral-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Smartphone className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">Instâncias Ativas</h3>
              <p className="text-sm text-neutral-500 dark:text-gray-400">
                {instances.filter(i => i.status === 'connected').length} de {instances.length}
              </p>
            </div>
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            {instances.filter(i => i.status === 'connected').length > 0 ? '✓ Operacional' : '⚠ Nenhuma ativa'}
          </div>
        </div>
      </div>

      {/* Instances List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-neutral-200 dark:border-gray-700">
        <div className="p-6 border-b border-neutral-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Instâncias WhatsApp
          </h2>
          <p className="text-neutral-600 dark:text-gray-400 mt-1">
            Gerencie suas conexões WhatsApp
          </p>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="space-y-6">
              <ListSkeleton items={2} showAvatar={true} />
            </div>
          ) : instances.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                Nenhuma instância criada
              </h3>
              <p className="text-neutral-600 dark:text-gray-400 mb-6">
                Crie sua primeira instância WhatsApp para começar
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Criar Instância</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {instances.map((instance) => {
                console.log('🎯 Renderizando instância:', instance);
                return (
                  <motion.div
                    key={instance.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neutral-50 dark:bg-gray-700/50 rounded-lg p-6 border border-neutral-200 dark:border-gray-600"
                  >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white">
                          {instance.name}
                        </h3>
                        {instance.phone && (
                          <p className="text-sm text-neutral-600 dark:text-gray-400 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {instance.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {instance.status === 'connected' ? (
                        <LoadingButton
                          loading={loadingStates[`disconnect-${instance.id}`]}
                          onClick={() => handleDisconnect(instance.id)}
                          variant="outline"
                          size="sm"
                          loadingText="Desconectando..."
                          className="text-red-600 hover:bg-red-50 border-red-200"
                        >
                          <PowerOff className="w-4 h-4" />
                        </LoadingButton>
                      ) : (
                        <LoadingButton
                          loading={loadingStates[`connect-${instance.id}`]}
                          onClick={() => handleConnect(instance.id)}
                          variant="outline"
                          size="sm"
                          loadingText="Conectando..."
                          className="text-green-600 hover:bg-green-50 border-green-200"
                        >
                          <Power className="w-4 h-4" />
                        </LoadingButton>
                      )}
                      
                      <LoadingButton
                        loading={loadingStates[`delete-${instance.id}`]}
                        onClick={() => handleDelete(instance.id)}
                        variant="outline"
                        size="sm"
                        loadingText="Excluindo..."
                        className="text-red-600 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </LoadingButton>
                    </div>
                  </div>

                  {/* Status */}
                  <StatusBadge 
                    status={
                      instance.status === 'connected' ? 'success' :
                      instance.status === 'connecting' || instance.status === 'qr_needed' ? 'warning' :
                      'error'
                    }
                    text={getStatusText(instance.status)}
                    size="md"
                  />

                  {/* QR Code */}
                  {instance.status === 'qr_needed' && instance.qrCode && (
                    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className="text-center">
                        <QrCode className="w-6 h-6 mx-auto mb-2 text-neutral-600 dark:text-gray-400" />
                        <p className="text-sm text-neutral-600 dark:text-gray-400 mb-3">
                          Escaneie o QR Code com seu WhatsApp
                        </p>
                        <div className="relative">
                          <img 
                            src={instance.qrCode} 
                            alt="QR Code" 
                            className="mx-auto max-w-32 border rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleShowQRCode(instance.qrCode!, instance.name)}
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleShowQRCode(instance.qrCode!, instance.name)}
                              className="bg-black bg-opacity-50 text-white p-2 rounded-full"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-gray-500 mt-2">
                          Clique para ampliar
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Last Activity */}
                  {instance.lastActivity && (
                    <div className="mt-4 text-xs text-neutral-500 dark:text-gray-500">
                      Última atividade: {new Date(instance.lastActivity).toLocaleString('pt-BR')}
                    </div>
                  )}
                </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Instance Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                Criar Nova Instância
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                    Nome da Instância
                  </label>
                  <input
                    type="text"
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                    placeholder="Ex: whatsapp-vendas"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-neutral-500 dark:text-gray-400 mt-1">
                    Use apenas letras, números e hífens
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={creatingInstance}
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-gray-600 text-neutral-700 dark:text-gray-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <LoadingButton
                  loading={creatingInstance}
                  onClick={handleCreateInstance}
                  disabled={!newInstanceName.trim()}
                  variant="primary"
                  loadingText="Criando..."
                  className="flex-1"
                >
                  Criar
                </LoadingButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && selectedQRCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 w-full max-w-md text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center mb-4">
                <QrCode className="w-8 h-8 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                  QR Code - {selectedQRCode.instanceName}
                </h2>
              </div>
              
              <p className="text-neutral-600 dark:text-gray-400 mb-6">
                Escaneie este QR Code com seu WhatsApp para conectar
              </p>
              
              <div className="bg-white p-4 rounded-lg inline-block border-2 border-neutral-200">
                <img 
                  src={selectedQRCode.qrCode} 
                  alt="QR Code" 
                  className="w-64 h-64 mx-auto"
                />
              </div>
              
              <div className="mt-6 text-sm text-neutral-500 dark:text-gray-500">
                <p>• Abra o WhatsApp no seu celular</p>
                <p>• Toque nos três pontos → Dispositivos conectados</p>
                <p>• Toque em "Conectar um dispositivo"</p>
                <p>• Aponte a câmera para este QR Code</p>
              </div>

              <button
                onClick={() => setShowQRModal(false)}
                className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Config Modal */}
      <AnimatePresence>
        {showConfigModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowConfigModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">
                Configurações WhatsApp
              </h2>

              <div className="space-y-6">
                {/* Auto Reply */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <input
                      type="checkbox"
                      id="autoReply"
                      checked={config.autoReply}
                      onChange={(e) => updateConfig({ autoReply: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-neutral-300 dark:border-gray-600 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="autoReply" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
                      Ativar resposta automática
                    </label>
                  </div>
                  
                  {config.autoReply && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                        Agente de IA
                      </label>
                      <select
                        value={config.agentId || ''}
                        onChange={(e) => updateConfig({ agentId: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Selecione um agente</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Business Hours */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <input
                      type="checkbox"
                      id="businessHours"
                      checked={config.businessHours?.enabled || false}
                      onChange={(e) => updateConfig({ 
                        businessHours: { 
                          ...config.businessHours!, 
                          enabled: e.target.checked 
                        } 
                      })}
                      className="w-4 h-4 text-primary-600 border-neutral-300 dark:border-gray-600 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="businessHours" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
                      Configurar horário comercial
                    </label>
                  </div>

                  {config.businessHours?.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                          Início
                        </label>
                        <input
                          type="time"
                          value={config.businessHours.start}
                          onChange={(e) => updateConfig({
                            businessHours: { ...config.businessHours!, start: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
                          Fim
                        </label>
                        <input
                          type="time"
                          value={config.businessHours.end}
                          onChange={(e) => updateConfig({
                            businessHours: { ...config.businessHours!, end: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-gray-600 text-neutral-700 dark:text-gray-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 