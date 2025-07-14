import { useState, useEffect, useCallback } from 'react'
import { flowBuilderService } from '../services/flowBuilderService'
import { flowExecutionEngine } from '../services/flowExecutionEngine'
import { flowTriggerService } from '../services/flowTriggerService'
import { flowTestingService } from '../services/flowTestingService'
import { flowTemplateLibrary } from '../services/flowTemplateLibrary'
import { 
  Flow, 
  FlowTemplate, 
  FlowExecution, 
  FlowTrigger,
  FlowTestConfig,
  FlowTestResult,
  FlowDebugSession,
  ExecutionLog,
  FlowValidationResult,
  FlowEditorState,
  NodeTemplate,
  DifficultyLevel
} from '../types/flowBuilder'

// ========================================
// HOOK PARA GERENCIAMENTO DO FLOW BUILDER
// ========================================

export const useFlowBuilder = (flowId?: string) => {
  // Estados principais
  const [flow, setFlow] = useState<Flow | null>(null)
  const [editorState, setEditorState] = useState<FlowEditorState>({
    flow: null,
    selectedNodes: [],
    selectedConnections: [],
    clipboard: {
      nodes: [],
      connections: []
    },
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    },
    isDirty: false,
    isExecuting: false
  })

  // Estados de execução
  const [executions, setExecutions] = useState<FlowExecution[]>([])
  const [currentExecution, setCurrentExecution] = useState<FlowExecution | null>(null)
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([])

  // Estados de triggers
  const [triggers, setTriggers] = useState<FlowTrigger[]>([])

  // Estados de templates
  const [templates, setTemplates] = useState<FlowTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate | null>(null)

  // Estados de teste e debug
  const [testResult, setTestResult] = useState<FlowTestResult | null>(null)
  const [debugSession, setDebugSession] = useState<FlowDebugSession | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  // Estados de validação
  const [validation, setValidation] = useState<FlowValidationResult | null>(null)

  // Estados de loading
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // ========================================
  // CARREGAMENTO INICIAL
  // ========================================

  useEffect(() => {
    if (flowId) {
      loadFlow(flowId)
      loadExecutions(flowId)
      loadTriggers(flowId)
    }
  }, [flowId])

  useEffect(() => {
    loadTemplates()
  }, [])

  // ========================================
  // MÉTODOS DE CARREGAMENTO
  // ========================================

  const loadFlow = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      const flowData = await flowBuilderService.getFlow(id)
      if (flowData) {
        setFlow(flowData)
        setEditorState(prev => ({
          ...prev,
          flow: flowData
        }))
        
        // Validar flow
        const validationResult = flowBuilderService.validateFlow(flowData)
        setValidation(validationResult)
      }
    } catch (error) {
      console.error('Erro ao carregar flow:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadExecutions = useCallback(async (id: string) => {
    try {
      const executionsData = await flowBuilderService.getExecutions(id, { limit: 20 })
      setExecutions(executionsData)
    } catch (error) {
      console.error('Erro ao carregar execuções:', error)
    }
  }, [])

  const loadTriggers = useCallback(async (id: string) => {
    try {
      const triggersData = await flowTriggerService.getTriggers(id)
      setTriggers(triggersData)
    } catch (error) {
      console.error('Erro ao carregar triggers:', error)
    }
  }, [])

  const loadTemplates = useCallback(async () => {
    try {
      const templatesData = await flowTemplateLibrary.getTemplates({ isPublic: true })
      setTemplates(templatesData)
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }, [])

  // ========================================
  // MÉTODOS DE FLOW
  // ========================================

  const createFlow = useCallback(async (flowData: Omit<Flow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successCount' | 'errorCount'>) => {
    setIsSaving(true)
    try {
      const newFlow = await flowBuilderService.createFlow(flowData)
      if (newFlow) {
        setFlow(newFlow)
        setEditorState(prev => ({
          ...prev,
          flow: newFlow,
          isDirty: false
        }))
        return newFlow
      }
    } catch (error) {
      console.error('Erro ao criar flow:', error)
    } finally {
      setIsSaving(false)
    }
    return null
  }, [])

  const updateFlow = useCallback(async (updates: Partial<Flow>) => {
    if (!flow) return null

    setIsSaving(true)
    try {
      const updatedFlow = await flowBuilderService.updateFlow(flow.id, updates)
      if (updatedFlow) {
        setFlow(updatedFlow)
        setEditorState(prev => ({
          ...prev,
          flow: updatedFlow,
          isDirty: false
        }))
        return updatedFlow
      }
    } catch (error) {
      console.error('Erro ao atualizar flow:', error)
    } finally {
      setIsSaving(false)
    }
    return null
  }, [flow])

  const deleteFlow = useCallback(async () => {
    if (!flow) return false

    try {
      const success = await flowBuilderService.deleteFlow(flow.id)
      if (success) {
        setFlow(null)
        setEditorState(prev => ({
          ...prev,
          flow: null,
          isDirty: false
        }))
      }
      return success
    } catch (error) {
      console.error('Erro ao deletar flow:', error)
      return false
    }
  }, [flow])

  // ========================================
  // MÉTODOS DE EXECUÇÃO
  // ========================================

  const executeFlow = useCallback(async (triggerType: string = 'manual', inputData: Record<string, any> = {}) => {
    if (!flow) return null

    setEditorState(prev => ({
      ...prev,
      isExecuting: true
    }))

    try {
      const executionId = await flowExecutionEngine.executeFlow(
        flow.id,
        triggerType,
        inputData
      )

      if (executionId) {
        // Monitorar execução
        monitorExecution(executionId)
        return executionId
      }
    } catch (error) {
      console.error('Erro ao executar flow:', error)
    } finally {
      setEditorState(prev => ({
        ...prev,
        isExecuting: false
      }))
    }

    return null
  }, [flow])

  const monitorExecution = useCallback(async (executionId: string) => {
    const checkExecution = async () => {
      try {
        const execution = await flowBuilderService.getExecution(executionId)
        if (execution) {
          setCurrentExecution(execution)
          
          if (['completed', 'failed', 'cancelled'].includes(execution.status)) {
            // Execução finalizada
            setEditorState(prev => ({
              ...prev,
              isExecuting: false
            }))
            
            // Recarregar execuções
            if (flow) {
              loadExecutions(flow.id)
            }
          } else {
            // Continuar monitorando
            setTimeout(checkExecution, 1000)
          }
        }
      } catch (error) {
        console.error('Erro ao monitorar execução:', error)
      }
    }

    checkExecution()
  }, [flow])

  const cancelExecution = useCallback(async (executionId: string) => {
    try {
      const success = await flowExecutionEngine.cancelExecution(executionId)
      if (success) {
        setCurrentExecution(null)
        setEditorState(prev => ({
          ...prev,
          isExecuting: false
        }))
      }
      return success
    } catch (error) {
      console.error('Erro ao cancelar execução:', error)
      return false
    }
  }, [])

  // ========================================
  // MÉTODOS DE TRIGGERS
  // ========================================

  const createTrigger = useCallback(async (triggerData: Omit<FlowTrigger, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTrigger = await flowTriggerService.createTrigger(triggerData)
      if (newTrigger) {
        setTriggers(prev => [...prev, newTrigger])
        return newTrigger
      }
    } catch (error) {
      console.error('Erro ao criar trigger:', error)
    }
    return null
  }, [])

  const updateTrigger = useCallback(async (triggerId: string, updates: Partial<FlowTrigger>) => {
    try {
      const updatedTrigger = await flowTriggerService.updateTrigger(triggerId, updates)
      if (updatedTrigger) {
        setTriggers(prev => 
          prev.map(trigger => 
            trigger.id === triggerId ? updatedTrigger : trigger
          )
        )
        return updatedTrigger
      }
    } catch (error) {
      console.error('Erro ao atualizar trigger:', error)
    }
    return null
  }, [])

  const deleteTrigger = useCallback(async (triggerId: string) => {
    try {
      const success = await flowTriggerService.deleteTrigger(triggerId)
      if (success) {
        setTriggers(prev => prev.filter(trigger => trigger.id !== triggerId))
      }
      return success
    } catch (error) {
      console.error('Erro ao deletar trigger:', error)
      return false
    }
  }, [])

  const testTrigger = useCallback(async (triggerId: string, testData: any = {}) => {
    try {
      const success = await flowTriggerService.testTrigger(triggerId, testData)
      return success
    } catch (error) {
      console.error('Erro ao testar trigger:', error)
      return false
    }
  }, [])

  // ========================================
  // MÉTODOS DE TESTE E DEBUG
  // ========================================

  const testFlow = useCallback(async (config: FlowTestConfig) => {
    if (!flow) return null

    setIsTesting(true)
    try {
      const result = await flowTestingService.testFlow(flow.id, config)
      setTestResult(result)
      return result
    } catch (error) {
      console.error('Erro ao testar flow:', error)
    } finally {
      setIsTesting(false)
    }
    return null
  }, [flow])

  const startDebugSession = useCallback(async () => {
    if (!flow) return null

    try {
      const session = await flowTestingService.startDebugSession(flow.id, flow.userId)
      setDebugSession(session)
      return session
    } catch (error) {
      console.error('Erro ao iniciar sessão de debug:', error)
    }
    return null
  }, [flow])

  const pauseDebugSession = useCallback(async (sessionId: string) => {
    try {
      const success = await flowTestingService.pauseDebugSession(sessionId)
      if (success) {
        setDebugSession(prev => prev ? { ...prev, status: 'paused' } : null)
      }
      return success
    } catch (error) {
      console.error('Erro ao pausar sessão de debug:', error)
      return false
    }
  }, [])

  const resumeDebugSession = useCallback(async (sessionId: string) => {
    try {
      const success = await flowTestingService.resumeDebugSession(sessionId)
      if (success) {
        setDebugSession(prev => prev ? { ...prev, status: 'active' } : null)
      }
      return success
    } catch (error) {
      console.error('Erro ao resumir sessão de debug:', error)
      return false
    }
  }, [])

  const stopDebugSession = useCallback(async (sessionId: string) => {
    try {
      const success = await flowTestingService.stopDebugSession(sessionId)
      if (success) {
        setDebugSession(null)
      }
      return success
    } catch (error) {
      console.error('Erro ao parar sessão de debug:', error)
      return false
    }
  }, [])

  // ========================================
  // MÉTODOS DE TEMPLATES
  // ========================================

  const createFlowFromTemplate = useCallback(async (templateId: string, flowName: string) => {
    if (!flow?.userId) return null

    try {
      const newFlow = await flowBuilderService.createFlowFromTemplate(
        templateId,
        flowName,
        flow.userId
      )
      
      if (newFlow) {
        // Incrementar contador de uso do template
        await flowTemplateLibrary.incrementUsageCount(templateId)
        
        return newFlow
      }
    } catch (error) {
      console.error('Erro ao criar flow a partir do template:', error)
    }
    return null
  }, [flow])

  const getTemplates = useCallback(async (filters: {
    category?: string
    difficulty?: DifficultyLevel
    isPublic?: boolean
    isFeatured?: boolean
    search?: string
    limit?: number
    offset?: number
  } = {}) => {
    try {
      const templatesData = await flowTemplateLibrary.getTemplates(filters)
      setTemplates(templatesData)
      return templatesData
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
      return []
    }
  }, [])

  // ========================================
  // MÉTODOS DE EDITOR
  // ========================================

  const updateEditorState = useCallback((updates: Partial<FlowEditorState>) => {
    setEditorState(prev => ({
      ...prev,
      ...updates,
      isDirty: true
    }))
  }, [])

  const selectNodes = useCallback((nodeIds: string[]) => {
    setEditorState(prev => ({
      ...prev,
      selectedNodes: nodeIds,
      selectedConnections: []
    }))
  }, [])

  const selectConnections = useCallback((connectionIds: string[]) => {
    setEditorState(prev => ({
      ...prev,
      selectedConnections: connectionIds,
      selectedNodes: []
    }))
  }, [])

  const copyToClipboard = useCallback((nodes: any[], connections: any[]) => {
    setEditorState(prev => ({
      ...prev,
      clipboard: {
        nodes,
        connections
      }
    }))
  }, [])

  const pasteFromClipboard = useCallback(() => {
    return editorState.clipboard
  }, [editorState.clipboard])

  const updateViewport = useCallback((viewport: { x: number; y: number; zoom: number }) => {
    setEditorState(prev => ({
      ...prev,
      viewport
    }))
  }, [])

  // ========================================
  // MÉTODOS DE VALIDAÇÃO
  // ========================================

  const validateFlow = useCallback(() => {
    if (!flow) return null

    const result = flowBuilderService.validateFlow(flow)
    setValidation(result)
    return result
  }, [flow])

  const validateFlowAdvanced = useCallback(async () => {
    if (!flow) return null

    try {
      const result = await flowTestingService.validateFlowAdvanced(flow)
      setValidation(result)
      return result
    } catch (error) {
      console.error('Erro ao validar flow avançado:', error)
    }
    return null
  }, [flow])

  // ========================================
  // MÉTODOS DE LOGS
  // ========================================

  const getExecutionLogs = useCallback(async (executionId: string) => {
    try {
      const logs = await flowExecutionEngine.getExecutionLogs(executionId)
      setExecutionLogs(logs)
      return logs
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
      return []
    }
  }, [])

  const getFlowExecutionHistory = useCallback(async (limit: number = 50) => {
    if (!flow) return []

    try {
      const history = await flowTestingService.getFlowExecutionHistory(flow.id, limit)
      return history
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      return []
    }
  }, [flow])

  // ========================================
  // MÉTODOS DE ANÁLISE
  // ========================================

  const analyzeFlowPerformance = useCallback(async () => {
    if (!flow) return null

    try {
      const analysis = await flowTestingService.analyzeFlowPerformance(flow.id)
      return analysis
    } catch (error) {
      console.error('Erro ao analisar performance:', error)
    }
    return null
  }, [flow])

  // ========================================
  // MÉTODOS DE ESTATÍSTICAS
  // ========================================

  const getFlowStats = useCallback(async () => {
    if (!flow) return null

    try {
      const stats = await flowBuilderService.getFlowStats(flow.id)
      return stats
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
    return null
  }, [flow])

  // ========================================
  // RETORNO DO HOOK
  // ========================================

  return {
    // Estados
    flow,
    editorState,
    executions,
    currentExecution,
    executionLogs,
    triggers,
    templates,
    selectedTemplate,
    testResult,
    debugSession,
    validation,
    isLoading,
    isSaving,
    isTesting,

    // Métodos de Flow
    createFlow,
    updateFlow,
    deleteFlow,
    loadFlow,

    // Métodos de Execução
    executeFlow,
    cancelExecution,
    monitorExecution,

    // Métodos de Triggers
    createTrigger,
    updateTrigger,
    deleteTrigger,
    testTrigger,

    // Métodos de Teste e Debug
    testFlow,
    startDebugSession,
    pauseDebugSession,
    resumeDebugSession,
    stopDebugSession,

    // Métodos de Templates
    createFlowFromTemplate,
    getTemplates,

    // Métodos de Editor
    updateEditorState,
    selectNodes,
    selectConnections,
    copyToClipboard,
    pasteFromClipboard,
    updateViewport,

    // Métodos de Validação
    validateFlow,
    validateFlowAdvanced,

    // Métodos de Logs
    getExecutionLogs,
    getFlowExecutionHistory,

    // Métodos de Análise
    analyzeFlowPerformance,
    getFlowStats
  }
} 