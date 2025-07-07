import { create } from 'zustand'
import { evolutionAPI } from '../../services/evolutionAPI'
import { useInstanceStore } from './instanceStore'

interface ConnectionState {
  pollingIntervals: Record<string, NodeJS.Timeout>
  
  // Actions
  connectInstance: (instanceId: string) => Promise<void>
  disconnectInstance: (instanceId: string) => Promise<void>
  startPolling: (instanceId: string) => void
  stopPolling: (instanceId: string) => void
  configureWebhook: (instanceId: string) => Promise<void>
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  pollingIntervals: {},

  configureWebhook: async (instanceId: string) => {
    try {
      console.log('🔧 Configurando webhook para instância:', instanceId)
      
      // Get current URL for webhook configuration
      const baseUrl = window.location.origin
      await evolutionAPI.configureRealTimeWebhook(instanceId, baseUrl)
      
      console.log('✅ Webhook configurado com sucesso para:', instanceId)
    } catch (error) {
      console.error('❌ Erro ao configurar webhook:', error)
      // Don't throw error - webhook is optional for basic functionality
    }
  },

  connectInstance: async (instanceId: string) => {
    console.log('🔗 Conectando instância:', instanceId)
    
    try {
      // First, verify if instance exists before attempting connection
      console.log('🔍 Verificando se a instância existe na API...')
      try {
        await evolutionAPI.getInstanceInfo(instanceId)
      } catch (error: any) {
        if (error?.message?.includes('404') || error?.message?.includes('not found')) {
          console.log(`❌ Instância ${instanceId} não encontrada na API - removendo do estado local`)
          const instanceStore = useInstanceStore.getState()
          const instancesWithoutMissing = instanceStore.instances.filter(instance => instance.id !== instanceId)
          instanceStore.updateInstance(instanceId, { status: 'disconnected' })
          throw new Error(`Instância "${instanceId}" não existe na API. Foi removida do estado local.`)
        }
        throw error
      }

      // Update instance status to connecting
      const instanceStore = useInstanceStore.getState()
      instanceStore.updateInstance(instanceId, { status: 'connecting' })
      
      // Start connection process
      console.log('📡 Chamando connectInstance na API...')
      const connectResponse = await evolutionAPI.connectInstance(instanceId)
      
      // Check if QR code is in the response
      if (connectResponse?.base64) {
        console.log('📱 QR Code recebido na resposta de conexão!')
        // Update instance with QR code from connect response
        instanceStore.updateInstance(instanceId, { 
          status: 'qr_needed', 
          qrCode: connectResponse.base64 
        })
      } else {
        console.log('ℹ️ QR Code não encontrado na resposta')
      }
      
      // Start polling for connection status
      get().startPolling(instanceId)
      
    } catch (error) {
      console.error('Error connecting instance:', error)
      throw error
    }
  },

  disconnectInstance: async (instanceId: string) => {
    console.log('🔌 Desconectando instância:', instanceId)
    try {
      await evolutionAPI.logoutInstance(instanceId)
      
      const instanceStore = useInstanceStore.getState()
      instanceStore.updateInstance(instanceId, { 
        status: 'disconnected', 
        qrCode: undefined, 
        phone: undefined 
      })
      
      // Stop polling
      get().stopPolling(instanceId)
      
      console.log('✅ Instância desconectada:', instanceId)
    } catch (error) {
      console.error('❌ Erro ao desconectar instância:', error)
      throw error
    }
  },

  startPolling: (instanceId: string) => {
    const { pollingIntervals } = get()
    
    // If already polling, stop first
    if (pollingIntervals[instanceId]) {
      clearInterval(pollingIntervals[instanceId])
    }
    
    let attempts = 0
    const maxAttempts = 24 // 24 attempts * 5 seconds = 2 minutes
    
    const checkStatus = async () => {
      try {
        const instanceInfo = await evolutionAPI.getInstanceInfo(instanceId)
        const instanceData = Array.isArray(instanceInfo) ? instanceInfo[0] : instanceInfo
        const instanceStore = useInstanceStore.getState()
        
        if (instanceData?.connectionStatus === 'open') {
          // Connected successfully
          console.log(`✅ Instância ${instanceId} conectada com sucesso!`)
          instanceStore.updateInstance(instanceId, {
            status: 'connected',
            qrCode: undefined,
            phone: instanceData.ownerJid ? instanceData.ownerJid.replace('@s.whatsapp.net', '') : undefined,
            lastActivity: new Date().toISOString()
          })
          
          // Configure webhook for real-time updates
          get().configureWebhook(instanceId)
          
          get().stopPolling(instanceId)
          return true
          
        } else if (instanceData?.connectionStatus === 'close') {
          // Explicitly disconnected
          console.log(`❌ Instância ${instanceId} desconectada`)
          instanceStore.updateInstance(instanceId, { 
            status: 'disconnected', 
            qrCode: undefined 
          })
          get().stopPolling(instanceId)
          return true
          
        } else if (attempts < maxAttempts) {
          attempts++
          console.log(`🔄 Verificando status ${instanceId} - Tentativa ${attempts}/${maxAttempts}`)
        } else {
          // Timeout after 2 minutes
          console.log(`⏰ Timeout na conexão da instância ${instanceId}`)
          instanceStore.updateInstance(instanceId, { 
            status: 'disconnected', 
            qrCode: undefined 
          })
          get().stopPolling(instanceId)
        }
        
      } catch (error) {
        console.error(`❌ Erro ao verificar status da instância ${instanceId}:`, error)
        attempts++
        
        if (attempts >= maxAttempts) {
          console.log(`⏰ Timeout na conexão da instância ${instanceId} devido a erros`)
          const instanceStore = useInstanceStore.getState()
          instanceStore.updateInstance(instanceId, { 
            status: 'disconnected', 
            qrCode: undefined 
          })
          get().stopPolling(instanceId)
        }
      }
    }
    
    // Start polling immediately
    checkStatus()
    
    // Then poll every 5 seconds
    const interval = setInterval(checkStatus, 5000)
    
    set(state => ({
      pollingIntervals: {
        ...state.pollingIntervals,
        [instanceId]: interval
      }
    }))
  },

  stopPolling: (instanceId: string) => {
    const { pollingIntervals } = get()
    
    if (pollingIntervals[instanceId]) {
      clearInterval(pollingIntervals[instanceId])
      
      set(state => {
        const newIntervals = { ...state.pollingIntervals }
        delete newIntervals[instanceId]
        return { pollingIntervals: newIntervals }
      })
      
      console.log(`🛑 Polling parado para instância: ${instanceId}`)
    }
  }
})) 