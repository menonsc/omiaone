import { supabase } from './supabase'
import { flowExecutionEngine } from './flowExecutionEngine'
import { 
  Flow, 
  FlowTestConfig, 
  FlowTestResult, 
  FlowDebugSession,
  ExecutionLog,
  FlowValidationResult,
  StepStatus
} from '../types/flowBuilder'
import { flowBuilderService } from './flowBuilderService'

// ========================================
// SERVIÇO DE TESTE E DEBUG DE FLUXOS
// ========================================

class FlowTestingService {
  private debugSessions: Map<string, FlowDebugSession> = new Map()

  // ========================================
  // TESTE DE FLUXOS
  // ========================================

  async testFlow(
    flowId: string, 
    config: FlowTestConfig
  ): Promise<FlowTestResult> {
    const startTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Validar flow antes do teste
      const flow = await flowBuilderService.getFlow(flowId)
      if (!flow) {
        return {
          success: false,
          executionId: '',
          duration: 0,
          steps: [],
          logs: [],
          errors: ['Flow não encontrado'],
          warnings: []
        }
      }

      const validation = flowBuilderService.validateFlow(flow)
      if (!validation.isValid) {
        errors.push(...validation.errors.map(e => e.message))
      }
      warnings.push(...validation.warnings.map(w => w.message))

      // Executar flow em modo de teste
      const executionId = await this.executeFlowInTestMode(flow, config)
      
      // Aguardar conclusão da execução
      const execution = await this.waitForExecutionCompletion(executionId, config.timeout || 30000)
      
      // Coletar logs e resultados
      const logs = await flowExecutionEngine.getExecutionLogs(executionId)
      const steps = await this.getExecutionSteps(executionId)

      const duration = Date.now() - startTime

      return {
        success: execution?.status === 'completed',
        executionId,
        duration,
        steps,
        logs,
        errors: execution?.status === 'failed' ? [execution.errorMessage || 'Execução falhou'] : errors,
        warnings
      }

    } catch (error) {
      const duration = Date.now() - startTime
      return {
        success: false,
        executionId: '',
        duration,
        steps: [],
        logs: [],
        errors: [error instanceof Error ? error.message : String(error)],
        warnings
      }
    }
  }

  private async executeFlowInTestMode(flow: Flow, config: FlowTestConfig): Promise<string> {
    // Criar execução de teste
    const { data, error } = await supabase
      .from('flow_executions')
      .insert({
        flow_id: flow.id,
        trigger_type: 'test',
        trigger_data: config.testData,
        input_data: config.testData,
        status: 'running',
        user_id: flow.userId
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Erro ao criar execução de teste: ${error.message}`)
    }

    // Executar flow com dados de teste
    await flowExecutionEngine.executeFlow(
      flow.id,
      'test',
      config.testData,
      flow.userId
    )

    return data.id
  }

  private async waitForExecutionCompletion(executionId: string, timeout: number): Promise<any> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      const execution = await flowBuilderService.getExecution(executionId)
      
      if (execution && ['completed', 'failed', 'cancelled'].includes(execution.status)) {
        return execution
      }
      
      // Aguardar 100ms antes de verificar novamente
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    throw new Error('Timeout na execução do teste')
  }

  private async getExecutionSteps(executionId: string): Promise<Array<{
    nodeId: string
    status: StepStatus
    input: Record<string, any>
    output: Record<string, any>
    error?: string
    duration: number
  }>> {
    const execution = await flowBuilderService.getExecution(executionId)
    if (!execution) return []

    return execution.steps.map(step => ({
      nodeId: step.nodeId,
      status: step.status as StepStatus,
      input: step.inputData,
      output: step.outputData,
      error: step.errorMessage,
      duration: step.durationMs || 0
    }))
  }

  // ========================================
  // DEBUG DE FLUXOS
  // ========================================

  async startDebugSession(flowId: string, userId: string): Promise<FlowDebugSession> {
    const sessionId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const session: FlowDebugSession = {
      id: sessionId,
      flowId,
      userId,
      status: 'active',
      breakpoints: [],
      currentStep: undefined,
      variables: new Map(),
      logs: [],
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    }

    this.debugSessions.set(sessionId, session)

    return session
  }

  async pauseDebugSession(sessionId: string): Promise<boolean> {
    const session = this.debugSessions.get(sessionId)
    if (!session) return false

    session.status = 'paused'
    session.lastActivityAt = new Date().toISOString()
    
    return true
  }

  async resumeDebugSession(sessionId: string): Promise<boolean> {
    const session = this.debugSessions.get(sessionId)
    if (!session) return false

    session.status = 'active'
    session.lastActivityAt = new Date().toISOString()
    
    return true
  }

  async stopDebugSession(sessionId: string): Promise<boolean> {
    const session = this.debugSessions.get(sessionId)
    if (!session) return false

    session.status = 'completed'
    session.lastActivityAt = new Date().toISOString()
    
    return true
  }

  async addBreakpoint(sessionId: string, nodeId: string): Promise<boolean> {
    const session = this.debugSessions.get(sessionId)
    if (!session) return false

    if (!session.breakpoints.includes(nodeId)) {
      session.breakpoints.push(nodeId)
    }
    
    return true
  }

  async removeBreakpoint(sessionId: string, nodeId: string): Promise<boolean> {
    const session = this.debugSessions.get(sessionId)
    if (!session) return false

    session.breakpoints = session.breakpoints.filter(id => id !== nodeId)
    
    return true
  }

  async stepOver(sessionId: string): Promise<boolean> {
    const session = this.debugSessions.get(sessionId)
    if (!session || session.status !== 'paused') return false

    // Implementar lógica de step over
    session.lastActivityAt = new Date().toISOString()
    
    return true
  }

  async stepInto(sessionId: string): Promise<boolean> {
    const session = this.debugSessions.get(sessionId)
    if (!session || session.status !== 'paused') return false

    // Implementar lógica de step into
    session.lastActivityAt = new Date().toISOString()
    
    return true
  }

  async stepOut(sessionId: string): Promise<boolean> {
    const session = this.debugSessions.get(sessionId)
    if (!session || session.status !== 'paused') return false

    // Implementar lógica de step out
    session.lastActivityAt = new Date().toISOString()
    
    return true
  }

  async getDebugSession(sessionId: string): Promise<FlowDebugSession | null> {
    return this.debugSessions.get(sessionId) || null
  }

  async getDebugSessions(userId: string): Promise<FlowDebugSession[]> {
    return Array.from(this.debugSessions.values())
      .filter(session => session.userId === userId)
  }

  // ========================================
  // ANÁLISE DE PERFORMANCE
  // ========================================

  async analyzeFlowPerformance(flowId: string): Promise<{
    avgExecutionTime: number
    slowestNodes: Array<{ nodeId: string; avgTime: number }>
    bottlenecks: string[]
    recommendations: string[]
  }> {
    try {
      // Buscar execuções recentes
      const executions = await flowBuilderService.getExecutions(flowId, { limit: 100 })
      
      if (executions.length === 0) {
        return {
          avgExecutionTime: 0,
          slowestNodes: [],
          bottlenecks: [],
          recommendations: ['Nenhuma execução encontrada para análise']
        }
      }

      // Calcular tempo médio de execução
      const totalTime = executions.reduce((sum, exec) => sum + (exec.durationMs || 0), 0)
      const avgExecutionTime = totalTime / executions.length

      // Analisar nós mais lentos
      const nodeTimes = new Map<string, number[]>()
      
      for (const execution of executions) {
        for (const step of execution.steps) {
          const times = nodeTimes.get(step.nodeId) || []
          times.push(step.durationMs || 0)
          nodeTimes.set(step.nodeId, times)
        }
      }

      const slowestNodes = Array.from(nodeTimes.entries())
        .map(([nodeId, times]) => ({
          nodeId,
          avgTime: times.reduce((sum, time) => sum + time, 0) / times.length
        }))
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 5)

      // Identificar gargalos
      const bottlenecks = slowestNodes
        .filter(node => node.avgTime > 1000) // Mais de 1 segundo
        .map(node => node.nodeId)

      // Gerar recomendações
      const recommendations: string[] = []
      
      if (avgExecutionTime > 5000) {
        recommendations.push('Considerar otimizar o fluxo para reduzir tempo de execução')
      }
      
      if (bottlenecks.length > 0) {
        recommendations.push(`Nós com gargalos identificados: ${bottlenecks.join(', ')}`)
      }
      
      if (executions.filter(e => e.status === 'failed').length > executions.length * 0.1) {
        recommendations.push('Taxa de falha alta - revisar lógica de tratamento de erros')
      }

      return {
        avgExecutionTime,
        slowestNodes,
        bottlenecks,
        recommendations
      }

    } catch (error) {
      console.error('Erro ao analisar performance:', error)
      return {
        avgExecutionTime: 0,
        slowestNodes: [],
        bottlenecks: [],
        recommendations: ['Erro ao analisar performance']
      }
    }
  }

  // ========================================
  // VALIDAÇÃO AVANÇADA
  // ========================================

  async validateFlowAdvanced(flow: Flow): Promise<FlowValidationResult> {
    const errors: any[] = []
    const warnings: any[] = []

    // Validar estrutura básica
    const basicValidation = flowBuilderService.validateFlow(flow)
    errors.push(...basicValidation.errors)
    warnings.push(...basicValidation.warnings)

    // Validar complexidade
    if (flow.flowData.nodes.length > 50) {
      warnings.push({
        message: 'Flow muito complexo - considere dividir em sub-flows',
        type: 'warning'
      })
    }

    // Validar loops infinitos
    const hasLoops = this.detectInfiniteLoops(flow.flowData.nodes, flow.flowData.connections)
    if (hasLoops) {
      errors.push({
        message: 'Loop infinito detectado no fluxo',
        type: 'error'
      })
    }

    // Validar nós não conectados
    const isolatedNodes = this.findIsolatedNodes(flow.flowData.nodes, flow.flowData.connections)
    if (isolatedNodes.length > 0) {
      warnings.push({
        message: `Nós isolados encontrados: ${isolatedNodes.join(', ')}`,
        type: 'warning'
      })
    }

    // Validar configurações de nós
    for (const node of flow.flowData.nodes) {
      const nodeValidation = this.validateNodeConfiguration(node)
      errors.push(...nodeValidation.errors)
      warnings.push(...nodeValidation.warnings)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private detectInfiniteLoops(nodes: any[], connections: any[]): boolean {
    // Implementação simplificada de detecção de loops
    // Em produção, usar algoritmo de detecção de ciclos em grafo
    return false
  }

  private findIsolatedNodes(nodes: any[], connections: any[]): string[] {
    const connectedNodes = new Set<string>()
    
    for (const connection of connections) {
      connectedNodes.add(connection.source)
      connectedNodes.add(connection.target)
    }

    return nodes
      .filter(node => !connectedNodes.has(node.id))
      .map(node => node.id)
  }

  private validateNodeConfiguration(node: any): { errors: any[]; warnings: any[] } {
    const errors: any[] = []
    const warnings: any[] = []

    // Validar configurações específicas por tipo de nó
    switch (node.type) {
      case 'action':
        if (!node.config.actionType) {
          errors.push({
            nodeId: node.id,
            message: 'Tipo de ação não especificado',
            type: 'error'
          })
        }
        break
      
      case 'condition':
        if (!node.config.conditions || node.config.conditions.length === 0) {
          errors.push({
            nodeId: node.id,
            message: 'Condições não especificadas',
            type: 'error'
          })
        }
        break
      
      case 'trigger':
        if (!node.config.triggerType) {
          errors.push({
            nodeId: node.id,
            message: 'Tipo de trigger não especificado',
            type: 'error'
          })
        }
        break
    }

    return { errors, warnings }
  }

  // ========================================
  // LOGS E MONITORAMENTO
  // ========================================

  async getExecutionLogs(executionId: string): Promise<ExecutionLog[]> {
    return flowExecutionEngine.getExecutionLogs(executionId)
  }

  async getFlowExecutionHistory(flowId: string, limit: number = 50): Promise<Array<{
    executionId: string
    status: string
    startedAt: string
    duration: number
    errorMessage?: string
  }>> {
    try {
      const executions = await flowBuilderService.getExecutions(flowId, { limit })
      
      return executions.map(exec => ({
        executionId: exec.id,
        status: exec.status,
        startedAt: exec.startedAt,
        duration: exec.durationMs || 0,
        errorMessage: exec.errorMessage
      }))
    } catch (error) {
      console.error('Erro ao buscar histórico de execuções:', error)
      return []
    }
  }

  // ========================================
  // LIMPEZA
  // ========================================

  cleanupDebugSessions(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 horas

    this.debugSessions.forEach((session, sessionId) => {
      const sessionAge = now - new Date(session.lastActivityAt).getTime()
      
      if (sessionAge > maxAge) {
        this.debugSessions.delete(sessionId)
      }
    })
  }
}

// ========================================
// EXPORTAÇÃO
// ========================================

export const flowTestingService = new FlowTestingService()
export default flowTestingService 