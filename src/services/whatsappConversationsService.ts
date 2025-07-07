import { supabase } from './supabase'
import type { WhatsAppChat } from '../store/whatsapp/messageStore'

export interface WhatsAppConversationDB {
  id: string
  user_id: string
  chat_id: string
  instance_id: string
  name: string
  phone?: string
  profile_picture?: string
  is_group: boolean
  last_message?: string
  last_message_time?: string
  unread_count: number
  is_pinned: boolean
  is_archived: boolean
  is_websocket_created: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

class WhatsAppConversationsService {
  private static instance: WhatsAppConversationsService

  static getInstance(): WhatsAppConversationsService {
    if (!WhatsAppConversationsService.instance) {
      WhatsAppConversationsService.instance = new WhatsAppConversationsService()
    }
    return WhatsAppConversationsService.instance
  }

  /**
   * Converte conversa do banco para formato da store
   */
  private dbToChat(dbConversation: WhatsAppConversationDB): WhatsAppChat {
    return {
      id: dbConversation.chat_id,
      name: dbConversation.name,
      phone: dbConversation.phone || dbConversation.chat_id,
      lastMessage: dbConversation.last_message,
      lastMessageTime: dbConversation.last_message_time,
      unreadCount: dbConversation.unread_count,
      profilePicture: dbConversation.profile_picture,
      isGroup: dbConversation.is_group,
      isWebSocketCreated: dbConversation.is_websocket_created
    }
  }

  /**
   * Converte conversa da store para formato do banco
   */
  private chatToDb(chat: WhatsAppChat, userId: string, instanceId: string): Omit<WhatsAppConversationDB, 'id' | 'created_at' | 'updated_at'> {
    return {
      user_id: userId,
      chat_id: chat.id,
      instance_id: instanceId,
      name: chat.name,
      phone: chat.phone,
      profile_picture: chat.profilePicture,
      is_group: chat.isGroup,
      last_message: chat.lastMessage,
      last_message_time: chat.lastMessageTime,
      unread_count: chat.unreadCount || 0,
      is_pinned: false,
      is_archived: false,
      is_websocket_created: chat.isWebSocketCreated || false,
      metadata: {}
    }
  }

  /**
   * Busca todas as conversas do usuário para uma instância específica
   */
  async getUserConversations(userId: string, instanceId: string): Promise<WhatsAppChat[]> {
    try {
      console.log('📡 Buscando conversas do banco de dados:', { userId, instanceId })
      
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('instance_id', instanceId)
        .order('last_message_time', { ascending: false, nullsFirst: false })

      if (error) {
        console.error('❌ Erro ao buscar conversas:', error)
        return []
      }

      const conversations = (data || []).map(this.dbToChat)
      console.log('✅ Conversas carregadas do banco:', conversations.length, 'conversas')
      
      return conversations
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar conversas:', error)
      return []
    }
  }

  /**
   * Salva ou atualiza uma conversa no banco
   */
  async saveConversation(chat: WhatsAppChat, userId: string, instanceId: string): Promise<boolean> {
    try {
      console.log('💾 Salvando conversa no banco:', { chatId: chat.id, name: chat.name, isWebSocketCreated: chat.isWebSocketCreated })
      
      const conversationData = this.chatToDb(chat, userId, instanceId)
      
      const { error } = await supabase
        .from('whatsapp_conversations')
        .upsert(conversationData, {
          onConflict: 'user_id,chat_id,instance_id'
        })

      if (error) {
        console.error('❌ Erro ao salvar conversa:', error)
        return false
      }

      console.log('✅ Conversa salva com sucesso no banco')
      return true
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar conversa:', error)
      return false
    }
  }

  /**
   * Salva múltiplas conversas de uma vez (batch)
   */
  async saveConversations(chats: WhatsAppChat[], userId: string, instanceId: string): Promise<boolean> {
    try {
      console.log('💾 Salvando', chats.length, 'conversas em lote no banco')
      
      const conversationsData = chats.map(chat => this.chatToDb(chat, userId, instanceId))
      
      const { error } = await supabase
        .from('whatsapp_conversations')
        .upsert(conversationsData, {
          onConflict: 'user_id,chat_id,instance_id'
        })

      if (error) {
        console.error('❌ Erro ao salvar conversas em lote:', error)
        return false
      }

      console.log('✅ Conversas salvas em lote com sucesso')
      return true
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar conversas em lote:', error)
      return false
    }
  }

  /**
   * Atualiza apenas o contador de não lidas de uma conversa
   */
  async updateUnreadCount(chatId: string, userId: string, instanceId: string, unreadCount: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({ 
          unread_count: unreadCount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .eq('instance_id', instanceId)

      if (error) {
        console.error('❌ Erro ao atualizar contador de não lidas:', error)
        return false
      }

      console.log('✅ Contador de não lidas atualizado:', { chatId, unreadCount })
      return true
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar contador:', error)
      return false
    }
  }

  /**
   * Atualiza a última mensagem de uma conversa
   */
  async updateLastMessage(
    chatId: string, 
    userId: string, 
    instanceId: string, 
    lastMessage: string, 
    lastMessageTime: string,
    unreadCount?: number
  ): Promise<boolean> {
    try {
      const updateData: any = {
        last_message: lastMessage,
        last_message_time: lastMessageTime,
        updated_at: new Date().toISOString()
      }

      if (unreadCount !== undefined) {
        updateData.unread_count = unreadCount
      }

      const { error } = await supabase
        .from('whatsapp_conversations')
        .update(updateData)
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .eq('instance_id', instanceId)

      if (error) {
        console.error('❌ Erro ao atualizar última mensagem:', error)
        return false
      }

      console.log('✅ Última mensagem atualizada:', { chatId, lastMessage: lastMessage.substring(0, 30) + '...' })
      return true
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar última mensagem:', error)
      return false
    }
  }

  /**
   * Remove uma conversa do banco
   */
  async deleteConversation(chatId: string, userId: string, instanceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .delete()
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .eq('instance_id', instanceId)

      if (error) {
        console.error('❌ Erro ao deletar conversa:', error)
        return false
      }

      console.log('✅ Conversa deletada do banco:', chatId)
      return true
    } catch (error) {
      console.error('❌ Erro inesperado ao deletar conversa:', error)
      return false
    }
  }

  /**
   * Busca conversas criadas dinamicamente (via WebSocket)
   */
  async getWebSocketCreatedConversations(userId: string, instanceId: string): Promise<WhatsAppChat[]> {
    try {
      console.log('🔍 Buscando conversas criadas via WebSocket')
      
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('instance_id', instanceId)
        .eq('is_websocket_created', true)
        .order('last_message_time', { ascending: false, nullsFirst: false })

      if (error) {
        console.error('❌ Erro ao buscar conversas WebSocket:', error)
        return []
      }

      const conversations = (data || []).map(this.dbToChat)
      console.log('✅ Conversas WebSocket carregadas:', conversations.length)
      
      return conversations
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar conversas WebSocket:', error)
      return []
    }
  }

  /**
   * Obtém estatísticas das conversas do usuário
   */
  async getConversationStats(userId: string): Promise<{
    total: number
    websocketCreated: number
    unread: number
    totalUnreadCount: number
    groups: number
    active: number
  } | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_whatsapp_conversation_stats', { user_id_param: userId })

      if (error || !data || data.length === 0) {
        console.error('❌ Erro ao buscar estatísticas:', error)
        return null
      }

      const stats = data[0]
      return {
        total: parseInt(stats.total_conversations),
        websocketCreated: parseInt(stats.websocket_created_conversations),
        unread: parseInt(stats.unread_conversations),
        totalUnreadCount: parseInt(stats.total_unread_count),
        groups: parseInt(stats.groups_count),
        active: parseInt(stats.active_conversations)
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar estatísticas:', error)
      return null
    }
  }
}

// Exportar instância singleton
export const whatsappConversationsService = WhatsAppConversationsService.getInstance() 