import { supabase } from './supabase'
import { flowExecutionEngine } from './flowExecutionEngine'
import { 
  FlowTrigger, 
  TriggerType, 
  ScheduledTrigger,
  WebhookPayload,
  TriggerData
} from '../types/flowBuilder'
import { webhookService } from './webhookService'

// ========================================
// SERVIÇO DE TRIGGERS DO FLOW BUILDER
// ========================================

class FlowTriggerService {
  private scheduler: NodeJS.Timeout | null = null
  private activeTriggers: Map<string, FlowTrigger> = new Map()

  constructor() {
    this.initializeScheduler()
  }

  // ========================================
  // INICIALIZAÇÃO DO SCHEDULER
  // ========================================

  private async initializeScheduler(): Promise<void> {
    // Carregar triggers ativos do banco
    await this.loadActiveTriggers()
    
    // Iniciar scheduler para triggers agendados
    this.startScheduler()
  }

  private async loadActiveTriggers(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('flow_triggers')
        .select('*')
        .eq('is_active', true)

      if (error) {
        console.error('Erro ao carregar triggers ativos:', error)
        return
      }

      data?.forEach(trigger => {
        this.activeTriggers.set(trigger.id, trigger)
      })
    } catch (error) {
      console.error('Erro ao carregar triggers:', error)
    }
  }

  private startScheduler(): void {
    // Executar a cada minuto para verificar triggers agendados
    this.scheduler = setInterval(async () => {
      await this.processScheduledTriggers()
    }, 60000) // 1 minuto
  }

  // ========================================
  // GESTÃO DE TRIGGERS
  // ========================================

  async createTrigger(trigger: Omit<FlowTrigger, 'id' | 'createdAt' | 'updatedAt'>): Promise<FlowTrigger | null> {
    try {
      const { data, error } = await supabase
        .from('flow_triggers')
        .insert({
          flow_id: trigger.flowId,
          trigger_type: trigger.triggerType,
          config: trigger.config,
          webhook_url: trigger.webhookUrl,
          webhook_secret: trigger.webhookSecret,
          cron_expression: trigger.cronExpression,
          timezone: trigger.timezone,
          next_run_at: trigger.nextRunAt,
          is_active: trigger.isActive
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar trigger:', error)
        return null
      }

      const createdTrigger = this.mapDatabaseToTrigger(data)
      
      // Adicionar à lista de triggers ativos
      if (createdTrigger.isActive) {
        this.activeTriggers.set(createdTrigger.id, createdTrigger)
      }

      // Configurar trigger específico
      await this.setupTrigger(createdTrigger)

      return createdTrigger
    } catch (error) {
      console.error('Erro ao criar trigger:', error)
      return null
    }
  }

  async updateTrigger(triggerId: string, updates: Partial<FlowTrigger>): Promise<FlowTrigger | null> {
    try {
      const updateData: any = {}

      if (updates.triggerType) updateData.trigger_type = updates.triggerType
      if (updates.config) updateData.config = updates.config
      if (updates.webhookUrl !== undefined) updateData.webhook_url = updates.webhookUrl
      if (updates.webhookSecret !== undefined) updateData.webhook_secret = updates.webhookSecret
      if (updates.cronExpression !== undefined) updateData.cron_expression = updates.cronExpression
      if (updates.timezone !== undefined) updateData.timezone = updates.timezone
      if (updates.nextRunAt !== undefined) updateData.next_run_at = updates.nextRunAt
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive

      const { data, error } = await supabase
        .from('flow_triggers')
        .update(updateData)
        .eq('id', triggerId)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar trigger:', error)
        return null
      }

      const updatedTrigger = this.mapDatabaseToTrigger(data)

      // Atualizar lista de triggers ativos
      if (updatedTrigger.isActive) {
        this.activeTriggers.set(updatedTrigger.id, updatedTrigger)
      } else {
        this.activeTriggers.delete(updatedTrigger.id)
      }

      // Reconfigurar trigger
      await this.setupTrigger(updatedTrigger)

      return updatedTrigger
    } catch (error) {
      console.error('Erro ao atualizar trigger:', error)
      return null
    }
  }

  async deleteTrigger(triggerId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('flow_triggers')
        .delete()
        .eq('id', triggerId)

      if (error) {
        console.error('Erro ao deletar trigger:', error)
        return false
      }

      // Remover da lista de triggers ativos
      this.activeTriggers.delete(triggerId)

      return true
    } catch (error) {
      console.error('Erro ao deletar trigger:', error)
      return false
    }
  }

  async getTriggers(flowId?: string): Promise<FlowTrigger[]> {
    try {
      let query = supabase.from('flow_triggers').select('*')

      if (flowId) {
        query = query.eq('flow_id', flowId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar triggers:', error)
        return []
      }

      return data?.map(this.mapDatabaseToTrigger) || []
    } catch (error) {
      console.error('Erro ao buscar triggers:', error)
      return []
    }
  }

  // ========================================
  // CONFIGURAÇÃO DE TRIGGERS ESPECÍFICOS
  // ========================================

  private async setupTrigger(trigger: FlowTrigger): Promise<void> {
    switch (trigger.triggerType) {
      case 'webhook':
        await this.setupWebhookTrigger(trigger)
        break
      case 'schedule':
        await this.setupScheduleTrigger(trigger)
        break
      case 'message_received':
        await this.setupMessageTrigger(trigger)
        break
    }
  }

  private async setupWebhookTrigger(trigger: FlowTrigger): Promise<void> {
    if (!trigger.webhookUrl) return

    // Registrar webhook no sistema de webhooks
    // Nota: Implementação simplificada - em produção integrar com webhookService
    console.log(`Webhook trigger configurado para flow: ${trigger.flowId}, URL: ${trigger.webhookUrl}`)
  }

  private async setupScheduleTrigger(trigger: FlowTrigger): Promise<void> {
    if (!trigger.cronExpression) return

    // Calcular próxima execução
    const nextRun = this.calculateNextRun(trigger.cronExpression, trigger.timezone || 'UTC')
    
    await supabase
      .from('flow_triggers')
      .update({ next_run_at: nextRun.toISOString() })
      .eq('id', trigger.id)
  }

  private async setupMessageTrigger(trigger: FlowTrigger): Promise<void> {
    // Configurar trigger para mensagens recebidas
    // Isso será processado pelo serviço de WhatsApp
    console.log(`Trigger de mensagem configurado para flow: ${trigger.flowId}`)
  }

  // ========================================
  // PROCESSAMENTO DE TRIGGERS
  // ========================================

  async processWebhookTrigger(webhookData: WebhookPayload): Promise<void> {
    try {
      const trigger = this.activeTriggers.get(webhookData.triggerId)
      if (!trigger) {
        console.error('Trigger não encontrado:', webhookData.triggerId)
        return
      }

      // Validar assinatura do webhook se configurada
      if (trigger.webhookSecret && webhookData.signature) {
        const isValid = this.validateWebhookSignature(webhookData, trigger.webhookSecret)
        if (!isValid) {
          console.error('Assinatura do webhook inválida')
          return
        }
      }

      // Executar flow
      await flowExecutionEngine.executeFlow(
        trigger.flowId,
        'webhook',
        webhookData.data
      )

      // Atualizar estatísticas do trigger
      await this.updateTriggerStats(trigger.id)

    } catch (error) {
      console.error('Erro ao processar webhook trigger:', error)
    }
  }

  async processMessageTrigger(messageData: any): Promise<void> {
    try {
      // Buscar triggers de mensagem ativos
      const messageTriggers = Array.from(this.activeTriggers.values())
        .filter(trigger => trigger.triggerType === 'message_received')

      for (const trigger of messageTriggers) {
        // Verificar se a mensagem atende aos critérios do trigger
        if (this.matchesTriggerCriteria(messageData, trigger.config)) {
          await flowExecutionEngine.executeFlow(
            trigger.flowId,
            'message_received',
            messageData
          )

          await this.updateTriggerStats(trigger.id)
        }
      }
    } catch (error) {
      console.error('Erro ao processar message trigger:', error)
    }
  }

  private async processScheduledTriggers(): Promise<void> {
    try {
      const now = new Date()
      
      // Buscar triggers agendados que devem executar agora
      const { data, error } = await supabase
        .from('flow_triggers')
        .select('*')
        .eq('trigger_type', 'schedule')
        .eq('is_active', true)
        .lte('next_run_at', now.toISOString())

      if (error) {
        console.error('Erro ao buscar triggers agendados:', error)
        return
      }

      for (const triggerData of data || []) {
        const trigger = this.mapDatabaseToTrigger(triggerData)
        
        // Executar flow
        await flowExecutionEngine.executeFlow(
          trigger.flowId,
          'schedule',
          { scheduled_at: trigger.nextRunAt }
        )

        // Calcular próxima execução
        const nextRun = this.calculateNextRun(trigger.cronExpression!, trigger.timezone || 'UTC')
        
        // Atualizar trigger
        await supabase
          .from('flow_triggers')
          .update({
            next_run_at: nextRun.toISOString(),
            last_triggered_at: now.toISOString(),
            trigger_count: trigger.triggerCount + 1
          })
          .eq('id', trigger.id)

        await this.updateTriggerStats(trigger.id)
      }
    } catch (error) {
      console.error('Erro ao processar triggers agendados:', error)
    }
  }

  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================

  private calculateNextRun(cronExpression: string, timezone: string): Date {
    // Implementação simplificada - em produção usar biblioteca como node-cron
    const now = new Date()
    const nextRun = new Date(now)
    
    // Para demonstração, adicionar 1 hora
    nextRun.setHours(nextRun.getHours() + 1)
    
    return nextRun
  }

  private validateWebhookSignature(webhookData: WebhookPayload, secret: string): boolean {
    // Implementar validação de assinatura HMAC
    // Por simplicidade, retornar true
    return true
  }

  private matchesTriggerCriteria(messageData: any, config: any): boolean {
    // Implementar lógica de matching baseada na configuração
    // Por exemplo, verificar se a mensagem contém palavras-chave
    if (config.keywords && Array.isArray(config.keywords)) {
      const messageText = messageData.text?.toLowerCase() || ''
      return config.keywords.some((keyword: string) => 
        messageText.includes(keyword.toLowerCase())
      )
    }
    
    return true
  }

  private async updateTriggerStats(triggerId: string): Promise<void> {
    try {
      await supabase
        .from('flow_triggers')
        .update({
          trigger_count: (await supabase.from('flow_triggers').select('trigger_count').eq('id', triggerId).single()).data?.trigger_count + 1,
          last_triggered_at: new Date().toISOString()
        })
        .eq('id', triggerId)
    } catch (error) {
      console.error('Erro ao atualizar estatísticas do trigger:', error)
    }
  }

  private mapDatabaseToTrigger(data: any): FlowTrigger {
    return {
      id: data.id,
      flowId: data.flow_id,
      triggerType: data.trigger_type,
      config: data.config || {},
      webhookUrl: data.webhook_url,
      webhookSecret: data.webhook_secret,
      cronExpression: data.cron_expression,
      timezone: data.timezone,
      nextRunAt: data.next_run_at,
      isActive: data.is_active,
      triggerCount: data.trigger_count || 0,
      lastTriggeredAt: data.last_triggered_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  // ========================================
  // MÉTODOS PÚBLICOS PARA MONITORAMENTO
  // ========================================

  getActiveTriggersCount(): number {
    return this.activeTriggers.size
  }

  getActiveTriggers(): FlowTrigger[] {
    return Array.from(this.activeTriggers.values())
  }

  async testTrigger(triggerId: string, testData: any = {}): Promise<boolean> {
    try {
      const trigger = this.activeTriggers.get(triggerId)
      if (!trigger) {
        console.error('Trigger não encontrado:', triggerId)
        return false
      }

      // Executar flow com dados de teste
      await flowExecutionEngine.executeFlow(
        trigger.flowId,
        trigger.triggerType,
        testData
      )

      return true
    } catch (error) {
      console.error('Erro ao testar trigger:', error)
      return false
    }
  }

  // ========================================
  // LIMPEZA E DESTRUIÇÃO
  // ========================================

  destroy(): void {
    if (this.scheduler) {
      clearInterval(this.scheduler)
      this.scheduler = null
    }
  }
}

// ========================================
// EXPORTAÇÃO
// ========================================

export const flowTriggerService = new FlowTriggerService()
export default flowTriggerService 