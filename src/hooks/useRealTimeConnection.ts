import { useEffect, useRef, useState, useCallback } from 'react'
import { webSocketService } from '../services/websocketService'
import { sseService } from '../services/sseService'
import { useMessageStore } from '../store/whatsapp/messageStore'
import { useInstanceStore } from '../store/whatsapp/instanceStore'
import { useAIStore } from '../store/whatsapp/aiStore'
import { useUIStore } from '../store/uiStore'
import { triggerWhatsAppEvent } from '../services/webhookService'

interface RealTimeConnectionOptions {
  instanceId?: string
  enableWebSocket?: boolean
  enableSSE?: boolean
  fallbackToPolling?: boolean
}

interface RealTimeConnectionState {
  isConnected: boolean
  connectionType: 'websocket' | 'sse' | 'polling' | 'none'
  lastMessageTime: string | null
  error: string | null
  reconnectAttempts: number
}

export const useRealTimeConnection = (options: RealTimeConnectionOptions = {}) => {
  const {
    instanceId,
    enableWebSocket = true, // Habilitado - servidor agora suporta WebSocket
    enableSSE = true,
    fallbackToPolling = true
  } = options

  const [state, setState] = useState<RealTimeConnectionState>({
    isConnected: false,
    connectionType: 'none',
    lastMessageTime: null,
    error: null,
    reconnectAttempts: 0
  })

  const pollingInterval = useRef<NodeJS.Timeout | null>(null)
  const globalPollingInterval = useRef<NodeJS.Timeout | null>(null)
  const { currentInstance } = useInstanceStore()
  const { 
    fetchMessages, 
    updateChatWithReceivedMessage,
    setCurrentChat,
    currentChat,
    fetchChats
  } = useMessageStore()
  const { generateAIResponse } = useAIStore()
  const { addNotification } = useUIStore()

  const instance = instanceId || currentInstance?.id

  // Process incoming messages
  const handleIncomingMessage = useCallback(async (messageData: any) => {
    try {
      console.log('📨 Processando mensagem recebida:', messageData)
      
      // Acessar dados dentro de 'data' ou usar fallback para compatibilidade
      const data = messageData.data || messageData
      
      console.log('🟢 Dados internos:', data)
      
      const message = {
        id: data.key?.id || Date.now().toString(),
        from: data.key?.remoteJid || '',
        to: data.key?.fromMe ? data.key?.remoteJid || '' : 'me',
        message: data.message?.conversation || data.message?.extendedTextMessage?.text || '[Mídia]',
        timestamp: (() => {
          try {
            if (data.messageTimestamp) {
              return new Date(data.messageTimestamp * 1000).toISOString()
            }
            return new Date().toISOString()
          } catch {
            return new Date().toISOString()
          }
        })(),
        type: 'text' as const
      }

      // Always update chat list with new message (regardless of current chat)
      if (!data.key?.fromMe) {
        updateChatWithReceivedMessage(
          message.from,
          message.message,
          message.timestamp
        )

        // 🔔 DISPARAR WEBHOOKS DO USUÁRIO
        console.log('🔔 Disparando webhooks para mensagem recebida')
        try {
          triggerWhatsAppEvent('whatsapp_message', {
            instanceName: instance,
            messageId: data.key?.id,
            from: message.from,
            to: instance,
            message: message.message,
            timestamp: message.timestamp,
            type: 'text',
            isGroup: message.from.includes('@g.us'),
            pushName: data.pushName || null,
            originalData: data
          })
        } catch (error) {
          console.error('❌ Erro ao disparar webhooks:', error)
        }

        // 🔔 ADICIONAR NOTIFICAÇÃO para TODAS as mensagens recebidas (contatos antigos e novos)
        const senderName = (() => {
          if (message.from.includes('@s.whatsapp.net')) {
            // Contato individual - extrair número
            const phoneNumber = message.from.split('@')[0]
            return phoneNumber
          } else if (message.from.includes('@g.us')) {
            // Grupo
            return 'Grupo'
          } else {
            // Formato não reconhecido
            return message.from
          }
        })()
        
        console.log('🔔 Adicionando notificação para mensagem de:', senderName, 'chatId:', message.from)
        
        addNotification({
          type: 'success',
          title: '💬 Nova mensagem!',
          message: `Nova mensagem de ${senderName}: ${message.message.substring(0, 50)}${message.message.length > 50 ? '...' : ''}`,
          chatId: message.from // ✅ ADICIONAR chatId para poder limpar depois
        })

        // Auto-reply with AI if configured
        const { useConfigStore } = await import('../store/whatsapp/configStore')
        const config = useConfigStore.getState().config
        if (config.autoReply && config.agentId) {
          try {
            const aiResponse = await generateAIResponse(message.from, message.message, instance)
            if (aiResponse) {
              // Send AI response
              const { sendMessage } = useMessageStore.getState()
              await sendMessage(message.from, aiResponse, instance)
            }
          } catch (error) {
            console.error('❌ Erro ao gerar resposta automática:', error)
          }
        }
      }

      // Refresh messages for current chat if it matches the message sender
      if (currentChat && instance && currentChat.id === message.from) {
        await fetchMessages(currentChat.id, instance)
      }

      setState(prev => ({
        ...prev,
        lastMessageTime: new Date().toISOString()
      }))

    } catch (error) {
      console.error('❌ Erro ao processar mensagem recebida:', error)
    }
  }, [currentChat, instance, updateChatWithReceivedMessage, addNotification, generateAIResponse, fetchMessages])

  // Handle connection updates
  const handleConnectionUpdate = useCallback((status: string) => {
    console.log('🔌 Status da conexão atualizado:', status)
    setState(prev => ({
      ...prev,
      isConnected: status === 'connected',
      error: status === 'error' ? 'Erro na conexão' : null
    }))
  }, [])

  // Handle errors
  const handleError = useCallback((error: any) => {
    console.error('❌ Erro na conexão em tempo real:', error)
    
    // Tratamento específico para erro de namespace inválido
    if (error?.message?.includes('Invalid namespace')) {
      console.log('⚠️ Erro de namespace detectado - tentando reconectar...')
      setState(prev => ({
        ...prev,
        error: 'Problema de configuração do WebSocket - tentando reconectar...',
        isConnected: false
      }))
      
      // Tenta reconectar após um tempo
      setTimeout(() => {
        if (enableWebSocket && instance) {
          startWebSocket()
        }
      }, 5000)
    } else {
      setState(prev => ({
        ...prev,
        error: error?.message || 'Erro desconhecido',
        isConnected: false
      }))
    }
  }, [enableWebSocket, instance])

  // Start WebSocket connection
  const startWebSocket = useCallback(async () => {
    if (!enableWebSocket || !instance) return

    try {
      webSocketService.setEventHandlers({
        onMessage: handleIncomingMessage,
        onConnectionUpdate: handleConnectionUpdate,
        onError: handleError
      })

      await webSocketService.connect(instance)
      setState(prev => ({ ...prev, connectionType: 'websocket' }))
    } catch (error) {
      console.error('❌ Erro ao conectar WebSocket:', error)
      if (enableSSE) {
        startSSE()
      }
    }
  }, [enableWebSocket, instance, handleIncomingMessage, handleConnectionUpdate, handleError, enableSSE])

  // Start SSE connection
  const startSSE = useCallback(async () => {
    if (!enableSSE || !instance) return

    try {
      sseService.setEventHandlers({
        onMessage: handleIncomingMessage,
        onConnectionUpdate: handleConnectionUpdate,
        onError: handleError
      })

      await sseService.connect(instance)
      setState(prev => ({ ...prev, connectionType: 'sse' }))
    } catch (error) {
      console.error('❌ Erro ao conectar SSE:', error)
      if (fallbackToPolling) {
        startPolling()
      }
    }
  }, [enableSSE, instance, handleIncomingMessage, handleConnectionUpdate, handleError, fallbackToPolling])

  // Start polling as fallback
  const startPolling = useCallback(() => {
    if (!fallbackToPolling || !instance) return

    console.log('🔄 Iniciando polling como fallback')
    
    // Poll for current chat messages (a cada 5 segundos)
    if (currentChat) {
      pollingInterval.current = setInterval(async () => {
        try {
          await fetchMessages(currentChat.id, instance)
        } catch (error) {
          console.error('❌ Erro no polling:', error)
        }
      }, 5000) // Aumentado para 5 segundos
    }

    // Global polling to check for new messages in all chats (a cada 15 segundos)
    globalPollingInterval.current = setInterval(async () => {
      try {
        await fetchChats(instance)
      } catch (error) {
        console.error('❌ Erro no polling global:', error)
      }
    }, 15000) // Aumentado para 15 segundos

    setState(prev => ({ ...prev, connectionType: 'polling' }))
  }, [fallbackToPolling, instance, currentChat, fetchMessages, fetchChats])

  // Stop all connections
  const stopConnections = useCallback(() => {
    webSocketService.disconnect()
    sseService.disconnect()
    
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      pollingInterval.current = null
    }

    if (globalPollingInterval.current) {
      clearInterval(globalPollingInterval.current)
      globalPollingInterval.current = null
    }

    setState(prev => ({ 
      ...prev, 
      isConnected: false, 
      connectionType: 'none' 
    }))
  }, [])

  // Start real-time connection
  const startConnection = useCallback(async () => {
    if (!instance) return

    console.log('🚀 Iniciando conexão em tempo real para instância:', instance)
    
    // Try WebSocket first, then SSE, then polling
    if (enableWebSocket) {
      await startWebSocket()
    } else if (enableSSE) {
      await startSSE()
    } else if (fallbackToPolling) {
      startPolling()
    }
  }, [instance, enableWebSocket, enableSSE, fallbackToPolling, startWebSocket, startSSE, startPolling])

  // Effect to start connection when instance changes
  useEffect(() => {
    if (instance) {
      startConnection()
    }

    return () => {
      stopConnections()
    }
  }, [instance, startConnection, stopConnections])

  // Effect to handle current chat changes
  useEffect(() => {
    if (currentChat && state.connectionType === 'polling') {
      // Restart polling for new chat
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
      
      // Start polling for current chat
      pollingInterval.current = setInterval(async () => {
        try {
          await fetchMessages(currentChat.id, instance!)
        } catch (error) {
          console.error('❌ Erro no polling:', error)
        }
      }, 3000)
    }
  }, [currentChat, state.connectionType, fetchMessages, instance])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConnections()
    }
  }, [stopConnections])

  return {
    ...state,
    startConnection,
    stopConnections,
    reconnect: startConnection
  }
} 