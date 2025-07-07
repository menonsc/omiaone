import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { evolutionAPI } from '../services/evolutionAPI'
import { useInstanceStore, useMessageStore } from '../store/whatsapp'

// Query Keys
export const whatsAppKeys = {
  all: ['whatsapp'] as const,
  instances: () => [...whatsAppKeys.all, 'instances'] as const,
  instance: (id: string) => [...whatsAppKeys.instances(), id] as const,
  chats: (instanceId: string) => [...whatsAppKeys.all, 'chats', instanceId] as const,
  messages: (instanceId: string, chatId: string) => 
    [...whatsAppKeys.all, 'messages', instanceId, chatId] as const,
  contacts: (instanceId: string) => [...whatsAppKeys.all, 'contacts', instanceId] as const,
  qrCode: (instanceId: string) => [...whatsAppKeys.all, 'qrcode', instanceId] as const,
}

// Hooks para Instâncias
export const useInstances = () => {
  return useQuery({
    queryKey: whatsAppKeys.instances(),
    queryFn: async () => {
      const response = await evolutionAPI.getInstanceInfo()
      return Array.isArray(response) ? response : [response]
    },
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 10 * 1000, // 10 segundos
  })
}

export const useInstance = (instanceId: string) => {
  return useQuery({
    queryKey: whatsAppKeys.instance(instanceId),
    queryFn: () => evolutionAPI.getInstanceInfo(instanceId),
    enabled: !!instanceId,
    staleTime: 10 * 1000, // 10 segundos
    refetchInterval: 5 * 1000, // 5 segundos
  })
}

export const useCreateInstance = () => {
  const queryClient = useQueryClient()
  const { fetchInstances } = useInstanceStore()

  return useMutation({
    mutationFn: (name: string) => evolutionAPI.createInstance({ instanceName: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsAppKeys.instances() })
      fetchInstances()
    },
  })
}

export const useDeleteInstance = () => {
  const queryClient = useQueryClient()
  const { fetchInstances } = useInstanceStore()

  return useMutation({
    mutationFn: (instanceId: string) => evolutionAPI.deleteInstance(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsAppKeys.instances() })
      fetchInstances()
    },
  })
}

export const useConnectInstance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (instanceId: string) => evolutionAPI.connectInstance(instanceId),
    onSuccess: (_, instanceId) => {
      queryClient.invalidateQueries({ queryKey: whatsAppKeys.instance(instanceId) })
      queryClient.invalidateQueries({ queryKey: whatsAppKeys.instances() })
    },
  })
}

export const useDisconnectInstance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (instanceId: string) => evolutionAPI.logoutInstance(instanceId),
    onSuccess: (_, instanceId) => {
      queryClient.invalidateQueries({ queryKey: whatsAppKeys.instance(instanceId) })
      queryClient.invalidateQueries({ queryKey: whatsAppKeys.instances() })
    },
  })
}

// Hooks para Chats
export const useChats = (instanceId: string) => {
  return useQuery({
    queryKey: whatsAppKeys.chats(instanceId),
    queryFn: () => evolutionAPI.fetchChats(instanceId),
    enabled: !!instanceId,
    staleTime: 15 * 1000, // 15 segundos
    refetchInterval: 10 * 1000, // 10 segundos
  })
}

export const useChatsFromContacts = (instanceId: string) => {
  const { fetchChatsFromContacts } = useMessageStore()

  return useQuery({
    queryKey: [...whatsAppKeys.chats(instanceId), 'contacts'],
    queryFn: () => fetchChatsFromContacts(instanceId),
    enabled: !!instanceId,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 15 * 1000, // 15 segundos
  })
}

// Hooks para Mensagens
export const useWhatsAppMessages = (instanceId: string, chatId: string) => {
  return useQuery({
    queryKey: whatsAppKeys.messages(instanceId, chatId),
    queryFn: () => evolutionAPI.fetchMessages(instanceId, chatId),
    enabled: !!instanceId && !!chatId,
    staleTime: 5 * 1000, // 5 segundos
    refetchInterval: 3 * 1000, // 3 segundos
  })
}

export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ instanceId, chatId, message }: { 
      instanceId: string; 
      chatId: string; 
      message: string 
    }) => evolutionAPI.sendTextMessage({
      number: chatId,
      text: message,
      instance: instanceId
    }),
    onSuccess: (_, { instanceId, chatId }) => {
      // Invalida as mensagens da conversa específica
      queryClient.invalidateQueries({ 
        queryKey: whatsAppKeys.messages(instanceId, chatId) 
      })
      // Invalida a lista de chats para atualizar última mensagem
      queryClient.invalidateQueries({ 
        queryKey: whatsAppKeys.chats(instanceId) 
      })
    },
  })
}

// Hooks para Contatos
export const useContacts = (instanceId: string) => {
  return useQuery({
    queryKey: whatsAppKeys.contacts(instanceId),
    queryFn: () => evolutionAPI.fetchContacts(instanceId),
    enabled: !!instanceId,
    staleTime: 60 * 1000, // 1 minuto
    refetchInterval: 30 * 1000, // 30 segundos
  })
}

// Hooks para QR Code
export const useQRCode = (instanceId: string) => {
  return useQuery({
    queryKey: whatsAppKeys.qrCode(instanceId),
    queryFn: () => evolutionAPI.getQRCode(instanceId),
    enabled: !!instanceId,
    staleTime: 5 * 1000, // 5 segundos
    refetchInterval: 3 * 1000, // 3 segundos
    retry: (failureCount, error: any) => {
      // Para de tentar se a instância estiver conectada
      if (error?.message?.includes('connected')) {
        return false
      }
      return failureCount < 10
    },
  })
}

// Hook para Status de Conexão
export const useConnectionStatus = (instanceId: string) => {
  return useQuery({
    queryKey: [...whatsAppKeys.instance(instanceId), 'status'],
    queryFn: () => evolutionAPI.getInstanceStatus(instanceId),
    enabled: !!instanceId,
    staleTime: 2 * 1000, // 2 segundos
    refetchInterval: 2 * 1000, // 2 segundos
  })
} 