import React, { useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { 
  Settings, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  MoreVertical
} from 'lucide-react'
import { FlowNode } from '../../../types/flowBuilder'

interface BaseNodeProps extends NodeProps {
  data: FlowNode & {
    isExecuting?: boolean
    isCompleted?: boolean
    isError?: boolean
    onNodeSelect?: (nodeId: string) => void
  }
  onConfigChange?: (nodeId: string, config: any) => void
  onNodeSelect?: (nodeId: string) => void
}

const BaseNode: React.FC<BaseNodeProps> = ({ 
  data, 
  selected,
  onConfigChange,
  onNodeSelect
}) => {
  const [showConfig, setShowConfig] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Handler para duplo clique
  const handleDoubleClick = () => {
    if (data.onNodeSelect) {
      data.onNodeSelect(data.id)
    } else if (onNodeSelect) {
      onNodeSelect(data.id)
    }
  }

  const getStatusIcon = () => {
    if (data.isError) return <AlertCircle className="w-4 h-4 text-red-500" />
    if (data.isCompleted) return <CheckCircle className="w-4 h-4 text-green-500" />
    if (data.isExecuting) return <Play className="w-4 h-4 text-blue-500 animate-pulse" />
    return <Clock className="w-4 h-4 text-gray-400" />
  }

  const getStatusColor = () => {
    if (data.isError) return 'border-red-500 bg-red-50'
    if (data.isCompleted) return 'border-green-500 bg-green-50'
    if (data.isExecuting) return 'border-blue-500 bg-blue-50'
    return selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
  }

  const handleConfigChange = (key: string, value: any) => {
    if (onConfigChange) {
      const newConfig = { ...data.config, [key]: value }
      onConfigChange(data.id, newConfig)
    }
  }

  return (
    <div 
      className={`relative min-w-[200px] max-w-[300px] ${getStatusColor()} border-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`}
      onDoubleClick={handleDoubleClick}
      title="Duplo clique para configurar"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <div>
            <h3 className="font-medium text-sm text-gray-900 truncate">
              {data.label || data.type}
            </h3>
            {data.description && (
              <p className="text-xs text-gray-500 truncate">
                {data.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              if (data.onNodeSelect) {
                data.onNodeSelect(data.id)
              } else if (onNodeSelect) {
                onNodeSelect(data.id)
              }
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Configurar (ou duplo clique no nó)"
          >
            <Settings className="w-3 h-3 text-gray-500" />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Mais opções"
            >
              <MoreVertical className="w-3 h-3 text-gray-500" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onNodeSelect?.(data.id)
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Selecionar
                </button>
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
                >
                  Deletar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="text-xs text-gray-600 mb-2">
          {data.type} • {data.subtype || 'default'}
        </div>
        
        {/* Configuração */}
        {showConfig && (
          <div className="mt-3 p-3 bg-gray-50 rounded border">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Configuração</h4>
            <NodeConfigPanel 
              node={data}
              onConfigChange={handleConfigChange}
            />
          </div>
        )}
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
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
    </div>
  )
}

// Componente para painel de configuração específico do nó
interface NodeConfigPanelProps {
  node: FlowNode
  onConfigChange: (key: string, value: any) => void
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onConfigChange }) => {
  const renderConfigField = (key: string, value: any, type: string = 'string') => {
    switch (type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onConfigChange(key, e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-xs text-gray-700">{key}</span>
          </label>
        )
      
      case 'select':
        return (
          <div>
            <label className="block text-xs text-gray-700 mb-1">{key}</label>
            <select
              value={value || ''}
              onChange={(e) => onConfigChange(key, e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Selecione...</option>
              {/* Opções específicas baseadas no tipo de nó */}
            </select>
          </div>
        )
      
      default:
        return (
          <div>
            <label className="block text-xs text-gray-700 mb-1">{key}</label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onConfigChange(key, e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              placeholder={`Digite ${key.toLowerCase()}...`}
            />
          </div>
        )
    }
  }

  // Renderizar campos de configuração baseados no tipo de nó
  const renderNodeSpecificConfig = () => {
    switch (node.type) {
      case 'trigger':
        return (
          <div className="space-y-2">
            {renderConfigField('enabled', node.config?.enabled, 'boolean')}
            {node.subtype === 'webhook' && (
              <>
                {renderConfigField('method', node.config?.method, 'select')}
                {renderConfigField('path', node.config?.path)}
              </>
            )}
            {node.subtype === 'schedule' && (
              <>
                {renderConfigField('cron', node.config?.cron)}
                {renderConfigField('timezone', node.config?.timezone)}
              </>
            )}
          </div>
        )
      
      case 'action':
        return (
          <div className="space-y-2">
            {renderConfigField('enabled', node.config?.enabled, 'boolean')}
            {node.subtype === 'send_message' && (
              <>
                {renderConfigField('channel', node.config?.channel, 'select')}
                {renderConfigField('message', node.config?.message)}
              </>
            )}
            {node.subtype === 'api_call' && (
              <>
                {renderConfigField('method', node.config?.method, 'select')}
                {renderConfigField('url', node.config?.url)}
                {renderConfigField('timeout', node.config?.timeout)}
              </>
            )}
          </div>
        )
      
      case 'condition':
        return (
          <div className="space-y-2">
            {renderConfigField('operator', node.config?.operator, 'select')}
            {renderConfigField('value', node.config?.value)}
            {renderConfigField('field', node.config?.field)}
          </div>
        )
      
      default:
        return (
          <div className="text-xs text-gray-500">
            Configuração não disponível para este tipo de nó
          </div>
        )
    }
  }

  return (
    <div className="space-y-3">
      {renderNodeSpecificConfig()}
    </div>
  )
}

export default BaseNode 