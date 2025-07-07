import React, { useState, useEffect } from 'react'
import { X, Save, User, Mail, Shield, Calendar } from 'lucide-react'
import { User as UserType, UserUpdateData } from '../types/userManagement'
import { LoadingButton, StatusBadge } from './ui/feedback'

interface UserEditModalProps {
  user: UserType
  isOpen: boolean
  onClose: () => void
  onSave: (userId: string, updates: UserUpdateData) => Promise<void>
  isLoading?: boolean
}

const UserEditModal: React.FC<UserEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<UserUpdateData>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        full_name: user.full_name,
        role: user.role,
        status: user.status
      })
      setErrors({})
    }
  }, [user, isOpen])

  const handleInputChange = (field: keyof UserUpdateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'Nome é obrigatório'
    }

    if (!formData.role) {
      newErrors.role = 'Role é obrigatório'
    }

    if (!formData.status) {
      newErrors.status = 'Status é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSave(user.id, formData)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Editar Usuário</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.full_name || ''}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.full_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Digite o nome completo"
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
            )}
          </div>

          {/* Email (somente leitura) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-900">{user.email}</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">Email não pode ser alterado</p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role || user.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.role ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="user">Usuário</option>
              <option value="moderator">Moderador</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
            <div className="mt-1">
              <StatusBadge
                status={getRoleColor(formData.role || user.role)}
                text={(formData.role || user.role).replace('_', ' ')}
                size="sm"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status || user.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.status ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="pending">Pendente</option>
              <option value="suspended">Suspenso</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status}</p>
            )}
            <div className="mt-1">
              <StatusBadge
                status={getStatusColor(formData.status || user.status)}
                text={formData.status || user.status}
                size="sm"
              />
            </div>
          </div>

          {/* Informações do Sistema */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Informações do Sistema</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Cadastro:</span>
                <p className="font-medium">{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <span className="text-gray-500">Último Acesso:</span>
                <p className="font-medium">
                  {user.last_access 
                    ? new Date(user.last_access).toLocaleDateString('pt-BR')
                    : 'Nunca'
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-500">Logins:</span>
                <p className="font-medium">{user.login_count || 0}</p>
              </div>
              <div>
                <span className="text-gray-500">Email Verificado:</span>
                <p className="font-medium">{user.is_email_verified ? 'Sim' : 'Não'}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <LoadingButton
              type="submit"
              loading={isLoading}
              size="sm"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserEditModal 