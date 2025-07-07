// ⚠️ DEPRECATED: Este arquivo foi dividido em stores modulares
// Use os imports específicos de src/store/whatsapp/ para melhor performance

import { 
  useInstanceStore, 
  useMessageStore, 
  useConnectionStore, 
  useConfigStore, 
  useAIStore,
  type WhatsAppInstance,
  type WhatsAppChat,
  type WhatsAppConfig,
  type WhatsAppMessage,
  type WhatsAppContact
} from './whatsapp'

// Interface de compatibilidade para manter a API existente
interface WhatsAppState {
  // Instance management
  instances: WhatsAppInstance[]
  currentInstance: WhatsAppInstance | null
  isLoading: boolean
  
  // Chat management
  chats: WhatsAppChat[]
  currentChat: WhatsAppChat | null
  messages: WhatsAppMessage[]
  
  // Contacts
  contacts: WhatsAppContact[]
  
  // Configuration
  config: WhatsAppConfig
  
  // Actions
  fetchInstances: () => Promise<void>
  createInstance: (name: string) => Promise<void>
  connectInstance: (instanceId: string) => Promise<void>
  disconnectInstance: (instanceId: string) => Promise<void>
  deleteInstance: (instanceId: string) => Promise<void>
  setCurrentInstance: (instance: WhatsAppInstance | null) => void
  
  fetchChats: (instanceId?: string) => Promise<void>
  fetchMessages: (chatId: string, instanceId?: string) => Promise<void>
  sendMessage: (chatId: string, message: string, instanceId?: string) => Promise<void>
  setCurrentChat: (chat: WhatsAppChat | null) => void
  
  fetchContacts: (instanceId?: string) => Promise<void>
  
  updateConfig: (config: Partial<WhatsAppConfig>) => void
  
  // Auto-reply with AI
  handleIncomingMessage: (message: WhatsAppMessage) => Promise<void>
  generateAIResponse: (chatId: string, messageText: string, instanceId?: string) => Promise<string>
  
  // Fallback method: use contacts as conversations
  fetchChatsFromContacts: (instanceId?: string) => Promise<void>
  
  // Update chat list with received message
  updateChatWithReceivedMessage: (chatId: string, message: string, timestamp: string) => void
}

// Store de compatibilidade que combina todos os stores modulares
export const useWhatsAppStore = create<WhatsAppState>((set, get) => {
  return {
    // Instance management
    get instances() { return useInstanceStore.getState().instances },
    get currentInstance() { return useInstanceStore.getState().currentInstance },
    get isLoading() { return useInstanceStore.getState().isLoading },
    
    // Chat management
    get chats() { return useMessageStore.getState().chats },
    get currentChat() { return useMessageStore.getState().currentChat },
    get messages() { return useMessageStore.getState().messages },
    
    // Contacts
    get contacts() { return useMessageStore.getState().contacts },
    
    // Configuration
    get config() { return useConfigStore.getState().config },
    
    // Actions - Instance management
    fetchInstances: () => useInstanceStore.getState().fetchInstances(),
    createInstance: (name: string) => useInstanceStore.getState().createInstance(name),
    connectInstance: (instanceId: string) => useConnectionStore.getState().connectInstance(instanceId),
    disconnectInstance: (instanceId: string) => useConnectionStore.getState().disconnectInstance(instanceId),
    deleteInstance: (instanceId: string) => useInstanceStore.getState().deleteInstance(instanceId),
    setCurrentInstance: (instance: WhatsAppInstance | null) => useInstanceStore.getState().setCurrentInstance(instance),
    
    // Actions - Chat management
    fetchChats: (instanceId?: string) => useMessageStore.getState().fetchChats(instanceId),
    fetchMessages: (chatId: string, instanceId?: string) => useMessageStore.getState().fetchMessages(chatId, instanceId),
    sendMessage: (chatId: string, message: string, instanceId?: string) => useMessageStore.getState().sendMessage(chatId, message, instanceId),
    setCurrentChat: (chat: WhatsAppChat | null) => useMessageStore.getState().setCurrentChat(chat),
    
    // Actions - Contacts
    fetchContacts: (instanceId?: string) => useMessageStore.getState().fetchContacts(instanceId),
    
    // Actions - Configuration
    updateConfig: (config: Partial<WhatsAppConfig>) => useConfigStore.getState().updateConfig(config),
    
    // Actions - AI
    handleIncomingMessage: (message: WhatsAppMessage) => useAIStore.getState().handleIncomingMessage(message),
    generateAIResponse: (chatId: string, messageText: string, instanceId?: string) => useAIStore.getState().generateAIResponse(chatId, messageText, instanceId),
    
    // Actions - Fallback
    fetchChatsFromContacts: (instanceId?: string) => useMessageStore.getState().fetchChatsFromContacts(instanceId),
    updateChatWithReceivedMessage: (chatId: string, message: string, timestamp: string) => useMessageStore.getState().updateChatWithReceivedMessage(chatId, message, timestamp)
  }
})

// Import necessário para create
import { create } from 'zustand'

// ⚠️ AVISO: Este arquivo será removido em versões futuras
// Migre para usar os stores específicos:
// - useInstanceStore() para instâncias
// - useMessageStore() para mensagens
// - useConnectionStore() para conexões
// - useConfigStore() para configurações
// - useAIStore() para IA 