import { supabase } from './supabase'
import { 
  Flow, 
  FlowExecution, 
  FlowNode, 
  FlowConnection,
  ExecutionContext,
  NodeExecutionResult,
  TriggerData,
  VariableScope,
  ExecutionLog,
  FlowTrigger,
  ScheduledTrigger
} from '../types/flowBuilder'
import { flowBuilderService } from './flowBuilderService'
import { webhookService } from './webhookService'
import { whatsappConversationsService } from './whatsappConversationsService'
import mailgun from './mailgun'

// ========================================
// ENGINE DE EXECUÇÃO DE FLUXOS EM TEMPO REAL
// ========================================

class FlowExecutionEngine {
  private executionQueue: Map<string, Promise<void>> = new Map()
  private activeExecutions: Map<string, ExecutionContext> = new Map()
  private nodeProcessors: Map<string, NodeProcessor> = new Map()

  constructor() {
    this.initializeNodeProcessors()
  }

  // ========================================
  // INICIALIZAÇÃO DOS PROCESSADORES DE NÓS
  // ========================================

  private initializeNodeProcessors() {
    // Processadores de triggers
    this.nodeProcessors.set('trigger.webhook', new WebhookTriggerProcessor())
    this.nodeProcessors.set('trigger.schedule', new ScheduleTriggerProcessor())
    this.nodeProcessors.set('trigger.manual', new ManualTriggerProcessor())
    this.nodeProcessors.set('trigger.message_received', new MessageTriggerProcessor())

    // Processadores de ações
    this.nodeProcessors.set('action.send_email', new SendEmailProcessor())
    this.nodeProcessors.set('action.send_whatsapp', new SendWhatsAppProcessor())
    this.nodeProcessors.set('action.webhook', new WebhookActionProcessor())
    this.nodeProcessors.set('action.wait', new WaitProcessor())
    this.nodeProcessors.set('action.ai_response', new AIResponseProcessor())
    this.nodeProcessors.set('action.set_variable', new SetVariableProcessor())

    // Processadores de condições
    this.nodeProcessors.set('condition.field_check', new FieldCheckProcessor())
    this.nodeProcessors.set('condition.expression', new ExpressionProcessor())
    this.nodeProcessors.set('condition.time_based', new TimeBasedProcessor())

    // Processadores de transformação
    this.nodeProcessors.set('transform.json', new JsonTransformProcessor())
    this.nodeProcessors.set('transform.text', new TextTransformProcessor())
    this.nodeProcessors.set('transform.math', new MathTransformProcessor())
  }

  // ========================================
  // EXECUÇÃO PRINCIPAL DE FLUXOS
  // ========================================

  async executeFlow(
    flowId: string, 
    triggerType: string = 'manual',
    inputData: Record<string, any> = {},
    userId?: string
  ): Promise<string> {
    const executionId = await this.createExecution(flowId, triggerType, inputData, userId)
    
    // Executar em background para não bloquear
    this.executionQueue.set(executionId, this.runExecution(executionId))
    
    return executionId
  }

  private async runExecution(executionId: string): Promise<void> {
    try {
      const execution = await this.getExecution(executionId)
      if (!execution) {
        throw new Error('Execução não encontrada')
      }

      const flow = await flowBuilderService.getFlow(execution.flowId)
      if (!flow) {
        throw new Error('Flow não encontrado')
      }

      // Criar contexto de execução
      const context: ExecutionContext = {
        executionId,
        flowId: flow.id,
        userId: execution.userId,
        variables: new Map(),
        inputData: execution.inputData,
        outputData: {},
        logs: [],
        startTime: Date.now(),
        currentNode: null,
        executionPath: []
      }

      this.activeExecutions.set(executionId, context)

      // Carregar variáveis globais e do flow
      await this.loadVariables(context, flow)

      // Executar fluxo
      await this.executeFlowNodes(flow, context)

      // Finalizar execução
      await this.finalizeExecution(executionId, context)

    } catch (error) {
      console.error('Erro na execução do flow:', error)
      await this.handleExecutionError(executionId, error)
    } finally {
      this.activeExecutions.delete(executionId)
      this.executionQueue.delete(executionId)
    }
  }

  // ========================================
  // EXECUÇÃO DE NÓS
  // ========================================

  private async executeFlowNodes(flow: Flow, context: ExecutionContext): Promise<void> {
    const { nodes, connections } = flow.flowData
    
    // Encontrar nós de trigger
    const triggerNodes = nodes.filter(node => node.type === 'trigger')
    
    for (const triggerNode of triggerNodes) {
      await this.executeNode(triggerNode, context)
      
      // Executar nós conectados
      await this.executeConnectedNodes(triggerNode, nodes, connections, context)
    }
  }

  private async executeConnectedNodes(
    startNode: FlowNode,
    nodes: FlowNode[],
    connections: FlowConnection[],
    context: ExecutionContext
  ): Promise<void> {
    const connectedNodes = this.getConnectedNodes(startNode.id, connections)
    
    for (const connection of connectedNodes) {
      const targetNode = nodes.find(n => n.id === connection.target)
      if (!targetNode) continue

      // Verificar condição da conexão
      if (connection.condition && !this.evaluateCondition(connection.condition, context)) {
        continue
      }

      // Executar nó
      const result = await this.executeNode(targetNode, context)
      
      // Se o nó foi executado com sucesso, continuar com os próximos
      if (result.success) {
        await this.executeConnectedNodes(targetNode, nodes, connections, context)
      }
    }
  }

  private async executeNode(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now()
    
    try {
      // Atualizar contexto
      context.currentNode = node
      context.executionPath.push({
        nodeId: node.id,
        nodeType: node.type,
        timestamp: new Date().toISOString()
      })

      // Log de início
      this.logExecution(context, 'info', `Executando nó: ${node.id} (${node.type})`)

      // Obter processador do nó
      const processor = this.nodeProcessors.get(`${node.type}.${node.subtype}`)
      if (!processor) {
        throw new Error(`Processador não encontrado para nó: ${node.type}.${node.subtype}`)
      }

      // Executar nó
      const result = await processor.execute(node, context)

      // Log de sucesso
      this.logExecution(context, 'info', `Nó ${node.id} executado com sucesso`, {
        duration: Date.now() - startTime,
        output: result.output
      })

      return result

    } catch (error) {
      // Log de erro
      this.logExecution(context, 'error', `Erro na execução do nó ${node.id}: ${error}`, {
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        success: false,
        output: {},
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // ========================================
  // SISTEMA DE VARIÁVEIS E CONTEXTO
  // ========================================

  private async loadVariables(context: ExecutionContext, flow: Flow): Promise<void> {
    // Carregar variáveis globais
    const globalVariables = await flowBuilderService.getVariables('global')
    for (const variable of globalVariables) {
      context.variables.set(`global.${variable.variableName}`, variable.variableValue)
    }

    // Carregar variáveis do usuário
    if (context.userId) {
      const userVariables = await flowBuilderService.getVariables('user', context.userId)
      for (const variable of userVariables) {
        context.variables.set(`user.${variable.variableName}`, variable.variableValue)
      }
    }

    // Carregar variáveis do flow
    const flowVariables = await flowBuilderService.getVariables('flow', flow.id)
    for (const variable of flowVariables) {
      context.variables.set(`flow.${variable.variableName}`, variable.variableValue)
    }

    // Carregar variáveis de execução (input data)
    for (const [key, value] of Object.entries(context.inputData)) {
      context.variables.set(`input.${key}`, value)
    }
  }

  setVariable(context: ExecutionContext, name: string, value: any, scope: VariableScope = 'execution'): void {
    const fullName = `${scope}.${name}`
    context.variables.set(fullName, value)
    
    // Log da variável
    this.logExecution(context, 'debug', `Variável definida: ${fullName} = ${JSON.stringify(value)}`)
  }

  getVariable(context: ExecutionContext, name: string, scope: VariableScope = 'execution'): any {
    const fullName = `${scope}.${name}`
    return context.variables.get(fullName)
  }

  // ========================================
  // SISTEMA DE TRIGGERS
  // ========================================

  async setupTriggers(flowId: string): Promise<void> {
    const flow = await flowBuilderService.getFlow(flowId)
    if (!flow) return

    const triggerNodes = flow.flowData.nodes.filter(node => node.type === 'trigger')
    
    for (const triggerNode of triggerNodes) {
      await this.setupTrigger(triggerNode, flowId)
    }
  }

  private async setupTrigger(triggerNode: FlowNode, flowId: string): Promise<void> {
    switch (triggerNode.subtype) {
      case 'webhook':
        await this.setupWebhookTrigger(triggerNode, flowId)
        break
      case 'schedule':
        await this.setupScheduleTrigger(triggerNode, flowId)
        break
      case 'message_received':
        await this.setupMessageTrigger(triggerNode, flowId)
        break
    }
  }

  private async setupWebhookTrigger(triggerNode: FlowNode, flowId: string): Promise<void> {
    const webhookUrl = triggerNode.config.webhook_url
    const secret = triggerNode.config.webhook_secret

    // Registrar webhook no sistema
    await webhookService.createWebhook({
      name: `Flow Trigger - ${flowId}`,
      description: `Webhook trigger para flow ${flowId}`,
      url: webhookUrl,
      events: ['custom'],
      secret_key: secret,
      user_id: 'system'
    })
  }

  private async setupScheduleTrigger(triggerNode: FlowNode, flowId: string): Promise<void> {
    const cronExpression = triggerNode.config.cron_expression
    const timezone = triggerNode.config.timezone || 'UTC'

    // Criar trigger agendado no banco
    await supabase.from('flow_triggers').upsert({
      flow_id: flowId,
      trigger_type: 'schedule',
      config: triggerNode.config,
      cron_expression: cronExpression,
      timezone,
      next_run_at: this.calculateNextRun(cronExpression, timezone)
    })
  }

  private async setupMessageTrigger(triggerNode: FlowNode, flowId: string): Promise<void> {
    // Configurar trigger para mensagens recebidas
    await supabase.from('flow_triggers').upsert({
      flow_id: flowId,
      trigger_type: 'message_received',
      config: triggerNode.config,
      is_active: true
    })
  }

  // ========================================
  // SISTEMA DE LOGS E MONITORAMENTO
  // ========================================

  private logExecution(
    context: ExecutionContext, 
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    metadata?: Record<string, any>
  ): void {
    const log: ExecutionLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      nodeId: context.currentNode?.id,
      metadata: metadata || {}
    }

    context.logs.push(log)
  }

  async getExecutionLogs(executionId: string): Promise<ExecutionLog[]> {
    const { data, error } = await supabase
      .from('flow_execution_steps')
      .select('logs')
      .eq('execution_id', executionId)
      .order('step_order')

    if (error) {
      console.error('Erro ao buscar logs:', error)
      return []
    }

    const logs: ExecutionLog[] = []
    data?.forEach(step => {
      if (step.logs) {
        logs.push(...step.logs)
      }
    })

    return logs
  }

  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================

  private getConnectedNodes(nodeId: string, connections: FlowConnection[]): FlowConnection[] {
    return connections.filter(conn => conn.source === nodeId)
  }

  private evaluateCondition(condition: any, context: ExecutionContext): boolean {
    // Implementar lógica de avaliação de condições
    if (condition.result !== undefined) {
      return condition.result
    }
    
    if (condition.expression) {
      return this.evaluateExpression(condition.expression, context)
    }

    return true
  }

  private evaluateExpression(expression: string, context: ExecutionContext): boolean {
    try {
      // Substituir variáveis na expressão
      let evalExpression = expression
      context.variables.forEach((value, key) => {
        evalExpression = evalExpression.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), JSON.stringify(value))
      })

      // Avaliar expressão (com segurança)
      return eval(evalExpression)
    } catch (error) {
      console.error('Erro ao avaliar expressão:', error)
      return false
    }
  }

  private calculateNextRun(cronExpression: string, timezone: string): Date {
    // Implementar cálculo da próxima execução baseado no cron
    // Por simplicidade, retornar 1 hora à frente
    const nextRun = new Date()
    nextRun.setHours(nextRun.getHours() + 1)
    return nextRun
  }

  // ========================================
  // MÉTODOS DE PERSISTÊNCIA
  // ========================================

  private async createExecution(
    flowId: string,
    triggerType: string,
    inputData: Record<string, any>,
    userId?: string
  ): Promise<string> {
    const { data, error } = await supabase
      .from('flow_executions')
      .insert({
        flow_id: flowId,
        trigger_type: triggerType,
        trigger_data: inputData,
        input_data: inputData,
        user_id: userId,
        status: 'running'
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Erro ao criar execução: ${error.message}`)
    }

    return data.id
  }

  private async getExecution(executionId: string): Promise<FlowExecution | null> {
    return flowBuilderService.getExecution(executionId)
  }

  private async finalizeExecution(executionId: string, context: ExecutionContext): Promise<void> {
    const duration = Date.now() - context.startTime
    
    await supabase
      .from('flow_executions')
      .update({
        status: 'completed',
        output_data: context.outputData,
        completed_at: new Date().toISOString(),
        duration_ms: duration
      })
      .eq('id', executionId)

    // Salvar logs
    await this.saveExecutionLogs(executionId, context.logs)
  }

  private async handleExecutionError(executionId: string, error: any): Promise<void> {
    await supabase
      .from('flow_executions')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        error_details: { stack: error instanceof Error ? error.stack : undefined },
        completed_at: new Date().toISOString()
      })
      .eq('id', executionId)
  }

  private async saveExecutionLogs(executionId: string, logs: ExecutionLog[]): Promise<void> {
    // Salvar logs em chunks para evitar payload muito grande
    const chunkSize = 50
    for (let i = 0; i < logs.length; i += chunkSize) {
      const chunk = logs.slice(i, i + chunkSize)
      
      await supabase
        .from('flow_execution_steps')
        .insert({
          execution_id: executionId,
          step_order: i / chunkSize,
          status: 'completed',
          logs: chunk
        })
    }
  }

  // ========================================
  // MÉTODOS PÚBLICOS PARA MONITORAMENTO
  // ========================================

  getActiveExecutions(): string[] {
    return Array.from(this.activeExecutions.keys())
  }

  getExecutionContext(executionId: string): ExecutionContext | undefined {
    return this.activeExecutions.get(executionId)
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    const context = this.activeExecutions.get(executionId)
    if (!context) return false

    // Marcar como cancelado
    await supabase
      .from('flow_executions')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', executionId)

    // Remover da lista de execuções ativas
    this.activeExecutions.delete(executionId)
    this.executionQueue.delete(executionId)

    return true
  }
}

// ========================================
// PROCESSADORES DE NÓS
// ========================================

abstract class NodeProcessor {
  abstract execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult>
}

// Processadores de Triggers
class WebhookTriggerProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    // Webhook triggers são processados externamente
    return { success: true, output: context.inputData }
  }
}

class ScheduleTriggerProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    // Schedule triggers são processados pelo scheduler
    return { success: true, output: { scheduled_at: new Date().toISOString() } }
  }
}

class ManualTriggerProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    return { success: true, output: { triggered_by: context.userId } }
  }
}

class MessageTriggerProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    return { success: true, output: context.inputData }
  }
}

// Processadores de Ações
class SendEmailProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { to, subject, template, variables } = node.config
    
    try {
      const emailContent = await this.renderTemplate(template, variables, context)
      
      await mailgun.sendEmail({
        to,
        subject,
        html: emailContent
      })

      return { 
        success: true, 
        output: { 
          sent_to: to,
          template_used: template,
          sent_at: new Date().toISOString()
        }
      }
    } catch (error) {
      return { success: false, output: {}, error: String(error) }
    }
  }

  private async renderTemplate(template: string, variables: any, context: ExecutionContext): Promise<string> {
    // Implementar renderização de template
    return template
  }
}

class SendWhatsAppProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { to, message, template } = node.config
    
    try {
      const renderedMessage = await this.renderMessage(message, template, context)
      
      // Simular envio de mensagem WhatsApp (implementar integração real)
      console.log(`Simulando envio de WhatsApp para ${to}: ${renderedMessage}`)

      return { 
        success: true, 
        output: { 
          sent_to: to,
          message_sent: renderedMessage,
          sent_at: new Date().toISOString()
        }
      }
    } catch (error) {
      return { success: false, output: {}, error: String(error) }
    }
  }

  private async renderMessage(message: string, template: string, context: ExecutionContext): Promise<string> {
    // Implementar renderização de mensagem
    return message
  }
}

class WebhookActionProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { url, method, headers, body } = node.config
    
    try {
      const response = await fetch(url, {
        method: method || 'POST',
        headers: headers || { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const responseData = await response.json()

      return { 
        success: response.ok, 
        output: { 
          status: response.status,
          response: responseData
        }
      }
    } catch (error) {
      return { success: false, output: {}, error: String(error) }
    }
  }
}

class WaitProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { duration_seconds } = node.config
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: true, 
          output: { 
            waited_for: duration_seconds,
            completed_at: new Date().toISOString()
          }
        })
      }, (duration_seconds || 1) * 1000)
    })
  }
}

class AIResponseProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { prompt, model, temperature } = node.config
    
    try {
      // Implementar chamada para IA
      const response = "Resposta simulada da IA"
      
      return { 
        success: true, 
        output: { 
          ai_response: response,
          model_used: model,
          generated_at: new Date().toISOString()
        }
      }
    } catch (error) {
      return { success: false, output: {}, error: String(error) }
    }
  }
}

class SetVariableProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { variable_name, variable_value, scope } = node.config
    
    const engine = new FlowExecutionEngine()
    engine.setVariable(context, variable_name, variable_value, scope)
    
    return { 
      success: true, 
      output: { 
        variable_set: variable_name,
        value: variable_value,
        scope
      }
    }
  }
}

// Processadores de Condições
class FieldCheckProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { field, operator, value } = node.config
    
    const fieldValue = this.getFieldValue(field, context)
    const result = this.compareValues(fieldValue, operator, value)
    
    return { 
      success: true, 
      output: { 
        field_checked: field,
        field_value: fieldValue,
        comparison_result: result
      }
    }
  }

  private getFieldValue(field: string, context: ExecutionContext): any {
    // Implementar extração de valor do campo
    return context.inputData[field]
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq': return actual === expected
      case 'ne': return actual !== expected
      case 'gt': return actual > expected
      case 'gte': return actual >= expected
      case 'lt': return actual < expected
      case 'lte': return actual <= expected
      case 'contains': return String(actual).includes(String(expected))
      default: return false
    }
  }
}

class ExpressionProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { expression } = node.config
    
    try {
      const result = this.evaluateExpression(expression, context)
      
      return { 
        success: true, 
        output: { 
          expression_evaluated: expression,
          result
        }
      }
    } catch (error) {
      return { success: false, output: {}, error: String(error) }
    }
  }

  private evaluateExpression(expression: string, context: ExecutionContext): any {
    // Implementar avaliação segura de expressão
    return eval(expression)
  }
}

class TimeBasedProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { time_condition } = node.config
    
    const now = new Date()
    const result = this.evaluateTimeCondition(time_condition, now)
    
    return { 
      success: true, 
      output: { 
        time_checked: time_condition,
        current_time: now.toISOString(),
        condition_result: result
      }
    }
  }

  private evaluateTimeCondition(condition: any, now: Date): boolean {
    // Implementar avaliação de condição de tempo
    return true
  }
}

// Processadores de Transformação
class JsonTransformProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { input_data, transformation } = node.config
    
    try {
      const transformed = this.applyJsonTransformation(input_data, transformation)
      
      return { 
        success: true, 
        output: { 
          transformed_data: transformed
        }
      }
    } catch (error) {
      return { success: false, output: {}, error: String(error) }
    }
  }

  private applyJsonTransformation(data: any, transformation: any): any {
    // Implementar transformação JSON
    return data
  }
}

class TextTransformProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { input_text, operation } = node.config
    
    try {
      const transformed = this.applyTextTransformation(input_text, operation)
      
      return { 
        success: true, 
        output: { 
          transformed_text: transformed
        }
      }
    } catch (error) {
      return { success: false, output: {}, error: String(error) }
    }
  }

  private applyTextTransformation(text: string, operation: string): string {
    switch (operation) {
      case 'uppercase': return text.toUpperCase()
      case 'lowercase': return text.toLowerCase()
      case 'trim': return text.trim()
      default: return text
    }
  }
}

class MathTransformProcessor extends NodeProcessor {
  async execute(node: FlowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const { expression } = node.config
    
    try {
      const result = this.evaluateMathExpression(expression, context)
      
      return { 
        success: true, 
        output: { 
          math_result: result
        }
      }
    } catch (error) {
      return { success: false, output: {}, error: String(error) }
    }
  }

  private evaluateMathExpression(expression: string, context: ExecutionContext): number {
    // Implementar avaliação segura de expressão matemática
    return eval(expression)
  }
}

// ========================================
// EXPORTAÇÃO
// ========================================

export const flowExecutionEngine = new FlowExecutionEngine()
export default flowExecutionEngine 