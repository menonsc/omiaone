import React, { useState } from 'react'
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe, 
  Mail, 
  MessageSquare, 
  Monitor, 
  RefreshCw, 
  Server, 
  Smartphone,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
  Link,
  Copy,
  Download,
  RotateCw,
  Bug,
  Settings
} from 'lucide-react'
import { EndpointStatus } from '../services/healthCheckService'
import { Spinner } from '../components/ui/feedback'
import { 
  useSystemHealth, 
  useSystemStats, 
  useEndpointsByCategory,
  useSystemHealthNotifications
} from '../hooks/useSystemHealth'
import { createYampiAPI } from '../services/yampiAPI'
import { supabase } from '../services/supabase'

const SystemStatus: React.FC = () => {
  const { 
    systemHealth, 
    isLoading, 
    isRefreshing, 
    error,
    refresh, 
    toggleAutoRefresh, 
    autoRefresh 
  } = useSystemHealth({ 
    autoRefresh: true, 
    refreshInterval: 30000,
    saveHistory: true
  })

  const stats = useSystemStats(systemHealth)
  const groupedEndpoints = useEndpointsByCategory(systemHealth)
  const notifications = useSystemHealthNotifications(systemHealth)
  const [showEndpointsList, setShowEndpointsList] = useState(false)
  const [showYampiDebug, setShowYampiDebug] = useState(false)
  const [yampiDebugData, setYampiDebugData] = useState<any>(null)
  const [isTestingYampi, setIsTestingYampi] = useState(false)

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500'
      case 'degraded': return 'text-yellow-500'
      case 'unhealthy': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getOverallStatusBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-50 border-green-200'
      case 'degraded': return 'bg-yellow-50 border-yellow-200'
      case 'unhealthy': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'degraded': return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'offline': return <WifiOff className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Site': return <Globe className="w-5 h-5" />
      case 'Aplicação': return <Monitor className="w-5 h-5" />
      case 'Trackeamento': return <TrendingUp className="w-5 h-5" />
      case 'WhatsApp': return <MessageSquare className="w-5 h-5" />
      case 'Inteligência Artificial': return <Zap className="w-5 h-5" />
      case 'Email': return <Mail className="w-5 h-5" />
      case 'Banco de Dados': return <Database className="w-5 h-5" />
      case 'E-commerce': return <Smartphone className="w-5 h-5" />
      case 'Servidor': return <Server className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'offline': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-50 border-green-200'
      case 'degraded': return 'bg-yellow-50 border-yellow-200'
      case 'offline': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const formatResponseTime = (time?: number) => {
    if (!time) return 'N/A'
    return `${time}ms`
  }

  const formatLastCheck = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const groupEndpointsByCategory = (endpoints: EndpointStatus[]) => {
    return endpoints.reduce((groups, endpoint) => {
      const category = endpoint.category
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(endpoint)
      return groups
    }, {} as Record<string, EndpointStatus[]>)
  }

  const getOverallStats = (endpoints: EndpointStatus[]) => {
    const total = endpoints.length
    const online = endpoints.filter(e => e.status === 'online').length
    const degraded = endpoints.filter(e => e.status === 'degraded').length
    const offline = endpoints.filter(e => e.status === 'offline').length
    const avgResponseTime = endpoints
      .filter(e => e.responseTime)
      .reduce((sum, e) => sum + (e.responseTime || 0), 0) / endpoints.filter(e => e.responseTime).length

    return { total, online, degraded, offline, avgResponseTime: Math.round(avgResponseTime) || 0 }
  }

  const getAllEndpoints = () => {
    const baseUrl = window.location.origin
    const apiUrl = import.meta.env.VITE_EVOLUTION_API_URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    
    return [
      // Site - Páginas Publicadas
      { name: 'Página Inicial', url: baseUrl, category: 'Site' },
      { name: 'Login', url: `${baseUrl}/login`, category: 'Site' },
      { name: 'Cadastro', url: `${baseUrl}/signup`, category: 'Site' },
      
      // API WhatsApp
      { name: 'Evolution API', url: apiUrl || 'Não configurado', category: 'API WhatsApp' },
      
      // API Banco de Dados
      { name: 'Supabase Database', url: supabaseUrl || 'Não configurado', category: 'Banco de Dados' },
      
      // APIs Externas (teste de conectividade)
      { name: 'Google Gemini AI', url: 'https://generativelanguage.googleapis.com/v1beta/models', category: 'IA' },
      { name: 'Mailgun API', url: 'https://api.mailgun.net/v3', category: 'Email' },
      
      // Páginas da Aplicação (internas - para monitoramento de disponibilidade)
      { name: 'Dashboard', url: `${baseUrl}/dashboard`, category: 'Aplicação' },
      { name: 'Chat IA', url: `${baseUrl}/chat`, category: 'Aplicação' },
      { name: 'WhatsApp', url: `${baseUrl}/whatsapp`, category: 'Aplicação' },
      { name: 'Analytics', url: `${baseUrl}/analytics`, category: 'Aplicação' },
      { name: 'Configurações', url: `${baseUrl}/settings`, category: 'Aplicação' },
    ]
  }

  const copyEndpointsToClipboard = async () => {
    const endpoints = getAllEndpoints()
    const text = endpoints
      .filter(endpoint => endpoint.url !== 'Não configurado')
      .map(endpoint => `${endpoint.name}: ${endpoint.url}`)
      .join('\n')
    
    try {
      await navigator.clipboard.writeText(text)
      // Aqui você pode adicionar uma mensagem de sucesso
      console.log('Endpoints copiados para a área de transferência!')
    } catch (err) {
      console.error('Erro ao copiar endpoints:', err)
    }
  }

  const exportEndpointsAsJSON = () => {
    const endpoints = getAllEndpoints()
    const validEndpoints = endpoints.filter(endpoint => endpoint.url !== 'Não configurado')
    
    const dataStr = JSON.stringify(validEndpoints, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = 'endpoints-monitoramento.json'
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const testYampiConnection = async () => {
    setIsTestingYampi(true)
    setYampiDebugData(null)
    
    try {
      const debugInfo: any = {
        timestamp: new Date().toISOString(),
        configs: {},
        test: null,
        error: null
      }

      // 1. PRIMEIRO: Buscar configuração no banco de dados (store de integrações)
      const sources: Array<{ name: string; getter: () => string | null | Promise<string | null> }> = [
        { 
          name: 'database (integrations table)', 
          getter: async (): Promise<string | null> => {
            try {
              const { data: integrations, error } = await supabase
                .from('integrations')
                .select('*')
                .eq('name', 'yampi')
                .eq('status', 'active')
                .single()

              if (!error && integrations?.credentials) {
                const creds = integrations.credentials
                if (creds.merchantAlias && creds.token) {
                  return JSON.stringify({
                    merchantAlias: creds.merchantAlias,
                    token: creds.token,
                    secretKey: creds.secretKey,
                    apiKey: creds.apiKey
                  })
                }
              }
              return null
            } catch (dbError) {
              console.warn('Erro ao buscar no banco:', dbError)
              return null
            }
          }
        },
        { name: 'localStorage yampi-config', getter: (): string | null => localStorage.getItem('yampi-config') },
        { name: 'sessionStorage yampi-config', getter: (): string | null => sessionStorage.getItem('yampi-config') },
        { name: 'localStorage integrations-store', getter: (): string | null => {
          const state = localStorage.getItem('integrations-store')
          if (state) {
            const parsed = JSON.parse(state)
            const yampiIntegration = parsed?.state?.integrations?.find((i: any) => i.name === 'yampi')
            return yampiIntegration?.config ? JSON.stringify(yampiIntegration.config) : null
          }
          return null
        }}
      ]

      for (const source of sources) {
        try {
          const config = await source.getter()
          
          debugInfo.configs[source.name] = {
            found: !!config,
            data: config ? JSON.parse(config) : null,
            valid: config ? (JSON.parse(config).merchantAlias && JSON.parse(config).token) : false
          }
        } catch (e) {
          debugInfo.configs[source.name] = {
            found: false,
            error: e instanceof Error ? e.message : 'Erro desconhecido'
          }
        }
      }

      // 2. Encontrar primeira configuração válida
      let validConfig = null
      let configSource = ''
      
      for (const [sourceName, sourceData] of Object.entries(debugInfo.configs)) {
        if ((sourceData as any).valid) {
          validConfig = (sourceData as any).data
          configSource = sourceName
          break
        }
      }

      if (validConfig) {
        // 3. Testar conexão
        try {
          const yampiAPI = createYampiAPI(validConfig)
          const testResult = await yampiAPI.testConnection()
          
          debugInfo.test = {
            configUsed: configSource,
            config: {
              merchantAlias: validConfig.merchantAlias,
              hasToken: !!validConfig.token,
              hasSecretKey: !!validConfig.secretKey,
              hasApiKey: !!validConfig.apiKey
            },
            result: testResult
          }
        } catch (testError) {
          debugInfo.test = {
            configUsed: configSource,
            error: testError instanceof Error ? testError.message : 'Erro no teste'
          }
        }
      } else {
        debugInfo.error = 'Nenhuma configuração válida encontrada'
      }

      setYampiDebugData(debugInfo)
    } catch (error) {
      setYampiDebugData({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsTestingYampi(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Verificando status do sistema...</p>
        </div>
      </div>
    )
  }

  if (!systemHealth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar status</h2>
          <p className="text-gray-600 mb-4">Não foi possível verificar o status do sistema</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Status do Sistema</h1>
              <p className="text-gray-600 mt-2">
                Monitoramento em tempo real de todos os serviços e APIs
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Atualização automática
                </label>
                <button
                  onClick={toggleAutoRefresh}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <button
                onClick={() => setShowEndpointsList(!showEndpointsList)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Link className="w-4 h-4" />
                <span>Endpoints</span>
              </button>
              <button
                onClick={() => setShowYampiDebug(!showYampiDebug)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <Bug className="w-4 h-4" />
                <span>Debug Yampi</span>
              </button>
              <button
                onClick={refresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Endpoints para Uptime Kuma */}
        {showEndpointsList && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Endpoints para Monitoramento Externo
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={copyEndpointsToClipboard}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </button>
                <button
                  onClick={exportEndpointsAsJSON}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                >
                  <Download className="w-3 h-3" />
                  <span>JSON</span>
                </button>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Lista de todos os endpoints monitorados. Use estes URLs no Uptime Kuma ou outras ferramentas de monitoramento:
            </p>
            
            <div className="space-y-4">
              {Object.entries(
                getAllEndpoints()
                  .filter(endpoint => endpoint.url !== 'Não configurado')
                  .reduce((acc, endpoint) => {
                    if (!acc[endpoint.category]) {
                      acc[endpoint.category] = []
                    }
                    acc[endpoint.category].push(endpoint)
                    return acc
                  }, {} as Record<string, Array<{ name: string; url: string; category: string }>>)
              ).map(([category, endpoints]) => (
                <div key={category} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{category}</h3>
                  <div className="space-y-2">
                    {endpoints.map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{endpoint.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border text-gray-700 dark:text-gray-300">
                            {endpoint.url}
                          </code>
                          <button
                            onClick={() => navigator.clipboard.writeText(endpoint.url)}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            title="Copiar URL"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    Configuração no Uptime Kuma:
                  </p>
                  <ul className="text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Use método HTTP/HTTPS para páginas web</li>
                    <li>• Para APIs, configure o método GET com headers apropriados</li>
                    <li>• Interval recomendado: 60-120 segundos</li>
                    <li>• Timeout: 10-30 segundos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Yampi */}
        {showYampiDebug && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Bug className="w-5 h-5 text-orange-600" />
                <span>Debug - API Yampi</span>
              </h2>
              <button
                onClick={testYampiConnection}
                disabled={isTestingYampi}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {isTestingYampi ? (
                  <Spinner size="sm" />
                ) : (
                  <Settings className="w-4 h-4" />
                )}
                <span>{isTestingYampi ? 'Testando...' : 'Testar Conexão'}</span>
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Esta ferramenta verifica todas as possíveis configurações do Yampi e testa a conexão com a API.
            </p>
            
            {yampiDebugData && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Configurações Encontradas:</h3>
                  <div className="space-y-3">
                    {Object.entries(yampiDebugData.configs || {}).map(([source, data]: [string, any]) => (
                      <div key={source} className="border border-gray-200 dark:border-gray-600 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{source}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            data.found 
                              ? data.valid 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {data.found ? (data.valid ? 'Válida' : 'Incompleta') : 'Não Encontrada'}
                          </span>
                        </div>
                        {data.data && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p><strong>Merchant Alias:</strong> {data.data.merchantAlias || 'N/A'}</p>
                            <p><strong>Token:</strong> {data.data.token ? '✓ Presente' : '✗ Ausente'}</p>
                            <p><strong>Secret Key:</strong> {data.data.secretKey ? '✓ Presente' : '✗ Ausente'}</p>
                            <p><strong>API Key:</strong> {data.data.apiKey ? '✓ Presente' : '✗ Ausente'}</p>
                          </div>
                        )}
                        {data.error && (
                          <div className="text-sm text-red-600 dark:text-red-400">
                            <strong>Erro:</strong> {data.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {yampiDebugData.test && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Resultado do Teste:</h3>
                    <div className="text-sm space-y-2">
                      <p><strong>Configuração Usada:</strong> {yampiDebugData.test.configUsed}</p>
                      {yampiDebugData.test.result && (
                        <>
                          <p className={`font-medium ${yampiDebugData.test.result.success ? 'text-green-600' : 'text-red-600'}`}>
                            <strong>Status:</strong> {yampiDebugData.test.result.success ? '✅ Sucesso' : '❌ Falha'}
                          </p>
                          {yampiDebugData.test.result.store_name && (
                            <p><strong>Nome da Loja:</strong> {yampiDebugData.test.result.store_name}</p>
                          )}
                          {yampiDebugData.test.result.merchant_alias && (
                            <p><strong>Merchant Alias:</strong> {yampiDebugData.test.result.merchant_alias}</p>
                          )}
                          {yampiDebugData.test.result.error && (
                            <p className="text-red-600"><strong>Erro:</strong> {yampiDebugData.test.result.error}</p>
                          )}
                        </>
                      )}
                      {yampiDebugData.test.error && (
                        <p className="text-red-600"><strong>Erro no Teste:</strong> {yampiDebugData.test.error}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {yampiDebugData.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <h3 className="font-medium text-red-900 dark:text-red-200 mb-2">Erro Geral:</h3>
                    <p className="text-sm text-red-700 dark:text-red-300">{yampiDebugData.error}</p>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  <strong>Timestamp:</strong> {yampiDebugData.timestamp}
                </div>
              </div>
            )}
            
            {!yampiDebugData && !isTestingYampi && (
              <div className="text-center py-8 text-gray-500">
                Clique em "Testar Conexão" para executar o diagnóstico completo da API Yampi
              </div>
            )}
          </div>
        )}

        {/* Status Geral */}
        <div className={`rounded-xl border-2 p-6 mb-8 ${getOverallStatusBg(systemHealth.overall)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${systemHealth.overall === 'healthy' ? 'bg-green-100' : systemHealth.overall === 'degraded' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                {systemHealth.overall === 'healthy' ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : systemHealth.overall === 'degraded' ? (
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                ) : (
                  <WifiOff className="w-8 h-8 text-red-600" />
                )}
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${getOverallStatusColor(systemHealth.overall)}`}>
                  {systemHealth.overall === 'healthy' ? 'Todos os sistemas operacionais' :
                   systemHealth.overall === 'degraded' ? 'Alguns serviços com problemas' :
                   'Múltiplos serviços fora do ar'}
                </h2>
                <p className="text-gray-600">
                  Última verificação: {formatLastCheck(systemHealth.lastUpdate)}
                </p>
              </div>
            </div>
            
            {/* Estatísticas */}
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.onlineEndpoints}</div>
                <div className="text-sm text-gray-600">Online</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.degradedEndpoints}</div>
                <div className="text-sm text-gray-600">Degradado</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.offlineEndpoints}</div>
                <div className="text-sm text-gray-600">Offline</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{Math.round(stats.averageResponseTime)}ms</div>
                <div className="text-sm text-gray-600">Resposta Média</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Categorias */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(groupedEndpoints).map(([category, endpoints]) => (
            <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    {getCategoryIcon(category)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                    <p className="text-sm text-gray-600">
                      {endpoints.filter(e => e.status === 'online').length}/{endpoints.length} serviços online
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {endpoints.map((endpoint) => (
                  <div key={endpoint.id} className={`rounded-lg border p-4 ${getStatusBg(endpoint.status)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(endpoint.status)}
                        <span className="font-medium text-gray-900">{endpoint.name}</span>
                      </div>
                      <span className={`text-sm font-medium ${getStatusColor(endpoint.status)}`}>
                        {endpoint.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Tempo de resposta:</span>
                        <span className="font-medium">{formatResponseTime(endpoint.responseTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Última verificação:</span>
                        <span className="font-medium">{formatLastCheck(endpoint.lastCheck)}</span>
                      </div>
                      {endpoint.url && (
                        <div className="flex justify-between">
                          <span>URL:</span>
                          <span className="font-medium truncate max-w-40" title={endpoint.url}>
                            {endpoint.url}
                          </span>
                        </div>
                      )}
                      {endpoint.error && (
                        <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs">
                          <strong>Erro:</strong> {endpoint.error}
                        </div>
                      )}
                      {endpoint.details && Object.keys(endpoint.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            Detalhes técnicos
                          </summary>
                          <div className="mt-1 p-2 bg-gray-100 rounded text-xs">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(endpoint.details, null, 2)}
                            </pre>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer com informações adicionais */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Sistema de monitoramento atualizado a cada 30 segundos • 
            Total de {systemHealth.endpoints.length} endpoints monitorados
          </p>
        </div>
      </div>
    </div>
  )
}

export default SystemStatus 