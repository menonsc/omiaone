import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  CheckCircle2,
  Bot,
  ArrowLeft,
  Paperclip,
  Smile,
  Image,
  Settings,
  Phone,
  MoreVertical,
  User,
  MessageCircle
} from 'lucide-react'
import { LoadingButton, StatusBadge, Spinner } from './ui/feedback'
import { useMessageStore, useConfigStore, useAIStore, useInstanceStore } from '../store/whatsapp'
import { useUIStore } from '../store/uiStore'
import { useRealTimeConnection } from '../hooks/useRealTimeConnection'
import ConnectionStatus from './ConnectionStatus'
import { evolutionAPI } from '../services/evolutionAPI'

interface ConversationViewProps {
  onBack: () => void
}

export default function ConversationView({ onBack }: ConversationViewProps) {
  const [newMessage, setNewMessage] = useState('')
  const [isAIResponding, setIsAIResponding] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendingMessage, setSendingMessage] = useState('')
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { 
    currentChat, 
    messages, 
    sendMessage,
    fetchMessages,
    updateChatWithReceivedMessage,
    setCurrentChat
  } = useMessageStore()
  const { currentInstance } = useInstanceStore()
  const { config } = useConfigStore()
  const { generateAIResponse } = useAIStore()
  
  const { addNotification } = useUIStore()

  // Real-time connection hook
  const realTimeConnection = useRealTimeConnection({
    instanceId: currentInstance?.id,
    enableWebSocket: true,
    enableSSE: true,
    fallbackToPolling: true
  })

  useEffect(() => {
    if (currentChat && currentInstance) {
      fetchMessages(currentChat.id, currentInstance.id)
      setLastMessageCount(0)
      setHasNewMessages(false)
    }
  }, [currentChat, currentInstance, fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isSending) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [isSending])

  // Handle new messages from real-time connection
  useEffect(() => {
    if (messages.length > lastMessageCount && lastMessageCount > 0) {
      const newMessagesCount = messages.length - lastMessageCount
      console.log(`🆕 ${newMessagesCount} nova(s) mensagem(s) detectada(s)!`)
      
      const lastMessage = messages[messages.length - 1]
      const isFromOthers = lastMessage && !isFromMe(lastMessage)
      
      if (isFromOthers && currentChat) {
        setHasNewMessages(true)
        
        updateChatWithReceivedMessage(
          currentChat.id,
          lastMessage.message,
          lastMessage.timestamp
        )
        
        addNotification({
          type: 'success',
          title: '💬 Nova mensagem!',
          message: `${currentChat?.name}: ${lastMessage.message.substring(0, 50)}${lastMessage.message.length > 50 ? '...' : ''}`
        })

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)

        setTimeout(() => {
          setHasNewMessages(false)
        }, 3000)
      }
    }
    
    setLastMessageCount(messages.length)
  }, [messages, lastMessageCount, currentChat, addNotification, updateChatWithReceivedMessage])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentChat || !currentInstance || isSending) return

    const messageText = newMessage.trim()
    
    setSendingMessage(messageText)
    setNewMessage('')
    setIsSending(true)
    
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)

    try {
      console.log('📤 Enviando mensagem:', messageText)
      
      await sendMessage(currentChat.id, messageText, currentInstance.id)
      
      console.log('✅ Mensagem enviada com sucesso')
      
      setTimeout(() => {
        fetchMessages(currentChat.id, currentInstance.id)
      }, 1000)
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error)
      
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao enviar mensagem. Tente novamente.'
      })
    } finally {
      setIsSending(false)
      setSendingMessage('')
    }
  }

  const handleGenerateAIResponse = async () => {
    if (!currentChat || !currentInstance || !config.agentId) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Configure um agente de IA para respostas automáticas.'
      })
      return
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.from === 'me') {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Não há mensagem do cliente para responder'
      })
      return
    }

    setIsAIResponding(true)
    try {
      const aiResponse = await generateAIResponse(
        currentChat.id, 
        lastMessage.message, 
        currentInstance.id
      )
      setNewMessage(aiResponse)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao gerar resposta com IA'
      })
    } finally {
      setIsAIResponding(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const isFromMe = (message: any) => {
    return message.from === 'me' || message.key?.fromMe
  }

  const handleTestWebhook = async () => {
    if (!currentInstance) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Selecione uma instância primeiro'
      })
      return
    }

    try {
      const webhook = await evolutionAPI.testWebhook(currentInstance.id)
      if (webhook) {
        addNotification({
          type: 'success',
          title: 'Webhook Configurado',
          message: 'Webhook está funcionando corretamente!'
        })
      } else {
        addNotification({
          type: 'warning',
          title: 'Webhook Não Configurado',
          message: 'Webhook não está configurado. As mensagens podem demorar para aparecer.'
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao testar webhook'
      })
    }
  }

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Selecione uma conversa
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Escolha uma conversa para começar a responder mensagens
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {currentChat.name}
              </h3>
              {hasNewMessages && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Nova</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentChat.phone}
              </p>
              <ConnectionStatus
                isConnected={realTimeConnection.isConnected}
                connectionType={realTimeConnection.connectionType}
                error={realTimeConnection.error}
                onReconnect={realTimeConnection.reconnect}
                className="text-xs"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button 
            onClick={handleTestWebhook}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Testar Webhook"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 conversation-scroll">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isFromMe(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isFromMe(message)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm">{message.message}</p>
                <div className={`flex items-center justify-end mt-1 space-x-1 ${
                  isFromMe(message) ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  <span className="text-xs">
                    {formatTime(message.timestamp)}
                  </span>
                  {isFromMe(message) && (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isSending && sendingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end"
            >
              <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-green-400 text-white opacity-70">
                <p className="text-sm">{sendingMessage}</p>
                <div className="flex items-center justify-end mt-1 space-x-1 text-green-100">
                  <span className="text-xs">Enviando...</span>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isAIResponding && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-600 dark:text-blue-400">IA está digitando...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {config.agentId && (
          <div className="mb-3 flex justify-end">
            <LoadingButton
              loading={isAIResponding}
              onClick={handleGenerateAIResponse}
              variant="primary"
              size="sm"
              loadingText="Gerando..."
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Bot className="w-4 h-4" />
              <span className="ml-2">Gerar resposta IA</span>
            </LoadingButton>
          </div>
        )}
        
        <div className="flex items-end space-x-2">
          <div className="flex space-x-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Image className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isSending ? "Enviando..." : "Digite sua mensagem..."}
              rows={1}
              disabled={isSending}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
              <Smile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          <LoadingButton
            loading={isSending}
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            variant="primary"
            size="sm"
            loadingText="Enviando..."
            className="bg-green-500 hover:bg-green-600"
          >
            <Send className="w-5 h-5" />
          </LoadingButton>
        </div>
      </div>
    </div>
  )
} 