import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WhatsAppConfig {
  autoReply: boolean
  agentId?: string
  webhookUrl?: string
  businessHours?: {
    enabled: boolean
    start: string
    end: string
    days: number[]
  }
}

interface ConfigState {
  config: WhatsAppConfig
  
  // Actions
  updateConfig: (config: Partial<WhatsAppConfig>) => void
  resetConfig: () => void
}

const defaultConfig: WhatsAppConfig = {
  autoReply: false,
  businessHours: {
    enabled: false,
    start: '09:00',
    end: '18:00',
    days: [1, 2, 3, 4, 5] // Monday to Friday
  }
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      config: defaultConfig,

      updateConfig: (newConfig: Partial<WhatsAppConfig>) => {
        set(state => ({
          config: { ...state.config, ...newConfig }
        }))
      },

      resetConfig: () => set({ config: defaultConfig })
    }),
    {
      name: 'whatsapp-config',
      partialize: (state) => ({ config: state.config })
    }
  )
) 