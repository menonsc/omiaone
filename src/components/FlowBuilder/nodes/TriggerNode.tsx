import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Zap, Globe, Calendar, MessageSquare } from 'lucide-react'
import { FlowNode } from '../../../types/flowBuilder'

interface TriggerNodeProps extends NodeProps {
  data: FlowNode & {
    isExecuting?: boolean
    isCompleted?: boolean
    isError?: boolean
    onNodeSelect?: (nodeId: string) => void
  }
  onConfigChange?: (nodeId: string, config: any) => void
}

const TriggerNode: React.FC<TriggerNodeProps> = ({ 
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
  const getTriggerIcon = () => {
    switch (data.subtype) {
      case 'webhook':
        return <Globe className="w-4 h-4 text-blue-500" />
      case 'schedule':
        return <Calendar className="w-4 h-4 text-green-500" />
      case 'message_received':
        return <MessageSquare className="w-4 h-4 text-purple-500" />
      default:
        return <Zap className="w-4 h-4 text-yellow-500" />
    }
  }

  const getTriggerColor = () => {
    switch (data.subtype) {
      case 'webhook':
        return 'border-blue-500 bg-blue-50'
      case 'schedule':
        return 'border-green-500 bg-green-50'
      case 'message_received':
        return 'border-purple-500 bg-purple-50'
      default:
        return selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
    }
  }

  const getTriggerDescription = () => {
    switch (data.subtype) {
      case 'webhook':
        return `Método: ${data.config?.method || 'POST'} | Path: ${data.config?.path || '/'}`
      case 'schedule':
        return `Cron: ${data.config?.cron || '0 9 * * *'} | TZ: ${data.config?.timezone || 'UTC'}`
      case 'message_received':
        return `Canal: ${data.config?.channel || 'whatsapp'} | Tipo: ${data.config?.messageType || 'text'}`
      default:
        return 'Trigger configurado'
    }
  }

  return (
    <div 
      className={`relative min-w-[200px] max-w-[300px] ${getTriggerColor()} border-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`}
      onDoubleClick={handleDoubleClick}
      title="Duplo clique para configurar"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {getTriggerIcon()}
          <div>
            <h3 className="font-medium text-sm text-gray-900">
              {data.label || 'Trigger'}
            </h3>
            <p className="text-xs text-gray-500">
              {data.subtype?.replace('_', ' ') || 'trigger'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="text-xs text-gray-600 mb-2">
          {getTriggerDescription()}
        </div>
        
        {/* Status */}
        <div className="flex items-center justify-between text-xs">
          <span className={`px-2 py-1 rounded-full ${
            data.isExecuting 
              ? 'bg-blue-100 text-blue-700' 
              : data.isCompleted 
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
          }`}>
            {data.isExecuting ? 'Executando' : data.isCompleted ? 'Concluído' : 'Aguardando'}
          </span>
          
          {data.config?.enabled !== false && (
            <span className="text-green-600">● Ativo</span>
          )}
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-400 border-2 border-white"
      />
    </div>
  )
}

export default TriggerNode 