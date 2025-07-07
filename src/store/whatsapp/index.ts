// Imports dos stores
import { useInstanceStore, type WhatsAppInstance } from './instanceStore'
import { useMessageStore, type WhatsAppChat } from './messageStore'
import { useConnectionStore } from './connectionStore'
import { useConfigStore, type WhatsAppConfig } from './configStore'
import { useAIStore } from './aiStore'

// Exports centralizados para facilitar imports
export { useInstanceStore, type WhatsAppInstance } from './instanceStore'
export { useMessageStore, type WhatsAppChat } from './messageStore'
export { useConnectionStore } from './connectionStore'
export { useConfigStore, type WhatsAppConfig } from './configStore'
export { useAIStore } from './aiStore'

// Tipos compartilhados
export type { WhatsAppMessage, WhatsAppContact } from '../../services/evolutionAPI'

// Hook composto para casos que precisam de múltiplos stores
export const useWhatsAppStores = () => ({
  instances: useInstanceStore(),
  messages: useMessageStore(),
  connection: useConnectionStore(),
  config: useConfigStore(),
  ai: useAIStore()
})

// Hook para acessar apenas dados das instâncias
export const useWhatsAppInstances = () => useInstanceStore()

// Hook para acessar apenas dados de mensagens
export const useWhatsAppMessages = () => useMessageStore()

// Hook para acessar apenas configurações
export const useWhatsAppConfig = () => useConfigStore()

// Hook para acessar apenas funcionalidades de IA
export const useWhatsAppAI = () => useAIStore() 