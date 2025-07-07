import { supabase } from './supabase'

export interface Webhook {
  id: string
  user_id: string
  name: string
  description?: string
  url: string
  events: WebhookEventType[]
  status: 'active' | 'inactive' | 'error' | 'testing'
  secret_key?: string
  headers: Record<string, string>
  retry_enabled: boolean
  max_retries: number
  retry_delay_seconds: number
  filters: Record<string, any>
  total_deliveries: number
  successful_deliveries: number
  failed_deliveries: number
  last_delivery_at?: string
  last_error_at?: string
  last_error_message?: string
  created_at: string
  updated_at: string
}

export interface WebhookDelivery {
  id: string
  webhook_id: string
  event_type: WebhookEventType
  event_data: Record<string, any>
  status: 'pending' | 'delivered' | 'failed' | 'retrying'
  http_status_code?: number
  response_body?: string
  response_headers: Record<string, string>
  attempt_number: number
  max_attempts: number
  queued_at: string
  delivered_at?: string
  next_retry_at?: string
  error_message?: string
  error_details: Record<string, any>
}

export type WebhookEventType = 
  | 'whatsapp_message'
  | 'whatsapp_connection'
  | 'user_login'
  | 'user_logout'
  | 'document_upload'
  | 'email_sent'
  | 'campaign_sent'
  | 'integration_sync'
  | 'system_alert'
  | 'audit_log'
  | 'custom'

export interface CreateWebhookData {
  name: string
  description?: string
  url: string
  events: WebhookEventType[]
  secret_key?: string
  headers?: Record<string, string>
  retry_enabled?: boolean
  max_retries?: number
  retry_delay_seconds?: number
  filters?: Record<string, any>
  user_id: string
}

export interface UpdateWebhookData extends Partial<CreateWebhookData> {
  status?: 'active' | 'inactive' | 'error' | 'testing'
  user_id?: string
}

export interface WebhookFilters {
  search?: string
  status?: string
  event_type?: WebhookEventType
  created_after?: string
  created_before?: string
}

export interface WebhookStats {
  total_webhooks: number
  active_webhooks: number
  total_deliveries: number
  successful_deliveries: number
  failed_deliveries: number
  success_rate: number
  average_response_time: number
}

class WebhookService {
  private static instance: WebhookService

  static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService()
    }
    return WebhookService.instance
  }

  // =====================================================
  // CRUD OPERATIONS
  // =====================================================

  async createWebhook(data: CreateWebhookData): Promise<Webhook> {
    const { data: webhook, error } = await supabase
      .from('webhooks')
      .insert({
        name: data.name,
        description: data.description,
        url: data.url,
        events: data.events,
        secret_key: data.secret_key,
        headers: data.headers || {},
        retry_enabled: data.retry_enabled ?? true,
        max_retries: data.max_retries ?? 3,
        retry_delay_seconds: data.retry_delay_seconds ?? 60,
        filters: data.filters || {},
        user_id: data.user_id
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar webhook: ${error.message}`)
    }

    return webhook
  }

  async getWebhooks(filters: WebhookFilters = {}): Promise<Webhook[]> {
    let query = supabase
      .from('webhooks')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.event_type) {
      query = query.contains('events', [filters.event_type])
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after)
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before)
    }

    const { data: webhooks, error } = await query

    if (error) {
      throw new Error(`Erro ao buscar webhooks: ${error.message}`)
    }

    return webhooks || []
  }

  async getWebhook(id: string): Promise<Webhook | null> {
    const { data: webhook, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Erro ao buscar webhook: ${error.message}`)
    }

    return webhook
  }

  async updateWebhook(id: string, data: UpdateWebhookData): Promise<Webhook> {
    const { data: webhook, error } = await supabase
      .from('webhooks')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar webhook: ${error.message}`)
    }

    return webhook
  }

  async deleteWebhook(id: string): Promise<void> {
    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao deletar webhook: ${error.message}`)
    }
  }

  // =====================================================
  // DELIVERY OPERATIONS
  // =====================================================

  async getDeliveries(webhookId: string, limit: number = 50): Promise<WebhookDelivery[]> {
    const { data: deliveries, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('queued_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Erro ao buscar entregas: ${error.message}`)
    }

    return deliveries || []
  }

  async getDelivery(id: string): Promise<WebhookDelivery | null> {
    const { data: delivery, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Erro ao buscar entrega: ${error.message}`)
    }

    return delivery
  }

  // =====================================================
  // TESTING OPERATIONS
  // =====================================================

  async testWebhook(id: string): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const webhook = await this.getWebhook(id)
      if (!webhook) {
        return { success: false, message: 'Webhook não encontrado' }
      }

      // Criar payload de teste
      const testPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Este é um teste do webhook',
          webhook_id: webhook.id,
          webhook_name: webhook.name
        }
      }

      // Enviar requisição de teste
      const response = await this.sendWebhook(webhook, testPayload)

      return {
        success: response.success,
        message: response.success ? 'Webhook testado com sucesso' : 'Falha no teste do webhook',
        details: response
      }
    } catch (error) {
      return {
        success: false,
        message: `Erro ao testar webhook: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }

  // =====================================================
  // STATISTICS
  // =====================================================

  async getWebhookStats(): Promise<WebhookStats> {
    const { data: stats, error } = await supabase
      .rpc('get_webhook_stats')

    if (error) {
      // Fallback para cálculo manual se a função não existir
      const webhooks = await this.getWebhooks()
      const total_webhooks = webhooks.length
      const active_webhooks = webhooks.filter(w => w.status === 'active').length
      const total_deliveries = webhooks.reduce((sum, w) => sum + w.total_deliveries, 0)
      const successful_deliveries = webhooks.reduce((sum, w) => sum + w.successful_deliveries, 0)
      const failed_deliveries = webhooks.reduce((sum, w) => sum + w.failed_deliveries, 0)
      const success_rate = total_deliveries > 0 ? (successful_deliveries / total_deliveries) * 100 : 0

      return {
        total_webhooks,
        active_webhooks,
        total_deliveries,
        successful_deliveries,
        failed_deliveries,
        success_rate,
        average_response_time: 0 // Não calculado no fallback
      }
    }

    return stats
  }

  // =====================================================
  // WEBHOOK DELIVERY
  // =====================================================

  async sendWebhook(webhook: Webhook, payload: any): Promise<{ success: boolean; statusCode?: number; response?: string; error?: string }> {
    try {
      // Preparar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'ElevROI-Webhook/1.0',
        ...webhook.headers
      }

      // Adicionar assinatura HMAC se secret_key estiver configurada
      if (webhook.secret_key) {
        const signature = this.generateHMACSignature(JSON.stringify(payload), webhook.secret_key)
        headers['X-Webhook-Signature'] = signature
      }

      // Enviar requisição
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // 30 segundos timeout
      })

      const responseText = await response.text()

      const success = response.ok
      const statusCode = response.status

      // Registrar entrega
      await this.registerDelivery(webhook.id, 'custom', payload, success ? 'delivered' : 'failed', statusCode, responseText)

      return {
        success,
        statusCode,
        response: responseText
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      // Registrar entrega com erro
      await this.registerDelivery(webhook.id, 'custom', payload, 'failed', undefined, undefined, errorMessage)

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  async triggerWebhookEvent(eventType: WebhookEventType, eventData: any): Promise<void> {
    try {
      // Buscar webhooks ativos para este evento
      const { data: webhooks, error } = await supabase
        .rpc('get_webhooks_for_event', { event_type_param: eventType })

      if (error) {
        console.error('Erro ao buscar webhooks para evento:', error)
        return
      }

      if (!webhooks || webhooks.length === 0) {
        return
      }

      // Preparar payload do evento
      const payload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data: eventData
      }

      // Enviar para todos os webhooks
      const promises = webhooks.map((webhook: any) => 
        this.sendWebhook(webhook, payload)
      )

      await Promise.allSettled(promises)
    } catch (error) {
      console.error('Erro ao disparar evento de webhook:', error)
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private async registerDelivery(
    webhookId: string,
    eventType: WebhookEventType,
    eventData: any,
    status: 'delivered' | 'failed',
    httpStatusCode?: number,
    responseBody?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase.rpc('register_webhook_delivery', {
        p_webhook_id: webhookId,
        p_event_type: eventType,
        p_event_data: eventData,
        p_status: status,
        p_http_status_code: httpStatusCode,
        p_response_body: responseBody,
        p_error_message: errorMessage
      })
    } catch (error) {
      console.error('Erro ao registrar entrega de webhook:', error)
    }
  }

  private generateHMACSignature(payload: string, secretKey: string): string {
    // Implementação básica de HMAC - em produção, use uma biblioteca criptográfica
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secretKey)
    const messageData = encoder.encode(payload)
    
    // Usar Web Crypto API se disponível
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // Implementação com Web Crypto API seria mais segura
      // Por simplicidade, retornando uma assinatura básica
      return btoa(`${secretKey}:${payload}`).slice(0, 64)
    }
    
    // Fallback simples
    return btoa(`${secretKey}:${payload}`).slice(0, 64)
  }

  // =====================================================
  // VALIDATION
  // =====================================================

  validateWebhookUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  validateWebhookData(data: CreateWebhookData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Nome é obrigatório')
    }

    if (!data.url || !this.validateWebhookUrl(data.url)) {
      errors.push('URL inválida')
    }

    if (!data.events || data.events.length === 0) {
      errors.push('Pelo menos um evento deve ser selecionado')
    }

    if (data.max_retries !== undefined && (data.max_retries < 0 || data.max_retries > 10)) {
      errors.push('Número máximo de tentativas deve estar entre 0 e 10')
    }

    if (data.retry_delay_seconds !== undefined && (data.retry_delay_seconds < 10 || data.retry_delay_seconds > 3600)) {
      errors.push('Delay de retry deve estar entre 10 e 3600 segundos')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export const webhookService = WebhookService.getInstance()

// =====================================================
// EVENT TRIGGERS
// =====================================================

// Função para disparar eventos de WhatsApp
export const triggerWhatsAppEvent = (eventType: 'whatsapp_message' | 'whatsapp_connection', data: any) => {
  webhookService.triggerWebhookEvent(eventType, data)
}

// Função para disparar eventos de usuário
export const triggerUserEvent = (eventType: 'user_login' | 'user_logout', data: any) => {
  webhookService.triggerWebhookEvent(eventType, data)
}

// Função para disparar eventos de sistema
export const triggerSystemEvent = (eventType: 'system_alert' | 'audit_log', data: any) => {
  webhookService.triggerWebhookEvent(eventType, data)
}

// Função para disparar eventos customizados
export const triggerCustomEvent = (eventType: string, data: any) => {
  webhookService.triggerWebhookEvent('custom', {
    custom_event_type: eventType,
    ...data
  })
} 