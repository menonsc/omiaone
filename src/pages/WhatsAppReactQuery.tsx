import React from 'react'
import { useState } from 'react'
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
import { useUIStore } from '../store/uiStore'
import { useChatStore } from '../store/chatStore'
import { 
  useInstances, 
  useCreateInstance, 
  useConnectInstance, 
  useDisconnectInstance, 
  useDeleteInstance,
  useQRCode
} from '../hooks/useWhatsAppQueries'

export default function WhatsAppReactQuery() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQRCode, setSelectedQRCode] = useState<{qrCode: string, instanceName: string} | null>(null)
  const [newInstanceName, setNewInstanceName] = useState('')

  // React Query Hooks
  const { data: instances = [], isLoading, error, refetch } = useInstances()
  const createInstanceMutation = useCreateInstance()
  const connectInstanceMutation = useConnectInstance()
  const disconnectInstanceMutation = useDisconnectInstance()
  const deleteInstanceMutation = useDeleteInstance()

  const { agents } = useChatStore()
  const { addNotification } = useUIStore()

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Nome da instância é obrigatório'
      })
      return
    }

    try {
      await createInstanceMutation.mutateAsync(newInstanceName.trim())
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

    try {
      await connectInstanceMutation.mutateAsync(instanceId)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao conectar instância'
      })
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

    try {
      await disconnectInstanceMutation.mutateAsync(instanceId)
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

    try {
      await deleteInstanceMutation.mutateAsync(instanceId)
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

  // Componente QR Code Modal
  const QRCodeModal = () => {
    if (!selectedQRCode) return null

    const { data: qrData } = useQRCode(selectedQRCode.instanceName)

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">QR Code - {selectedQRCode.instanceName}</h3>
            <button
              onClick={() => setShowQRModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="text-center">
            {qrData?.base64 ? (
              <div>
                <img 
                  src={`data:image/png;base64,${qrData.base64}`} 
                  alt="QR Code" 
                  className="mx-auto mb-4"
                />
                <p className="text-sm text-gray-600">
                  Escaneie este QR Code com seu WhatsApp
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="ml-2 text-gray-600">Carregando QR Code...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Business</h1>
            <p className="text-gray-600">Gerencie suas instâncias do WhatsApp</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Instância</span>
          </button>
        </div>
      </div>

      {/* Status da API */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">
              Erro ao carregar instâncias: {error.message}
            </span>
          </div>
        </div>
      )}

      {/* Lista de Instâncias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-6"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))
        ) : instances.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma instância encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Crie sua primeira instância do WhatsApp para começar
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Instância</span>
            </button>
          </div>
        ) : (
          instances.map((instance: any) => (
            <motion.div
              key={instance.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Smartphone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{instance.name}</h3>
                    <p className="text-sm text-gray-500">ID: {instance.id}</p>
                  </div>
                </div>
                {getStatusIcon(instance.status)}
              </div>

              <div className="space-y-3 mb-4">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(instance.status)}`}>
                  {getStatusText(instance.status)}
                </div>
                
                {instance.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{instance.phone}</span>
                  </div>
                )}
                
                {instance.lastActivity && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Última atividade: {new Date(instance.lastActivity).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                {instance.status === 'connected' ? (
                  <button
                    onClick={() => handleDisconnect(instance.id)}
                    disabled={disconnectInstanceMutation.isPending}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    <PowerOff className="w-4 h-4" />
                    <span>{disconnectInstanceMutation.isPending ? 'Desconectando...' : 'Desconectar'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(instance.id)}
                    disabled={connectInstanceMutation.isPending}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                  >
                    <Power className="w-4 h-4" />
                    <span>{connectInstanceMutation.isPending ? 'Conectando...' : 'Conectar'}</span>
                  </button>
                )}

                {instance.status === 'qr_needed' && (
                  <button
                    onClick={() => handleShowQRCode(instance.qrCode || '', instance.name)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(instance.id)}
                  disabled={deleteInstanceMutation.isPending}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal de Criação */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold mb-4">Criar Nova Instância</h3>
              <input
                type="text"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                placeholder="Nome da instância"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateInstance}
                  disabled={createInstanceMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {createInstanceMutation.isPending ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal QR Code */}
      <AnimatePresence>
        {showQRModal && <QRCodeModal />}
      </AnimatePresence>
    </div>
  )
} 