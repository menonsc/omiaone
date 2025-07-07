import React from 'react'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Shield,
  Activity
} from 'lucide-react'
import { useUserStats } from '../hooks/useUserManagement'
import { Skeleton } from './ui/feedback'

const UserStats: React.FC = () => {
  const { data: stats, isLoading, error } = useUserStats()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border">
            <Skeleton className="w-16 h-4 mb-2" />
            <Skeleton className="w-12 h-8" />
          </div>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">Erro ao carregar estatísticas</span>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats.total_users,
      icon: Users,
      color: 'blue',
      description: 'Usuários cadastrados no sistema'
    },
    {
      title: 'Usuários Ativos',
      value: stats.active_users,
      icon: UserCheck,
      color: 'green',
      description: 'Usuários com status ativo'
    },
    {
      title: 'Usuários Inativos',
      value: stats.inactive_users,
      icon: UserX,
      color: 'red',
      description: 'Usuários com status inativo'
    },
    {
      title: 'Novos Hoje',
      value: stats.new_users_today,
      icon: TrendingUp,
      color: 'purple',
      description: 'Usuários cadastrados hoje'
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'green':
        return 'bg-green-50 text-green-600 border-green-200'
      case 'red':
        return 'bg-red-50 text-red-600 border-red-200'
      case 'purple':
        return 'bg-purple-50 text-purple-600 border-purple-200'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`p-2 rounded-lg border ${getColorClasses(stat.color)}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Distribuição por Role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>Distribuição por Role</span>
          </h3>
          <div className="space-y-3">
            {stats.users_by_role && Object.entries(stats.users_by_role).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {role.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição por Status */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-green-600" />
            <span>Distribuição por Status</span>
          </h3>
          <div className="space-y-3">
            {stats.users_by_status && Object.entries(stats.users_by_status).map(([status, count]) => {
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'active': return 'bg-green-500'
                  case 'inactive': return 'bg-red-500'
                  case 'pending': return 'bg-yellow-500'
                  case 'suspended': return 'bg-orange-500'
                  default: return 'bg-gray-500'
                }
              }
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {status}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Estatísticas Adicionais */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-purple-600" />
          <span>Estatísticas de Crescimento</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats.new_users_this_week}</p>
            <p className="text-sm text-purple-700">Esta Semana</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.new_users_this_month}</p>
            <p className="text-sm text-blue-700">Este Mês</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.pending_users}</p>
            <p className="text-sm text-green-700">Pendentes</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserStats 