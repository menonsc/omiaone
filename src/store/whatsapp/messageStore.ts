import { create } from 'zustand'
import { evolutionAPI, type WhatsAppMessage, type WhatsAppContact } from '../../services/evolutionAPI'
import { useInstanceStore } from './instanceStore'

export interface WhatsAppChat {
  id: string
  name: string
  phone: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
  profilePicture?: string
  isGroup: boolean
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

export const useMessageStore = create<MessageState>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  contacts: [],

  fetchChats: async (instanceId?: string) => {
    const instance = instanceId || useInstanceStore.getState().currentInstance?.id
    console.log('🔍 fetchChats called with instance:', instance)
    
    if (!instance) {
      console.error('❌ No instance provided for fetchChats')
      return
    }
    
    try {
      console.log('📡 Calling evolutionAPI.fetchChats for instance:', instance)
      const response = await evolutionAPI.fetchChats(instance)
      console.log('📥 fetchChats response:', {
        response,
        isArray: Array.isArray(response),
        length: Array.isArray(response) ? response.length : 'not array',
        type: typeof response
      })
      
      const chats: WhatsAppChat[] = []
      
      if (response && Array.isArray(response)) {
        console.log('✅ Processing', response.length, 'chats')
        response.forEach((chat: any, index: number) => {
          console.log(`📱 Chat ${index}:`, {
            id: chat.id,
            name: chat.name,
            keys: Object.keys(chat)
          })
          
          chats.push({
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
      
      console.log('💾 Setting chats in store:', chats)
      set({ chats })
      
      // Se não conseguiu chats, tenta buscar contatos
      if (chats.length === 0) {
        console.log('🔄 No chats found, trying to fetch contacts with messages...')
        await get().fetchChatsFromContacts(instance)
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching chats:', error)
      
      // Se houve erro, tenta buscar contatos como fallback
      console.log('🔄 Error occurred, trying contacts fallback...')
      try {
        await get().fetchChatsFromContacts(instance)
      } catch (contactError) {
        console.error('❌ Contacts fallback also failed:', contactError)
        set({ chats: [] })
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
        set({ chats: [] })
        return
      }

      console.log('✅ Processing contacts to find those with messages...')
      const chats: WhatsAppChat[] = []
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
        
        // Add successful results to chats
        batchResults.forEach(result => {
          if (result) {
            chats.push(result)
          }
        })
        
        processedCount += batch.length
        console.log(`📊 Progress: ${processedCount}/${contactsToProcess.length} contacts processed, ${chats.length} conversations found`)
        
        // Small delay between batches to avoid overwhelming the API
        if (i + batchSize < contactsToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      // Sort by most recent message first
      chats.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || 0).getTime()
        const timeB = new Date(b.lastMessageTime || 0).getTime()
        return timeB - timeA
      })
      
      console.log(`💾 Setting ${chats.length} conversations with real messages (from ${processedCount} contacts processed)`)
      set({ chats })
      
    } catch (error) {
      console.error('❌ Error fetching contacts as chats:', error)
      set({ chats: [] })
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
    if (chat && useInstanceStore.getState().currentInstance) {
      console.log('📥 Fetching messages for chat:', chat.id, 'instance:', useInstanceStore.getState().currentInstance?.id)
      get().fetchMessages(chat.id, useInstanceStore.getState().currentInstance!.id)
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
    const updatedChats = currentChats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          lastMessage: message,
          lastMessageTime: timestamp
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
  }
})) 