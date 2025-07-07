import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Bot, User, ThumbsUp, ThumbsDown, Copy, MessageSquare, Plus, History, Trash2, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../store/chatStore'
import { useUIStore } from '../store/uiStore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { LoadingButton, ListSkeleton, Spinner, StatusBadge } from '../components/ui/feedback'

export default function Chat() {
  const { agentId, sessionId } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const {
    messages,
    currentSession,
    sessions,
    agents,
    isLoading,
    createSession,
    sendMessage,
    fetchAgents,
    fetchSessions,
    updateMessageFeedback,
    setCurrentSession,
    deleteSession
  } = useChatStore()
  
  const { addNotification } = useUIStore()

  useEffect(() => {
    fetchAgents()
    fetchSessions()
  }, [fetchAgents, fetchSessions])

  // Handle URL parameters and session management
  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      // Direct session access
      const session = sessions.find(s => s.id === sessionId)
      if (session && session.id !== currentSession?.id) {
        setCurrentSession(session)
      }
    } else if (agentId && agents.length > 0 && !sessionId) {
      // Agent-based access - create or find session
      const agent = agents.find(a => a.id === agentId)
      if (agent) {
        // Find existing session for this agent or create new one
        const existingSession = sessions.find(s => s.agent_id === agentId)
        if (existingSession && existingSession.id !== currentSession?.id) {
          setCurrentSession(existingSession)
          navigate(`/chat/${agentId}/${existingSession.id}`, { replace: true })
        } else if (!existingSession) {
          handleCreateSession(agentId)
        }
      }
    } else if (!sessionId && !agentId && currentSession) {
      // Accessing /chat without parameters - clear current session to show agent selection
      setCurrentSession(null)
    }
  }, [sessionId, agentId, sessions, agents, currentSession])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleCreateSession = async (selectedAgentId: string) => {
    try {
      const newSession = await createSession(selectedAgentId)
      navigate(`/chat/${selectedAgentId}/${newSession.id}`)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao criar nova conversa'
      })
    }
  }

  const handleSelectSession = (session: any) => {
    navigate(`/chat/${session.agent_id}/${session.id}`)
  }

  const handleDeleteSession = async (sessionToDelete: any, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteSession(sessionToDelete.id)
      if (currentSession?.id === sessionToDelete.id) {
        navigate('/chat')
      }
      addNotification({
        type: 'success',
        title: 'Sucesso',
        message: 'Conversa excluída'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao excluir conversa'
      })
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || !currentSession) return

    const messageText = message.trim()
    setMessage('')
    setIsTyping(true)

    try {
      await sendMessage(messageText)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao enviar mensagem'
      })
    } finally {
      setIsTyping(false)
    }
  }

  const handleFeedback = async (messageId: string, score: number) => {
    try {
      await updateMessageFeedback(messageId, score)
      addNotification({
        type: 'success',
        title: 'Obrigado!',
        message: 'Feedback registrado com sucesso'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao registrar feedback'
      })
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      addNotification({
        type: 'success',
        title: 'Copiado!',
        message: 'Texto copiado para a área de transferência'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao copiar texto'
      })
    }
  }

  const currentAgent = agents.find(a => a.id === currentSession?.agent_id)

  const getAgentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      knowledge: 'bg-blue-500',
      onboarding: 'bg-green-500',
      support: 'bg-orange-500',
      general: 'bg-gray-500',
      sales: 'bg-purple-500',
      hr: 'bg-pink-500',
      finance: 'bg-yellow-500',
      marketing: 'bg-indigo-500',
      legal: 'bg-red-500',
      analytics: 'bg-teal-500'
    }
    return colors[type] || 'bg-primary-500'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Histórico de Conversas */}
      <motion.div
        initial={false}
        animate={{ width: showSidebar ? 320 : 0 }}
        className="bg-white dark:bg-gray-800 border-r border-neutral-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-neutral-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center">
                <History className="w-5 h-5 mr-2" />
                Conversas
              </h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-gray-700"
              >
                <History className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            
            {/* New Chat Button */}
            <button
              onClick={() => {
                setCurrentSession(null)
                navigate('/chat')
              }}
              className="w-full bg-primary-600 text-white rounded-lg px-4 py-2 flex items-center justify-center space-x-2 hover:bg-primary-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Conversa</span>
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-2">
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-500 dark:text-gray-400 text-sm">
                  Nenhuma conversa ainda
                </p>
                <p className="text-neutral-400 dark:text-gray-500 text-xs mt-1">
                  Crie uma nova conversa para começar
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => {
                  const agent = agents.find(a => a.id === session.agent_id)
                  const isActive = currentSession?.id === session.id
                  
                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`relative group rounded-lg p-3 cursor-pointer transition-all ${
                        isActive 
                          ? 'bg-primary-50 dark:bg-primary-600/10 border border-primary-200 dark:border-primary-500/20' 
                          : 'hover:bg-neutral-50 dark:hover:bg-gray-700/50'
                      }`}
                      onClick={() => handleSelectSession(session)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Agent Avatar */}
                        <div className={`w-10 h-10 ${getAgentTypeColor(agent?.type || 'general')} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        
                        {/* Session Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium text-sm truncate ${
                            isActive ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-900 dark:text-white'
                          }`}>
                            {agent?.name || 'Agente Desconhecido'}
                          </h3>
                          <p className="text-neutral-500 dark:text-gray-400 text-xs truncate mt-1">
                            {session.title}
                          </p>
                          <div className="flex items-center mt-2">
                            <Clock className="w-3 h-3 text-neutral-400 mr-1" />
                            <span className="text-neutral-400 text-xs">
                              {formatDate(session.updated_at)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDeleteSession(session, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-opacity"
                          title="Excluir conversa"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Toggle Sidebar Button */}
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="absolute top-4 left-4 z-10 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-neutral-200 dark:border-gray-700 hover:bg-neutral-50 dark:hover:bg-gray-700"
          >
            <History className="w-5 h-5 text-neutral-600 dark:text-gray-400" />
          </button>
        )}

        {/* Content Area */}
        {!currentSession ? (
          // Agent Selection Screen
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
                  Escolha um Agente para Conversar
                </h1>
                <p className="text-neutral-600 dark:text-gray-400">
                  Selecione um dos agentes disponíveis para iniciar uma conversa
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleCreateSession(agent.id)}
                  >
                    <div className={`w-16 h-16 ${getAgentTypeColor(agent.type)} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                      <Bot className="w-8 h-8 text-white" />
                    </div>

                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                        {agent.name}
                      </h3>
                      <p className="text-neutral-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {agent.description || 'Assistente de IA especializado'}
                      </p>

                      <div className="mt-4">
                        <div className="flex items-center justify-center space-x-2 bg-primary-50 dark:bg-primary-600/10 text-primary-600 px-4 py-2 rounded-lg">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-sm font-medium">Iniciar Conversa</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Chat Interface
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${getAgentTypeColor(currentAgent?.type || 'general')} rounded-lg flex items-center justify-center`}>
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {currentAgent?.name || 'Assistente'}
                  </h1>
                  <p className="text-sm text-neutral-600 dark:text-gray-400">
                    {currentAgent?.description || 'Assistente de IA especializado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot className="w-16 h-16 text-primary-400 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-600 dark:text-gray-400 mb-2">
                    Conversa iniciada com {currentAgent?.name}
                  </h3>
                  <p className="text-neutral-500 dark:text-gray-500 max-w-md">
                    Digite sua primeira mensagem para começar a conversar!
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} space-x-3`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          msg.role === 'user' 
                            ? 'bg-primary-600 ml-3' 
                            : 'bg-neutral-200 dark:bg-gray-700 mr-3'
                        }`}>
                          {msg.role === 'user' ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-neutral-600 dark:text-gray-400" />
                          )}
                        </div>

                        <div className={`rounded-lg p-4 ${
                          msg.role === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm max-w-none dark:prose-invert message-content">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({ children }) => (
                                    <p className="mb-3 last:mb-0 leading-relaxed text-gray-800 dark:text-gray-200">
                                      {children}
                                    </p>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className="font-semibold text-gray-900 dark:text-white block mb-2 mt-4 first:mt-0">
                                      {children}
                                    </strong>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="list-disc pl-6 mb-4 space-y-1">
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="list-decimal pl-6 mb-4 space-y-1">
                                      {children}
                                    </ol>
                                  ),
                                  li: ({ children }) => (
                                    <li className="leading-relaxed text-gray-800 dark:text-gray-200 mb-1">
                                      {children}
                                    </li>
                                  ),
                                  h1: ({ children }) => (
                                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 mt-4 first:mt-0">
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 mt-4 first:mt-0">
                                      {children}
                                    </h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2 mt-3 first:mt-0">
                                      {children}
                                    </h3>
                                  ),
                                  blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-primary-300 pl-4 italic text-gray-600 dark:text-gray-400 mb-4 mt-4">
                                      {children}
                                    </blockquote>
                                  ),
                                  code: ({ children, className }) => {
                                    const isInline = !className?.includes('language-')
                                    return isInline ? (
                                      <code className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
                                        {children}
                                      </code>
                                    ) : (
                                      <code className={className}>
                                        {children}
                                      </code>
                                    )
                                  },
                                  pre: ({ children }) => (
                                    <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg mb-4 mt-4 overflow-x-auto">
                                      {children}
                                    </pre>
                                  )
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          )}

                          {msg.role === 'assistant' && (
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100 dark:border-gray-700">
                              <button
                                onClick={() => copyToClipboard(msg.content)}
                                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-gray-700 transition-colors"
                                title="Copiar"
                              >
                                <Copy className="w-4 h-4 text-neutral-500" />
                              </button>
                              
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleFeedback(msg.id, 5)}
                                  className={`p-1 rounded transition-colors ${
                                    msg.feedback === 5
                                      ? 'bg-success-500 text-white'
                                      : 'hover:bg-neutral-100 dark:hover:bg-gray-700 text-neutral-500'
                                  }`}
                                  title="Útil"
                                >
                                  <ThumbsUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleFeedback(msg.id, 1)}
                                  className={`p-1 rounded transition-colors ${
                                    msg.feedback === 1
                                      ? 'bg-danger-500 text-white'
                                      : 'hover:bg-neutral-100 dark:hover:bg-gray-700 text-neutral-500'
                                  }`}
                                  title="Não útil"
                                >
                                  <ThumbsDown className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-neutral-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Bot className="w-4 h-4 text-neutral-600 dark:text-gray-400" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce typing-dot"></div>
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce typing-dot"></div>
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {currentSession && (
              <div className="bg-white dark:bg-gray-800 border-t border-neutral-200 dark:border-gray-700 p-4">
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage(e)
                        }
                      }}
                      placeholder="Digite sua mensagem... (Pressione Enter para enviar, Shift+Enter para nova linha)"
                      className="w-full p-3 pr-12 border border-neutral-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent resize-none max-h-32 dark:bg-gray-900 dark:text-white"
                      rows={1}
                      disabled={isLoading}
                    />
                  </div>
                  <LoadingButton
                    loading={isLoading}
                    onClick={() => handleSendMessage({} as React.FormEvent)}
                    disabled={!message.trim()}
                    variant="primary"
                    loadingText="Enviando..."
                  >
                    <Send className="w-5 h-5" />
                  </LoadingButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 