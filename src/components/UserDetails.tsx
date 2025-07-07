import React, { useState } from 'react'
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Clock, 
  Edit, 
  Save, 
  X, 
  Eye, 
  Trash2, 
  RefreshCw,
  LogOut,
  Activity,
  History,
  Settings,
  AlertTriangle
} from 'lucide-react'
import { useUser, useUserHistory, useUserSessions, useUserActivities, useUserPermissions, useUserRoles } from '../hooks/useUserManagement'
import { useUpdateUser, useDeleteUser, useResetPassword, useImpersonateUser, useRevokeSession, useRevokeAllUserSessions } from '../hooks/useUserManagement'
import { User as UserType, UserUpdateData } from '../types/userManagement'
import { formatDate, formatFileSize } from '../utils/helpers'
import { 
  Spinner, 
  LoadingButton, 
  StatusBadge, 
  Skeleton,
  FeedbackToast 
} from './ui/feedback'

interface UserDetailsProps {
  userId: string
  onClose: () => void
}

const UserDetails: React.FC<UserDetailsProps> = ({ userId, onClose }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<UserUpdateData>({})
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'sessions' | 'permissions'>('overview')
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    isVisible: boolean
  }>({ type: 'info', message: '', isVisible: false })

  // Queries
  const { data: user, isLoading: isLoadingUser } = useUser(userId)
  const { data: history, isLoading: isLoadingHistory } = useUserHistory(userId, 50)
  const { data: sessions, isLoading: isLoadingSessions } = useUserSessions(userId)
  const { data: activities, isLoading: isLoadingActivities } = useUserActivities(userId, 50)
  const { data: permissions, isLoading: isLoadingPermissions } = useUserPermissions(userId)
  const { data: roles, isLoading: isLoadingRoles } = useUserRoles(userId)

  // Mutations
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()
  const resetPasswordMutation = useResetPassword()
  const impersonateMutation = useImpersonateUser()
  const revokeSessionMutation = useRevokeSession()
  const revokeAllSessionsMutation = useRevokeAllUserSessions()

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message, isVisible: true })
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000)
  }

  const handleEdit = () => {
    if (user) {
      setEditData({
        full_name: user.full_name,
        role: user.role,
        status: user.status
      })
      setIsEditing(true)
    }
  }

  const handleSave = async () => {
    try {
      await updateUserMutation.mutateAsync({ userId, updates: editData })
      setIsEditing(false)
      showToast('success', 'Usuário atualizado com sucesso!')
    } catch (error) {
      showToast('error', `Erro ao atualizar usuário: ${error.message}`)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({})
  }

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      try {
        await deleteUserMutation.mutateAsync(userId)
        showToast('success', 'Usuário excluído com sucesso!')
        onClose()
      } catch (error) {
        showToast('error', `Erro ao excluir usuário: ${error.message}`)
      }
    }
  }

  const handleResetPassword = async () => {
    try {
      await resetPasswordMutation.mutateAsync({ userId, sendEmail: true })
      showToast('success', 'Link de reset de senha enviado com sucesso!')
    } catch (error) {
      showToast('error', `Erro ao enviar reset de senha: ${error.message}`)
    }
  }

  const handleImpersonate = async () => {
    try {
      await impersonateMutation.mutateAsync({ 
        userId, 
        reason: 'Debug administrativo',
        duration: 60 
      })
      showToast('success', 'Impersonação iniciada!')
    } catch (error) {
      showToast('error', `Erro na impersonação: ${error.message}`)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSessionMutation.mutateAsync(sessionId)
      showToast('success', 'Sessão revogada com sucesso!')
    } catch (error) {
      showToast('error', `Erro ao revogar sessão: ${error.message}`)
    }
  }

  const handleRevokeAllSessions = async () => {
    if (confirm('Tem certeza que deseja revogar todas as sessões deste usuário?')) {
      try {
        await revokeAllSessionsMutation.mutateAsync({ userId })
        showToast('success', 'Todas as sessões foram revogadas!')
      } catch (error) {
        showToast('error', `Erro ao revogar sessões: ${error.message}`)
      }
    }
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

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop': return '🖥️'
      case 'mobile': return '📱'
      case 'tablet': return '📱'
      default: return '💻'
    }
  }

  if (isLoadingUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Detalhes do Usuário</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-4">
            <Skeleton className="w-full h-32" />
            <Skeleton className="w-full h-64" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Usuário não encontrado</h3>
            <p className="text-gray-600 mb-4">O usuário solicitado não foi encontrado ou foi removido.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Editar Usuário' : user.full_name}
              </h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <LoadingButton
                  onClick={handleSave}
                  loading={updateUserMutation.isPending}
                  size="sm"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </LoadingButton>
                <button
                  onClick={handleCancel}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="p-2 text-blue-600 hover:text-blue-800"
                  title="Editar usuário"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                  className="p-2 text-green-600 hover:text-green-800"
                  title="Reset de senha"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleImpersonate}
                  disabled={impersonateMutation.isPending}
                  className="p-2 text-purple-600 hover:text-purple-800"
                  title="Impersonar usuário"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteUserMutation.isPending}
                  className="p-2 text-red-600 hover:text-red-800"
                  title="Excluir usuário"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Visão Geral', icon: User },
              { id: 'history', label: 'Histórico', icon: History },
              { id: 'sessions', label: 'Sessões', icon: Activity },
              { id: 'permissions', label: 'Permissões', icon: Shield }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.full_name || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{user.full_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    {isEditing ? (
                      <select
                        value={editData.role || user.role}
                        onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="user">Usuário</option>
                        <option value="moderator">Moderador</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    ) : (
                      <div className="mt-1">
                        <StatusBadge
                          status={getRoleColor(user.role)}
                          text={user.role.replace('_', ' ')}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    {isEditing ? (
                      <select
                        value={editData.status || user.status}
                        onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                        <option value="pending">Pendente</option>
                        <option value="suspended">Suspenso</option>
                      </select>
                    ) : (
                      <div className="mt-1">
                        <StatusBadge
                          status={getStatusColor(user.status)}
                          text={user.status}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Estatísticas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Cadastro</span>
                    </div>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {formatDate(user.created_at, 'short')}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Último Acesso</span>
                    </div>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {user.last_access ? formatDate(user.last_access, 'time') : 'Nunca'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Logins</span>
                    </div>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {user.login_count || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Tentativas Falhadas</span>
                    </div>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {user.failed_login_attempts || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Histórico de Atividades</h3>
                <span className="text-sm text-gray-500">
                  {history?.length || 0} atividades
                </span>
              </div>
              {isLoadingHistory ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="w-full h-16" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {history?.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{item.action}</p>
                          <p className="text-sm text-gray-600">{item.resource}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(item.created_at, 'time')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Sessões Ativas</h3>
                <LoadingButton
                  onClick={handleRevokeAllSessions}
                  loading={revokeAllSessionsMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  <LogOut className="w-4 h-4" />
                  Revogar Todas
                </LoadingButton>
              </div>
              {isLoadingSessions ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="w-full h-20" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions?.map((session) => (
                    <div key={session.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getDeviceIcon(session.device_info.type)}</span>
                          <div>
                            <p className="font-medium text-gray-900">
                              {session.device_info.browser} em {session.device_info.os}
                            </p>
                            <p className="text-sm text-gray-600">
                              {session.ip_address} • {formatDate(session.last_activity, 'time')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {session.is_current && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Atual
                            </span>
                          )}
                          <button
                            onClick={() => handleRevokeSession(session.session_id)}
                            disabled={revokeSessionMutation.isPending}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Revogar sessão"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              {/* Roles */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Roles Atribuídos</h3>
                {isLoadingRoles ? (
                  <Skeleton className="w-full h-20" />
                ) : (
                  <div className="space-y-2">
                    {roles?.map((role) => (
                      <div key={role.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{role.role_name}</p>
                          <p className="text-sm text-gray-600">
                            Atribuído em {formatDate(role.assigned_at, 'short')}
                          </p>
                        </div>
                        <StatusBadge
                          status={role.is_active ? 'green' : 'red'}
                          text={role.is_active ? 'Ativo' : 'Inativo'}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Permissões */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Permissões</h3>
                {isLoadingPermissions ? (
                  <Skeleton className="w-full h-32" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {permissions && Object.entries(permissions.permissions).map(([resource, actions]) => (
                      <div key={resource} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 capitalize mb-2">
                          {resource.replace('_', ' ')}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {actions.map((action) => (
                            <span
                              key={action}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                            >
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
    </div>
  )
}

export default UserDetails 