import React from 'react'
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react'
import { StatusBadge, LoadingButton } from './ui/feedback'

interface ConnectionStatusProps {
  isConnected: boolean
  connectionType: 'websocket' | 'sse' | 'polling' | 'none'
  error?: string | null
  onReconnect?: () => void
  className?: string
  isReconnecting?: boolean
}

export default function ConnectionStatus({
  isConnected,
  connectionType,
  error,
  onReconnect,
  className = '',
  isReconnecting = false
}: ConnectionStatusProps) {
  const getStatusColor = () => {
    if (isConnected) {
      switch (connectionType) {
        case 'websocket':
          return 'text-green-600 dark:text-green-400'
        case 'sse':
          return 'text-blue-600 dark:text-blue-400'
        case 'polling':
          return 'text-yellow-600 dark:text-yellow-400'
        default:
          return 'text-gray-600 dark:text-gray-400'
      }
    }
    return 'text-red-600 dark:text-red-400'
  }

  const getStatusIcon = () => {
    if (isConnected) {
      return <Wifi className="w-4 h-4" />
    }
    return <WifiOff className="w-4 h-4" />
  }

  const getConnectionTypeText = () => {
    switch (connectionType) {
      case 'websocket':
        return 'WebSocket'
      case 'sse':
        return 'SSE'
      case 'polling':
        return 'Polling (5s)'
      case 'none':
        return 'Desconectado'
      default:
        return 'Desconhecido'
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <StatusBadge
        status={
          isReconnecting ? 'loading' :
          isConnected ? 'success' :
          error ? 'error' : 'offline'
        }
        text={
          isReconnecting ? 'Reconectando...' :
          isConnected ? getConnectionTypeText() : 'Desconectado'
        }
        size="sm"
      />
      
      {!isConnected && onReconnect && !isReconnecting && (
        <LoadingButton
          loading={isReconnecting}
          onClick={onReconnect}
          variant="outline"
          size="sm"
          loadingText="Reconectando..."
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="text-xs ml-1">Reconectar</span>
        </LoadingButton>
      )}
    </div>
  )
} 