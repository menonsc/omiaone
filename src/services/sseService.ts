interface SSEConfig {
  baseURL: string
  apiKey: string
  instanceName: string
}

interface SSEEventHandlers {
  onMessage?: (message: any) => void
  onConnectionUpdate?: (status: string) => void
  onError?: (error: any) => void
  onReconnect?: () => void
}

class SSEService {
  private config: SSEConfig
  private eventSource: EventSource | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false
  private eventHandlers: SSEEventHandlers = {}
  private reconnectTimeout: NodeJS.Timeout | null = null

  constructor(config: SSEConfig) {
    this.config = config
  }

  setEventHandlers(handlers: SSEEventHandlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers }
  }

  async connect(instanceName?: string): Promise<void> {
    if (this.isConnecting || this.eventSource?.readyState === EventSource.OPEN) {
      return
    }

    this.isConnecting = true
    const instance = instanceName || this.config.instanceName

    try {
      // SSE endpoint
      const sseUrl = `${this.config.baseURL}/webhook/sse/${instance}?apikey=${encodeURIComponent(this.config.apiKey)}`
      
      console.log('🔌 Conectando SSE:', sseUrl)
      
      this.eventSource = new EventSource(sseUrl)

      this.eventSource.onopen = () => {
        console.log('✅ SSE conectado com sucesso')
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.eventHandlers.onConnectionUpdate?.('connected')
      }

      this.eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('📨 SSE message received:', message)
          
          if (message.type === 'message') {
            this.eventHandlers.onMessage?.(message.data)
          } else if (message.type === 'connection') {
            this.eventHandlers.onConnectionUpdate?.(message.data.status)
          } else if (message.type === 'error') {
            this.eventHandlers.onError?.(message.data)
          }
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error)
        }
      }

      this.eventSource.onerror = (error) => {
        console.error('❌ SSE error:', error)
        this.isConnecting = false
        this.eventHandlers.onError?.(error)
        
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.scheduleReconnect()
        }
      }

    } catch (error) {
      console.error('❌ Error connecting SSE:', error)
      this.isConnecting = false
      this.eventHandlers.onError?.(error)
      throw error
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Máximo de tentativas de reconexão atingido')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`🔄 Agendando reconexão SSE em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.eventSource?.readyState !== EventSource.OPEN) {
        this.connect()
      }
    }, delay)
  }

  disconnect() {
    console.log('🔌 Desconectando SSE')
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    
    this.isConnecting = false
    this.reconnectAttempts = 0
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN
  }
}

// Default configuration
const defaultSSEConfig: SSEConfig = {
  baseURL: import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080',
  apiKey: import.meta.env.VITE_EVOLUTION_API_KEY || 'your-api-key',
  instanceName: import.meta.env.VITE_EVOLUTION_INSTANCE_NAME || 'default-instance'
}

export const sseService = new SSEService(defaultSSEConfig)

export {
  SSEService,
  type SSEConfig,
  type SSEEventHandlers
} 