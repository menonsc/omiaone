import React, { useState, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Mail, 
  Eye,
  Download,
  RefreshCw,
  Users,
  Shield,
  Calendar,
  Clock
} from 'lucide-react'
import { useUserManagement } from '../hooks/useUserManagement'
import { UserFilters, User, UserAction } from '../types/userManagement'
import { formatDate, debounce } from '../utils/helpers'
import { 
  Spinner, 
  LoadingButton, 
  StatusBadge, 
  Skeleton,
  FeedbackToast 
} from '../components/ui/feedback'

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<UserFilters>({
    role: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    lastAccessFrom: '',
    lastAccessTo: ''
  })
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    isVisible: boolean
  }>({ type: 'info', message: '', isVisible: false })

  const queryClient = useQueryClient()
  const {
    getUsers,
    updateUser,
    deleteUser,
    bulkUpdateUsers,
    resetPassword,
    impersonateUser,
    exportUsers
  } = useUserManagement()

  // Query infinita para listagem paginada
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['users', searchTerm, filters],
    queryFn: ({ pageParam = 0 }) => getUsers({
      page: pageParam,
      search: searchTerm,
      filters
    }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<User> }) =>
      updateUser(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      showToast('success', 'Usuário atualizado com sucesso!')
    },
    onError: (error) => {
      showToast('error', `Erro ao atualizar usuário: ${error.message}`)
    }
  })

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      showToast('success', 'Usuário excluído com sucesso!')
    },
    onError: (error) => {
      showToast('error', `Erro ao excluir usuário: ${error.message}`)
    }
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ action, userIds }: { action: UserAction; userIds: string[] }) =>
      bulkUpdateUsers(action, userIds),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setSelectedUsers([])
      setShowBulkActions(false)
      showToast('success', `Ação "${action}" aplicada com sucesso!`)
    },
    onError: (error) => {
      showToast('error', `Erro na ação em massa: ${error.message}`)
    }
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => resetPassword(userId),
    onSuccess: () => {
      showToast('success', 'Link de reset de senha enviado com sucesso!')
    },
    onError: (error) => {
      showToast('error', `Erro ao enviar reset de senha: ${error.message}`)
    }
  })

  const impersonateMutation = useMutation({
    mutationFn: (userId: string) => impersonateUser(userId),
    onSuccess: (data) => {
      showToast('success', 'Impersonação iniciada com sucesso!')
      // Redirecionar para dashboard como usuário
      window.location.href = `/dashboard?impersonate=${data.sessionId}`
    },
    onError: (error) => {
      showToast('error', `Erro na impersonação: ${error.message}`)
    }
  })

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term)
    }, 300),
    []
  )

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value)
  }

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleUserSelect = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => 
      checked 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    )
    setShowBulkActions(selectedUsers.length > 0 || checked)
  }

  const handleSelectAll = (checked: boolean) => {
    const allUserIds = data?.pages.flatMap(page => page.users.map(user => user.id)) || []
    setSelectedUsers(checked ? allUserIds : [])
    setShowBulkActions(checked)
  }

  const handleBulkAction = (action: UserAction) => {
    if (selectedUsers.length === 0) return
    bulkUpdateMutation.mutate({ action, userIds: selectedUsers })
  }

  const handleExport = async () => {
    try {
      await exportUsers({ search: searchTerm, filters })
      showToast('success', 'Exportação iniciada! Você receberá o arquivo por email.')
    } catch (error) {
      showToast('error', `Erro na exportação: ${error.message}`)
    }
  }

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message, isVisible: true })
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'red'
      case 'admin': return 'orange'
      case 'moderator': return 'blue'
      case 'user': return 'green'
      default: return 'gray'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'inactive': return 'red'
      case 'pending': return 'yellow'
      case 'suspended': return 'orange'
      default: return 'gray'
    }
  }

  // Renderização
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Erro ao carregar usuários</h3>
          <p className="text-red-600 mt-1">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const allUsers = data?.pages.flatMap(page => page.users) || []
  const totalUsers = data?.pages[0]?.total || 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="text-gray-600 mt-1">
            {totalUsers} usuários encontrados
          </p>
        </div>
        <div className="flex gap-2">
          <LoadingButton
            onClick={() => refetch()}
            loading={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </LoadingButton>
          <LoadingButton
            onClick={handleExport}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4" />
            Exportar
          </LoadingButton>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome, email, role..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={handleSearchChange}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
              showFilters 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Filtros Avançados */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderador</option>
                <option value="user">Usuário</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="pending">Pendente</option>
                <option value="suspended">Suspenso</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Cadastro
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Ações em Massa */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-800">
                {selectedUsers.length} usuário(s) selecionado(s)
              </span>
              <div className="flex gap-2">
                <LoadingButton
                  onClick={() => handleBulkAction('activate')}
                  loading={bulkUpdateMutation.isPending}
                  size="sm"
                  variant="outline"
                >
                  <UserCheck className="w-4 h-4" />
                  Ativar
                </LoadingButton>
                <LoadingButton
                  onClick={() => handleBulkAction('deactivate')}
                  loading={bulkUpdateMutation.isPending}
                  size="sm"
                  variant="outline"
                >
                  <UserX className="w-4 h-4" />
                  Desativar
                </LoadingButton>
                <LoadingButton
                  onClick={() => handleBulkAction('delete')}
                  loading={bulkUpdateMutation.isPending}
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </LoadingButton>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedUsers([])
                setShowBulkActions(false)
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Usuários */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === allUsers.length && allUsers.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cadastro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acesso
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                // Skeletons de carregamento
                Array.from({ length: 10 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <Skeleton className="w-4 h-4" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div>
                          <Skeleton className="w-32 h-4 mb-1" />
                          <Skeleton className="w-24 h-3" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="w-16 h-6" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="w-12 h-6" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="w-20 h-4" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="w-20 h-4" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="w-20 h-8 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : (
                allUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {user.avatar_url ? (
                            <img
                              className="w-10 h-10 rounded-full"
                              src={user.avatar_url}
                              alt={user.full_name}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {user.full_name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={getRoleColor(user.role)}
                        text={user.role.replace('_', ' ')}
                        size="sm"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={getStatusColor(user.status)}
                        text={user.status}
                        size="sm"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.created_at, 'short')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.last_access 
                        ? formatDate(user.last_access, 'time')
                        : 'Nunca'
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => impersonateMutation.mutate(user.id)}
                          disabled={impersonateMutation.isPending}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Impersonar usuário"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => resetPasswordMutation.mutate(user.id)}
                          disabled={resetPasswordMutation.isPending}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Reset de senha"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateUserMutation.mutate({
                            userId: user.id,
                            updates: { status: user.status === 'active' ? 'inactive' : 'active' }
                          })}
                          disabled={updateUserMutation.isPending}
                          className="p-1 text-orange-600 hover:text-orange-800"
                          title={user.status === 'active' ? 'Desativar' : 'Ativar'}
                        >
                          {user.status === 'active' ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteUserMutation.mutate(user.id)}
                          disabled={deleteUserMutation.isPending}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load More */}
        {hasNextPage && (
          <div className="px-6 py-4 border-t">
            <LoadingButton
              onClick={() => fetchNextPage()}
              loading={isFetchingNextPage}
              variant="outline"
              className="w-full"
            >
              {isFetchingNextPage ? 'Carregando...' : 'Carregar mais usuários'}
            </LoadingButton>
          </div>
        )}
      </div>

      {/* Toast */}
      <FeedbackToast
        type={toast.type}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  )
}

export default UserManagement 