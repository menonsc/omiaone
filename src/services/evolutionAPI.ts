interface EvolutionAPIConfig {
  baseURL: string
  apiKey: string
  instanceName: string
}

interface WhatsAppMessage {
  id: string
  from: string
  to: string
  message: string
  timestamp: string
  type: 'text' | 'image' | 'audio' | 'video' | 'document'
  mediaUrl?: string
}

interface WhatsAppContact {
  id: string
  name: string
  phone: string
  lastMessage?: string
  lastMessageTime?: string
}

interface SendMessageRequest {
  number: string
  text: string
  instance?: string
}

interface CreateInstanceRequest {
  instanceName: string
  token?: string
  qrcode?: boolean
  webhook?: string
  integration?: string
}

class EvolutionAPIService {
  private config: EvolutionAPIConfig

  constructor(config: EvolutionAPIConfig) {
    this.config = config
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
    const url = `${this.config.baseURL}${endpoint}`
    
    console.log(`🌐 Evolution API Request:`, {
      url,
      method,
      data,
      apiKey: this.config.apiKey ? '***' + this.config.apiKey.slice(-4) : 'undefined'
    })
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey,
        },
        body: data ? JSON.stringify(data) : undefined,
      })

      console.log(`📥 Response Status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ HTTP Error ${response.status}:`, errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log(`✅ Response Success:`, result)
      return result
    } catch (error) {
      console.error('❌ EvolutionAPI request failed:', error)
      throw error
    }
  }

  // Instance Management
  async createInstance(data: CreateInstanceRequest) {
    return this.makeRequest('/instance/create', 'POST', data)
  }

  async getInstanceInfo(instanceName?: string) {
    // Se um instanceName específico for fornecido, busca apenas essa instância
    // Senão, busca todas as instâncias
    if (instanceName) {
      return this.makeRequest(`/instance/fetchInstances?instanceName=${instanceName}`)
    } else {
      return this.makeRequest('/instance/fetchInstances')
    }
  }

  async connectInstance(instanceName?: string) {
    const instance = instanceName || this.config.instanceName
    const response = await this.makeRequest(`/instance/connect/${instance}`, 'GET')
    
    // Debug the response structure
    console.log('🔍 Connect response structure:', {
      hasBase64: !!response?.base64,
      hasCode: !!response?.code,
      keys: Object.keys(response || {}),
      base64Preview: response?.base64 ? response.base64.substring(0, 50) + '...' : 'N/A'
    })
    
    return response
  }

  async getQRCode(instanceName?: string) {
    const instance = instanceName || this.config.instanceName
    return this.makeRequest(`/instance/qrcode/${instance}`)
  }

  async getInstanceStatus(instanceName?: string) {
    const instance = instanceName || this.config.instanceName
    return this.makeRequest(`/instance/connectionState/${instance}`)
  }

  async logoutInstance(instanceName?: string) {
    const instance = instanceName || this.config.instanceName
    return this.makeRequest(`/instance/logout/${instance}`, 'DELETE')
  }

  async deleteInstance(instanceName?: string) {
    const instance = instanceName || this.config.instanceName
    return this.makeRequest(`/instance/delete/${instance}`, 'DELETE')
  }

  // Message Operations
  async sendTextMessage(data: SendMessageRequest) {
    const instance = data.instance || this.config.instanceName
    return this.makeRequest(`/message/sendText/${instance}`, 'POST', {
      number: data.number,
      text: data.text
    })
  }

  async sendImageMessage(instanceName: string, number: string, imageUrl: string, caption?: string) {
    return this.makeRequest(`/message/sendMedia/${instanceName}`, 'POST', {
      number,
      mediatype: 'image',
      media: imageUrl,
      caption
    })
  }

  async sendAudioMessage(instanceName: string, number: string, audioUrl: string) {
    return this.makeRequest(`/message/sendMedia/${instanceName}`, 'POST', {
      number,
      mediatype: 'audio',
      media: audioUrl
    })
  }

  async sendDocumentMessage(instanceName: string, number: string, documentUrl: string, filename: string) {
    return this.makeRequest(`/message/sendMedia/${instanceName}`, 'POST', {
      number,
      mediatype: 'document',
      media: documentUrl,
      filename
    })
  }

  // Chat Operations
  async fetchChats(instanceName?: string) {
    const instance = instanceName || this.config.instanceName
    try {
      // Primeira tentativa: usar o endpoint padrão
      return this.makeRequest(`/chat/findChats/${instance}`, 'POST')
    } catch (error: any) {
      console.error('❌ Error fetching chats:', error.message)
      
      // Se for erro de coluna inexistente no banco, tenta endpoint alternativo
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.log('⚠️ Database structure issue detected. Trying alternative endpoint...')
        
        try {
          // Tenta usar o endpoint de contatos como fallback
          console.log('🔄 Trying alternative: /chat/findContacts')
          const contacts = await this.makeRequest(`/chat/findContacts/${instance}`, 'POST', {})
          
          // Converte contatos para formato de chats
          if (contacts && Array.isArray(contacts)) {
            const chats = contacts.map((contact: any) => ({
              id: contact.id || contact.remoteJid,
              name: contact.name || contact.pushName || 'Contato',
              lastMessage: contact.lastMessage || '',
              lastMessageTime: contact.lastMessageTime || new Date().toISOString(),
              unreadCount: 0,
              isGroup: contact.id?.includes('@g.us') || false
            }))
            
            console.log('✅ Successfully converted contacts to chats format')
            return chats
          }
          
          return []
        } catch (fallbackError: any) {
          console.error('❌ Alternative endpoint also failed:', fallbackError.message)
          return []
        }
      }
      
      // Se for erro específico da coluna "updatedat"
      if (error.message?.includes('updatedat')) {
        console.log('⚠️ Column "updatedat" does not exist in database. Returning empty chats array.')
        return []
      }
      
      // Se for erro 500 com mensagem de banco de dados
      if (error.message?.includes('500') && error.message?.includes('prisma')) {
        console.log('⚠️ Database error detected. Returning empty chats array.')
        return []
      }
      
      throw error
    }
  }

  async fetchMessages(instanceName: string, chatId: string, limit = 20) {
    return this.makeRequest(`/chat/findMessages/${instanceName}`, 'POST', {
      where: {
        key: {
          remoteJid: chatId
        }
      },
      limit
    })
  }

  async markMessageAsRead(instanceName: string, chatId: string) {
    return this.makeRequest(`/chat/markMessageAsRead/${instanceName}`, 'POST', {
      readMessages: [{
        remoteJid: chatId,
        id: 'all'
      }]
    })
  }

  // Contact Operations
  async fetchContacts(instanceName?: string) {
    const instance = instanceName || this.config.instanceName
    return this.makeRequest(`/chat/findContacts/${instance}`, 'POST', {})
  }

  async getProfilePicture(instanceName: string, number: string) {
    return this.makeRequest(`/chat/fetchProfile/${instanceName}`, 'POST', {
      number
    })
  }

  // Webhook Configuration
  async setWebhook(instanceName: string, webhookUrl: string, events?: string[]) {
    return this.makeRequest(`/webhook/set/${instanceName}`, 'POST', {
      url: webhookUrl,
      events: events || ['MESSAGE_UPSERT', 'CONNECTION_UPDATE', 'CALL', 'MESSAGE_UPDATE', 'MESSAGE_DELETE']
    })
  }

  // Configure webhook for real-time updates
  async configureRealTimeWebhook(instanceName: string, baseUrl: string) {
    const webhookUrl = `${baseUrl}/api/webhooks/whatsapp/${instanceName}`
    
    try {
      console.log('🔧 Configurando webhook para tempo real:', webhookUrl)
      return await this.setWebhook(instanceName, webhookUrl, [
        'MESSAGE_UPSERT',
        'CONNECTION_UPDATE', 
        'CALL',
        'MESSAGE_UPDATE',
        'MESSAGE_DELETE',
        'PRESENCE_UPDATE',
        'CHAT_UPDATE'
      ])
    } catch (error) {
      console.error('❌ Erro ao configurar webhook:', error)
      throw error
    }
  }

  async getWebhook(instanceName?: string) {
    const instance = instanceName || this.config.instanceName
    return this.makeRequest(`/webhook/find/${instance}`)
  }

  // Test webhook configuration
  async testWebhook(instanceName?: string) {
    const instance = instanceName || this.config.instanceName
    try {
      const webhook = await this.getWebhook(instance)
      console.log('🔍 Webhook configurado:', webhook)
      return webhook
    } catch (error) {
      console.error('❌ Erro ao verificar webhook:', error)
      return null
    }
  }

  // Group Operations
  async createGroup(instanceName: string, groupName: string, participants: string[]) {
    return this.makeRequest(`/group/create/${instanceName}`, 'POST', {
      subject: groupName,
      participants
    })
  }

  async addParticipant(instanceName: string, groupId: string, participants: string[]) {
    return this.makeRequest(`/group/updateParticipant/${instanceName}`, 'POST', {
      groupJid: groupId,
      action: 'add',
      participants
    })
  }

  async removeParticipant(instanceName: string, groupId: string, participants: string[]) {
    return this.makeRequest(`/group/updateParticipant/${instanceName}`, 'POST', {
      groupJid: groupId,
      action: 'remove',
      participants
    })
  }

  // Utility methods
  formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '')
    
    // Add country code if not present (assuming Brazil +55)
    if (!cleaned.startsWith('55') && cleaned.length === 11) {
      cleaned = '55' + cleaned
    }
    
    // Add WhatsApp suffix
    return cleaned + '@s.whatsapp.net'
  }

  isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length >= 10 && cleaned.length <= 15
  }
}

// Default configuration
const defaultConfig: EvolutionAPIConfig = {
  baseURL: import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080',
  apiKey: import.meta.env.VITE_EVOLUTION_API_KEY || 'your-api-key',
  instanceName: import.meta.env.VITE_EVOLUTION_INSTANCE_NAME || 'default-instance'
}

export const evolutionAPI = new EvolutionAPIService(defaultConfig)

export {
  EvolutionAPIService,
  type EvolutionAPIConfig,
  type WhatsAppMessage,
  type WhatsAppContact,
  type SendMessageRequest,
  type CreateInstanceRequest
} 