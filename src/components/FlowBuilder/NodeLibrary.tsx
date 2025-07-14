import React, { useState } from 'react'
import { NodeTemplate, FlowNodeType } from '../../types/flowBuilder'
import { 
  Search,
  Filter,
  Zap,
  MessageSquare,
  ShoppingCart,
  Settings,
  BookOpen,
  Clock,
  Database,
  Bell,
  Code,
  Globe,
  Mail,
  Phone,
  Calendar,
  FileText,
  BarChart3,
  Users,
  Shield,
  Key
} from 'lucide-react'

interface NodeLibraryProps {
  onNodeSelect: (nodeTemplate: NodeTemplate) => void
  onClose: () => void
  isOpen: boolean
}

const NodeLibrary: React.FC<NodeLibraryProps> = ({
  onNodeSelect,
  onClose,
  isOpen
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Templates de nós pré-definidos
  const nodeTemplates: NodeTemplate[] = [
    // Triggers
    {
      id: 'webhook-trigger',
      type: 'trigger',
      subtype: 'webhook',
      name: 'Webhook Trigger',
      description: 'Inicia o fluxo quando recebe uma requisição webhook',
      icon: 'Globe',
      category: 'triggers',
      defaultConfig: {
        method: 'POST',
        path: '/webhook',
        headers: {},
        authentication: { type: 'none' }
      },
      inputs: [],
      outputs: [
        { id: 'data', name: 'Dados', type: 'object' },
        { id: 'headers', name: 'Headers', type: 'object' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
          path: { type: 'string' },
          headers: { type: 'object' }
        }
      }
    },
    {
      id: 'schedule-trigger',
      type: 'trigger',
      subtype: 'schedule',
      name: 'Agendamento',
      description: 'Inicia o fluxo em horários específicos',
      icon: 'Calendar',
      category: 'triggers',
      defaultConfig: {
        cron: '0 9 * * *',
        timezone: 'UTC'
      },
      inputs: [],
      outputs: [
        { id: 'timestamp', name: 'Timestamp', type: 'string' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          cron: { type: 'string' },
          timezone: { type: 'string' }
        }
      }
    },
    {
      id: 'message-trigger',
      type: 'trigger',
      subtype: 'message_received',
      name: 'Mensagem Recebida',
      description: 'Inicia quando uma mensagem é recebida',
      icon: 'MessageSquare',
      category: 'triggers',
      defaultConfig: {
        channel: 'whatsapp',
        messageType: 'text'
      },
      inputs: [],
      outputs: [
        { id: 'message', name: 'Mensagem', type: 'string' },
        { id: 'sender', name: 'Remetente', type: 'string' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          channel: { type: 'string', enum: ['whatsapp', 'telegram', 'email'] },
          messageType: { type: 'string', enum: ['text', 'media', 'any'] }
        }
      }
    },

    // Actions
    {
      id: 'send-message',
      type: 'action',
      subtype: 'send_message',
      name: 'Enviar Mensagem',
      description: 'Envia uma mensagem através de diferentes canais',
      icon: 'MessageSquare',
      category: 'actions',
      defaultConfig: {
        channel: 'whatsapp',
        messageType: 'text',
        message: 'Olá! Como posso ajudar?'
      },
      inputs: [
        { id: 'recipient', name: 'Destinatário', type: 'string', required: true },
        { id: 'message', name: 'Mensagem', type: 'string', required: true }
      ],
      outputs: [
        { id: 'messageId', name: 'ID da Mensagem', type: 'string' },
        { id: 'status', name: 'Status', type: 'string' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          channel: { type: 'string', enum: ['whatsapp', 'telegram', 'email'] },
          messageType: { type: 'string', enum: ['text', 'media', 'template'] },
          message: { type: 'string' }
        }
      }
    },
    {
      id: 'send-email',
      type: 'action',
      subtype: 'send_email',
      name: 'Enviar Email',
      description: 'Envia um email usando templates configurados',
      icon: 'Mail',
      category: 'actions',
      defaultConfig: {
        template: 'default',
        subject: 'Notificação',
        variables: {}
      },
      inputs: [
        { id: 'to', name: 'Para', type: 'string', required: true },
        { id: 'subject', name: 'Assunto', type: 'string', required: true },
        { id: 'content', name: 'Conteúdo', type: 'string', required: true }
      ],
      outputs: [
        { id: 'emailId', name: 'ID do Email', type: 'string' },
        { id: 'status', name: 'Status', type: 'string' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          template: { type: 'string' },
          subject: { type: 'string' },
          variables: { type: 'object' }
        }
      }
    },
    {
      id: 'api-call',
      type: 'action',
      subtype: 'api_call',
      name: 'Chamada API',
      description: 'Faz uma requisição para uma API externa',
      icon: 'Globe',
      category: 'actions',
      defaultConfig: {
        method: 'GET',
        url: 'https://api.example.com',
        headers: {},
        timeout: 30000
      },
      inputs: [
        { id: 'url', name: 'URL', type: 'string', required: true },
        { id: 'method', name: 'Método', type: 'string', required: true },
        { id: 'data', name: 'Dados', type: 'object', required: false }
      ],
      outputs: [
        { id: 'response', name: 'Resposta', type: 'object' },
        { id: 'status', name: 'Status', type: 'number' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
          url: { type: 'string' },
          headers: { type: 'object' },
          timeout: { type: 'number' }
        }
      }
    },

    // Conditions
    {
      id: 'condition-check',
      type: 'condition',
      subtype: 'field_check',
      name: 'Verificar Campo',
      description: 'Verifica condições em campos específicos',
      icon: 'Shield',
      category: 'conditions',
      defaultConfig: {
        field: 'value',
        operator: 'eq',
        value: ''
      },
      inputs: [
        { id: 'data', name: 'Dados', type: 'object', required: true }
      ],
      outputs: [
        { id: 'true', name: 'Verdadeiro', type: 'boolean' },
        { id: 'false', name: 'Falso', type: 'boolean' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          operator: { type: 'string', enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains'] },
          value: { type: 'string' }
        }
      }
    },

    // AI
    {
      id: 'ai-generate',
      type: 'ai',
      subtype: 'generate_response',
      name: 'Gerar Resposta IA',
      description: 'Gera respostas usando inteligência artificial',
      icon: 'BookOpen',
      category: 'ai',
      defaultConfig: {
        model: 'gpt-3.5-turbo',
        prompt: 'Responda de forma amigável e profissional',
        maxTokens: 150,
        temperature: 0.7
      },
      inputs: [
        { id: 'input', name: 'Entrada', type: 'string', required: true },
        { id: 'context', name: 'Contexto', type: 'object', required: false }
      ],
      outputs: [
        { id: 'response', name: 'Resposta', type: 'string' },
        { id: 'confidence', name: 'Confiança', type: 'number' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          model: { type: 'string' },
          prompt: { type: 'string' },
          maxTokens: { type: 'number' },
          temperature: { type: 'number', minimum: 0, maximum: 2 }
        }
      }
    },

    // Delays
    {
      id: 'delay-fixed',
      type: 'delay',
      subtype: 'fixed_delay',
      name: 'Atraso Fixo',
      description: 'Aguarda um tempo específico antes de continuar',
      icon: 'Clock',
      category: 'delays',
      defaultConfig: {
        duration: 60,
        unit: 'seconds'
      },
      inputs: [],
      outputs: [
        { id: 'completed', name: 'Concluído', type: 'boolean' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          duration: { type: 'number' },
          unit: { type: 'string', enum: ['seconds', 'minutes', 'hours', 'days'] }
        }
      }
    },

    // Data
    {
      id: 'data-transform',
      type: 'data',
      subtype: 'transform',
      name: 'Transformar Dados',
      description: 'Transforma e manipula dados',
      icon: 'Database',
      category: 'data',
      defaultConfig: {
        operation: 'map',
        mapping: {}
      },
      inputs: [
        { id: 'input', name: 'Entrada', type: 'object', required: true }
      ],
      outputs: [
        { id: 'output', name: 'Saída', type: 'object' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string', enum: ['map', 'filter', 'reduce', 'sort'] },
          mapping: { type: 'object' }
        }
      }
    },

    // Notifications
    {
      id: 'notification-send',
      type: 'notification',
      subtype: 'send_notification',
      name: 'Enviar Notificação',
      description: 'Envia notificações push ou in-app',
      icon: 'Bell',
      category: 'notifications',
      defaultConfig: {
        type: 'push',
        title: 'Notificação',
        message: 'Nova notificação'
      },
      inputs: [
        { id: 'recipient', name: 'Destinatário', type: 'string', required: true },
        { id: 'title', name: 'Título', type: 'string', required: true },
        { id: 'message', name: 'Mensagem', type: 'string', required: true }
      ],
      outputs: [
        { id: 'notificationId', name: 'ID da Notificação', type: 'string' },
        { id: 'status', name: 'Status', type: 'string' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['push', 'in-app', 'email'] },
          title: { type: 'string' },
          message: { type: 'string' }
        }
      }
    }
  ]

  const filteredNodes = nodeTemplates.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = [
    { id: 'all', name: 'Todos', icon: <Zap className="w-4 h-4" /> },
    { id: 'triggers', name: 'Triggers', icon: <Zap className="w-4 h-4" /> },
    { id: 'actions', name: 'Ações', icon: <Settings className="w-4 h-4" /> },
    { id: 'conditions', name: 'Condições', icon: <Shield className="w-4 h-4" /> },
    { id: 'ai', name: 'IA', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'delays', name: 'Atrasos', icon: <Clock className="w-4 h-4" /> },
    { id: 'data', name: 'Dados', icon: <Database className="w-4 h-4" /> },
    { id: 'notifications', name: 'Notificações', icon: <Bell className="w-4 h-4" /> }
  ]

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      Globe,
      Calendar,
      MessageSquare,
      Mail,
      Shield,
      BookOpen,
      Clock,
      Database,
      Bell,
      Code,
      Settings,
      BarChart3,
      Users,
      Key
    }
    return iconMap[iconName] || Zap
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Biblioteca de Nós</h2>
            <p className="text-gray-600 mt-1">
              Arraste um nó para o canvas para adicioná-lo ao fluxo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            ×
          </button>
        </div>

        {/* Filtros */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4">
            {/* Busca */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar nós..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Categorias */}
            <div className="flex gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category.icon}
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Nós */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredNodes.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum nó encontrado
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros de busca.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNodes.map(node => {
                const IconComponent = getIconComponent(node.icon)
                return (
                  <div
                    key={node.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => onNodeSelect(node)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify(node))
                    }}
                  >
                    {/* Header do Nó */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{node.name}</h3>
                        <span className="text-xs text-gray-500 capitalize">{node.category}</span>
                      </div>
                    </div>

                    {/* Descrição */}
                    <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                      {node.description}
                    </p>

                    {/* Inputs/Outputs */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{node.inputs.length} entrada{node.inputs.length !== 1 ? 's' : ''}</span>
                      <span>{node.outputs.length} saída{node.outputs.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredNodes.length} nó{filteredNodes.length !== 1 ? 's' : ''} encontrado{filteredNodes.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-500">
              Arraste um nó para o canvas ou clique para adicionar
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NodeLibrary 