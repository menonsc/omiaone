import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Flow, FlowValidationResult, FlowTemplate } from '../types/flowBuilder'
import FlowCanvas from '../components/FlowBuilder/FlowCanvas'
import { flowBuilderService } from '../services/flowBuilderService'
import { useAuthStore } from '../store/authStore'
import { 
  CanCreateFlow,
  CanEditFlow,
  CanExecuteFlow,
  CanExportImportFlows,
  CanManageTemplates,
  CanConfigureFlowBuilder
} from '../components/PermissionGuard'
import TemplateLibrary from '../components/FlowBuilder/TemplateLibrary'
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Settings,
  Share,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  BookOpen
} from 'lucide-react'

const FlowBuilder: React.FC = () => {
  const { flowId } = useParams<{ flowId?: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [flow, setFlow] = useState<Flow | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [validationResult, setValidationResult] = useState<FlowValidationResult | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [executionProgress, setExecutionProgress] = useState<{
    currentStep: string
    totalSteps: number
    completedSteps: number
  } | undefined>()
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false)

  // Carregar flow se editing um existente
  useEffect(() => {
    if (flowId && user) {
      loadFlow(flowId)
    } else if (user) {
      // Criar novo flow
      createNewFlow()
    }
  }, [flowId, user])

  const loadFlow = async (id: string) => {
    setIsLoading(true)
    try {
      const loadedFlow = await flowBuilderService.getFlow(id)
      if (loadedFlow) {
        setFlow(loadedFlow)
      } else {
        console.error('Flow não encontrado')
        navigate('/flows')
      }
    } catch (error) {
      console.error('Erro ao carregar flow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createNewFlow = () => {
    if (!user) return

    const newFlow: Flow = {
      id: 'new',
      name: 'Novo Fluxo',
      description: '',
      userId: user.id,
      isActive: false,
      isTemplate: false,
      category: 'general',
      flowData: {
        nodes: [],
        connections: [],
        variables: {},
        settings: {}
      },
      variables: {},
      settings: {
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        errorHandling: 'stop',
        logging: 'errors'
      },
      executionCount: 0,
      successCount: 0,
      errorCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id
    }

    setFlow(newFlow)
  }

  const handleFlowChange = useCallback((updatedFlow: Flow) => {
    setFlow(updatedFlow)
  }, [])

  const handleSave = async () => {
    if (!flow || !user) {
      console.error('Flow ou usuário não encontrado:', { flow: !!flow, user: !!user })
      return
    }

    console.log('Iniciando salvamento do flow:', { flowId: flow.id, flowName: flow.name })
    setIsSaving(true)
    
    try {
      let savedFlow: Flow | null = null

      if (flow.id === 'new') {
        console.log('Criando novo flow...')
        // Criar novo flow
        const flowData = {
          ...flow,
          userId: user.id
        }
        console.log('Dados do flow para criação:', flowData)
        
        savedFlow = await flowBuilderService.createFlow(flowData)
        console.log('Resultado da criação:', savedFlow)
        
        if (savedFlow) {
          console.log('Navegando para o flow criado:', savedFlow.id)
          navigate(`/flow-builder/${savedFlow.id}`, { replace: true })
        } else {
          console.error('Falha ao criar flow - retornou null')
        }
      } else {
        console.log('Atualizando flow existente:', flow.id)
        // Atualizar flow existente
        savedFlow = await flowBuilderService.updateFlow(flow.id, flow)
        console.log('Resultado da atualização:', savedFlow)
      }

      if (savedFlow) {
        setFlow(savedFlow)
        console.log('Flow salvo com sucesso!', savedFlow)
      } else {
        console.error('Falha ao salvar flow - retornou null')
      }
    } catch (error) {
      console.error('Erro ao salvar flow:', error)
      console.error('Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleExecute = async () => {
    if (!flow || isExecuting) return

    // Validar antes de executar
    const validation = flowBuilderService.validateFlow(flow)
    if (!validation.isValid) {
      setValidationResult(validation)
      setShowValidation(true)
      return
    }

    setIsExecuting(true)
    setExecutionProgress({
      currentStep: '',
      totalSteps: flow.flowData.nodes.length,
      completedSteps: 0
    })

    try {
      const executionId = await flowBuilderService.executeFlow(
        flow.id,
        'manual',
        {}
      )

      if (executionId) {
        console.log('Execução iniciada:', executionId)
        // TODO: Implementar monitoramento em tempo real da execução
        
        // Simular progresso por enquanto
        for (let i = 0; i < flow.flowData.nodes.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          setExecutionProgress(prev => prev ? {
            ...prev,
            currentStep: flow.flowData.nodes[i].id,
            completedSteps: i + 1
          } : undefined)
        }
      }
    } catch (error) {
      console.error('Erro ao executar flow:', error)
    } finally {
      setIsExecuting(false)
      setExecutionProgress(undefined)
    }
  }

  const handleValidate = () => {
    if (!flow) return

    const validation = flowBuilderService.validateFlow(flow)
    setValidationResult(validation)
    setShowValidation(true)
  }

  const handleBack = () => {
    navigate('/flows')
  }

  const handleTemplateSelect = async (template: FlowTemplate) => {
    if (!user) return

    try {
      const newFlow = await flowBuilderService.createFlowFromTemplate(
        template.id,
        `${template.name} - Cópia`,
        user.id
      )

      if (newFlow) {
        navigate(`/flow-builder/${newFlow.id}`)
      }
    } catch (error) {
      console.error('Erro ao criar flow a partir do template:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando fluxo...</p>
        </div>
      </div>
    )
  }

  if (!flow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Fluxo não encontrado</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {flow.name}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  flow.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {flow.isActive ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Ativo
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3" />
                      Inativo
                    </>
                  )}
                </span>
                
                <span className="text-xs text-gray-500">
                  {flow.executionCount} execuções
                </span>
                
                <span className="text-xs text-gray-500">
                  {flow.flowData.nodes.length} nós
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CanEditFlow>
              <button
                onClick={handleValidate}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Validar
              </button>
            </CanEditFlow>

            <CanEditFlow>
              <button
                disabled={isSaving}
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </CanEditFlow>

            <CanExecuteFlow>
              <button
                disabled={isExecuting || flow.flowData.nodes.length === 0}
                onClick={handleExecute}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-4 h-4" />
                {isExecuting ? 'Executando...' : 'Executar'}
              </button>
            </CanExecuteFlow>

            <div className="w-px h-8 bg-gray-300" />

            <CanEditFlow>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                <Share className="w-4 h-4" />
              </button>
            </CanEditFlow>

            <CanExportImportFlows>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </CanExportImportFlows>

            <CanManageTemplates>
              <button 
                onClick={() => setShowTemplateLibrary(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Biblioteca de Templates"
              >
                <BookOpen className="w-4 h-4" />
              </button>
            </CanManageTemplates>

            <CanConfigureFlowBuilder>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </CanConfigureFlowBuilder>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <FlowCanvas
          flow={flow}
          onFlowChange={handleFlowChange}
          onSave={handleSave}
          onExecute={handleExecute}
          onValidate={handleValidate}
          isExecuting={isExecuting}
          executionProgress={executionProgress}
        />
      </div>

      {/* Modal de Validação */}
      {showValidation && validationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Resultado da Validação
              </h3>
              <button
                onClick={() => setShowValidation(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <div className={`flex items-center gap-2 p-3 rounded-md ${
                validationResult.isValid
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {validationResult.isValid ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                <span className="font-medium">
                  {validationResult.isValid 
                    ? 'Fluxo válido!' 
                    : 'Fluxo contém erros'
                  }
                </span>
              </div>
            </div>

            {validationResult.errors.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-red-700 mb-2">Erros:</h4>
                <ul className="space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600">
                      • {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-yellow-700 mb-2">Avisos:</h4>
                <ul className="space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-600">
                      • {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowValidation(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Fechar
              </button>
              {validationResult.isValid && (
                <button
                  onClick={() => {
                    setShowValidation(false)
                    handleExecute()
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Executar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Biblioteca de Templates */}
      <TemplateLibrary
        isOpen={showTemplateLibrary}
        onTemplateSelect={handleTemplateSelect}
        onClose={() => setShowTemplateLibrary(false)}
      />
    </div>
  )
}

export default FlowBuilder 