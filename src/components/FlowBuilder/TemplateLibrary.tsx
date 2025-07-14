import React, { useState, useEffect } from 'react'
import { FlowTemplate, FlowCategory } from '../../types/flowBuilder'
import { flowBuilderService } from '../../services/flowBuilderService'
import { useAuthStore } from '../../store/authStore'
import { 
  CanManageTemplates,
  CanCreateFlow
} from '../PermissionGuard'
import { 
  Search,
  Filter,
  Star,
  Download,
  Eye,
  Plus,
  BookOpen,
  Zap,
  MessageSquare,
  ShoppingCart,
  Users,
  Settings,
  TrendingUp
} from 'lucide-react'

interface TemplateLibraryProps {
  onTemplateSelect: (template: FlowTemplate) => void
  onClose: () => void
  isOpen: boolean
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onTemplateSelect,
  onClose,
  isOpen
}) => {
  const { user } = useAuthStore()
  const [templates, setTemplates] = useState<FlowTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<FlowTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  // Carregar templates
  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  // Filtrar templates
  useEffect(() => {
    let filtered = templates

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filtro por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }

    // Filtro por dificuldade
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(template => template.difficultyLevel === selectedDifficulty)
    }

    setFilteredTemplates(filtered)
  }, [templates, searchTerm, selectedCategory, selectedDifficulty])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const loadedTemplates = await flowBuilderService.getTemplates({
        isPublic: true,
        limit: 50
      })
      setTemplates(loadedTemplates)
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateSelect = (template: FlowTemplate) => {
    onTemplateSelect(template)
    onClose()
  }

  const getCategoryIcon = (category: FlowCategory) => {
    switch (category) {
      case 'customer_service':
        return <MessageSquare className="w-5 h-5" />
      case 'sales':
        return <ShoppingCart className="w-5 h-5" />
      case 'marketing':
        return <TrendingUp className="w-5 h-5" />
      case 'operations':
        return <Settings className="w-5 h-5" />
      case 'hr':
        return <Users className="w-5 h-5" />
      case 'finance':
        return <TrendingUp className="w-5 h-5" />
      case 'general':
        return <Zap className="w-5 h-5" />
      default:
        return <Zap className="w-5 h-5" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700'
      case 'advanced':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const categories = [
    { id: 'all', name: 'Todos', icon: <Zap className="w-4 h-4" /> },
    { id: 'customer_service', name: 'Atendimento', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'sales', name: 'Vendas', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'marketing', name: 'Marketing', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'operations', name: 'Operações', icon: <Settings className="w-4 h-4" /> },
    { id: 'hr', name: 'RH', icon: <Users className="w-4 h-4" /> },
    { id: 'finance', name: 'Financeiro', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'general', name: 'Geral', icon: <Zap className="w-4 h-4" /> }
  ]

  const difficulties = [
    { id: 'all', name: 'Todas' },
    { id: 'beginner', name: 'Iniciante' },
    { id: 'intermediate', name: 'Intermediário' },
    { id: 'advanced', name: 'Avançado' }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Biblioteca de Templates</h2>
            <p className="text-gray-600 mt-1">
              Escolha um template para começar rapidamente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            ×
          </button>
        </div>

        {/* Filtros */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4">
            {/* Busca */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Categorias */}
            <div className="flex gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category.icon}
                  {category.name}
                </button>
              ))}
            </div>

            {/* Dificuldade */}
            <div className="flex gap-2">
              {difficulties.map(difficulty => (
                <button
                  key={difficulty.id}
                  onClick={() => setSelectedDifficulty(difficulty.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedDifficulty === difficulty.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {difficulty.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Templates */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Carregando templates...</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum template encontrado
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros ou criar um novo template.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleTemplateSelect(template)}
                >
                  {/* Header do Template */}
                  <div className="flex items-start justify-between mb-4">
                                         <div className="flex items-center gap-2">
                       {getCategoryIcon(template.category || 'general')}
                       <h3 className="font-semibold text-gray-900">{template.name}</h3>
                     </div>
                    {template.isFeatured && (
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    )}
                  </div>

                  {/* Descrição */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {template.description || 'Template de automação'}
                  </p>

                  {/* Tags */}
                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                          +{template.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getDifficultyColor(template.difficultyLevel)}`}>
                        {template.difficultyLevel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {template.usageCount}
                      </span>
                      {template.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          {template.rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <CanCreateFlow>
                      <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                        <Plus className="w-4 h-4" />
                        Usar
                      </button>
                    </CanCreateFlow>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} encontrado{filteredTemplates.length !== 1 ? 's' : ''}
            </p>
            
            <CanManageTemplates>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm">
                <Plus className="w-4 h-4" />
                Criar Template
              </button>
            </CanManageTemplates>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplateLibrary 