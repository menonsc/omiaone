import React, { useState } from 'react'
import { 
  useAllRoles, 
  useCreateRole, 
  useUpdateRole, 
  useDeleteRole,
  useAssignRole,
  useRevokeRole
} from '../hooks/usePermissionsQueries'
import { AdminGuard } from '../components/PermissionGuard'
import { Spinner, LoadingButton } from '../components/ui/feedback'
import { Role, RESOURCE_LABELS, ACTION_LABELS } from '../services/permissions'
import { 
  UsersIcon, 
  ShieldCheckIcon, 
  CogIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const RoleManagement: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isUserAssignmentOpen, setIsUserAssignmentOpen] = useState(false)

  const { data: roles, isLoading: rolesLoading, refetch: refetchRoles } = useAllRoles()
  const createRoleMutation = useCreateRole()
  const updateRoleMutation = useUpdateRole()
  const deleteRoleMutation = useDeleteRole()

  const handleCreateRole = () => {
    setSelectedRole(null)
    setIsCreateModalOpen(true)
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setIsEditModalOpen(true)
  }

  const handleDeleteRole = (role: Role) => {
    setSelectedRole(role)
    setIsDeleteModalOpen(true)
  }

  const handleUserAssignment = (role: Role) => {
    setSelectedRole(role)
    setIsUserAssignmentOpen(true)
  }

  const getRoleColor = (hierarchyLevel: number) => {
    switch (hierarchyLevel) {
      case 1: return 'bg-red-50 text-red-700 border-red-200'
      case 2: return 'bg-orange-50 text-orange-700 border-orange-200'
      case 3: return 'bg-blue-50 text-blue-700 border-blue-200'
      case 4: return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getHierarchyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Super Administrador'
      case 2: return 'Administrador'
      case 3: return 'Moderador'
      case 4: return 'Usuário'
      default: return `Nível ${level}`
    }
  }

  if (rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spinner size="lg" />
        <span className="ml-3">Carregando papéis...</span>
      </div>
    )
  }

  return (
    <AdminGuard requireSuperAdmin={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Papéis</h1>
            <p className="text-gray-600">
              Configure papéis e permissões do sistema RBAC
            </p>
          </div>
          <button
            onClick={handleCreateRole}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Papel
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Papéis
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {roles?.length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Papéis do Sistema
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {roles?.filter(r => r.is_system_role).length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CogIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Papéis Customizados
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {roles?.filter(r => !r.is_system_role).length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Papéis Ativos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {roles?.filter(r => r.is_active).length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Papéis */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Papéis Configurados
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Lista completa de papéis e suas permissões
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {roles?.map((role) => (
              <li key={role.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(role.hierarchy_level)}`}>
                        Nível {role.hierarchy_level}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">{role.display_name}</p>
                        {role.is_system_role && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Sistema
                          </span>
                        )}
                        {!role.is_active && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{role.description}</p>
                      <div className="mt-1">
                        <p className="text-xs text-gray-400">
                          {Object.keys(role.permissions).length} recursos • {' '}
                          {Object.values(role.permissions).reduce((acc, actions) => acc + actions.length, 0)} permissões
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUserAssignment(role)}
                      className="inline-flex items-center p-1 border border-transparent rounded-full text-gray-400 hover:text-gray-500"
                      title="Gerenciar usuários"
                    >
                      <UsersIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEditRole(role)}
                      className="inline-flex items-center p-1 border border-transparent rounded-full text-gray-400 hover:text-gray-500"
                      title="Editar papel"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    {!role.is_system_role && (
                      <button
                        onClick={() => handleDeleteRole(role)}
                        className="inline-flex items-center p-1 border border-transparent rounded-full text-red-400 hover:text-red-500"
                        title="Deletar papel"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Detalhes das Permissões */}
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(role.permissions).map(([resource, actions]) => (
                      <div key={resource} className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          {RESOURCE_LABELS[resource] || resource}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {actions.map((action: string) => (
                            <span
                              key={action}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {ACTION_LABELS[action] || action}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Modais */}
        {isCreateModalOpen && (
          <RoleFormModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={async (roleData) => {
              await createRoleMutation.mutateAsync(roleData)
              refetchRoles()
              setIsCreateModalOpen(false)
            }}
            isLoading={createRoleMutation.isPending}
          />
        )}

        {isEditModalOpen && selectedRole && (
          <RoleFormModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            role={selectedRole}
            onSubmit={async (roleData) => {
              await updateRoleMutation.mutateAsync({
                roleId: selectedRole.id,
                updates: roleData
              })
              refetchRoles()
              setIsEditModalOpen(false)
            }}
            isLoading={updateRoleMutation.isPending}
          />
        )}

        {isDeleteModalOpen && selectedRole && (
          <DeleteRoleModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            role={selectedRole}
            onConfirm={async () => {
              await deleteRoleMutation.mutateAsync(selectedRole.id)
              refetchRoles()
              setIsDeleteModalOpen(false)
            }}
            isLoading={deleteRoleMutation.isPending}
          />
        )}

        {isUserAssignmentOpen && selectedRole && (
          <UserAssignmentModal
            isOpen={isUserAssignmentOpen}
            onClose={() => setIsUserAssignmentOpen(false)}
            role={selectedRole}
          />
        )}
      </div>
    </AdminGuard>
  )
}

// Componente do Modal de Formulário de Papel
interface RoleFormModalProps {
  isOpen: boolean
  onClose: () => void
  role?: Role
  onSubmit: (roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  isLoading: boolean
}

const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  role,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    display_name: role?.display_name || '',
    description: role?.description || '',
    hierarchy_level: role?.hierarchy_level || 5,
    permissions: role?.permissions || {} as Record<string, string[]>,
    is_system_role: role?.is_system_role || false,
    is_active: role?.is_active ?? true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const updatePermissions = (resource: string, actions: string[]) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [resource]: actions
      }
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {role ? 'Editar Papel' : 'Criar Novo Papel'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome de Exibição</label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nível Hierárquico</label>
                  <select
                    value={formData.hierarchy_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, hierarchy_level: parseInt(e.target.value) }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={1}>1 - Super Administrador</option>
                    <option value={2}>2 - Administrador</option>
                    <option value={3}>3 - Moderador</option>
                    <option value={4}>4 - Usuário</option>
                    <option value={5}>5 - Personalizado</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Ativo</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_system_role}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_system_role: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Papel do Sistema</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Editor de Permissões */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Permissões</h4>
                <PermissionEditor
                  permissions={formData.permissions}
                  onPermissionsChange={(permissions) => setFormData(prev => ({ ...prev, permissions }))}
                />
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {role ? 'Atualizando...' : 'Criando...'}
                  </>
                ) : (
                  `${role ? 'Atualizar' : 'Criar'} Papel`
                )}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onClose}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Componente Editor de Permissões (implementação simplificada)
interface PermissionEditorProps {
  permissions: Record<string, string[]>
  onPermissionsChange: (permissions: Record<string, string[]>) => void
}

const PermissionEditor: React.FC<PermissionEditorProps> = ({ permissions, onPermissionsChange }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Editor de permissões completo seria implementado aqui.
        Por enquanto, as permissões são gerenciadas via JSON.
      </p>
      <textarea
        value={JSON.stringify(permissions, null, 2)}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value)
            onPermissionsChange(parsed)
          } catch (error) {
            // Ignore JSON inválido
          }
        }}
        rows={10}
        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
        placeholder="Permissões em formato JSON"
      />
    </div>
  )
}

// Modal de Confirmação de Exclusão
interface DeleteRoleModalProps {
  isOpen: boolean
  onClose: () => void
  role: Role
  onConfirm: () => Promise<void>
  isLoading: boolean
}

const DeleteRoleModal: React.FC<DeleteRoleModalProps> = ({
  isOpen,
  onClose,
  role,
  onConfirm,
  isLoading
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Deletar Papel
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Tem certeza que deseja deletar o papel "{role.display_name}"? 
                    Esta ação não pode ser desfeita e todos os usuários com este papel 
                    perderão suas permissões associadas.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <LoadingButton
              loading={isLoading}
              onClick={onConfirm}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Deletar
            </LoadingButton>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal de Atribuição de Usuários (implementação básica)
interface UserAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  role: Role
}

const UserAssignmentModal: React.FC<UserAssignmentModalProps> = ({ isOpen, onClose, role }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Gerenciar Usuários - {role.display_name}
            </h3>
            
            <div className="text-center py-8">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Interface de atribuição de usuários será implementada aqui.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Permitirá buscar usuários e atribuir/revogar este papel.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleManagement 