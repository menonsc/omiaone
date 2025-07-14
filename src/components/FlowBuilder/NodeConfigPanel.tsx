import React, { useState } from 'react'
import { 
  Settings, 
  X, 
  Save, 
  TestTube,
  Eye,
  Code,
  Database,
  Globe,
  MessageSquare,
  Mail,
  Calendar,
  GitBranch
} from 'lucide-react'
import { FlowNode } from '../../types/flowBuilder'

interface NodeConfigPanelProps {
  node: FlowNode
  isOpen: boolean
  onClose: () => void
  onConfigChange: (nodeId: string, config: any) => void
  onTest?: (nodeId: string) => void
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  isOpen,
  onClose,
  onConfigChange,
  onTest
}) => {
  const [activeTab, setActiveTab] = useState('general')
  const [config, setConfig] = useState(node.config || {})

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onConfigChange(node.id, newConfig)
  }

  const handleSave = () => {
    onConfigChange(node.id, config)
    onClose()
  }

  const renderGeneralTab = () => (
    <div className="space-y-4">
      {/* Informações básicas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Nó
        </label>
        <input
          type="text"
          value={node.label || ''}
          onChange={(e) => handleConfigChange('label', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Digite o nome do nó..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição
        </label>
        <textarea
          value={node.description || ''}
          onChange={(e) => handleConfigChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Descreva a função deste nó..."
        />
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={config.enabled !== false}
            onChange={(e) => handleConfigChange('enabled', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Nó ativo</span>
        </label>
      </div>
    </div>
  )

  const renderTriggerConfig = () => (
    <div className="space-y-4">
      {node.subtype === 'webhook' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método HTTP
            </label>
            <select
              value={config.method || 'POST'}
              onChange={(e) => handleConfigChange('method', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caminho
            </label>
            <input
              type="text"
              value={config.path || '/'}
              onChange={(e) => handleConfigChange('path', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="/webhook"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Headers (JSON)
            </label>
            <textarea
              value={JSON.stringify(config.headers || {}, null, 2)}
              onChange={(e) => {
                try {
                  const headers = JSON.parse(e.target.value)
                  handleConfigChange('headers', headers)
                } catch (error) {
                  // Ignorar erro de JSON inválido
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={4}
              placeholder='{"Content-Type": "application/json"}'
            />
          </div>
        </>
      )}

      {node.subtype === 'schedule' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expressão Cron
            </label>
            <input
              type="text"
              value={config.cron || '0 9 * * *'}
              onChange={(e) => handleConfigChange('cron', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0 9 * * *"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: minuto hora dia mês dia_semana
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuso Horário
            </label>
            <select
              value={config.timezone || 'UTC'}
              onChange={(e) => handleConfigChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="UTC">UTC</option>
              <option value="America/Sao_Paulo">America/Sao_Paulo</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </div>
        </>
      )}

      {node.subtype === 'message_received' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canal
            </label>
            <select
              value={config.channel || 'whatsapp'}
              onChange={(e) => handleConfigChange('channel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="email">Email</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Mensagem
            </label>
            <select
              value={config.messageType || 'text'}
              onChange={(e) => handleConfigChange('messageType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="text">Texto</option>
              <option value="media">Mídia</option>
              <option value="any">Qualquer</option>
            </select>
          </div>
        </>
      )}
    </div>
  )

  const renderActionConfig = () => (
    <div className="space-y-4">
      {node.subtype === 'send_message' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canal
            </label>
            <select
              value={config.channel || 'whatsapp'}
              onChange={(e) => handleConfigChange('channel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="email">Email</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Mensagem
            </label>
            <select
              value={config.messageType || 'text'}
              onChange={(e) => handleConfigChange('messageType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="text">Texto</option>
              <option value="template">Template</option>
              <option value="media">Mídia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensagem
            </label>
            <textarea
              value={config.message || ''}
              onChange={(e) => handleConfigChange('message', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Digite a mensagem..."
            />
          </div>
        </>
      )}

      {node.subtype === 'send_email' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template
            </label>
            <select
              value={config.template || 'default'}
              onChange={(e) => handleConfigChange('template', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="default">Padrão</option>
              <option value="welcome">Boas-vindas</option>
              <option value="notification">Notificação</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assunto
            </label>
            <input
              type="text"
              value={config.subject || ''}
              onChange={(e) => handleConfigChange('subject', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Assunto do email..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variáveis (JSON)
            </label>
            <textarea
              value={JSON.stringify(config.variables || {}, null, 2)}
              onChange={(e) => {
                try {
                  const variables = JSON.parse(e.target.value)
                  handleConfigChange('variables', variables)
                } catch (error) {
                  // Ignorar erro de JSON inválido
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={4}
              placeholder='{"name": "João", "company": "Empresa"}'
            />
          </div>
        </>
      )}

      {node.subtype === 'api_call' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método HTTP
            </label>
            <select
              value={config.method || 'GET'}
              onChange={(e) => handleConfigChange('method', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL
            </label>
            <input
              type="url"
              value={config.url || ''}
              onChange={(e) => handleConfigChange('url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://api.example.com/endpoint"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeout (ms)
            </label>
            <input
              type="number"
              value={config.timeout || 30000}
              onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1000"
              max="60000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Headers (JSON)
            </label>
            <textarea
              value={JSON.stringify(config.headers || {}, null, 2)}
              onChange={(e) => {
                try {
                  const headers = JSON.parse(e.target.value)
                  handleConfigChange('headers', headers)
                } catch (error) {
                  // Ignorar erro de JSON inválido
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={4}
              placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
            />
          </div>
        </>
      )}
    </div>
  )

  const renderConditionConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Campo
        </label>
        <input
          type="text"
          value={config.field || ''}
          onChange={(e) => handleConfigChange('field', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="nome_do_campo"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Operador
        </label>
        <select
          value={config.operator || 'equals'}
          onChange={(e) => handleConfigChange('operator', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="equals">Igual (=)</option>
          <option value="not_equals">Diferente (≠)</option>
                     <option value="greater_than">Maior que (&gt;)</option>
           <option value="less_than">Menor que (&lt;)</option>
          <option value="greater_than_or_equal">Maior ou igual (≥)</option>
          <option value="less_than_or_equal">Menor ou igual (≤)</option>
          <option value="contains">Contém</option>
          <option value="not_contains">Não contém</option>
          <option value="starts_with">Começa com</option>
          <option value="ends_with">Termina com</option>
          <option value="is_empty">Está vazio</option>
          <option value="is_not_empty">Não está vazio</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Valor
        </label>
        <input
          type="text"
          value={config.value || ''}
          onChange={(e) => handleConfigChange('value', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="valor para comparação"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição da Condição
        </label>
        <textarea
          value={config.description || ''}
          onChange={(e) => handleConfigChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="Descreva o que esta condição verifica..."
        />
      </div>
    </div>
  )

  const renderAdvancedTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Configuração JSON
        </label>
        <textarea
          value={JSON.stringify(config, null, 2)}
          onChange={(e) => {
            try {
              const newConfig = JSON.parse(e.target.value)
              setConfig(newConfig)
            } catch (error) {
              // Ignorar erro de JSON inválido
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          rows={10}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Variáveis de Entrada
        </label>
                 <textarea
           value={JSON.stringify([], null, 2)}
           className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
           rows={4}
           readOnly
         />
       </div>

       <div>
         <label className="block text-sm font-medium text-gray-700 mb-2">
           Variáveis de Saída
         </label>
         <textarea
           value={JSON.stringify([], null, 2)}
           className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
           rows={4}
           readOnly
         />
      </div>
    </div>
  )

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'general':
        return <Settings className="w-4 h-4" />
      case 'config':
        return <Code className="w-4 h-4" />
      case 'advanced':
        return <Database className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab()
      case 'config':
        switch (node.type) {
          case 'trigger':
            return renderTriggerConfig()
          case 'action':
            return renderActionConfig()
          case 'condition':
            return renderConditionConfig()
          default:
            return <div className="text-gray-500">Configuração não disponível para este tipo de nó</div>
        }
      case 'advanced':
        return renderAdvancedTab()
      default:
        return renderGeneralTab()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {getTabIcon(activeTab)}
            <h2 className="text-lg font-semibold text-gray-900">
              Configurar Nó: {node.label || node.type}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'general', label: 'Geral', icon: Settings },
            { id: 'config', label: 'Configuração', icon: Code },
            { id: 'advanced', label: 'Avançado', icon: Database }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-2">
            {onTest && (
              <button
                onClick={() => onTest(node.id)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <TestTube className="w-4 h-4" />
                <span>Testar</span>
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Salvar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NodeConfigPanel 