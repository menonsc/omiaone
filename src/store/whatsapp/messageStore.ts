import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { evolutionAPI, type WhatsAppMessage, type WhatsAppContact } from '../../services/evolutionAPI'
import { useInstanceStore } from './instanceStore'
import { useUIStore } from '../uiStore'

export interface WhatsAppChat {
  id: string
  name: string
  phone: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
  profilePicture?: string
  isGroup: boolean
  isWebSocketCreated?: boolean // Flag para identificar chats criados pelo WebSocket
}

interface MessageState {
  chats: WhatsAppChat[]
  currentChat: WhatsAppChat | null
  messages: WhatsAppMessage[]
  contacts: WhatsAppContact[]
  
  // Actions
  fetchChats: (instanceId?: string) => Promise<void>
  fetchMessages: (chatId: string, instanceId?: string) => Promise<void>
  sendMessage: (chatId: string, message: string, instanceId?: string) => Promise<void>
  setCurrentChat: (chat: WhatsAppChat | null) => void
  fetchContacts: (instanceId?: string) => Promise<void>
  
  // Fallback method: use contacts as conversations
  fetchChatsFromContacts: (instanceId?: string) => Promise<void>
  
  // Update chat list with received message
  updateChatWithReceivedMessage: (chatId: string, message: string, timestamp: string) => void
}

// Store persistente apenas para chats dinâmicos (criados pelo WebSocket)
interface DynamicChatsState {
  dynamicChats: WhatsAppChat[]
  addDynamicChat: (chat: WhatsAppChat) => void
  updateDynamicChat: (chatId: string, updates: Partial<WhatsAppChat>) => void
  getDynamicChats: () => WhatsAppChat[]
  clearDynamicChats: () => void
}

const useDynamicChatsStore = create<DynamicChatsState>()(
  persist(
    (set, get) => ({
      dynamicChats: [],
      
      addDynamicChat: (chat: WhatsAppChat) => {
        console.log('💾 Salvando chat dinâmico no localStorage:', chat.name)
        set((state) => ({
          dynamicChats: [chat, ...state.dynamicChats.filter(c => c.id !== chat.id)]
        }))
      },
      
      updateDynamicChat: (chatId: string, updates: Partial<WhatsAppChat>) => {
        console.log('🔄 Atualizando chat dinâmico no localStorage:', chatId, updates)
        set((state) => ({
          dynamicChats: state.dynamicChats.map(chat => 
            chat.id === chatId ? { ...chat, ...updates } : chat
          )
        }))
      },
      
      getDynamicChats: () => {
        const chats = get().dynamicChats
        console.log('📖 Carregando', chats.length, 'chats dinâmicos do localStorage:', chats.map(c => ({ name: c.name, isWebSocketCreated: c.isWebSocketCreated })))
        return chats
      },
      
      clearDynamicChats: () => {
        console.log('🗑️ Limpando chats dinâmicos do localStorage')
        set({ dynamicChats: [] })
      }
    }),
    {
      name: 'whatsapp-dynamic-chats', // nome único para o localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        dynamicChats: state.dynamicChats.filter(chat => chat.isWebSocketCreated) // Só persiste chats do WebSocket
      })
    }
  )
)

export const useMessageStore = create<MessageState>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  contacts: [],

  fetchChats: async (instanceId?: string) => {
    const instance = instanceId || useInstanceStore.getState().currentInstance?.id
    console.log('🔍 fetchChats called with instance:', instance)
    
    // 🐛 DEBUG: Verificar estado atual dos chats
    const debugCurrentChats = get().chats
    console.log('🐛 Estado atual dos chats antes de fetchChats:', debugCurrentChats.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      isWebSocketCreated: c.isWebSocketCreated,
      lastMessage: c.lastMessage?.substring(0, 30) + '...'
    })))
    
    if (!instance) {
      console.error('❌ No instance provided for fetchChats')
      return
    }
    
    // 🚀 PRESERVAR chats criados dinamicamente (novos usuários)
    // Carregar do localStorage E do estado atual
    const persistedDynamicChats = useDynamicChatsStore.getState().getDynamicChats()
    const currentChats = get().chats
    const currentDynamicChats = currentChats.filter(chat => {
      // Identifica chats que foram criados dinamicamente pelo WebSocket
      // Usa a flag específica ou fallback para lógica antiga
      const isDynamic = chat.isWebSocketCreated || 
                       chat.name === chat.phone || 
                       chat.name.match(/^\d+$/)
      return isDynamic
    })
    
    // Combinar chats dinâmicos do localStorage com os do estado atual
    const allDynamicChats = new Map<string, WhatsAppChat>()
    
    // Adicionar do localStorage primeiro
    persistedDynamicChats.forEach(chat => {
      allDynamicChats.set(chat.id, chat)
    })
    
    // Adicionar/atualizar com os do estado atual (mais recentes)
    currentDynamicChats.forEach(chat => {
      const existing = allDynamicChats.get(chat.id)
      if (!existing || new Date(chat.lastMessageTime || 0) > new Date(existing.lastMessageTime || 0)) {
        allDynamicChats.set(chat.id, chat)
      }
    })
    
    const dynamicChats = Array.from(allDynamicChats.values())
    
    console.log('🔄 Preservando', dynamicChats.length, 'chats criados dinamicamente (localStorage + estado):', dynamicChats.map(c => ({ 
      name: c.name, 
      phone: c.phone, 
      isWebSocketCreated: c.isWebSocketCreated,
      source: persistedDynamicChats.some(p => p.id === c.id) ? 'localStorage' : 'estado'
    })))
    
    try {
      console.log('📡 Calling evolutionAPI.fetchChats for instance:', instance)
      const response = await evolutionAPI.fetchChats(instance)
      console.log('📥 fetchChats response:', {
        response,
        isArray: Array.isArray(response),
        length: Array.isArray(response) ? response.length : 'not array',
        type: typeof response
      })
      
      const chatsFromAPI: WhatsAppChat[] = []
      
      if (response && Array.isArray(response)) {
        console.log('✅ Processing', response.length, 'chats from API')
        response.forEach((chat: any, index: number) => {
          console.log(`📱 Chat ${index}:`, {
            id: chat.id,
            name: chat.name,
            keys: Object.keys(chat)
          })
          
          chatsFromAPI.push({
            id: chat.id,
            name: chat.name || chat.pushName || chat.id,
            phone: chat.id,
            lastMessage: chat.lastMessage?.message || chat.lastMessage,
            lastMessageTime: chat.lastMessage?.messageTimestamp || chat.lastMessageTime,
            unreadCount: chat.unreadCount || 0,
            isGroup: chat.id.includes('@g.us'),
            profilePicture: chat.profilePicture || chat.profilePicUrl
          })
        })
      } else {
        console.warn('⚠️ Response is not an array or is empty:', response)
      }
      
      // 🔗 COMBINAR chats da API com chats dinâmicos
      const combinedChats: WhatsAppChat[] = []
      const seenChatIds = new Set<string>()
      
      // Adicionar chats da API primeiro
      chatsFromAPI.forEach(chat => {
        combinedChats.push(chat)
        seenChatIds.add(chat.id)
      })
      
      // Adicionar chats dinâmicos que não estão na API
      dynamicChats.forEach(dynamicChat => {
        if (!seenChatIds.has(dynamicChat.id)) {
          console.log('🆕 Preservando chat dinâmico que não está na API:', dynamicChat.name)
          combinedChats.push(dynamicChat)
          seenChatIds.add(dynamicChat.id)
        } else {
          // Chat existe na API, mas vamos preservar informações mais recentes do dinâmico
          const apiChatIndex = combinedChats.findIndex(c => c.id === dynamicChat.id)
          if (apiChatIndex !== -1) {
            const apiChat = combinedChats[apiChatIndex]
            const dynamicIsNewer = new Date(dynamicChat.lastMessageTime || 0).getTime() > 
                                  new Date(apiChat.lastMessageTime || 0).getTime()
            
            if (dynamicIsNewer) {
              console.log('🔄 Chat dinâmico tem mensagem mais recente, atualizando:', dynamicChat.name)
              combinedChats[apiChatIndex] = {
                ...apiChat,
                lastMessage: dynamicChat.lastMessage,
                lastMessageTime: dynamicChat.lastMessageTime,
                unreadCount: dynamicChat.unreadCount
              }
            }
          }
        }
      })
      
      // Ordenar por mensagem mais recente
      combinedChats.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || 0).getTime()
        const timeB = new Date(b.lastMessageTime || 0).getTime()
        return timeB - timeA
      })
      
      console.log('💾 Setting combined chats in store:', combinedChats.length, 'total chats')
      set({ chats: combinedChats })
      
      // Se não conseguiu chats da API e não tem chats dinâmicos, tenta buscar contatos
      if (chatsFromAPI.length === 0 && dynamicChats.length === 0) {
        console.log('🔄 No chats found from API or dynamic, trying to fetch contacts with messages...')
        await get().fetchChatsFromContacts(instance)
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching chats:', error)
      
      // Se houve erro, preserva pelo menos os chats dinâmicos e tenta contatos como fallback
      console.log('🔄 Error occurred, preserving dynamic chats and trying contacts fallback...')
      
      if (dynamicChats.length > 0) {
        console.log('💾 Preservando', dynamicChats.length, 'chats dinâmicos mesmo com erro na API')
        set({ chats: dynamicChats })
      }
      
      try {
        await get().fetchChatsFromContacts(instance)
      } catch (contactError) {
        console.error('❌ Contacts fallback also failed:', contactError)
        // Se tudo falhou, pelo menos preserva os chats dinâmicos
        if (dynamicChats.length === 0) {
          set({ chats: [] })
        }
      }
    }
  },

  fetchChatsFromContacts: async (instanceId?: string) => {
    const instance = instanceId || useInstanceStore.getState().currentInstance?.id
    console.log('🔄 fetchChatsFromContacts called with instance:', instance)
    
    if (!instance) {
      console.error('❌ No instance provided for fetchChatsFromContacts')
      return
    }
    
    // 🚀 PRESERVAR chats criados dinamicamente (novos usuários)
    // Carregar do localStorage E do estado atual
    const persistedDynamicChats = useDynamicChatsStore.getState().getDynamicChats()
    const currentChats = get().chats
    const currentDynamicChats = currentChats.filter(chat => {
      // Identifica chats que foram criados dinamicamente pelo WebSocket
      // Usa a flag específica ou fallback para lógica antiga
      const isDynamic = chat.isWebSocketCreated || 
                       chat.name === chat.phone || 
                       chat.name.match(/^\d+$/)
      return isDynamic
    })
    
    // Combinar chats dinâmicos do localStorage com os do estado atual
    const allDynamicChats = new Map<string, WhatsAppChat>()
    
    // Adicionar do localStorage primeiro
    persistedDynamicChats.forEach(chat => {
      allDynamicChats.set(chat.id, chat)
    })
    
    // Adicionar/atualizar com os do estado atual (mais recentes)
    currentDynamicChats.forEach(chat => {
      const existing = allDynamicChats.get(chat.id)
      if (!existing || new Date(chat.lastMessageTime || 0) > new Date(existing.lastMessageTime || 0)) {
        allDynamicChats.set(chat.id, chat)
      }
    })
    
    const dynamicChats = Array.from(allDynamicChats.values())
    
    console.log('🔄 Preservando', dynamicChats.length, 'chats dinâmicos em fetchChatsFromContacts (localStorage + estado):', dynamicChats.map(c => ({ 
      name: c.name, 
      phone: c.phone, 
      isWebSocketCreated: c.isWebSocketCreated,
      source: persistedDynamicChats.some(p => p.id === c.id) ? 'localStorage' : 'estado'
    })))
    
    try {
      console.log('📡 Calling evolutionAPI.fetchContacts for instance:', instance)
      const contacts = await evolutionAPI.fetchContacts(instance)
      console.log('📥 fetchContacts response:', {
        contacts,
        isArray: Array.isArray(contacts),
        length: Array.isArray(contacts) ? contacts.length : 'not array'
      })
      
      if (!contacts || !Array.isArray(contacts)) {
        console.warn('⚠️ No contacts or invalid response structure')
        // Preservar chats dinâmicos mesmo se não conseguir contatos
        if (dynamicChats.length > 0) {
          console.log('💾 Preservando chats dinâmicos mesmo sem contatos da API')
          set({ chats: dynamicChats })
        } else {
          set({ chats: [] })
        }
        return
      }

      console.log('✅ Processing contacts to find those with messages...')
      const chatsFromContacts: WhatsAppChat[] = []
      let processedCount = 0
      
      // Process contacts in batches to avoid overwhelming the API
      const batchSize = 10
      const maxContacts = 50 // Limit to first 50 contacts for performance
      const contactsToProcess = contacts.slice(0, maxContacts)
      
      for (let i = 0; i < contactsToProcess.length; i += batchSize) {
        const batch = contactsToProcess.slice(i, i + batchSize)
        console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(contactsToProcess.length/batchSize)}`)
        
        // Process batch in parallel
        const batchPromises = batch.map(async (contact) => {
          const chatId = contact.remoteJid || contact.id
          
          try {
            // Try to fetch the last message for this chat
            const messagesResponse = await evolutionAPI.fetchMessages(instance, chatId, 1)
            
            if (messagesResponse?.messages?.records && messagesResponse.messages.records.length > 0) {
              const lastMsg = messagesResponse.messages.records[0]
              let lastMessage = lastMsg.message?.conversation || lastMsg.message?.extendedTextMessage?.text || '[Mídia]'
              const lastMessageTime = new Date(lastMsg.messageTimestamp * 1000).toISOString()
              
              // Add "Você: " prefix if the message was sent by us
              if (lastMsg.key?.fromMe) {
                lastMessage = `Você: ${lastMessage}`
              }
              
              console.log(`✅ Found conversation with messages: ${contact.pushName || contact.name || chatId}`)
              
              return {
                id: chatId,
                name: contact.pushName || contact.name || contact.remoteJid?.split('@')[0] || 'Contato',
                phone: contact.remoteJid || contact.id,
                lastMessage,
                lastMessageTime,
                unreadCount: 0,
                isGroup: contact.remoteJid?.includes('@g.us') || false,
                profilePicture: contact.profilePicUrl
              }
            }
            
            // Skip contacts without messages
            return null
            
          } catch (msgError) {
            console.warn(`⚠️ Could not fetch messages for ${chatId}:`, msgError)
            return null
          }
        })
        
        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises)
        
        // Add successful results to chatsFromContacts
        batchResults.forEach(result => {
          if (result) {
            chatsFromContacts.push(result)
          }
        })
        
        processedCount += batch.length
        console.log(`📊 Progress: ${processedCount}/${contactsToProcess.length} contacts processed, ${chatsFromContacts.length} conversations found`)
        
        // Small delay between batches to avoid overwhelming the API
        if (i + batchSize < contactsToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      // 🔗 COMBINAR chats dos contatos com chats dinâmicos
      const combinedChats: WhatsAppChat[] = []
      const seenChatIds = new Set<string>()
      
      // Adicionar chats dos contatos primeiro
      chatsFromContacts.forEach(chat => {
        combinedChats.push(chat)
        seenChatIds.add(chat.id)
      })
      
      // Adicionar chats dinâmicos que não estão nos contatos
      dynamicChats.forEach(dynamicChat => {
        if (!seenChatIds.has(dynamicChat.id)) {
          console.log('🆕 Preservando chat dinâmico que não está nos contatos:', dynamicChat.name)
          combinedChats.push(dynamicChat)
          seenChatIds.add(dynamicChat.id)
        } else {
          // Chat existe nos contatos, mas vamos preservar informações mais recentes do dinâmico
          const contactChatIndex = combinedChats.findIndex(c => c.id === dynamicChat.id)
          if (contactChatIndex !== -1) {
            const contactChat = combinedChats[contactChatIndex]
            const dynamicIsNewer = new Date(dynamicChat.lastMessageTime || 0).getTime() > 
                                  new Date(contactChat.lastMessageTime || 0).getTime()
            
            if (dynamicIsNewer) {
              console.log('🔄 Chat dinâmico tem mensagem mais recente, atualizando:', dynamicChat.name)
              combinedChats[contactChatIndex] = {
                ...contactChat,
                lastMessage: dynamicChat.lastMessage,
                lastMessageTime: dynamicChat.lastMessageTime,
                unreadCount: dynamicChat.unreadCount
              }
            }
          }
        }
      })
      
      // Sort by most recent message first
      combinedChats.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || 0).getTime()
        const timeB = new Date(b.lastMessageTime || 0).getTime()
        return timeB - timeA
      })
      
      console.log(`💾 Setting ${combinedChats.length} conversations combined (${chatsFromContacts.length} from contacts + ${dynamicChats.length} dynamic)`)
      set({ chats: combinedChats })
      
    } catch (error) {
      console.error('❌ Error fetching contacts as chats:', error)
      // Preservar chats dinâmicos mesmo em caso de erro
      if (dynamicChats.length > 0) {
        console.log('💾 Preservando', dynamicChats.length, 'chats dinâmicos mesmo com erro na busca de contatos')
        set({ chats: dynamicChats })
      } else {
        set({ chats: [] })
      }
    }
  },

  fetchMessages: async (chatId: string, instanceId?: string) => {
    const instance = instanceId || useInstanceStore.getState().currentInstance?.id
    console.log('🔍 fetchMessages called for chat:', chatId, 'instance:', instance)
    
    if (!instance) return
    
    try {
      const response = await evolutionAPI.fetchMessages(instance, chatId, 50)
      console.log('📥 fetchMessages response:', response)
      
      const messages: WhatsAppMessage[] = []
      
      if (response?.messages?.records && Array.isArray(response.messages.records)) {
        console.log('✅ Processing', response.messages.records.length, 'messages')
        
        response.messages.records.forEach((msg: any) => {
          console.log('📨 Message:', {
            id: msg.key?.id,
            fromMe: msg.key?.fromMe,
            message: msg.message?.conversation,
            timestamp: msg.messageTimestamp
          })
          
          messages.push({
            id: msg.key?.id || msg.id || Date.now().toString(),
            from: msg.key?.fromMe ? 'me' : msg.key?.remoteJid || chatId,
            to: msg.key?.fromMe ? msg.key?.remoteJid || chatId : 'me',
            message: msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[Mídia]',
            timestamp: new Date(msg.messageTimestamp * 1000).toISOString(),
            type: msg.messageType === 'conversation' ? 'text' : 'document'
          })
        })
        
        // Sort by timestamp (oldest first)
        messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        
        console.log('💾 Setting', messages.length, 'messages in store')
        set({ messages })
      } else {
        console.warn('⚠️ No messages or invalid response structure:', response)
        set({ messages: [] })
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error)
      set({ messages: [] })
    }
  },

  sendMessage: async (chatId: string, message: string, instanceId?: string) => {
    const instance = instanceId || useInstanceStore.getState().currentInstance?.id
    if (!instance) throw new Error('No instance selected')
    
    console.log('📤 Sending message:', { chatId, message, instance })
    
    try {
      // Use the chat ID directly (it should already be in the correct format)
      const number = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`
      
      console.log('📡 Calling evolutionAPI.sendTextMessage with number:', number)
      
      const response = await evolutionAPI.sendTextMessage({
        number: number,
        text: message,
        instance
      })
      
      console.log('✅ Message sent successfully:', response)
      
      // Add message to local state immediately for better UX
      const newMessage: WhatsAppMessage = {
        id: response.key?.id || Date.now().toString(),
        from: 'me',
        to: chatId,
        message,
        timestamp: new Date().toISOString(),
        type: 'text'
      }
      
      set({ messages: [...get().messages, newMessage] })
      
      // Update chat list immediately with new last message
      const currentChats = get().chats
      const updatedChats = currentChats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            lastMessage: `Você: ${message}`,
            lastMessageTime: new Date().toISOString()
          }
        }
        return chat
      })
      
      // Re-sort chats by most recent message
      updatedChats.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || 0).getTime()
        const timeB = new Date(b.lastMessageTime || 0).getTime()
        return timeB - timeA
      })
      
      set({ chats: updatedChats })
      
      // Refresh messages after a short delay to get the real message from server
      setTimeout(() => {
        get().fetchMessages(chatId, instance)
      }, 2000)
      
      return response
      
    } catch (error) {
      console.error('❌ Error sending message:', error)
      throw error
    }
  },

  setCurrentChat: (chat: WhatsAppChat | null) => {
    console.log('🔄 Setting current chat:', chat)
    set({ currentChat: chat, messages: [] })
    
    if (chat) {
      // 📖 MARCAR CONVERSA COMO LIDA ao abrir
      console.log('📖 Marcando conversa como lida:', chat.name)
      const currentChats = get().chats
      const updatedChats = currentChats.map(c => {
        if (c.id === chat.id) {
          return {
            ...c,
            unreadCount: 0 // Zerar contador de não lidas
          }
        }
        return c
      })
      
      set({ chats: updatedChats })
      
      // 🔄 Atualizar no localStorage se for chat dinâmico
      if (chat.isWebSocketCreated) {
        useDynamicChatsStore.getState().updateDynamicChat(chat.id, {
          unreadCount: 0
        })
      }
      
      // 🗑️ LIMPAR NOTIFICAÇÕES desta conversa
      const { removeNotificationsByChat } = useUIStore.getState()
      if (removeNotificationsByChat) {
        removeNotificationsByChat(chat.id)
      }
      
      // 📥 Buscar mensagens
      if (useInstanceStore.getState().currentInstance) {
        console.log('📥 Fetching messages for chat:', chat.id, 'instance:', useInstanceStore.getState().currentInstance?.id)
        get().fetchMessages(chat.id, useInstanceStore.getState().currentInstance!.id)
      }
    }
  },

  fetchContacts: async (instanceId?: string) => {
    const instance = instanceId || useInstanceStore.getState().currentInstance?.id
    if (!instance) return
    
    try {
      const response = await evolutionAPI.fetchContacts(instance)
      const contacts: WhatsAppContact[] = []
      
      if (response && Array.isArray(response)) {
        response.forEach((contact: any) => {
          contacts.push({
            id: contact.id,
            name: contact.name || contact.pushName || contact.id,
            phone: contact.id
          })
        })
      }
      
      set({ contacts })
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  },

  updateChatWithReceivedMessage: (chatId: string, message: string, timestamp: string) => {
    console.log('📥 Updating chat with received message:', { chatId, message, timestamp })
    
    const currentChats = get().chats
    const currentChat = get().currentChat
    
    // Verifica se o chat já existe na lista
    const existingChatIndex = currentChats.findIndex(chat => chat.id === chatId)
    
    if (existingChatIndex !== -1) {
      // Chat existe - atualiza normalmente
      console.log('✅ Chat encontrado - atualizando chat existente:', chatId)
      const isCurrentChat = currentChat?.id === chatId
      
      const updatedChats = currentChats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            lastMessage: message,
            lastMessageTime: timestamp,
            // 🔢 INCREMENTAR contador de não lidas APENAS se não for a conversa atual
            unreadCount: isCurrentChat ? 0 : (chat.unreadCount || 0) + 1
          }
        }
        return chat
      })
      
      // Re-sort chats by most recent message
      updatedChats.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || 0).getTime()
        const timeB = new Date(b.lastMessageTime || 0).getTime()
        return timeB - timeA
      })
      
      set({ chats: updatedChats })
      
      // 🔄 Se é um chat dinâmico, atualizar no localStorage também
      const updatedChat = updatedChats.find(chat => chat.id === chatId)
      if (updatedChat && updatedChat.isWebSocketCreated) {
        useDynamicChatsStore.getState().updateDynamicChat(chatId, {
          lastMessage: message,
          lastMessageTime: timestamp,
          unreadCount: updatedChat.unreadCount
        })
      }
    } else {
      // Chat NÃO existe - CRIAR NOVO CHAT (novo usuário)
      console.log('🆕 NOVO USUÁRIO DETECTADO - Criando novo chat:', chatId)
      
      // Extrair informações do chatId para criar um nome apropriado
      let chatName = 'Novo Contato'
      let phone = chatId
      let isGroup = false
      
      if (chatId.includes('@g.us')) {
        // É um grupo
        isGroup = true
        chatName = 'Novo Grupo'
        phone = chatId
      } else if (chatId.includes('@s.whatsapp.net')) {
        // É um contato individual
        isGroup = false
        // Extrair o número do telefone
        const phoneNumber = chatId.split('@')[0]
        phone = phoneNumber
        chatName = phoneNumber // Usar o número como nome temporário
      } else {
        // Formato não reconhecido, usar como está
        phone = chatId
        chatName = chatId
      }
      
      // Criar novo chat
      const isNewChatCurrent = currentChat?.id === chatId
      const newChat: WhatsAppChat = {
        id: chatId,
        name: chatName,
        phone: phone,
        lastMessage: message,
        lastMessageTime: timestamp,
        unreadCount: isNewChatCurrent ? 0 : 1, // Nova mensagem = 1 não lida (exceto se for a conversa atual)
        profilePicture: undefined,
        isGroup: isGroup,
        isWebSocketCreated: true // ✅ MARCAR como criado pelo WebSocket
      }
      
      console.log('🚀 Criando novo chat com flag WebSocket:', {
        ...newChat,
        isWebSocketCreated: newChat.isWebSocketCreated
      })
      
      // Adicionar o novo chat no TOPO da lista (mensagem mais recente)
      const updatedChats = [newChat, ...currentChats]
      
      // Re-sort para garantir ordem correta
      updatedChats.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || 0).getTime()
        const timeB = new Date(b.lastMessageTime || 0).getTime()
        return timeB - timeA
      })
      
      console.log('💾 Atualizando lista de chats com novo usuário. Total de chats:', updatedChats.length)
      set({ chats: updatedChats })
      
      // 🚀 SALVAR chat dinâmico no localStorage para persistir após refresh
      useDynamicChatsStore.getState().addDynamicChat(newChat)
      
      // Opcional: Tentar buscar informações mais detalhadas do contato via API (sem bloquear a UI)
      setTimeout(async () => {
        try {
          const instance = useInstanceStore.getState().currentInstance?.id
          if (instance) {
            console.log('🔍 Tentando buscar detalhes do novo contato:', chatId)
            
            // Tentar buscar informações do contato para melhorar o nome/foto
            const contacts = await evolutionAPI.fetchContacts(instance)
            if (contacts && Array.isArray(contacts)) {
              const contactInfo = contacts.find((contact: any) => 
                contact.id === chatId || contact.remoteJid === chatId
              )
              
              if (contactInfo) {
                console.log('📱 Informações do contato encontradas:', contactInfo)
                
                // Atualizar o chat com informações mais detalhadas
                const chatsState = get().chats
                const updatedChatsWithDetails = chatsState.map(chat => {
                  if (chat.id === chatId) {
                    return {
                      ...chat,
                      name: contactInfo.pushName || contactInfo.name || chat.name,
                      profilePicture: contactInfo.profilePicUrl || chat.profilePicture,
                      // 🛡️ PRESERVAR a flag isWebSocketCreated mesmo após atualizar dados
                      isWebSocketCreated: chat.isWebSocketCreated
                    }
                  }
                  return chat
                })
                
                console.log('✅ Atualizando chat com detalhes do contato. Flag preservada:', updatedChatsWithDetails.find(c => c.id === chatId)?.isWebSocketCreated)
                set({ chats: updatedChatsWithDetails })
                
                // 🔄 ATUALIZAR chat dinâmico no localStorage com novos detalhes
                const updatedChat = updatedChatsWithDetails.find(c => c.id === chatId)
                if (updatedChat && updatedChat.isWebSocketCreated) {
                  useDynamicChatsStore.getState().updateDynamicChat(chatId, {
                    name: updatedChat.name,
                    profilePicture: updatedChat.profilePicture
                  })
                }
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Erro ao buscar detalhes do contato (não crítico):', error)
          // Não fazer nada - o chat já foi criado com informações básicas
        }
      }, 1000) // Delay de 1 segundo para não sobrecarregar
    }
  }
})) 