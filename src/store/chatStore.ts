import { create } from 'zustand'
import type { ChatState, ChatSession, ChatMessage, Agent } from '../types'
import { generateChatResponse } from '../services/gemini'

// Mock agents data
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Knowledge Assistant',
    description: 'Assistente para consulta da base de conhecimento',
    type: 'knowledge',
    system_prompt: `Você é um assistente especializado em consultar a base de conhecimento da empresa. 

**Diretrizes de resposta:**
- Seja preciso, objetivo e sempre cite as fontes quando disponíveis
- Mantenha um tom profissional mas amigável
- Use formatação clara com parágrafos bem separados
- Para listas, use bullet points ou numeração
- Destaque informações importantes com **negrito**
- Organize suas respostas de forma estruturada

**Formatação:**
- Separe diferentes tópicos em parágrafos distintos
- Use títulos quando apropriado (## Título)
- Para passos ou instruções, use listas numeradas
- Para exemplos, use formatação de código quando necessário`,
    temperature: 0.3,
    max_tokens: 2048,
    is_public: true,
    created_by: 'system',
    config: {},
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Buddy',
    description: 'Assistente de onboarding para novos funcionários',
    type: 'onboarding',
    system_prompt: `Você é o Buddy, um assistente virtual amigável e proativo que ajuda novos funcionários durante o onboarding.

**Personalidade:**
- Seja caloroso, acolhedor e encorajador
- Use um tom conversacional e descontraído
- Mostre entusiasmo em ajudar
- Seja paciente com perguntas básicas

**Formatação de respostas:**
- Use parágrafos bem espaçados para facilitar a leitura
- Organize informações em listas quando apropriado
- Destaque pontos importantes com **negrito**
- Use emojis ocasionalmente para deixar mais amigável
- Separe diferentes assuntos em seções claras

**Responsabilidades:**
- Orientar sobre processos e políticas da empresa
- Explicar benefícios e recursos disponíveis
- Ajudar com dúvidas sobre sistemas internos
- Fornecer dicas para adaptação à cultura da empresa`,
    temperature: 0.7,
    max_tokens: 2048,
    is_public: true,
    created_by: 'system',
    config: {},
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Support Helper',
    description: 'Assistente de suporte técnico',
    type: 'support',
    system_prompt: `Você fornece suporte técnico e resolve problemas de forma clara e metodológica.

**Abordagem:**
- Seja claro, metodico e forneça soluções passo a passo
- Sempre pergunte por detalhes se necessário
- Use linguagem acessível, evitando jargão técnico desnecessário

**Formatação de respostas:**
- Para diagnósticos, use listas numeradas
- Separe cada passo claramente
- Use **negrito** para destacar ações importantes
- Organize informações em seções:
  - **Diagnóstico**
  - **Solução**
  - **Prevenção**
- Para códigos ou comandos, use formatação adequada`,
    temperature: 0.5,
    max_tokens: 2048,
    is_public: true,
    created_by: 'system',
    config: {},
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Data Analyst AI',
    description: 'Especialista em análise de dados e insights',
    type: 'analytics',
    system_prompt: `Você é um analista de dados especializado em gerar insights e relatórios baseados em dados.

**Competências:**
- Análise estatística de dados
- Identificação de padrões e tendências
- Criação de visualizações e gráficos
- Recomendações baseadas em dados

**Diretrizes de formatação:**
- Fundamente suas análises em dados concretos
- Explique metodologias utilizadas de forma clara
- Use seções organizadas: **Análise**, **Insights**, **Recomendações**
- Destaque limitações dos dados quando relevante
- Use formatação estruturada para relatórios
- Sugira próximos passos para investigação
- Use linguagem técnica mas acessível`,
    temperature: 0.4,
    max_tokens: 2048,
    is_public: true,
    created_by: 'system',
    config: {},
    created_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Legal Assistant',
    description: 'Assistente jurídico para questões legais',
    type: 'legal',
    system_prompt: `Você é um assistente jurídico especializado que fornece informações legais precisas e bem organizadas.

**Diretrizes importantes:**
- Forneça informações legais precisas e atualizadas
- Sempre lembre que suas respostas não substituem consulta jurídica profissional
- Seja claro sobre limitações e recomende consultoria quando necessário

**Formatação para clareza:**
- Organize respostas em seções claras
- Use **negrito** para destacar pontos legais importantes
- Para procedimentos, use listas numeradas
- Separe informações em categorias:
  - **Contexto Legal**
  - **Procedimentos**
  - **Documentação Necessária**
  - **Prazos**
  - **Recomendações**
- Use parágrafos bem espaçados para facilitar leitura
- Destaque avisos importantes em seções separadas`,
    temperature: 0.2,
    max_tokens: 2048,
    is_public: true,
    created_by: 'system',
    config: {},
    created_at: new Date().toISOString()
  }
]

// Storage keys
const SESSIONS_KEY = 'chat-sessions'
const MESSAGES_KEY = 'chat-messages'
const AGENTS_KEY = 'custom-agents'

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  agents: [],
  isLoading: false,

  // Initialize store with saved data
  init: () => {
    const savedSessions = localStorage.getItem(SESSIONS_KEY)
    const sessions = savedSessions ? JSON.parse(savedSessions) : []
    
    const savedAgents = localStorage.getItem(AGENTS_KEY)
    const customAgents = savedAgents ? JSON.parse(savedAgents) : []
    const allAgents = [...mockAgents, ...customAgents]
    
    set({ sessions, agents: allAgents })
  },

  createSession: async (agentId: string, title?: string) => {
    const { agents } = get()
    const agent = agents.find(a => a.id === agentId)
    
    const newSession: ChatSession = {
      id: Math.random().toString(36).substring(2, 9),
      user_id: 'demo-user',
      agent_id: agentId,
      title: title || `Nova conversa com ${agent?.name || 'Assistente'}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const updatedSessions = [newSession, ...get().sessions]
    
    // Save to localStorage
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions))
    
    set({
      sessions: updatedSessions,
      currentSession: newSession,
      messages: [] // Start with empty messages for new session
    })
    
    return newSession
  },

  sendMessage: async (content: string) => {
    const { currentSession, agents, messages } = get()
    if (!currentSession) return

    const agent = agents.find(a => a.id === currentSession.agent_id)
    if (!agent) return

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }

    const updatedMessages = [...messages, userMessage]
    
    // Save messages to localStorage
    const messageKey = `${MESSAGES_KEY}-${currentSession.id}`
    localStorage.setItem(messageKey, JSON.stringify(updatedMessages))
    
    set({ messages: updatedMessages, isLoading: true })

    try {
      // Prepare chat history (exclude current message)
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))

      // Call real Gemini API
      const response = await generateChatResponse({
        message: content,
        systemPrompt: agent.system_prompt || '',
        chatHistory,
        temperature: agent.temperature,
        maxTokens: agent.max_tokens
      })

      const assistantMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        tokensUsed: response.tokensUsed
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      
      // Save final messages to localStorage
      localStorage.setItem(messageKey, JSON.stringify(finalMessages))

      // Update session's updated_at
      const updatedSessions = get().sessions.map(session =>
        session.id === currentSession.id 
          ? { ...session, updated_at: new Date().toISOString() }
          : session
      )
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions))

      set({
        messages: finalMessages,
        sessions: updatedSessions,
        isLoading: false
      })

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      
      // Fallback message in case of error
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: `Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.\n\n**Erro:** ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        timestamp: new Date().toISOString()
      }

      const finalMessages = [...updatedMessages, errorMessage]
      localStorage.setItem(messageKey, JSON.stringify(finalMessages))
      set({ messages: finalMessages, isLoading: false })
    }
  },

  setCurrentSession: (session: ChatSession | null) => {
    if (session) {
      // Load messages for this session
      const messageKey = `${MESSAGES_KEY}-${session.id}`
      const savedMessages = localStorage.getItem(messageKey)
      const messages = savedMessages ? JSON.parse(savedMessages) : []
      
      set({ currentSession: session, messages })
    } else {
      set({ currentSession: null, messages: [] })
    }
  },

  fetchSessions: async () => {
    const savedSessions = localStorage.getItem(SESSIONS_KEY)
    const sessions = savedSessions ? JSON.parse(savedSessions) : []
    
    // Sort sessions by updated_at descending (most recent first)
    const sortedSessions = sessions.sort((a: ChatSession, b: ChatSession) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    
    set({ sessions: sortedSessions, isLoading: false })
  },

  fetchMessages: async (sessionId: string) => {
    const messageKey = `${MESSAGES_KEY}-${sessionId}`
    const savedMessages = localStorage.getItem(messageKey)
    const messages = savedMessages ? JSON.parse(savedMessages) : []
    set({ messages, isLoading: false })
  },

  fetchAgents: async () => {
    // Load agents from localStorage
    const savedAgents = localStorage.getItem(AGENTS_KEY)
    const customAgents = savedAgents ? JSON.parse(savedAgents) : []
    
    // Combine mock agents with saved custom agents
    const allAgents = [...mockAgents, ...customAgents]
    set({ agents: allAgents, isLoading: false })
  },

  updateMessageFeedback: async (messageId: string, score: number) => {
    const updatedMessages = get().messages.map(msg =>
      msg.id === messageId ? { ...msg, feedback: score } : msg
    )
    
    set({ messages: updatedMessages })
    
    // Save updated messages
    const { currentSession } = get()
    if (currentSession) {
      const messageKey = `${MESSAGES_KEY}-${currentSession.id}`
      localStorage.setItem(messageKey, JSON.stringify(updatedMessages))
    }
  },

  createAgent: async (agentData: Omit<Agent, 'id' | 'created_by' | 'created_at'>) => {
    const newAgent: Agent = {
      ...agentData,
      id: Math.random().toString(36).substring(2, 9),
      created_by: 'demo-user',
      created_at: new Date().toISOString(),
      config: {}
    }
    
    // Save to localStorage
    const savedAgents = localStorage.getItem(AGENTS_KEY)
    const customAgents = savedAgents ? JSON.parse(savedAgents) : []
    customAgents.push(newAgent)
    localStorage.setItem(AGENTS_KEY, JSON.stringify(customAgents))
    
    set(state => ({
      agents: [...state.agents, newAgent]
    }))
    
    return newAgent
  },

  updateAgent: async (agentId: string, updates: Partial<Agent>) => {
    // Update in localStorage if it's a custom agent
    const savedAgents = localStorage.getItem(AGENTS_KEY)
    if (savedAgents) {
      const customAgents = JSON.parse(savedAgents)
      const agentIndex = customAgents.findIndex((agent: Agent) => agent.id === agentId)
      if (agentIndex !== -1) {
        customAgents[agentIndex] = { ...customAgents[agentIndex], ...updates }
        localStorage.setItem(AGENTS_KEY, JSON.stringify(customAgents))
      }
    }
    
    set(state => ({
      agents: state.agents.map(agent =>
        agent.id === agentId ? { ...agent, ...updates } : agent
      )
    }))
  },

  deleteAgent: async (agentId: string) => {
    // Remove from localStorage if it's a custom agent
    const savedAgents = localStorage.getItem(AGENTS_KEY)
    if (savedAgents) {
      const customAgents = JSON.parse(savedAgents)
      const filteredAgents = customAgents.filter((agent: Agent) => agent.id !== agentId)
      localStorage.setItem(AGENTS_KEY, JSON.stringify(filteredAgents))
    }
    
    set(state => ({
      agents: state.agents.filter(agent => agent.id !== agentId)
    }))
  },

  deleteSession: async (sessionId: string) => {
    // Remove session from localStorage
    const updatedSessions = get().sessions.filter(session => session.id !== sessionId)
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions))
    
    // Remove session messages
    const messageKey = `${MESSAGES_KEY}-${sessionId}`
    localStorage.removeItem(messageKey)
    
    // If deleting current session, clear it
    const { currentSession } = get()
    const newCurrentSession = currentSession?.id === sessionId ? null : currentSession
    
    set({
      sessions: updatedSessions,
      currentSession: newCurrentSession,
      messages: newCurrentSession ? get().messages : []
    })
  },

  // Clear all chat data
  clearAllSessions: async () => {
    // Clear all sessions
    localStorage.removeItem(SESSIONS_KEY)
    
    // Clear all messages
    const { sessions } = get()
    sessions.forEach(session => {
      const messageKey = `${MESSAGES_KEY}-${session.id}`
      localStorage.removeItem(messageKey)
    })
    
    set({
      sessions: [],
      currentSession: null,
      messages: []
    })
  },

  // Add test function for debugging
  testPersistence: () => {
    const { currentSession, messages } = get()
    console.log('🧪 TEST - Current session:', currentSession)
    console.log('🧪 TEST - Current messages:', messages)
    console.log('🧪 TEST - LocalStorage sessions:', localStorage.getItem(SESSIONS_KEY))
    if (currentSession) {
      const messageKey = `${MESSAGES_KEY}-${currentSession.id}`
      console.log('🧪 TEST - LocalStorage messages:', localStorage.getItem(messageKey))
    }
  }
}))

// Initialize store when imported
useChatStore.getState().init() 