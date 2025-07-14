import { supabase } from './supabase'
import { 
  Flow, 
  FlowExecution, 
  FlowTemplate, 
  FlowTrigger, 
  FlowVariable, 
  FlowStats,
  FlowValidationResult,
  ExecutionContext,
  FlowNode,
  FlowConnection,
  WebhookPayload,
  ScheduledTrigger,
  FlowExport,
  FlowImportResult
} from '../types/flowBuilder'
import { v4 as uuidv4 } from 'uuid'

class FlowBuilderService {
  // ========================================
  // FLOWS - CRUD Operations
  // ========================================

  async createFlow(flow: Omit<Flow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successCount' | 'errorCount'>): Promise<Flow | null> {
    console.log('flowBuilderService.createFlow - Iniciando criação:', { flowName: flow.name, userId: flow.userId })
    
    try {
      const insertData = {
        name: flow.name,
        description: flow.description,
        user_id: flow.userId,
        organization_id: flow.organizationId,
        is_active: flow.isActive,
        is_template: flow.isTemplate,
        category: flow.category,
        flow_data: flow.flowData,
        variables: flow.variables,
        settings: flow.settings,
        created_by: flow.userId
      }
      
      console.log('flowBuilderService.createFlow - Dados para inserção:', insertData)
      
      const { data, error } = await supabase
        .from('flows')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('flowBuilderService.createFlow - Erro do Supabase:', error)
        return null
      }

      console.log('flowBuilderService.createFlow - Dados retornados:', data)
      const mappedFlow = this.mapDatabaseToFlow(data)
      console.log('flowBuilderService.createFlow - Flow mapeado:', mappedFlow)
      
      return mappedFlow
    } catch (error) {
      console.error('flowBuilderService.createFlow - Erro geral:', error)
      return null
    }
  }

  async getFlow(flowId: string): Promise<Flow | null> {
    try {
      const { data, error } = await supabase
        .from('flows')
        .select('*')
        .eq('id', flowId)
        .single()

      if (error) {
        console.error('Erro ao buscar flow:', error)
        return null
      }

      return this.mapDatabaseToFlow(data)
    } catch (error) {
      console.error('Erro ao buscar flow:', error)
      return null
    }
  }

  async getFlows(filters: {
    userId?: string
    category?: string
    isActive?: boolean
    search?: string
    limit?: number
    offset?: number
  } = {}): Promise<Flow[]> {
    try {
      let query = supabase.from('flows').select('*')

      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive)
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      query = query.order('updated_at', { ascending: false })

      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar flows:', error)
        return []
      }

      return data?.map(this.mapDatabaseToFlow) || []
    } catch (error) {
      console.error('Erro ao buscar flows:', error)
      return []
    }
  }

  async updateFlow(flowId: string, updates: Partial<Flow>): Promise<Flow | null> {
    try {
      const updateData: any = {}

      if (updates.name) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive
      if (updates.category) updateData.category = updates.category
      if (updates.flowData) updateData.flow_data = updates.flowData
      if (updates.variables) updateData.variables = updates.variables
      if (updates.settings) updateData.settings = updates.settings

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('flows')
        .update(updateData)
        .eq('id', flowId)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar flow:', error)
        return null
      }

      return this.mapDatabaseToFlow(data)
    } catch (error) {
      console.error('Erro ao atualizar flow:', error)
      return null
    }
  }

  async deleteFlow(flowId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('flows')
        .delete()
        .eq('id', flowId)

      if (error) {
        console.error('Erro ao deletar flow:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao deletar flow:', error)
      return false
    }
  }

  // ========================================
  // TEMPLATES
  // ========================================

  async getTemplates(filters: {
    category?: string
    isPublic?: boolean
    isFeatured?: boolean
    search?: string
    limit?: number
  } = {}): Promise<FlowTemplate[]> {
    try {
      let query = supabase.from('flow_templates').select('*')

      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.isPublic !== undefined) {
        query = query.eq('is_public', filters.isPublic)
      }
      if (filters.isFeatured !== undefined) {
        query = query.eq('is_featured', filters.isFeatured)
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      query = query.order('usage_count', { ascending: false })

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar templates:', error)
        return []
      }

      return data?.map(this.mapDatabaseToTemplate) || []
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
      return []
    }
  }

  async createFlowFromTemplate(templateId: string, flowName: string, userId: string): Promise<Flow | null> {
    try {
      // Buscar template
      const { data: templateData, error: templateError } = await supabase
        .from('flow_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (templateError || !templateData) {
        console.error('Template não encontrado:', templateError)
        return null
      }

      // Criar flow baseado no template
      const newFlow = {
        name: flowName,
        description: templateData.description,
        userId,
        isActive: false, // Começa inativo para o usuário configurar
        isTemplate: false,
        category: templateData.category,
        flowData: templateData.template_data,
        variables: templateData.template_data.variables || {},
        settings: templateData.template_data.settings || {}
      }

      // Incrementar usage_count do template
      await supabase
        .from('flow_templates')
        .update({ usage_count: templateData.usage_count + 1 })
        .eq('id', templateId)

      return await this.createFlow(newFlow)
    } catch (error) {
      console.error('Erro ao criar flow a partir do template:', error)
      return null
    }
  }

  // ========================================
  // EXECUÇÃO DE FLUXOS
  // ========================================

  async executeFlow(flowId: string, triggerType: string, inputData: Record<string, any> = {}): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .rpc('execute_flow', {
          flow_id_param: flowId,
          trigger_type_param: triggerType,
          input_data_param: inputData
        })

      if (error) {
        console.error('Erro ao executar flow:', error)
        return null
      }

      return data // retorna execution_id
    } catch (error) {
      console.error('Erro ao executar flow:', error)
      return null
    }
  }

  async getExecution(executionId: string): Promise<FlowExecution | null> {
    try {
      const { data, error } = await supabase
        .from('flow_executions')
        .select(`
          *,
          flow_execution_steps (*)
        `)
        .eq('id', executionId)
        .single()

      if (error) {
        console.error('Erro ao buscar execução:', error)
        return null
      }

      return this.mapDatabaseToExecution(data)
    } catch (error) {
      console.error('Erro ao buscar execução:', error)
      return null
    }
  }

  async getExecutions(flowId: string, filters: {
    status?: string
    limit?: number
    offset?: number
  } = {}): Promise<FlowExecution[]> {
    try {
      let query = supabase
        .from('flow_executions')
        .select(`
          *,
          flow_execution_steps (*)
        `)
        .eq('flow_id', flowId)

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      query = query.order('started_at', { ascending: false })

      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar execuções:', error)
        return []
      }

      return data?.map(this.mapDatabaseToExecution) || []
    } catch (error) {
      console.error('Erro ao buscar execuções:', error)
      return []
    }
  }

  async updateExecutionStatus(
    executionId: string, 
    status: string, 
    outputData?: Record<string, any>,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        completed_at: new Date().toISOString()
      }

      if (outputData) {
        updateData.output_data = outputData
      }
      if (errorMessage) {
        updateData.error_message = errorMessage
      }

      const { error } = await supabase
        .from('flow_executions')
        .update(updateData)
        .eq('id', executionId)

      if (error) {
        console.error('Erro ao atualizar status da execução:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao atualizar status da execução:', error)
      return false
    }
  }

  // ========================================
  // TRIGGERS
  // ========================================

  async createTrigger(trigger: Omit<FlowTrigger, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>): Promise<FlowTrigger | null> {
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

      return this.mapDatabaseToTrigger(data)
    } catch (error) {
      console.error('Erro ao criar trigger:', error)
      return null
    }
  }

  async getTriggers(flowId: string): Promise<FlowTrigger[]> {
    try {
      const { data, error } = await supabase
        .from('flow_triggers')
        .select('*')
        .eq('flow_id', flowId)

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
  // VARIÁVEIS
  // ========================================

  async getVariables(scope: string, scopeId?: string): Promise<FlowVariable[]> {
    try {
      let query = supabase
        .from('flow_variables')
        .select('*')
        .eq('scope', scope)

      if (scopeId) {
        query = query.eq('scope_id', scopeId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar variáveis:', error)
        return []
      }

      return data?.map(this.mapDatabaseToVariable) || []
    } catch (error) {
      console.error('Erro ao buscar variáveis:', error)
      return []
    }
  }

  async setVariable(
    scope: string,
    scopeId: string | null,
    name: string,
    value: any,
    type: string = 'string'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('flow_variables')
        .upsert({
          scope,
          scope_id: scopeId,
          variable_name: name,
          variable_value: value,
          variable_type: type
        }, {
          onConflict: 'scope,scope_id,variable_name'
        })

      if (error) {
        console.error('Erro ao definir variável:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao definir variável:', error)
      return false
    }
  }

  // ========================================
  // ESTATÍSTICAS
  // ========================================

  async getFlowStats(flowId: string): Promise<FlowStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_flow_stats', { flow_id_param: flowId })

      if (error) {
        console.error('Erro ao buscar estatísticas:', error)
        return null
      }

      // Buscar dados adicionais para estatísticas completas
      const [executionsByDayData, popularNodesData, errorPatternsData] = await Promise.all([
        this.getExecutionsByDay(flowId),
        this.getPopularNodes(flowId),
        this.getErrorPatterns(flowId)
      ])

      return {
        totalExecutions: data.total_executions || 0,
        successfulExecutions: data.successful_executions || 0,
        failedExecutions: data.failed_executions || 0,
        avgDurationMs: data.avg_duration_ms || 0,
        lastExecution: data.last_execution,
        successRate: data.success_rate || 0,
        executionsByDay: executionsByDayData,
        popularNodes: popularNodesData,
        errorPatterns: errorPatternsData
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return null
    }
  }

  // ========================================
  // VALIDAÇÃO
  // ========================================

  validateFlow(flow: Flow): FlowValidationResult {
    const errors: any[] = []
    const warnings: any[] = []

    // Validar se há pelo menos um trigger
    const triggerNodes = flow.flowData.nodes.filter(node => node.type === 'trigger')
    if (triggerNodes.length === 0) {
      errors.push({
        type: 'error',
        message: 'O fluxo deve ter pelo menos um nó de trigger'
      })
    }

    // Validar conexões
    for (const connection of flow.flowData.connections) {
      const sourceExists = flow.flowData.nodes.find(n => n.id === connection.source)
      const targetExists = flow.flowData.nodes.find(n => n.id === connection.target)

      if (!sourceExists) {
        errors.push({
          connectionId: connection.id,
          type: 'error',
          message: `Nó de origem '${connection.source}' não encontrado`
        })
      }

      if (!targetExists) {
        errors.push({
          connectionId: connection.id,
          type: 'error',
          message: `Nó de destino '${connection.target}' não encontrado`
        })
      }
    }

    // Validar configuração dos nós
    for (const node of flow.flowData.nodes) {
      if (!node.config || Object.keys(node.config).length === 0) {
        warnings.push({
          nodeId: node.id,
          message: `Nó '${node.label || node.id}' não está configurado`
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // ========================================
  // IMPORTAÇÃO/EXPORTAÇÃO
  // ========================================

  async exportFlow(flowId: string): Promise<FlowExport | null> {
    try {
      const flow = await this.getFlow(flowId)
      if (!flow) return null

      const { id, userId, createdAt, updatedAt, ...exportableFlow } = flow

      return {
        flow: exportableFlow,
        version: '1.0',
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        dependencies: [], // TODO: Implementar detecção de dependências
        metadata: {
          originalId: id,
          exportTool: 'FlowBuilder v1.0'
        }
      }
    } catch (error) {
      console.error('Erro ao exportar flow:', error)
      return null
    }
  }

  async importFlow(flowExport: FlowExport, userId: string): Promise<FlowImportResult> {
    try {
      const newFlow = {
        ...flowExport.flow,
        userId,
        name: `${flowExport.flow.name} (Importado)`,
        isActive: false // Importado como inativo por segurança
      }

      const createdFlow = await this.createFlow(newFlow)

      return {
        success: !!createdFlow,
        flowId: createdFlow?.id,
        errors: [],
        warnings: [],
        skippedNodes: [],
        createdVariables: []
      }
    } catch (error) {
      console.error('Erro ao importar flow:', error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      }
    }
  }

  // ========================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ========================================

  private mapDatabaseToFlow(data: any): Flow {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      userId: data.user_id,
      organizationId: data.organization_id,
      isActive: data.is_active,
      isTemplate: data.is_template,
      category: data.category,
      flowData: data.flow_data,
      variables: data.variables || {},
      settings: data.settings || {},
      executionCount: data.execution_count || 0,
      successCount: data.success_count || 0,
      errorCount: data.error_count || 0,
      lastExecutedAt: data.last_executed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by
    }
  }

  private mapDatabaseToTemplate(data: any): FlowTemplate {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      tags: data.tags || [],
      templateData: data.template_data,
      isPublic: data.is_public,
      isFeatured: data.is_featured,
      difficultyLevel: data.difficulty_level,
      usageCount: data.usage_count || 0,
      rating: data.rating,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  private mapDatabaseToExecution(data: any): FlowExecution {
    return {
      id: data.id,
      flowId: data.flow_id,
      triggerType: data.trigger_type,
      triggerData: data.trigger_data || {},
      status: data.status,
      inputData: data.input_data || {},
      outputData: data.output_data || {},
      contextVariables: data.context_variables || {},
      startedAt: data.started_at,
      completedAt: data.completed_at,
      durationMs: data.duration_ms,
      errorMessage: data.error_message,
      errorDetails: data.error_details,
      userId: data.user_id,
      sessionId: data.session_id,
      ipAddress: data.ip_address,
      steps: data.flow_execution_steps?.map((step: any) => ({
        id: step.id,
        executionId: step.execution_id,
        flowId: step.flow_id,
        nodeId: step.node_id,
        stepOrder: step.step_order,
        inputData: step.input_data || {},
        outputData: step.output_data || {},
        status: step.status,
        startedAt: step.started_at,
        completedAt: step.completed_at,
        durationMs: step.duration_ms,
        errorMessage: step.error_message,
        errorDetails: step.error_details,
        retryCount: step.retry_count || 0,
        logs: step.logs || []
      })) || []
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

  private mapDatabaseToVariable(data: any): FlowVariable {
    return {
      id: data.id,
      scope: data.scope,
      scopeId: data.scope_id,
      variableName: data.variable_name,
      variableValue: data.variable_value,
      variableType: data.variable_type,
      isSecret: data.is_secret,
      isReadonly: data.is_readonly,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by
    }
  }

  private async getExecutionsByDay(flowId: string): Promise<Array<{
    date: string
    count: number
    successCount: number
    failureCount: number
  }>> {
    // TODO: Implementar consulta agregada por dia
    return []
  }

  private async getPopularNodes(flowId: string): Promise<Array<{
    nodeType: string
    count: number
  }>> {
    // TODO: Implementar consulta de nós mais utilizados
    return []
  }

  private async getErrorPatterns(flowId: string): Promise<Array<{
    errorType: string
    count: number
    nodes: string[]
  }>> {
    // TODO: Implementar análise de padrões de erro
    return []
  }
}

export const flowBuilderService = new FlowBuilderService()
export default flowBuilderService 