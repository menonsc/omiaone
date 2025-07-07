import { create } from 'zustand'
import { supabase } from '../services/supabase'
import { createYampiAPI, type YampiConfig, type YampiConnectionTest } from '../services/yampiAPI'

interface Integration {
  id: string
  user_id: string
  name: string
  display_name: string
  type: 'ecommerce' | 'payment' | 'communication' | 'crm' | 'automation' | 'productivity'
  status: 'active' | 'inactive' | 'error' | 'testing'
  config: Record<string, any>
  credentials: Record<string, any>
  last_sync_at?: string
  sync_status: string
  error_message?: string
  created_at: string
  updated_at: string
}

interface IntegrationSyncLog {
  id: string
  integration_id: string
  sync_type: 'full' | 'incremental' | 'manual'
  status: 'success' | 'error' | 'partial'
  records_processed: number
  records_success: number
  records_error: number
  error_details: Record<string, any>
  started_at: string
  completed_at?: string
  duration_ms?: number
}

interface IntegrationsState {
  integrations: Integration[]
  isLoading: boolean
  error: string | null
  
  // Yampi específico
  yampiAPI: ReturnType<typeof createYampiAPI> | null
  yampiConnectionStatus: 'idle' | 'testing' | 'connected' | 'error'
  yampiError: string | null
  
  // Actions
  fetchIntegrations: () => Promise<void>
  getIntegration: (name: string) => Integration | null
  createIntegration: (integration: Omit<Integration, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Integration>
  updateIntegration: (id: string, updates: Partial<Integration>) => Promise<void>
  deleteIntegration: (id: string) => Promise<void>
  testIntegrationConnection: (id: string) => Promise<boolean>
  
  // Yampi específico
  configureYampi: (config: YampiConfig) => Promise<void>
  testYampiConnection: () => Promise<YampiConnectionTest>
  disconnectYampi: () => Promise<void>
  
  // Sync logs
  getSyncLogs: (integrationId: string) => Promise<IntegrationSyncLog[]>
  startSync: (integrationId: string, syncType: 'full' | 'incremental' | 'manual') => Promise<void>
}

export const useIntegrationsStore = create<IntegrationsState>((set, get) => ({
  integrations: [],
  isLoading: false,
  error: null,
  yampiAPI: null,
  yampiConnectionStatus: 'idle',
  yampiError: null,

  fetchIntegrations: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const integrations = data || []
      set({ integrations, isLoading: false })

      // Se existe uma integração Yampi ativa, configurar a API
      const yampiIntegration = integrations.find(i => i.name === 'yampi' && i.status === 'active')
      if (yampiIntegration && yampiIntegration.credentials.merchantAlias && yampiIntegration.credentials.token) {
        const yampiAPI = createYampiAPI({
          merchantAlias: yampiIntegration.credentials.merchantAlias,
          token: yampiIntegration.credentials.token,
          secretKey: yampiIntegration.credentials.secretKey,
          apiKey: yampiIntegration.credentials.apiKey
        })
        set({ yampiAPI, yampiConnectionStatus: 'connected' })
      }
    } catch (error) {
      console.error('Erro ao buscar integrações:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isLoading: false 
      })
    }
  },

  getIntegration: (name: string) => {
    const { integrations } = get()
    return integrations.find(i => i.name === name) || null
  },

  createIntegration: async (integrationData) => {
    set({ isLoading: true, error: null })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('integrations')
        .insert({
          ...integrationData,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      const newIntegration = data as Integration
      set(state => ({
        integrations: [newIntegration, ...state.integrations],
        isLoading: false
      }))

      return newIntegration
    } catch (error) {
      console.error('Erro ao criar integração:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isLoading: false 
      })
      throw error
    }
  },

  updateIntegration: async (id: string, updates: Partial<Integration>) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      set(state => ({
        integrations: state.integrations.map(i => 
          i.id === id ? { ...i, ...updates } : i
        )
      }))
    } catch (error) {
      console.error('Erro ao atualizar integração:', error)
      throw error
    }
  },

  deleteIntegration: async (id: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        integrations: state.integrations.filter(i => i.id !== id)
      }))
    } catch (error) {
      console.error('Erro ao deletar integração:', error)
      throw error
    }
  },

  testIntegrationConnection: async (id: string): Promise<boolean> => {
    const { integrations } = get()
    const integration = integrations.find(i => i.id === id)
    
    if (!integration) return false

    try {
      // Atualizar status para testando
      await get().updateIntegration(id, { status: 'testing' })

      let success = false

      if (integration.name === 'yampi') {
        const yampiAPI = createYampiAPI({
          merchantAlias: integration.credentials.merchantAlias,
          token: integration.credentials.token,
          secretKey: integration.credentials.secretKey,
          apiKey: integration.credentials.apiKey
        })
        
        const result = await yampiAPI.testConnection()
        success = result.success
        
        if (!success && result.error) {
          await get().updateIntegration(id, { 
            status: 'error',
            error_message: result.error
          })
        }
      }

      if (success) {
        await get().updateIntegration(id, { 
          status: 'active',
          error_message: undefined
        })
      }

      return success
    } catch (error) {
      await get().updateIntegration(id, { 
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Erro desconhecido'
      })
      return false
    }
  },

  // Yampi específico
  configureYampi: async (config: YampiConfig) => {
    set({ yampiConnectionStatus: 'testing', yampiError: null })
    
    try {
      const yampiAPI = createYampiAPI(config)
      const connectionTest = await yampiAPI.testConnection()
      
      if (!connectionTest.success) {
        set({ 
          yampiConnectionStatus: 'error', 
          yampiError: connectionTest.error || 'Falha na conexão' 
        })
        throw new Error(connectionTest.error || 'Falha na conexão')
      }

      // Verificar se já existe uma integração Yampi
      const existingYampi = get().getIntegration('yampi')
      
      if (existingYampi) {
        // Atualizar integração existente
        await get().updateIntegration(existingYampi.id, {
          status: 'active',
          credentials: {
            merchantAlias: config.merchantAlias,
            token: config.token,
            secretKey: config.secretKey,
            apiKey: config.apiKey
          },
          config: {
            store_name: connectionTest.store_name
          },
          last_sync_at: new Date().toISOString(),
          sync_status: 'connected',
          error_message: undefined
        })
      } else {
        // Criar nova integração
        await get().createIntegration({
          name: 'yampi',
          display_name: 'Yampi',
          type: 'ecommerce',
          status: 'active',
          credentials: {
            merchantAlias: config.merchantAlias,
            token: config.token,
            secretKey: config.secretKey,
            apiKey: config.apiKey
          },
          config: {
            store_name: connectionTest.store_name
          },
          sync_status: 'connected'
        })
      }

      set({ 
        yampiAPI, 
        yampiConnectionStatus: 'connected',
        yampiError: null
      })
    } catch (error) {
      set({ 
        yampiConnectionStatus: 'error',
        yampiError: error instanceof Error ? error.message : 'Erro desconhecido'
      })
      throw error
    }
  },

  testYampiConnection: async (): Promise<YampiConnectionTest> => {
    const { yampiAPI } = get()
    
    if (!yampiAPI) {
      return {
        success: false,
        error: 'API Yampi não configurada'
      }
    }

    set({ yampiConnectionStatus: 'testing' })
    
    try {
      const result = await yampiAPI.testConnection()
      
      set({ 
        yampiConnectionStatus: result.success ? 'connected' : 'error',
        yampiError: result.success ? null : result.error || 'Erro desconhecido'
      })
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      set({ 
        yampiConnectionStatus: 'error',
        yampiError: errorMessage
      })
      
      return {
        success: false,
        error: errorMessage
      }
    }
  },

  disconnectYampi: async () => {
    const yampiIntegration = get().getIntegration('yampi')
    
    if (yampiIntegration) {
      await get().updateIntegration(yampiIntegration.id, {
        status: 'inactive',
        sync_status: 'disconnected'
      })
    }

    set({ 
      yampiAPI: null,
      yampiConnectionStatus: 'idle',
      yampiError: null
    })
  },

  getSyncLogs: async (integrationId: string): Promise<IntegrationSyncLog[]> => {
    try {
      const { data, error } = await supabase
        .from('integration_sync_logs')
        .select('*')
        .eq('integration_id', integrationId)
        .order('started_at', { ascending: false })
        .limit(50)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs de sincronização:', error)
      return []
    }
  },

  startSync: async (integrationId: string, syncType: 'full' | 'incremental' | 'manual') => {
    const { integrations } = get()
    const integration = integrations.find(i => i.id === integrationId)
    
    if (!integration) {
      throw new Error('Integração não encontrada')
    }

    try {
      // Criar log de sincronização
      const { data, error } = await supabase
        .from('integration_sync_logs')
        .insert({
          integration_id: integrationId,
          sync_type: syncType,
          status: 'success', // Por enquanto, sempre success
          records_processed: 0,
          records_success: 0,
          records_error: 0,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 100
        })
        .select()
        .single()

      if (error) throw error

      // Atualizar última sincronização
      await get().updateIntegration(integrationId, {
        last_sync_at: new Date().toISOString(),
        sync_status: 'synced'
      })
    } catch (error) {
      console.error('Erro ao iniciar sincronização:', error)
      throw error
    }
  }
}))

export type { Integration, IntegrationSyncLog } 