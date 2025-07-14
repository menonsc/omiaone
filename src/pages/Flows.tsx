import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flow } from '../types/flowBuilder'
import { flowBuilderService } from '../services/flowBuilderService'
import { useAuthStore } from '../store/authStore'
import { 
  CanCreateFlow,
  CanEditFlow,
  CanExecuteFlow,
  CanExportImportFlows
} from '../components/PermissionGuard'
import { 
  Plus, 
  Edit, 
  Play, 
  Trash2, 
  Copy, 
  Download, 
  Upload,
  Search,
  Filter,
  Calendar,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical
} from 'lucide-react'

const Flows: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [flows, setFlows] = useState<Flow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadFlows()
    }
  }, [user])

  const loadFlows = async () => {
    setIsLoading(true)
    try {
      const filters: any = {
        userId: user?.id,
        search: searchTerm || undefined
      }

      if (selectedCategory !== 'all') {
        filters.category = selectedCategory
      }
      if (selectedStatus !== 'all') {
        filters.isActive = selectedStatus === 'active'
      }

      const flowsData = await flowBuilderService.getFlows(filters)
      setFlows(flowsData)
    } catch (error) {
      console.error('Erro ao carregar flows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    loadFlows()
  }

  const handleDelete = async (flowId: string) => {
    try {
      const success = await flowBuilderService.deleteFlow(flowId)
      if (success) {
        setFlows(flows.filter(flow => flow.id !== flowId))
        setShowDeleteModal(null)
      }
    } catch (error) {
      console.error('Erro ao deletar flow:', error)
    }
  }

  const handleDuplicate = async (flow: Flow) => {
    try {
      const duplicatedFlow = await flowBuilderService.createFlow({
        ...flow,
        name: `${flow.name} (Cópia)`,
        isActive: false
      })
      
      if (duplicatedFlow && duplicatedFlow.id) {
        navigate(`/flow-builder/${duplicatedFlow.id}`)
      }
    } catch (error) {
      console.error('Erro ao duplicar flow:', error)
    }
  }

  const handleExecute = async (flow: Flow) => {
    try {
      const executionId = await flowBuilderService.executeFlow(
        flow.id,
        'manual',
        {}
      )
      
      if (executionId) {
        console.log('Execução iniciada:', executionId)
        // TODO: Implementar monitoramento da execução
      }
    } catch (error) {
      console.error('Erro ao executar flow:', error)
    }
  }

  const getStatusIcon = (flow: Flow) => {
    if (flow.isActive) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    return <AlertCircle className="w-4 h-4 text-yellow-500" />
  }

  const getStatusText = (flow: Flow) => {
    return flow.isActive ? 'Ativo' : 'Inativo'
  }

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      general: 'Geral',
      customer_service: 'Atendimento',
      marketing: 'Marketing',
      operations: 'Operações',
      sales: 'Vendas'
    }
    return categories[category] || category
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fluxos de Automação
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seus fluxos de automação e workflows
          </p>
        </div>
        
        <CanCreateFlow>
          <Link
            to="/flow-builder"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Fluxo
          </Link>
        </CanCreateFlow>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-4">
          {/* Busca */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar flows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Filtro por categoria */}
          <div className="min-w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todas as categorias</option>
              <option value="general">Geral</option>
              <option value="customer_service">Atendimento</option>
              <option value="marketing">Marketing</option>
              <option value="operations">Operações</option>
              <option value="sales">Vendas</option>
            </select>
          </div>

          {/* Filtro por status */}
          <div className="min-w-32">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>

          <button
            onClick={loadFlows}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista de Flows */}
      {flows.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum fluxo encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Crie seu primeiro fluxo de automação'
            }
          </p>
          <CanCreateFlow>
            <Link
              to="/flow-builder"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Fluxo
            </Link>
          </CanCreateFlow>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow) => (
            <div
              key={flow.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              {/* Header do card */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(flow)}
                  <span className={`text-sm font-medium ${
                    flow.isActive ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {getStatusText(flow)}
                  </span>
                </div>
                
                <div className="relative">
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Conteúdo do card */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {flow.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  {flow.description || 'Sem descrição'}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(flow.updatedAt)}
                  </span>
                  <span className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    {flow.executionCount} execuções
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-4">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                  {getCategoryLabel(flow.category)}
                </span>
              </div>

              {/* Ações */}
              <div className="flex space-x-2">
                <CanEditFlow>
                  <Link
                    to={`/flow-builder/${flow.id}`}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Link>
                </CanEditFlow>

                <CanExecuteFlow>
                  <button
                    onClick={() => handleExecute(flow)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Executar
                  </button>
                </CanExecuteFlow>
              </div>

              {/* Ações secundárias */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleDuplicate(flow)}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Duplicar
                </button>

                <CanExportImportFlows>
                  <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    Exportar
                  </button>
                </CanExportImportFlows>

                <button
                  onClick={() => setShowDeleteModal(flow.id)}
                  className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirmar exclusão
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja excluir este fluxo? Esta ação não pode ser desfeita.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Flows 