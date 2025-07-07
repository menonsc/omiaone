import React, { useState } from 'react'
import { 
  BarChart3, 
  Activity, 
  AlertTriangle, 
  Users, 
  MessageSquare, 
  FileText, 
  Mail, 
  Clock,
  TrendingUp,
  AlertCircle,
  Download
} from 'lucide-react'
import { useAdminAnalytics } from '../hooks/useAnalyticsQueries'

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'alerts' | 'performance'>('dashboard')

  const { dashboardMetrics, isLoading, systemLogs } = useAdminAnalytics()

  // Métricas do dashboard
  const metrics = dashboardMetrics.data

  // Componente de métricas
  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = 'blue',
    subtitle 
  }: {
    title: string
    value: string | number
    icon: any
    trend?: string
    color?: string
    subtitle?: string
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/20`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-sm text-green-600 dark:text-green-400">{trend}</span>
        </div>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Administrativo</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitoramento completo do sistema, logs e métricas de performance
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Download className="h-4 w-4 inline mr-2" />
              Relatório
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'logs', label: 'Logs', icon: FileText },
              { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
              { id: 'performance', label: 'Performance', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Métricas principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Usuários Ativos"
                  value={metrics?.activeUsers || 0}
                  icon={Users}
                  color="blue"
                  subtitle="Últimos 30 dias"
                />
                <MetricCard
                  title="Mensagens WhatsApp"
                  value={metrics?.whatsappMessages || 0}
                  icon={MessageSquare}
                  color="green"
                  subtitle="Total enviadas"
                />
                <MetricCard
                  title="Interações IA"
                  value={metrics?.aiInteractions || 0}
                  icon={Activity}
                  color="purple"
                  subtitle="Conversas com agentes"
                />
                <MetricCard
                  title="Campanhas Email"
                  value={metrics?.campaignsSent || 0}
                  icon={Mail}
                  color="orange"
                  subtitle="Campanhas enviadas"
                />
              </div>

              {/* Métricas de performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Tempo de Carregamento"
                  value={`${Math.round(metrics?.avgPageLoadTime || 0)}ms`}
                  icon={Clock}
                  color="blue"
                  subtitle="Média das páginas"
                />
                <MetricCard
                  title="Tempo de API"
                  value={`${Math.round(metrics?.avgApiResponseTime || 0)}ms`}
                  icon={Activity}
                  color="green"
                  subtitle="Resposta média"
                />
                <MetricCard
                  title="Erros de API"
                  value={metrics?.apiErrors || 0}
                  icon={AlertTriangle}
                  color="red"
                  subtitle="Últimos 30 dias"
                />
                <MetricCard
                  title="Alertas do Sistema"
                  value={metrics?.systemErrors || 0}
                  icon={AlertCircle}
                  color="yellow"
                  subtitle="Alertas ativos"
                />
              </div>

              {/* Resumo adicional */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Atividade por Funcionalidade
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">WhatsApp</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {metrics?.whatsappMessages || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">IA</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {metrics?.aiInteractions || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Documentos</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {metrics?.documentsUploaded || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Email Marketing</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {metrics?.campaignsSent || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Resumo do Sistema
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total de Usuários</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {metrics?.totalUsers || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Novos Usuários</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {metrics?.newUsers || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total de Sessões</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {metrics?.totalSessions || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Visualizações</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {metrics?.totalPageViews || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Logs do Sistema
              </h3>
              {systemLogs.isLoading ? (
                <div className="text-center text-gray-500">Carregando logs...</div>
              ) : systemLogs.data && systemLogs.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left">
                    <thead>
                      <tr>
                        <th className="px-2 py-1">Data</th>
                        <th className="px-2 py-1">Nível</th>
                        <th className="px-2 py-1">Componente</th>
                        <th className="px-2 py-1">Ação</th>
                        <th className="px-2 py-1">Mensagem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemLogs.data.map((log: any) => (
                        <tr key={log.id} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="px-2 py-1 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="px-2 py-1">{log.log_level}</td>
                          <td className="px-2 py-1">{log.component}</td>
                          <td className="px-2 py-1">{log.action}</td>
                          <td className="px-2 py-1 max-w-xs truncate" title={log.message}>{log.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500">Nenhum log encontrado.</div>
              )}
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Alertas do Sistema
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Sistema de alertas em desenvolvimento
                </p>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Métricas de Performance
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Gráficos detalhados de performance em desenvolvimento
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics 