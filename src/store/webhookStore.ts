import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  webhookService, 
  Webhook, 
  WebhookDelivery, 
  CreateWebhookData, 
  UpdateWebhookData, 
  WebhookFilters, 
  WebhookStats 
} from '../services/webhookService'

interface WebhookState {
  // Estado dos dados
  webhooks: Webhook[]
  deliveries: Record<string, WebhookDelivery[]>
  stats: WebhookStats | null
  
  // Estado de UI
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isTesting: boolean
  error: string | null
  
  // Filtros ativos
  activeFilters: WebhookFilters
  
  // Webhook selecionado
  selectedWebhook: Webhook | null
  
  // Actions para webhooks
  fetchWebhooks: (filters?: WebhookFilters) => Promise<void>
  createWebhook: (data: CreateWebhookData) => Promise<Webhook>
  updateWebhook: (id: string, data: UpdateWebhookData) => Promise<Webhook>
  deleteWebhook: (id: string) => Promise<void>
  testWebhook: (id: string) => Promise<{ success: boolean; message: string; details?: any }>
  
  // Actions para deliveries
  fetchDeliveries: (webhookId: string, limit?: number) => Promise<void>
  
  // Actions para estatísticas
  fetchStats: () => Promise<void>
  
  // Actions de UI
  setSelectedWebhook: (webhook: Webhook | null) => void
  setActiveFilters: (filters: WebhookFilters) => void
  clearFilters: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Actions de estado
  refreshWebhooks: () => Promise<void>
  clearState: () => void
}

const defaultStats: WebhookStats = {
  total_webhooks: 0,
  active_webhooks: 0,
  total_deliveries: 0,
  successful_deliveries: 0,
  failed_deliveries: 0,
  success_rate: 0,
  average_response_time: 0
}

export const useWebhookStore = create<WebhookState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      webhooks: [],
      deliveries: {},
      stats: null,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      isTesting: false,
      error: null,
      activeFilters: {},
      selectedWebhook: null,

      // =====================================================
      // WEBHOOK ACTIONS
      // =====================================================

      fetchWebhooks: async (filters?: WebhookFilters) => {
        set({ isLoading: true, error: null })
        
        try {
          const webhooks = await webhookService.getWebhooks(filters || get().activeFilters)
          set({ webhooks, isLoading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao buscar webhooks',
            isLoading: false 
          })
        }
      },

      createWebhook: async (data: CreateWebhookData) => {
        set({ isCreating: true, error: null })
        
        try {
          const webhook = await webhookService.createWebhook(data)
          set(state => ({
            webhooks: [webhook, ...state.webhooks],
            isCreating: false
          }))
          return webhook
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao criar webhook',
            isCreating: false 
          })
          throw error
        }
      },

      updateWebhook: async (id: string, data: UpdateWebhookData) => {
        set({ isUpdating: true, error: null })
        
        try {
          const updatedWebhook = await webhookService.updateWebhook(id, data)
          set(state => ({
            webhooks: state.webhooks.map(w => w.id === id ? updatedWebhook : w),
            selectedWebhook: state.selectedWebhook?.id === id ? updatedWebhook : state.selectedWebhook,
            isUpdating: false
          }))
          return updatedWebhook
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao atualizar webhook',
            isUpdating: false 
          })
          throw error
        }
      },

      deleteWebhook: async (id: string) => {
        set({ isDeleting: true, error: null })
        
        try {
          await webhookService.deleteWebhook(id)
          set(state => ({
            webhooks: state.webhooks.filter(w => w.id !== id),
            selectedWebhook: state.selectedWebhook?.id === id ? null : state.selectedWebhook,
            deliveries: Object.fromEntries(
              Object.entries(state.deliveries).filter(([webhookId]) => webhookId !== id)
            ),
            isDeleting: false
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao deletar webhook',
            isDeleting: false 
          })
          throw error
        }
      },

      testWebhook: async (id: string) => {
        set({ isTesting: true, error: null })
        
        try {
          const result = await webhookService.testWebhook(id)
          set({ isTesting: false })
          return result
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao testar webhook',
            isTesting: false 
          })
          throw error
        }
      },

      // =====================================================
      // DELIVERY ACTIONS
      // =====================================================

      fetchDeliveries: async (webhookId: string, limit: number = 50) => {
        try {
          const deliveries = await webhookService.getDeliveries(webhookId, limit)
          set(state => ({
            deliveries: {
              ...state.deliveries,
              [webhookId]: deliveries
            }
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao buscar entregas'
          })
        }
      },

      // =====================================================
      // STATS ACTIONS
      // =====================================================

      fetchStats: async () => {
        try {
          const stats = await webhookService.getWebhookStats()
          set({ stats })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas',
            stats: defaultStats
          })
        }
      },

      // =====================================================
      // UI ACTIONS
      // =====================================================

      setSelectedWebhook: (webhook: Webhook | null) => {
        set({ selectedWebhook: webhook })
      },

      setActiveFilters: (filters: WebhookFilters) => {
        set({ activeFilters: filters })
      },

      clearFilters: () => {
        set({ activeFilters: {} })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      // =====================================================
      // STATE ACTIONS
      // =====================================================

      refreshWebhooks: async () => {
        await get().fetchWebhooks()
      },

      clearState: () => {
        set({
          webhooks: [],
          deliveries: {},
          stats: null,
          selectedWebhook: null,
          activeFilters: {},
          error: null
        })
      }
    }),
    {
      name: 'webhook-store',
      partialize: (state) => ({
        activeFilters: state.activeFilters,
        selectedWebhook: state.selectedWebhook
      })
    }
  )
)

// =====================================================
// SELECTORS
// =====================================================

export const useWebhookSelector = <T>(selector: (state: WebhookState) => T) => {
  return useWebhookStore(selector)
}

export const useWebhooks = () => useWebhookStore(state => state.webhooks)
export const useWebhookStats = () => useWebhookStore(state => state.stats)
export const useSelectedWebhook = () => useWebhookStore(state => state.selectedWebhook)
export const useWebhookDeliveries = (webhookId: string) => 
  useWebhookStore(state => state.deliveries[webhookId] || [])

export const useWebhookLoading = () => useWebhookStore(state => ({
  isLoading: state.isLoading,
  isCreating: state.isCreating,
  isUpdating: state.isUpdating,
  isDeleting: state.isDeleting,
  isTesting: state.isTesting
}))

export const useWebhookError = () => useWebhookStore(state => state.error)

// =====================================================
// COMPUTED SELECTORS
// =====================================================

export const useActiveWebhooks = () => 
  useWebhookStore(state => state.webhooks.filter(w => w.status === 'active'))

export const useWebhookByStatus = (status: Webhook['status']) => 
  useWebhookStore(state => state.webhooks.filter(w => w.status === status))

export const useWebhookByEvent = (eventType: string) => 
  useWebhookStore(state => state.webhooks.filter(w => w.events.includes(eventType as any)))

export const useWebhookSuccessRate = () => 
  useWebhookStore(state => {
    if (!state.stats) return 0
    return state.stats.success_rate
  })

// =====================================================
// ACTIONS EXPORT
// =====================================================

export const {
  fetchWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  fetchDeliveries,
  fetchStats,
  setSelectedWebhook,
  setActiveFilters,
  clearFilters,
  setLoading,
  setError,
  refreshWebhooks,
  clearState
} = useWebhookStore.getState() 