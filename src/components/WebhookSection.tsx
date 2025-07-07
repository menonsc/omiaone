import React, { useState, useEffect } from 'react'
import { 
  Webhook, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Settings, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  Activity,
  Zap,
  Shield,
  RotateCcw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebhookStore, useWebhooks, useWebhookStats, useWebhookLoading, useWebhookError } from '../store/webhookStore'
import { CreateWebhookData, WebhookEventType } from '../services/webhookService'
import { useUIStore } from '../store/uiStore'
import { Spinner, LoadingButton } from './ui/feedback'
import { useAuthStore } from '../store/authStore'

const WebhookSection: React.FC = () => {
  const { addNotification } = useUIStore()
  const webhooks = useWebhooks()
  const stats = useWebhookStats()
  const { isLoading, isCreating, isUpdating, isDeleting, isTesting } = useWebhookLoading()
  const error = useWebhookError()
  
  const {
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    fetchStats,
    setError
  } = useWebhookStore()

  const { user } = useAuthStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [eventFilter, setEventFilter] = useState<string>('all')

  // Form states
  const [formData, setFormData] = useState<CreateWebhookData>({
    name: '',
    description: '',
    url: '',
    events: [],
    secret_key: '',
    headers: {},
    retry_enabled: true,
    max_retries: 3,
    retry_delay_seconds: 60,
    filters: {},
    user_id: user?.id || ''
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    fetchWebhooks()
    fetchStats()
  }, [])

  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error
      })
      setError(null)
    }
  }, [error])

  // =====================================================
  // EVENT HANDLERS
  // =====================================================

  // Função utilitária para limpar campos opcionais antes do envio
  const cleanPayload = (data: CreateWebhookData) => {
    return {
      ...data,
      description: data.description?.trim() ? data.description : undefined,
      secret_key: data.secret_key?.trim() ? data.secret_key : undefined,
      headers: data.headers && Object.keys(data.headers).length > 0 ? data.headers : {},
      filters: data.filters && Object.keys(data.filters).length > 0 ? data.filters : {},
      events: Array.isArray(data.events) ? data.events : [],
      url: data.url?.trim() || '',
    }
  }

  const handleCreateWebhook = async () => {
    try {
      if (!user?.id) throw new Error('Usuário não autenticado')
      await createWebhook({ ...cleanPayload(formData), user_id: user.id })
      setShowCreateModal(false)
      resetForm()
      addNotification({
        type: 'success',
        title: 'Sucesso',
        message: 'Webhook criado com sucesso!'
      })
    } catch (error) {
      // Error já tratado no store
    }
  }

  const handleUpdateWebhook = async () => {
    if (!selectedWebhook) return
    
    try {
      if (!user?.id) throw new Error('Usuário não autenticado')
      await updateWebhook(selectedWebhook.id, { ...cleanPayload(formData), user_id: user.id })
      setShowEditModal(false)
      resetForm()
      addNotification({
        type: 'success',
        title: 'Sucesso',
        message: 'Webhook atualizado com sucesso!'
      })
    } catch (error) {
      // Error já tratado no store
    }
  }

  const handleDeleteWebhook = async () => {
    if (!selectedWebhook) return
    
    try {
      await deleteWebhook(selectedWebhook.id)
      setShowDeleteModal(false)
      setSelectedWebhook(null)
      addNotification({
        type: 'success',
        title: 'Sucesso',
        message: 'Webhook deletado com sucesso!'
      })
    } catch (error) {
      // Error já tratado no store
    }
  }

  const handleTestWebhook = async (webhook: any) => {
    try {
      const result = await testWebhook(webhook.id)
      addNotification({
        type: result.success ? 'success' : 'error',
        title: result.success ? 'Teste Bem-sucedido' : 'Teste Falhou',
        message: result.message
      })
    } catch (error) {
      // Error já tratado no store
    }
  }

  const handleToggleStatus = async (webhook: any) => {
    const newStatus = webhook.status === 'active' ? 'inactive' : 'active'
    try {
      await updateWebhook(webhook.id, { status: newStatus })
      addNotification({
        type: 'success',
        title: 'Status Atualizado',
        message: `Webhook ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`
      })
    } catch (error) {
      // Error já tratado no store
    }
  }

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      url: '',
      events: [],
      secret_key: '',
      headers: {},
      retry_enabled: true,
      max_retries: 3,
      retry_delay_seconds: 60,
      filters: {},
      user_id: user?.id || ''
    })
    setShowAdvanced(false)
  }

  const openEditModal = (webhook: any) => {
    setSelectedWebhook(webhook)
    setFormData({
      name: webhook.name,
      description: webhook.description || '',
      url: webhook.url,
      events: webhook.events,
      secret_key: webhook.secret_key || '',
      headers: webhook.headers || {},
      retry_enabled: webhook.retry_enabled,
      max_retries: webhook.max_retries,
      retry_delay_seconds: webhook.retry_delay_seconds,
      filters: webhook.filters || {},
      user_id: user?.id || ''
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (webhook: any) => {
    setSelectedWebhook(webhook)
    setShowDeleteModal(true)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      addNotification({
        type: 'success',
        title: 'Copiado',
        message: 'URL copiada para a área de transferência!'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao copiar URL'
      })
    }
  }

  // =====================================================
  // FILTERING
  // =====================================================

  const filteredWebhooks = webhooks.filter(webhook => {
    const matchesSearch = webhook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         webhook.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || webhook.status === statusFilter
    const matchesEvent = eventFilter === 'all' || webhook.events.includes(eventFilter as WebhookEventType)
    
    return matchesSearch && matchesStatus && matchesEvent
  })

  // =====================================================
  // RENDER FUNCTIONS
  // =====================================================

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'inactive': return <Pause className="w-4 h-4 text-gray-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'testing': return <Clock className="w-4 h-4 text-yellow-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200'
      case 'inactive': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'testing': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6 px-4 md:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Webhook className="w-6 h-6 text-blue-600" />
            <span>Webhooks</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure webhooks para receber notificações em tempo real
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Webhook</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 min-h-[120px] shadow-sm">
            <div className="mb-2 p-3 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Webhook className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total_webhooks}</div>
          </div>
          <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 min-h-[120px] shadow-sm">
            <div className="mb-2 p-3 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Ativos</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.active_webhooks}</div>
          </div>
          <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 min-h-[120px] shadow-sm">
            <div className="mb-2 p-3 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Entregas</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total_deliveries}</div>
          </div>
          <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 min-h-[120px] shadow-sm">
            <div className="mb-2 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Taxa Sucesso</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.success_rate.toFixed(1)}%</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar webhooks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="error">Erro</option>
              <option value="testing">Testando</option>
            </select>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos os Eventos</option>
              <option value="whatsapp_message">Mensagem WhatsApp</option>
              <option value="whatsapp_connection">Conexão WhatsApp</option>
              <option value="user_login">Login de Usuário</option>
              <option value="user_logout">Logout de Usuário</option>
              <option value="document_upload">Upload de Documento</option>
              <option value="email_sent">Email Enviado</option>
              <option value="campaign_sent">Campanha Enviada</option>
              <option value="integration_sync">Sincronização</option>
              <option value="system_alert">Alerta do Sistema</option>
              <option value="audit_log">Log de Auditoria</option>
              <option value="custom">Customizado</option>
            </select>
          </div>
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setEventFilter('all')
            }}
            className="ml-0 sm:ml-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors flex-shrink-0"
            title="Limpar filtros"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Webhooks List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {isLoading ? (
          <div className="py-12 text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando webhooks...</p>
          </div>
        ) : filteredWebhooks.length === 0 ? (
          <div className="py-12 text-center">
            <Webhook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum webhook encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' || eventFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Crie seu primeiro webhook para começar a receber notificações'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && eventFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Primeiro Webhook
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredWebhooks.map((webhook) => (
              <div key={webhook.id} className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {webhook.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(webhook.status)}`}>
                        {getStatusIcon(webhook.status)}
                        <span className="ml-1">{webhook.status}</span>
                      </span>
                    </div>
                    
                    {webhook.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {webhook.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <ExternalLink className="w-4 h-4" />
                        <span className="truncate max-w-xs">{webhook.url}</span>
                        <button
                          onClick={() => copyToClipboard(webhook.url)}
                          className="p-1 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Zap className="w-4 h-4" />
                        <span>{webhook.events.length} eventos</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Activity className="w-4 h-4" />
                        <span>{webhook.total_deliveries} entregas</span>
                      </div>
                      
                      {webhook.last_delivery_at && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Última: {formatDate(webhook.last_delivery_at)}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Event Tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {webhook.events.map((event) => (
                        <span
                          key={event}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleTestWebhook(webhook)}
                      disabled={isTesting}
                      className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Testar Webhook"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleToggleStatus(webhook)}
                      disabled={isUpdating}
                      className="p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      title={webhook.status === 'active' ? 'Desativar' : 'Ativar'}
                    >
                      {webhook.status === 'active' ? <Pause className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => openEditModal(webhook)}
                      className="p-2 text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => openDeleteModal(webhook)}
                      className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <WebhookModal
            isOpen={showCreateModal || showEditModal}
            onClose={() => {
              setShowCreateModal(false)
              setShowEditModal(false)
              resetForm()
            }}
            onSubmit={showCreateModal ? handleCreateWebhook : handleUpdateWebhook}
            formData={formData}
            setFormData={setFormData}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            isLoading={isCreating || isUpdating}
            isEdit={showEditModal}
          />
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedWebhook && (
          <DeleteModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteWebhook}
            webhook={selectedWebhook}
            isLoading={isDeleting}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// =====================================================
// MODAL COMPONENTS
// =====================================================

interface WebhookModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  formData: CreateWebhookData
  setFormData: (data: CreateWebhookData) => void
  showAdvanced: boolean
  setShowAdvanced: (show: boolean) => void
  isLoading: boolean
  isEdit: boolean
}

const WebhookModal: React.FC<WebhookModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  showAdvanced,
  setShowAdvanced,
  isLoading,
  isEdit
}) => {
  const eventOptions: { value: WebhookEventType; label: string; description: string }[] = [
    { value: 'whatsapp_message', label: 'Mensagem WhatsApp', description: 'Quando uma mensagem é recebida ou enviada' },
    { value: 'whatsapp_connection', label: 'Conexão WhatsApp', description: 'Quando o status da conexão muda' },
    { value: 'user_login', label: 'Login de Usuário', description: 'Quando um usuário faz login' },
    { value: 'user_logout', label: 'Logout de Usuário', description: 'Quando um usuário faz logout' },
    { value: 'document_upload', label: 'Upload de Documento', description: 'Quando um documento é enviado' },
    { value: 'email_sent', label: 'Email Enviado', description: 'Quando um email é enviado' },
    { value: 'campaign_sent', label: 'Campanha Enviada', description: 'Quando uma campanha é enviada' },
    { value: 'integration_sync', label: 'Sincronização', description: 'Quando uma integração sincroniza dados' },
    { value: 'system_alert', label: 'Alerta do Sistema', description: 'Quando um alerta do sistema é gerado' },
    { value: 'audit_log', label: 'Log de Auditoria', description: 'Quando um log de auditoria é criado' },
    { value: 'custom', label: 'Customizado', description: 'Eventos customizados' }
  ]

  const handleEventToggle = (event: WebhookEventType) => {
    const newEvents = formData.events.includes(event)
      ? formData.events.filter(e => e !== event)
      : [...formData.events, event]
    
    setFormData({ ...formData, events: newEvents })
  }

  const handleInputChange = (field: keyof CreateWebhookData, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Editar Webhook' : 'Novo Webhook'}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Nome do webhook"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Descrição opcional do webhook"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://seu-servidor.com/webhook"
              />
            </div>
          </div>

          {/* Events */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Eventos *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {eventOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={formData.events.includes(option.value)}
                    onChange={() => handleEventToggle(option.value)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Settings className="w-4 h-4" />
              <span>Configurações Avançadas</span>
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 space-y-4 overflow-hidden"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Chave Secreta (HMAC)
                    </label>
                    <input
                      type="text"
                      value={formData.secret_key}
                      onChange={(e) => handleInputChange('secret_key', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Chave para assinatura HMAC (opcional)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Máximo de Tentativas
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.max_retries}
                        onChange={(e) => handleInputChange('max_retries', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Delay de Retry (segundos)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="3600"
                        value={formData.retry_delay_seconds}
                        onChange={(e) => handleInputChange('retry_delay_seconds', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.retry_enabled}
                        onChange={(e) => handleInputChange('retry_enabled', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Habilitar retry automático
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <LoadingButton
            onClick={onSubmit}
            loading={isLoading}
            disabled={!formData.name || !formData.url || formData.events.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isEdit ? 'Atualizar' : 'Criar'} Webhook
          </LoadingButton>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  webhook: any
  isLoading: boolean
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  webhook,
  isLoading
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Deletar Webhook
            </h2>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Tem certeza que deseja deletar o webhook <strong>{webhook.name}</strong>? 
            Esta ação não pode ser desfeita.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <LoadingButton
              onClick={onConfirm}
              loading={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Deletar
            </LoadingButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default WebhookSection 