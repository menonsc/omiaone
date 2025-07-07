import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { evolutionAPI } from '../../services/evolutionAPI'

export interface WhatsAppInstance {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_needed'
  qrCode?: string
  lastActivity?: string
  phone?: string
  profilePicture?: string
}

interface InstanceState {
  instances: WhatsAppInstance[]
  currentInstance: WhatsAppInstance | null
  isLoading: boolean
  
  // Actions
  fetchInstances: () => Promise<void>
  createInstance: (name: string) => Promise<void>
  deleteInstance: (instanceId: string) => Promise<void>
  updateInstance: (id: string, updates: Partial<WhatsAppInstance>) => void
  setCurrentInstance: (instance: WhatsAppInstance | null) => void
}

const WHATSAPP_INSTANCES_KEY = 'whatsapp-instances'

export const useInstanceStore = create<InstanceState>()(
  subscribeWithSelector((set, get) => ({
    instances: [],
    currentInstance: null,
    isLoading: false,

    fetchInstances: async () => {
      console.log('🔄 Buscando instâncias...')
      set({ isLoading: true })
      try {
        const response = await evolutionAPI.getInstanceInfo()
        console.log('📋 Resposta da API:', response)
        const instances: WhatsAppInstance[] = []
        
        if (response && Array.isArray(response)) {
          for (const instanceData of response) {
            if (instanceData && instanceData.name) {
              console.log('🔍 Processando instância:', instanceData.name)
              
              try {
                let status: WhatsAppInstance['status'] = 'disconnected'
                if (instanceData.connectionStatus === 'open') {
                  status = 'connected'
                } else if (instanceData.connectionStatus === 'connecting') {
                  status = 'connecting'
                }

                instances.push({
                  id: instanceData.name,
                  name: instanceData.name,
                  status,
                  lastActivity: instanceData.createdAt || new Date().toISOString(),
                  phone: instanceData.ownerJid ? instanceData.ownerJid.replace('@s.whatsapp.net', '') : undefined
                })
              } catch (error) {
                console.error('❌ Erro ao processar instância:', instanceData.name, error)
              }
            }
          }
        }
        
        console.log('✅ Instâncias processadas:', instances)
        set({ instances, isLoading: false })
        
        // Auto-select first instance if none selected
        if (instances.length > 0 && !get().currentInstance) {
          set({ currentInstance: instances[0] })
        }
        
        // Save to localStorage
        localStorage.setItem(WHATSAPP_INSTANCES_KEY, JSON.stringify(instances))
      } catch (error) {
        console.error('❌ Erro ao buscar instâncias:', error)
        set({ isLoading: false, instances: [] })
      }
    },

    createInstance: async (name: string) => {
      console.log('🔄 Iniciando criação de instância:', name)
      set({ isLoading: true })
      try {
        console.log('📡 Chamando evolutionAPI.createInstance...')
        const result = await evolutionAPI.createInstance({
          instanceName: name,
          qrcode: true,
          webhook: '', // Will be set by config store
          integration: 'WHATSAPP-BAILEYS'
        })
        console.log('✅ Instância criada com sucesso:', result)
        
        // Refresh instances list
        console.log('🔄 Atualizando lista de instâncias...')
        await get().fetchInstances()
        console.log('✅ Lista atualizada')
      } catch (error) {
        console.error('❌ Erro ao criar instância:', error)
        throw error
      } finally {
        set({ isLoading: false })
      }
    },

    deleteInstance: async (instanceId: string) => {
      console.log('🗑️ Excluindo instância:', instanceId)
      try {
        // First, remove from API
        await evolutionAPI.deleteInstance(instanceId)
        
        // Remove from local state
        const instances = get().instances.filter(instance => instance.id !== instanceId)
        set({ instances })
        
        // Update localStorage
        localStorage.setItem(WHATSAPP_INSTANCES_KEY, JSON.stringify(instances))
        console.log('✅ Instância excluída:', instanceId)
      } catch (error: any) {
        console.error('❌ Erro ao excluir instância:', error)
        
        // If instance was already deleted (404), remove from local state anyway
        if (error?.message?.includes('404') || error?.message?.includes('not found')) {
          console.log('ℹ️ Instância já foi excluída da API - removendo apenas do estado local')
          const instances = get().instances.filter(instance => instance.id !== instanceId)
          set({ instances })
          localStorage.setItem(WHATSAPP_INSTANCES_KEY, JSON.stringify(instances))
          return // Don't throw error in this case
        }
        
        throw error
      }
    },

    updateInstance: (id: string, updates: Partial<WhatsAppInstance>) => {
      set(state => ({
        instances: state.instances.map(instance =>
          instance.id === id ? { ...instance, ...updates } : instance
        )
      }))
    },

    setCurrentInstance: (instance: WhatsAppInstance | null) => {
      set({ currentInstance: instance })
    }
  }))
)

// Initialize from localStorage
const savedInstances = localStorage.getItem(WHATSAPP_INSTANCES_KEY)
if (savedInstances) {
  try {
    const instances = JSON.parse(savedInstances)
    useInstanceStore.setState({ instances })
  } catch (error) {
    console.error('Erro ao carregar instâncias do localStorage:', error)
  }
} 