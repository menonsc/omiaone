import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  ConnectionMode,
  Connection,
  EdgeChange,
  NodeChange,
  ReactFlowProvider,
  Panel,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import { FlowNode, FlowConnection, Flow, NodeTemplate } from '../../types/flowBuilder'
import { 
  CanEditFlow,
  CanExecuteFlow,
  CanConfigureFlowBuilder
} from '../PermissionGuard'
import { 
  Save, 
  Play, 
  Pause, 
  Settings, 
  Eye,
  Trash2,
  Copy,
  Plus
} from 'lucide-react'

// Componentes de nós customizados
import TriggerNode from './nodes/TriggerNode'
import ActionNode from './nodes/ActionNode'
import ConditionNode from './nodes/ConditionNode'
import BaseNode from './nodes/BaseNode'
import NodeConfigPanel from './NodeConfigPanel'

// Biblioteca de nós
import NodeLibrary from './NodeLibrary'

// Configuração dos tipos de nós customizados
const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  default: BaseNode,
}

interface FlowCanvasProps {
  flow: Flow | null
  onFlowChange: (flow: Flow) => void
  onSave: () => void
  onExecute: () => void
  onValidate: () => void
  isExecuting?: boolean
  executionProgress?: {
    currentStep: string
    totalSteps: number
    completedSteps: number
  }
  className?: string
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({
  flow,
  onFlowChange,
  onSave,
  onExecute,
  onValidate,
  isExecuting = false,
  executionProgress,
  className = ''
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [configuringNode, setConfiguringNode] = useState<FlowNode | null>(null)
  const [showConfigPanel, setShowConfigPanel] = useState(false)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Converter dados do flow para formato React Flow
  const initialNodes: Node[] = useMemo(() => {
    if (!flow?.flowData?.nodes) return []
    
    return flow.flowData.nodes.map((node: FlowNode) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        ...node,
        config: node.config,
        isExecuting: isExecuting && executionProgress?.currentStep === node.id,
        isCompleted: executionProgress ? 
          flow.flowData.nodes.findIndex(n => n.id === node.id) < 
          flow.flowData.nodes.findIndex(n => n.id === executionProgress.currentStep) : false,
        onNodeSelect: (nodeId: string) => {
          const n = flow?.flowData?.nodes.find(n => n.id === nodeId)
          if (n) {
            setConfiguringNode(n)
            setShowConfigPanel(true)
          }
        },
        onConfigChange: (nodeId: string, config: any) => {
          setNodes(prevNodes => prevNodes.map(node => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  config
                }
              }
            }
            return node
          }))
          // O resto do update do flow será feito no handler global
        }
      },
      selected: selectedNodes.includes(node.id)
    }))
  }, [flow, selectedNodes, isExecuting, executionProgress, setNodes])

  const initialEdges: Edge[] = useMemo(() => {
    if (!flow?.flowData?.connections) return []
    
    return flow.flowData.connections.map((connection: FlowConnection) => ({
      id: connection.id,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined,
      type: 'smoothstep',
      animated: isExecuting,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      style: {
        stroke: isExecuting ? '#3b82f6' : '#64748b',
        strokeWidth: 2,
      },
      data: connection.condition
    }))
  }, [flow, isExecuting])

  // Inicializar nós e edges apenas quando o flow mudar (não quando os nós são movidos)
  useEffect(() => {
    // Só inicializar se não há nós atuais ou se o flow mudou completamente
    const shouldInitialize = nodes.length === 0 || 
      (flow?.flowData?.nodes && flow.flowData.nodes.length !== nodes.length) ||
      (flow?.flowData?.connections && flow.flowData.connections.length !== edges.length)
    
    if (shouldInitialize) {
      console.log('🔄 Inicializando nós e edges:', { 
        nodesCount: initialNodes.length, 
        edgesCount: initialEdges.length 
      })
      setNodes(initialNodes)
      setEdges(initialEdges)
    }
  }, [flow?.id, flow?.flowData?.nodes?.length, flow?.flowData?.connections?.length, setNodes, setEdges])

  // Handler global para atualização do flow (mantém persistência)
  const handleNodeConfigChange = useCallback((nodeId: string, config: any) => {
    const updatedNodes = nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            config
          }
        }
      }
      return node
    })
    
    const flowNodes: FlowNode[] = updatedNodes.map(node => ({
      id: node.id,
      type: node.type as any,
      position: node.position,
      config: node.data?.config || {},
      data: node.data,
      isActive: node.data?.isActive !== false,
      label: node.data?.label,
      description: node.data?.description
    }))

    const updatedFlow: Flow = {
      ...flow!,
      flowData: {
        ...flow!.flowData,
        nodes: flowNodes
      }
    }

    onFlowChange(updatedFlow)
    setIsDirty(true)
  }, [nodes, flow, onFlowChange])

  // Handler para abrir painel de configuração
  const handleNodeConfig = useCallback((nodeId: string) => {
    const node = flow?.flowData?.nodes.find(n => n.id === nodeId)
    if (node) {
      setConfiguringNode(node)
      setShowConfigPanel(true)
    }
  }, [flow])

  // Atualizar flow quando nodes ou edges mudarem
  const updateFlow = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    if (!flow) return

    const flowNodes: FlowNode[] = newNodes.map(node => ({
      id: node.id,
      type: node.type as any,
      position: node.position,
      config: node.data?.config || {},
      data: node.data,
      isActive: node.data?.isActive !== false,
      label: node.data?.label,
      description: node.data?.description
    }))

    const flowConnections: FlowConnection[] = newEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined,
      condition: edge.data
    }))

    const updatedFlow: Flow = {
      ...flow,
      flowData: {
        ...flow.flowData,
        nodes: flowNodes,
        connections: flowConnections
      }
    }

    onFlowChange(updatedFlow)
    setIsDirty(true)
  }, [flow, onFlowChange])

  // Handler para mudanças nos nós
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    console.log('🔄 Mudanças nos nós:', changes)
    onNodesChange(changes)
    
    // Processar mudanças de posição
    const updatedNodes = nodes.map(node => {
      const change = changes.find(c => 'id' in c && c.id === node.id)
      if (change && change.type === 'position' && 'position' in change) {
        console.log('📍 Atualizando posição do nó:', node.id, change.position)
        return { ...node, position: change.position! }
      }
      return node
    })
    
    // Só atualizar o flow se houve mudanças reais
    const hasPositionChanges = changes.some(change => 
      change.type === 'position' && 'position' in change
    )
    
    if (hasPositionChanges) {
      console.log('🔄 Atualizando flow com novas posições')
      updateFlow(updatedNodes, edges)
    }
  }, [onNodesChange, nodes, edges, updateFlow])

  // Handler para mudanças nas conexões
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes)
    updateFlow(nodes, edges)
  }, [onEdgesChange, nodes, edges, updateFlow])

  // Handler para criar nova conexão
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return

    const newEdge: Edge = {
      id: `edge-${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      style: {
        stroke: '#64748b',
        strokeWidth: 2,
      }
    }
    
    const newEdges = addEdge(newEdge, edges)
    setEdges(newEdges)
    updateFlow(nodes, newEdges)
  }, [edges, nodes, setEdges, updateFlow])

  // Handler para adicionar nó a partir do template
  const handleNodeSelect = useCallback((nodeTemplate: NodeTemplate) => {
    if (!flow) return

    const newNode: Node = {
      id: `${nodeTemplate.type}-${Date.now()}`,
      type: nodeTemplate.type,
      position: { x: 100, y: 100 }, // Posição padrão
      data: {
        id: `${nodeTemplate.type}-${Date.now()}`,
        type: nodeTemplate.type,
        subtype: nodeTemplate.subtype,
        label: nodeTemplate.name,
        description: nodeTemplate.description,
        config: nodeTemplate.defaultConfig,
        inputs: nodeTemplate.inputs,
        outputs: nodeTemplate.outputs,
        isActive: true
      }
    }

    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    updateFlow(newNodes, edges)
    setIsLibraryOpen(false)
  }, [flow, nodes, edges, updateFlow])

  // Handler para arrastar nó da biblioteca
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()

    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
    const nodeData = event.dataTransfer.getData('application/reactflow')
    
    if (!nodeData || !reactFlowBounds || !reactFlowInstance) return

    const { type, label, config } = JSON.parse(nodeData)
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    })

    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: {
        id: `${type}-${Date.now()}`,
        type,
        label,
        config: config || {},
        isActive: true
      }
    }

    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    updateFlow(newNodes, edges)
  }, [reactFlowInstance, nodes, edges, setNodes, updateFlow])

  // Handlers da toolbar
  const handleSave = useCallback(() => {
    onSave()
    setIsDirty(false)
  }, [onSave])

  const handleExecute = useCallback(() => {
    if (isExecuting) {
      // TODO: Implementar pausa/stop
      return
    }
    onExecute()
  }, [isExecuting, onExecute])

  const handleDeleteSelected = useCallback(() => {
    const selectedNodeIds = nodes.filter(node => node.selected).map(node => node.id)
    const selectedEdgeIds = edges.filter(edge => edge.selected).map(edge => edge.id)
    
    const newNodes = nodes.filter(node => !selectedNodeIds.includes(node.id))
    const newEdges = edges.filter(edge => 
      !selectedEdgeIds.includes(edge.id) &&
      !selectedNodeIds.includes(edge.source) &&
      !selectedNodeIds.includes(edge.target)
    )
    
    setNodes(newNodes)
    setEdges(newEdges)
    updateFlow(newNodes, newEdges)
  }, [nodes, edges, setNodes, setEdges, updateFlow])

  const handleCopy = useCallback(() => {
    const selectedNodes = nodes.filter(node => node.selected)
    if (selectedNodes.length > 0) {
      localStorage.setItem('flowbuilder-clipboard', JSON.stringify(selectedNodes))
    }
  }, [nodes])

  const handlePaste = useCallback(() => {
    const clipboard = localStorage.getItem('flowbuilder-clipboard')
    if (!clipboard) return

    try {
      const copiedNodes = JSON.parse(clipboard)
      const newNodes = copiedNodes.map((node: Node) => ({
        ...node,
        id: `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: {
          x: node.position.x + 20,
          y: node.position.y + 20
        },
        selected: true
      }))

      const allNodes = [...nodes.map(n => ({ ...n, selected: false })), ...newNodes]
      setNodes(allNodes)
      updateFlow(allNodes, edges)
    } catch (error) {
      console.error('Erro ao colar nós:', error)
    }
  }, [nodes, edges, setNodes, updateFlow])

  // Atalhos de teclado
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault()
            handleSave()
            break
          case 'c':
            event.preventDefault()
            handleCopy()
            break
          case 'v':
            event.preventDefault()
            handlePaste()
            break
        }
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        handleDeleteSelected()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, handleCopy, handlePaste, handleDeleteSelected])

  return (
    <div className={`flex h-full ${className}`}>
      {/* Biblioteca de Nós */}
      <NodeLibrary
        isOpen={isLibraryOpen}
        onNodeSelect={handleNodeSelect}
        onClose={() => setIsLibraryOpen(false)}
      />

      {/* Canvas principal */}
      <div className="flex-1 relative">
        <div ref={reactFlowWrapper} className="h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            attributionPosition="bottom-left"
            className="bg-gray-50"
          >
            <Background color="#aaa" gap={16} />
            <Controls 
              className="bg-white shadow-lg border border-gray-200 rounded-lg"
              showInteractive={false}
            />
            <MiniMap 
              className="bg-white shadow-lg border border-gray-200 rounded-lg"
              nodeColor="#3b82f6"
              maskColor="rgba(0, 0, 0, 0.1)"
            />
            
            {/* Toolbar principal */}
            <Panel position="top-center" className="bg-white shadow-lg border border-gray-200 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className={`p-2 rounded-md transition-colors ${
                    isDirty 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isDirty ? "Salvar (Ctrl+S)" : "Salvo"}
                >
                  <Save className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300" />

                <button
                  onClick={handleExecute}
                  disabled={!flow || flow.flowData.nodes.length === 0}
                  className={`p-2 rounded-md transition-colors ${
                    isExecuting
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500'
                  }`}
                  title={isExecuting ? "Parar execução" : "Executar fluxo"}
                >
                  {isExecuting ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  onClick={onValidate}
                  className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                  title="Validar fluxo"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300" />

                <button
                  onClick={handleCopy}
                  className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                  title="Copiar selecionados (Ctrl+C)"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={handleDeleteSelected}
                  className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-red-100 hover:text-red-600 transition-colors"
                  title="Deletar selecionados (Delete)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300" />

                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                  title="Adicionar nó"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                  title="Configurações do fluxo"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </Panel>

            {/* Indicador de progresso da execução */}
            {isExecuting && executionProgress && (
              <Panel position="top-right" className="bg-blue-600 text-white rounded-lg p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <div className="text-sm">
                    Executando... ({executionProgress.completedSteps}/{executionProgress.totalSteps})
                  </div>
                </div>
                <div className="mt-1 text-xs opacity-75">
                  Passo atual: {executionProgress.currentStep}
                </div>
              </Panel>
            )}

            {/* Status do fluxo */}
            <Panel position="bottom-right" className="bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span>{nodes.length} nós</span>
                <span>•</span>
                <span>{edges.length} conexões</span>
                {isDirty && (
                  <>
                    <span>•</span>
                    <span className="text-orange-600">Não salvo</span>
                  </>
                )}
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Node Config Panel */}
      {showConfigPanel && configuringNode && (
        <NodeConfigPanel
          node={configuringNode}
          isOpen={showConfigPanel}
          onClose={() => {
            setShowConfigPanel(false)
            setConfiguringNode(null)
          }}
          onConfigChange={handleNodeConfigChange}
          onTest={(nodeId) => {
            console.log('Testando nó:', nodeId)
            // TODO: Implementar teste de nó
          }}
        />
      )}
    </div>
  )
}

// Wrapper com ReactFlowProvider
const FlowCanvasWrapper: React.FC<FlowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  )
}

export default FlowCanvasWrapper 