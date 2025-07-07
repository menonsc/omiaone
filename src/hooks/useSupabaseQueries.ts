import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabase'
import { 
  getProfile, 
  updateProfile, 
  getAgents, 
  getChatSessions, 
  getMessages, 
  createChatSession, 
  saveMessage, 
  logActivity, 
  searchDocuments, 
  uploadDocument 
} from '../services/supabase'

// Query Keys
export const supabaseKeys = {
  all: ['supabase'] as const,
  profile: (userId: string) => [...supabaseKeys.all, 'profile', userId] as const,
  agents: () => [...supabaseKeys.all, 'agents'] as const,
  agent: (id: string) => [...supabaseKeys.all, 'agent', id] as const,
  chatSessions: (userId: string) => [...supabaseKeys.all, 'chatSessions', userId] as const,
  chatSession: (sessionId: string) => [...supabaseKeys.all, 'chatSession', sessionId] as const,
  messages: (sessionId: string) => [...supabaseKeys.all, 'messages', sessionId] as const,
  documents: () => [...supabaseKeys.all, 'documents'] as const,
  document: (id: string) => [...supabaseKeys.all, 'document', id] as const,
  searchDocuments: (query: string) => [...supabaseKeys.all, 'searchDocuments', query] as const,
  activityLogs: (userId: string) => [...supabaseKeys.all, 'activityLogs', userId] as const,
}

// Hooks para Perfil
export const useProfile = (userId: string) => {
  return useQuery({
    queryKey: supabaseKeys.profile(userId),
    queryFn: () => getProfile(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: any }) => 
      updateProfile(userId, updates),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: supabaseKeys.profile(userId) })
    },
  })
}

// Hooks para Agentes
export const useAgents = () => {
  return useQuery({
    queryKey: supabaseKeys.agents(),
    queryFn: getAgents,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // 10 minutos
  })
}

export const useAgent = (agentId: string) => {
  return useQuery({
    queryKey: supabaseKeys.agent(agentId),
    queryFn: async () => {
      const agents = await getAgents()
      return agents.find(agent => agent.id === agentId)
    },
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

export const useCreateAgent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (agentData: any) => {
      const { data, error } = await supabase
        .from('agents')
        .insert(agentData)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supabaseKeys.agents() })
    },
  })
}

export const useUpdateAgent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: supabaseKeys.agents() })
      queryClient.invalidateQueries({ queryKey: supabaseKeys.agent(id) })
    },
  })
}

export const useDeleteAgent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId)
      
      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supabaseKeys.agents() })
    },
  })
}

// Hooks para Sessões de Chat
export const useChatSessions = (userId: string) => {
  return useQuery({
    queryKey: supabaseKeys.chatSessions(userId),
    queryFn: () => getChatSessions(userId),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  })
}

export const useChatSession = (sessionId: string) => {
  return useQuery({
    queryKey: supabaseKeys.chatSession(sessionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 segundos
  })
}

export const useCreateChatSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, agentId, title }: { userId: string; agentId: string; title?: string }) =>
      createChatSession(userId, agentId, title),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: supabaseKeys.chatSessions(userId) })
    },
  })
}

export const useDeleteChatSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
      
      if (error) throw error
      return { success: true }
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: supabaseKeys.chatSession(sessionId) })
      queryClient.invalidateQueries({ queryKey: supabaseKeys.messages(sessionId) })
    },
  })
}

// Hooks para Mensagens
export const useMessages = (sessionId: string) => {
  return useQuery({
    queryKey: supabaseKeys.messages(sessionId),
    queryFn: () => getMessages(sessionId),
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 1 * 60 * 1000, // 1 minuto
  })
}

export const useSaveMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, role, content, tokensUsed }: {
      sessionId: string
      role: string
      content: string
      tokensUsed?: number
    }) => saveMessage(sessionId, role, content, tokensUsed),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: supabaseKeys.messages(sessionId) })
    },
  })
}

export const useUpdateMessageFeedback = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, score }: { messageId: string; score: number }) => {
      const { error } = await supabase
        .from('messages')
        .update({ feedback_score: score })
        .eq('id', messageId)
      
      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      // Invalida todas as queries de mensagens para atualizar feedback
      queryClient.invalidateQueries({ queryKey: supabaseKeys.messages('*') })
    },
  })
}

// Hooks para Documentos
export const useDocuments = () => {
  return useQuery({
    queryKey: supabaseKeys.documents(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // 10 minutos
  })
}

export const useDocument = (documentId: string) => {
  return useQuery({
    queryKey: supabaseKeys.document(documentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!documentId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}

export const useUploadDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, userId }: { file: File; userId: string }) =>
      uploadDocument(file, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supabaseKeys.documents() })
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
      
      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supabaseKeys.documents() })
    },
  })
}

// Hook para Busca de Documentos
export const useSearchDocuments = (query: string) => {
  return useQuery({
    queryKey: supabaseKeys.searchDocuments(query),
    queryFn: () => searchDocuments(query),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

// Hooks para Logs de Atividade
export const useActivityLogs = (userId: string) => {
  return useQuery({
    queryKey: supabaseKeys.activityLogs(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      return data
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchInterval: 5 * 60 * 1000, // 5 minutos
  })
}

export const useLogActivity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, action, resourceType, resourceId, details }: {
      userId: string
      action: string
      resourceType?: string
      resourceId?: string
      details?: any
    }) => logActivity(userId, action, resourceType, resourceId, details),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: supabaseKeys.activityLogs(userId) })
    },
  })
} 