import { io, Socket } from 'socket.io-client'

interface WebSocketConfig {
  baseURL: string
  apiKey: string
  instanceName: string
}

interface WebSocketEventHandlers {
  onMessage?: (message: any) => void
  onConnectionUpdate?: (status: string) => void
  onError?: (error: any) => void
  onReconnect?: () => void
}

class WebSocketService {
  private config: WebSocketConfig
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false
  private eventHandlers: WebSocketEventHandlers = {}
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(config: WebSocketConfig) {
    this.config = config
  }

  setEventHandlers(handlers: WebSocketEventHandlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers }
  }

  async connect(instanceName?: string): Promise<void> {
    if (this.isConnecting || this.socket?.connected) {
      return
    }

    this.isConnecting = true
    const instance = instanceName || this.config.instanceName

    try {
      // URL adaptada para funcionar com diferentes configurações
      let wsUrl = this.config.baseURL
      
      // Limpeza da URL base
      wsUrl = wsUrl.replace(/\/$/, '') // Remove trailing slash
      
      // Configuração específica para Evolution API
      if (wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1')) {
        // Para localhost, usa o padrão do Evolution API
        wsUrl = wsUrl
      } else {
        // Para URLs externas (como ngrok, domínio personalizado)
        // Não adiciona /socket.io/ automaticamente - deixa o socket.io resolver
        wsUrl = wsUrl
      }
      
      // Ajuste: conectar no namespace correto se a instância for 'elevroi'
      if (instance === 'elevroi' && !wsUrl.endsWith('/elevroi')) {
        wsUrl = wsUrl.replace(/\/$/, '') + '/elevroi'
      }
      
      console.log('🔌 Conectando via socket.io:', wsUrl)
      console.log('🔌 Instance:', instance)

      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        auth: { 
          apikey: this.config.apiKey,
          instance: instance // Adiciona a instância no auth
        },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 30000, // Timeout aumentado
        forceNew: true,
        upgrade: true,
        rememberUpgrade: false,
        // Configurações específicas para Evolution API
        path: '/socket.io/', // Força o path padrão
        autoConnect: true
      })

      this.socket.on('connect', () => {
        console.log('✅ Socket.io conectado com sucesso')
        console.log('🔌 Socket ID:', this.socket?.id)
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.eventHandlers.onConnectionUpdate?.('connected')
        
        // Envia dados da instância após conectar
        if (this.socket) {
          this.socket.emit('join', { instance })
        }
      })

      this.socket.on('disconnect', (reason: string) => {
        console.log('🔌 Socket.io desconectado:', reason)
        this.isConnecting = false
        this.stopHeartbeat()
        this.eventHandlers.onConnectionUpdate?.('disconnected')
      })

      this.socket.on('connect_error', (error: any) => {
        console.error('❌ Socket.io connect_error:', error)
        console.error('❌ Error details:', {
          message: error.message,
          type: error.type,
          description: error.description
        })
        this.isConnecting = false
        this.eventHandlers.onError?.(error)
      })

      // Eventos específicos da Evolution API
      this.socket.on('MESSAGE_UPSERT', (data: any) => {
        console.log('📨 Evento MESSAGE_UPSERT recebido:', data)
        this.eventHandlers.onMessage?.(data)
      })

      // Adicionado: compatibilidade com evento minúsculo
      this.socket.on('messages.upsert', (data: any) => {
        console.log('📨 Evento messages.upsert recebido:', data)
        this.eventHandlers.onMessage?.(data)
      })

      this.socket.on('CONNECTION_UPDATE', (data: any) => {
        console.log('🔌 Evento CONNECTION_UPDATE recebido:', data)
        this.eventHandlers.onConnectionUpdate?.(data?.status || 'unknown')
      })

      this.socket.on('error', (error: any) => {
        console.error('❌ Socket.io error:', error)
        this.eventHandlers.onError?.(error)
      })

      // Eventos adicionais para debugging
      this.socket.on('connect_timeout', () => {
        console.error('❌ Socket.io connection timeout')
      })

      this.socket.on('reconnect', (attemptNumber: number) => {
        console.log('🔄 Socket.io reconnected after', attemptNumber, 'attempts')
      })

      this.socket.on('reconnect_error', (error: any) => {
        console.error('❌ Socket.io reconnect error:', error)
      })

      // Log global para todos os eventos recebidos
      this.socket.onAny((event, ...args) => {
        console.log('[WebSocket][onAny] Evento recebido:', event, args)
      })

    } catch (error) {
      console.error('❌ Erro ao conectar via socket.io:', error)
      this.isConnecting = false
      this.eventHandlers.onError?.(error)
      throw error
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping', { timestamp: new Date().toISOString() })
      }
    }, 30000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  disconnect() {
    console.log('🔌 Desconectando socket.io')
    this.stopHeartbeat()
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnecting = false
    this.reconnectAttempts = 0
  }

  isConnected(): boolean {
    return !!this.socket?.connected
  }

  send(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('⚠️ Socket.io não está conectado')
    }
  }
}

// Configuração padrão
const defaultWebSocketConfig: WebSocketConfig = {
  baseURL: import.meta.env.VITE_WEBSOCKET_URL || import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080',
  apiKey: import.meta.env.VITE_EVOLUTION_API_KEY || 'your-api-key',
  instanceName: import.meta.env.VITE_EVOLUTION_INSTANCE_NAME || 'default-instance'
}

export const webSocketService = new WebSocketService(defaultWebSocketConfig)

export {
  WebSocketService,
  type WebSocketConfig,
  type WebSocketEventHandlers
} 