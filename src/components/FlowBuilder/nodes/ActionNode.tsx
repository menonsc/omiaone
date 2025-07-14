import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { 
  MessageSquare, 
  Mail, 
  Globe, 
  Database, 
  FileText,
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { FlowNode } from '../../../types/flowBuilder'

interface ActionNodeProps extends NodeProps {
  data: FlowNode & {
    isExecuting?: boolean
    isCompleted?: boolean
    isError?: boolean
    onNodeSelect?: (nodeId: string) => void
  }
  onConfigChange?: (nodeId: string, config: any) => void
}

const ActionNode: React.FC<ActionNodeProps> = ({ 
  data, 
  selected,
  onConfigChange 
}) => {
  // Handler para duplo clique
  const handleDoubleClick = () => {
    if (data.onNodeSelect) {
      data.onNodeSelect(data.id)
    }
  }
  const getActionIcon = () => {
    switch (data.subtype) {
      case 'send_message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'send_email':
        return <Mail className="w-4 h-4 text-green-500" />
      case 'api_call':
        return <Globe className="w-4 h-4 text-purple-500" />
      case 'database_operation':
        return <Database className="w-4 h-4 text-orange-500" />
      case 'file_operation':
        return <FileText className="w-4 h-4 text-gray-500" />
      default:
        return <Send className="w-4 h-4 text-gray-500" />
    }
  }

  const getActionColor = () => {
    switch (data.subtype) {
      case 'send_message':
        return 'border-blue-500 bg-blue-50'
      case 'send_email':
        return 'border-green-500 bg-green-50'
      case 'api_call':
        return 'border-purple-500 bg-purple-50'
      case 'database_operation':
        return 'border-orange-500 bg-orange-50'
      case 'file_operation':
        return 'border-gray-500 bg-gray-50'
      default:
        return selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
    }
  }

  const getActionDescription = () => {
    switch (data.subtype) {
      case 'send_message':
        return `Canal: ${data.config?.channel || 'whatsapp'} | Tipo: ${data.config?.messageType || 'text'}`
      case 'send_email':
        return `Template: ${data.config?.template || 'default'} | Assunto: ${data.config?.subject || 'Notificação'}`
      case 'api_call':
        return `Método: ${data.config?.method || 'GET'} | URL: ${data.config?.url || 'N/A'}`
      case 'database_operation':
        return `Operação: ${data.config?.operation || 'select'} | Tabela: ${data.config?.table || 'N/A'}`
      case 'file_operation':
        return `Operação: ${data.config?.operation || 'read'} | Arquivo: ${data.config?.filename || 'N/A'}`
      default:
        return 'Ação configurada'
    }
  }

  const getStatusIcon = () => {
    if (data.isError) return <AlertCircle className="w-4 h-4 text-red-500" />
    if (data.isCompleted) return <CheckCircle className="w-4 h-4 text-green-500" />
    if (data.isExecuting) return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
  }

  return (
    <div 
      className={`relative min-w-[200px] max-w-[300px] ${getActionColor()} border-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`}
      onDoubleClick={handleDoubleClick}
      title="Duplo clique para configurar"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {getActionIcon()}
          <div>
            <h3 className="font-medium text-sm text-gray-900">
              {data.label || 'Ação'}
            </h3>
            <p className="text-xs text-gray-500">
              {data.subtype?.replace('_', ' ') || 'action'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="text-xs text-gray-600 mb-2">
          {getActionDescription()}
        </div>
        
        {/* Configuração rápida */}
        {data.config && (
          <div className="space-y-1">
            {data.subtype === 'send_message' && data.config.message && (
              <div className="text-xs bg-gray-100 p-2 rounded">
                <strong>Mensagem:</strong> {data.config.message.substring(0, 50)}
                {data.config.message.length > 50 && '...'}
              </div>
            )}
            
            {data.subtype === 'send_email' && data.config.subject && (
              <div className="text-xs bg-gray-100 p-2 rounded">
                <strong>Assunto:</strong> {data.config.subject}
              </div>
            )}
            
            {data.subtype === 'api_call' && data.config.url && (
              <div className="text-xs bg-gray-100 p-2 rounded">
                <strong>URL:</strong> {data.config.url.substring(0, 30)}
                {data.config.url.length > 30 && '...'}
              </div>
            )}
          </div>
        )}
        
        {/* Status */}
        <div className="flex items-center justify-between text-xs mt-2">
          <span className={`px-2 py-1 rounded-full ${
            data.isExecuting 
              ? 'bg-blue-100 text-blue-700' 
              : data.isCompleted 
                ? 'bg-green-100 text-green-700'
                : data.isError
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600'
          }`}>
            {data.isExecuting ? 'Executando' : data.isCompleted ? 'Concluído' : data.isError ? 'Erro' : 'Aguardando'}
          </span>
          
          {data.config?.enabled !== false && (
            <span className="text-green-600">● Ativo</span>
          )}
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-400 border-2 border-white"
      />
    </div>
  )
}

export default ActionNode 