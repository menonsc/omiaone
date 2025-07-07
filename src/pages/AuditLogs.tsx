import React, { useState, useMemo } from 'react'
import { 
  useAuditDashboard, 
  useAuditLogs, 
  useAuditFilters,
  useCreateAuditExport,
  useAuditExports
} from '../hooks/useAuditQueries'
import { AuditFilters } from '../services/auditService'
import { PermissionGuard } from '../components/PermissionGuard'
import { 
  Shield, 
  Activity, 
  Users, 
  AlertTriangle, 
  Download, 
  Filter, 
  Search,
  Calendar,
  Eye,
  FileText,
  Settings,
  BarChart3,
  RefreshCw
} from 'lucide-react'

const AuditLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'alerts' | 'config' | 'exports'>('dashboard')
  const [filters, setFilters] = useState<AuditFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const dashboard = useAuditDashboard()
  const logs = useAuditLogs(filters)
  const filtersData = useAuditFilters()
  const createExport = useCreateAuditExport()
  const exports = useAuditExports()

  // Filtros aplicados
  const appliedFilters = useMemo(() => {
    const applied: string[] = []
    if (filters.user_id) applied.push(`Usuário: ${filters.user_id}`)
    if (filters.action) applied.push(`Ação: ${filters.action}`)
    if (filters.resource) applied.push(`Recurso: ${filters.resource}`)
    if (filters.severity) applied.push(`Severidade: ${filters.severity}`)
    if (filters.date_from) applied.push(`De: ${new Date(filters.date_from).toLocaleDateString()}`)
    if (filters.date_to) applied.push(`Até: ${new Date(filters.date_to).toLocaleDateString()}`)
    if (filters.ip_address) applied.push(`IP: ${filters.ip_address}`)
    return applied
  }, [filters])

  const handleFilterChange = (key: keyof AuditFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
  }

  const handleExport = async (type: 'csv' | 'pdf' | 'json') => {
    try {
      await createExport.mutateAsync({
        export_type: type,
        filters
      })
    } catch (error) {
      console.error('Erro ao criar exportação:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'error': return 'text-red-600 bg-red-50'
      case 'warn': return 'text-yellow-600 bg-yellow-50'
      case 'info': return 'text-blue-600 bg-blue-50'
      case 'debug': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return <Shield className="w-4 h-4" />
    if (action.includes('create')) return <FileText className="w-4 h-4" />
    if (action.includes('update')) return <Settings className="w-4 h-4" />
    if (action.includes('delete')) return <AlertTriangle className="w-4 h-4" />
    if (action.includes('access')) return <Eye className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  return (
    <PermissionGuard resource="audit" action="read">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Auditoria</h1>
            <p className="text-gray-600">Monitoramento e logs de atividades do sistema</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => logs.refetch()}
              disabled={logs.isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className={`w-4 h-4 ${logs.isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'logs', label: 'Logs', icon: FileText },
              { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
              { id: 'config', label: 'Configurações', icon: Settings },
              { id: 'exports', label: 'Exportações', icon: Download }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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

        {/* Filtros */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Limpar filtros
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar em logs..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ação
                </label>
                <select
                  value={filters.action || ''}
                  onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as ações</option>
                  {filtersData.data?.actions?.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recurso
                </label>
                <select
                  value={filters.resource || ''}
                  onChange={(e) => handleFilterChange('resource', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os recursos</option>
                  {filtersData.data?.resources?.map(resource => (
                    <option key={resource} value={resource}>{resource}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severidade
                </label>
                <select
                  value={filters.severity || ''}
                  onChange={(e) => handleFilterChange('severity', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as severidades</option>
                  {filtersData.data?.severities?.map(severity => (
                    <option key={severity} value={severity}>{severity}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de
                </label>
                <input
                  type="date"
                  value={filters.date_from ? new Date(filters.date_from).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data até
                </label>
                <input
                  type="date"
                  value={filters.date_to ? new Date(filters.date_to).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {appliedFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {appliedFilters.map((filter, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {filter}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conteúdo das Tabs */}
        {activeTab === 'dashboard' && (
          <DashboardTab dashboard={dashboard} />
        )}
        
        {activeTab === 'logs' && (
          <LogsTab 
            logs={logs} 
            searchTerm={searchTerm}
            onExport={handleExport}
            getSeverityColor={getSeverityColor}
            getActionIcon={getActionIcon}
          />
        )}
        
        {activeTab === 'alerts' && (
          <AlertsTab alerts={dashboard.alerts} />
        )}
        
        {activeTab === 'config' && (
          <ConfigTab config={filtersData.data?.config} />
        )}
        
        {activeTab === 'exports' && (
          <ExportsTab exports={exports} />
        )}
      </div>
    </PermissionGuard>
  )
}

// Componente do Dashboard
const DashboardTab: React.FC<{ dashboard: any }> = ({ dashboard }) => {
  if (dashboard.isLoading) {
    return <div className="text-center py-8">Carregando dashboard...</div>
  }

  if (dashboard.error) {
    return <div className="text-center py-8 text-red-600">Erro ao carregar dashboard</div>
  }

  const stats = dashboard.stats
  const recentLogs = dashboard.recentLogs || []

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Logs</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_logs || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuários Únicos</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.unique_users || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ações Críticas</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.critical_actions || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">IPs Únicos</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.unique_ips || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Recentes */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Logs Recentes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentLogs.map((log: any) => (
            <div key={log.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(log.severity)}`}>
                    {log.severity}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{log.action}</span>
                  <span className="text-sm text-gray-500">em {log.resource}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
              {log.user_name && (
                <p className="text-sm text-gray-600 mt-1">
                  Por: {log.user_name} ({log.user_email})
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente dos Logs
const LogsTab: React.FC<{ 
  logs: any
  searchTerm: string
  onExport: (type: 'csv' | 'pdf' | 'json') => void
  getSeverityColor: (severity: string) => string
  getActionIcon: (action: string) => React.ReactNode
}> = ({ logs, searchTerm, onExport, getSeverityColor, getActionIcon }) => {
  const filteredLogs = logs.data?.filter((log: any) => {
    if (!searchTerm) return true
    return (
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.includes(searchTerm)
    )
  }) || []

  if (logs.isLoading) {
    return <div className="text-center py-8">Carregando logs...</div>
  }

  return (
    <div className="space-y-4">
      {/* Ações */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {filteredLogs.length} logs encontrados
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onExport('csv')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="w-4 h-4 inline mr-2" />
            CSV
          </button>
          <button
            onClick={() => onExport('pdf')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="w-4 h-4 inline mr-2" />
            PDF
          </button>
          <button
            onClick={() => onExport('json')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="w-4 h-4 inline mr-2" />
            JSON
          </button>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recurso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getActionIcon(log.action)}
                      <span className="text-sm font-medium text-gray-900">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.resource}
                    {log.resource_id && (
                      <span className="text-gray-500 ml-1">({log.resource_id})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.user_name ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                        <div className="text-sm text-gray-500">{log.user_email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Sistema</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.ip_address || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Componente dos Alertas
const AlertsTab: React.FC<{ alerts: any }> = ({ alerts }) => {
  if (!alerts) {
    return <div className="text-center py-8">Nenhum alerta configurado</div>
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Alertas de Auditoria</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {alerts.map((alert: any) => (
            <div key={alert.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                  <p className="text-sm text-gray-600">{alert.description}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {alert.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente de Configurações
const ConfigTab: React.FC<{ config: any }> = ({ config }) => {
  if (!config) {
    return <div className="text-center py-8">Carregando configurações...</div>
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Configurações de Auditoria</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {config.map((item: any) => (
            <div key={item.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{item.resource_name}</h4>
                  <p className="text-sm text-gray-600">
                    Retenção: {item.retention_days} dias | 
                    Nível: {item.log_level} | 
                    Rastrear mudanças: {item.track_changes ? 'Sim' : 'Não'}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  item.is_audited ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {item.is_audited ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente de Exportações
const ExportsTab: React.FC<{ exports: any }> = ({ exports }) => {
  if (exports.isLoading) {
    return <div className="text-center py-8">Carregando exportações...</div>
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Exportações</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {exports.data?.map((exp: any) => (
            <div key={exp.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Exportação {exp.export_type.toUpperCase()}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Criada em: {new Date(exp.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  exp.status === 'completed' ? 'bg-green-100 text-green-800' :
                  exp.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  exp.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {exp.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AuditLogs 