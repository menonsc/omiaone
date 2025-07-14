import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { 
  GitBranch, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Clock
} from 'lucide-react'
import { FlowNode } from '../../../types/flowBuilder'

interface ConditionNodeProps extends NodeProps {
  data: FlowNode & {
    isExecuting?: boolean
    isCompleted?: boolean
    isError?: boolean
    onNodeSelect?: (nodeId: string) => void
  }
  onConfigChange?: (nodeId: string, config: any) => void
}

const ConditionNode: React.FC<ConditionNodeProps> = ({ 
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
  const getConditionIcon = () => {
    if (data.isError) return <AlertCircle className="w-4 h-4 text-red-500" />
    if (data.isCompleted) {
      const result = data.config?.result
      return result ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />
    }
    if (data.isExecuting) return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    return <GitBranch className="w-4 h-4 text-purple-500" />
  }

  const getConditionColor = () => {
    if (data.isError) return 'border-red-500 bg-red-50'
    if (data.isCompleted) {
      const result = data.config?.result
      return result ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
    }
    if (data.isExecuting) return 'border-blue-500 bg-blue-50'
    return selected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-gray-300'
  }

  const getConditionDescription = () => {
    const operator = data.config?.operator || 'equals'
    const field = data.config?.field || 'campo'
    const value = data.config?.value || 'valor'
    
    return `${field} ${operator} ${value}`
  }

  const getConditionResult = () => {
    if (data.isCompleted) {
      const result = data.config?.result
      return result ? 'Verdadeiro' : 'Falso'
    }
    return 'Aguardando'
  }

  const getOperatorLabel = (operator: string) => {
    const operators: Record<string, string> = {
      'equals': '=',
      'not_equals': '≠',
      'greater_than': '>',
      'less_than': '<',
      'greater_than_or_equal': '≥',
      'less_than_or_equal': '≤',
      'contains': 'contém',
      'not_contains': 'não contém',
      'starts_with': 'começa com',
      'ends_with': 'termina com',
      'is_empty': 'está vazio',
      'is_not_empty': 'não está vazio'
    }
    return operators[operator] || operator
  }

  return (
    <div 
      className={`relative min-w-[200px] max-w-[300px] ${getConditionColor()} border-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`}
      onDoubleClick={handleDoubleClick}
      title="Duplo clique para configurar"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {getConditionIcon()}
          <div>
            <h3 className="font-medium text-sm text-gray-900">
              {data.label || 'Condição'}
            </h3>
            <p className="text-xs text-gray-500">
              {data.subtype?.replace('_', ' ') || 'condition'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="text-xs text-gray-600 mb-2">
          {getConditionDescription()}
        </div>
        
        {/* Condição detalhada */}
        {data.config && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-medium">{data.config.field || 'campo'}</span>
              <span className="text-gray-500">{getOperatorLabel(data.config.operator || 'equals')}</span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                {data.config.value || 'valor'}
              </span>
            </div>
            
            {data.config.description && (
              <div className="text-xs bg-gray-100 p-2 rounded">
                {data.config.description}
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
                ? data.config?.result 
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600'
          }`}>
            {getConditionResult()}
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
        position={Position.Top}
        id="true"
        className="w-3 h-3 bg-green-400 border-2 border-white"
        style={{ top: '10px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 bg-red-400 border-2 border-white"
        style={{ bottom: '10px' }}
      />
    </div>
  )
}

export default ConditionNode 