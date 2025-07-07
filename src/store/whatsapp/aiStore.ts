import { create } from 'zustand'
import { type WhatsAppMessage } from '../../services/evolutionAPI'
import { useConfigStore } from './configStore'
import { useMessageStore } from './messageStore'

interface AIState {
  // Actions
  handleIncomingMessage: (message: WhatsAppMessage) => Promise<void>
  generateAIResponse: (chatId: string, messageText: string, instanceId?: string) => Promise<string>
}

export const useAIStore = create<AIState>((set, get) => ({
  handleIncomingMessage: async (message: WhatsAppMessage) => {
    const config = useConfigStore.getState().config
    
    // Check if auto-reply is enabled
    if (!config.autoReply || !config.agentId) return
    
    // Check business hours
    if (config.businessHours?.enabled) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentDay = now.getDay()
      const startHour = parseInt(config.businessHours.start.split(':')[0])
      const endHour = parseInt(config.businessHours.end.split(':')[0])
      
      if (
        !config.businessHours.days.includes(currentDay) ||
        currentHour < startHour ||
        currentHour >= endHour
      ) {
        // Send out of hours message
        const outOfHoursMessage = `Olá! Estamos fora do horário de atendimento. Nosso horário é de ${config.businessHours.start} às ${config.businessHours.end}. Retornaremos sua mensagem em breve.`
        
        try {
          await useMessageStore.getState().sendMessage(message.from, outOfHoursMessage)
        } catch (error) {
          console.error('Error sending out of hours message:', error)
        }
        return
      }
    }
    
    // Generate AI response using configured agent
    try {
      // Import Gemini service here to avoid circular dependencies
      const { generateChatResponse } = await import('../../services/gemini')
      
      // Get the agent configuration from the chat store
      const { useChatStore } = await import('../chatStore')
      const chatStore = useChatStore.getState()
      const agent = chatStore.agents.find(a => a.id === config.agentId)
      
      if (!agent) {
        console.error('Agent not found:', config.agentId)
        return
      }
      
      // Prepare conversation context for WhatsApp
      const context = `${message.message}`
      
      // Generate response using the configured agent
      const response = await generateChatResponse({
        message: context,
        systemPrompt: agent.system_prompt || '',
        temperature: agent.temperature || 0.7,
        maxTokens: 500 // Keep responses short for WhatsApp
      })
      
      const aiResponse = response.content
      
      // Add typing delay for more natural interaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Send AI response
      await useMessageStore.getState().sendMessage(message.from, aiResponse)
      
    } catch (error) {
      console.error('Error generating AI response:', error)
      
      // Fallback to simple auto-reply
      const fallbackMessage = `Olá! Recebi sua mensagem e nossa equipe retornará em breve. Obrigado!`
      
      try {
        setTimeout(async () => {
          await useMessageStore.getState().sendMessage(message.from, fallbackMessage)
        }, 2000)
      } catch (fallbackError) {
        console.error('Error sending fallback message:', fallbackError)
      }
    }
  },

  generateAIResponse: async (chatId: string, messageText: string, instanceId?: string) => {
    const config = useConfigStore.getState().config
    
    if (!config.agentId) {
      throw new Error('Nenhum agente configurado para resposta automática')
    }
    
    try {
      // Import Gemini service
      const { generateChatResponse } = await import('../../services/gemini')
      
      // Get the agent configuration from the chat store
      const { useChatStore } = await import('../chatStore')
      const chatStore = useChatStore.getState()
      const agent = chatStore.agents.find(a => a.id === config.agentId)
      
      if (!agent) {
        throw new Error('Agente não encontrado')
      }
      
      // Generate response
      const response = await generateChatResponse({
        message: messageText,
        systemPrompt: agent.system_prompt || '',
        temperature: agent.temperature || 0.7,
        maxTokens: 500 // Keep responses short for WhatsApp
      })
      
      return response.content
      
    } catch (error) {
      console.error('Error generating AI response:', error)
      throw error
    }
  }
})) 