import React from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign,
  RefreshCw,
  Check, 
  X, 
  Loader2,
  AlertCircle
} from 'lucide-react'
import { createYampiAPI, type YampiConfig, type YampiProduct, type YampiOrder, type YampiCustomer } from '../services/yampiAPI'

export default function YampiTestLocal() {
  const [yampiConfig, setYampiConfig] = useState<YampiConfig>({
    merchantAlias: '',
    token: '',
    secretKey: '',
    apiKey: ''
  })
  
  const [yampiAPI, setYampiAPI] = useState<ReturnType<typeof createYampiAPI> | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle')
  const [connectionError, setConnectionError] = useState<string | null>(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<YampiProduct[]>([])
  const [orders, setOrders] = useState<YampiOrder[]>([])
  const [customers, setCustomers] = useState<YampiCustomer[]>([])
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0
  })

  const handleConnect = async () => {
    if (!yampiConfig.merchantAlias || !yampiConfig.token || !yampiConfig.secretKey) {
      alert('Por favor, preencha alias da loja, token e chave secreta')
      return
    }

    setConnectionStatus('testing')
    setConnectionError(null)
    
    try {
      const api = createYampiAPI(yampiConfig)
      const connectionTest = await api.testConnection()
      
      if (!connectionTest.success) {
        setConnectionStatus('error')
        setConnectionError(connectionTest.error || 'Falha na conexão')
        return
      }

      setYampiAPI(api)
      setConnectionStatus('connected')
      
      // Buscar dados iniciais
      await fetchDashboardData(api)
    } catch (error) {
      setConnectionStatus('error')
      setConnectionError(error instanceof Error ? error.message : 'Erro desconhecido')
    }
  }

  const fetchDashboardData = async (api?: ReturnType<typeof createYampiAPI>) => {
    const apiToUse = api || yampiAPI
    if (!apiToUse) return
    
    setIsLoading(true)
    
    try {
      // Buscar dados em paralelo
      const [productsResponse, ordersResponse, customersResponse] = await Promise.all([
        apiToUse.getProducts({ limit: 10, include: ['images', 'skus'] }),
        apiToUse.getOrders({ limit: 10, include: ['customer', 'items'] }),
        apiToUse.getCustomers({ limit: 10 })
      ])

      setProducts(productsResponse.data)
      setOrders(ordersResponse.data)
      setCustomers(customersResponse.data)

      // Calcular estatísticas
      setStats({
        totalProducts: productsResponse.meta?.pagination?.total || productsResponse.data.length,
        totalOrders: ordersResponse.meta?.pagination?.total || ordersResponse.data.length,
        totalCustomers: customersResponse.meta?.pagination?.total || customersResponse.data.length,
        totalRevenue: ordersResponse.data.reduce((sum, order) => sum + order.total, 0)
      })
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      alert('Falha ao carregar dados da Yampi')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600'
      case 'testing': return 'text-blue-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Check className="w-5 h-5" />
      case 'testing': return <Loader2 className="w-5 h-5 animate-spin" />
      case 'error': return <X className="w-5 h-5" />
      default: return <AlertCircle className="w-5 h-5" />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Conectado'
      case 'testing': return 'Testando...'
      case 'error': return 'Erro na conexão'
      default: return 'Não conectado'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          🛒 Teste Yampi API - Versão Local
        </h1>
        <p className="text-neutral-600 dark:text-gray-400 mt-2">
          Teste sua integração com a Yampi sem banco de dados
        </p>
      </div>

      {/* Configuração */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Configuração da API
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
              Alias da Loja *
            </label>
            <input
              type="text"
              value={yampiConfig.merchantAlias}
              onChange={(e) => setYampiConfig(prev => ({ ...prev, merchantAlias: e.target.value }))}
              placeholder="Ex: minha-loja"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
              Token de Acesso *
            </label>
            <input
              type="password"
              value={yampiConfig.token}
              onChange={(e) => setYampiConfig(prev => ({ ...prev, token: e.target.value }))}
              placeholder="Token da API"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
              Chave Secreta *
            </label>
            <input
              type="password"
              value={yampiConfig.secretKey}
              onChange={(e) => setYampiConfig(prev => ({ ...prev, secretKey: e.target.value }))}
              placeholder="User-Secret-Key"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
              API Key (Opcional)
            </label>
            <input
              type="password"
              value={yampiConfig.apiKey}
              onChange={(e) => setYampiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="Chave API adicional"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Status da Conexão */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          
          <button
            onClick={handleConnect}
            disabled={connectionStatus === 'testing' || !yampiConfig.merchantAlias || !yampiConfig.token || !yampiConfig.secretKey}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {connectionStatus === 'testing' ? 'Testando...' : 'Testar Conexão'}
          </button>
        </div>

        {connectionError && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                  Erro na Conexão
                </h4>
                <div className="text-sm text-red-600 dark:text-red-400 whitespace-pre-line">
                  {connectionError}
                </div>
                
                {connectionError.includes('403') && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                    <h5 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                      🔐 Erro 403 - Permissões Insuficientes
                    </h5>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
                      Suas credenciais estão corretas, mas sua conta não tem permissões para acessar a API.
                    </p>
                    <div className="text-xs text-amber-700 dark:text-amber-400">
                      <strong>Soluções:</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Verifique se sua conta Yampi tem plano que inclui API</li>
                        <li>Entre em contato com o suporte Yampi para habilitar acesso à API</li>
                        <li>Confirme se o token foi gerado com as permissões corretas</li>
                        <li>Tente regenerar o token e a chave secreta no painel</li>
                      </ol>
                    </div>
                  </div>
                )}
                
                {connectionError.includes('401') && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                    <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                      🔑 Erro 401 - Credenciais Inválidas
                    </h5>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Verifique se copiou corretamente o Token de Acesso e a Chave Secreta do painel Yampi.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instruções para obter credenciais */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          💡 Como obter suas credenciais Yampi:
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-neutral-600 dark:text-gray-400">
          <li>Acesse o painel da sua loja Yampi</li>
          <li>Vá em <strong>Configurações → Integrações → API</strong></li>
          <li>Copie o <strong>Token de Acesso</strong> (User-Token)</li>
          <li>Copie a <strong>Chave Secreta</strong> (User-Secret-Key)</li>
          <li>O <strong>alias da loja</strong> está na URL da sua loja Yampi</li>
        </ol>
      </div>

      {/* Informações sobre permissões */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          🔐 Requisitos de Permissões da API Yampi
        </h3>
        <div className="space-y-4 text-neutral-600 dark:text-gray-400">
          <div>
            <h4 className="font-medium text-neutral-900 dark:text-white mb-2">📋 Pré-requisitos:</h4>
            <ul className="space-y-1 text-sm">
              <li>• <strong>Plano Yampi</strong>: Verifique se seu plano inclui acesso à API</li>
              <li>• <strong>Permissões habilitadas</strong>: API deve estar ativa para sua conta</li>
              <li>• <strong>Credenciais válidas</strong>: Token e chave secreta atuais</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-neutral-900 dark:text-white mb-2">🚨 Se receber erro 403:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Verifique se sua conta tem plano que inclui API</li>
              <li>Entre em contato com o suporte Yampi</li>
              <li>Solicite habilitação de acesso à API</li>
              <li>Regenere suas credenciais no painel</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-medium text-neutral-900 dark:text-white mb-2">📞 Contato Yampi:</h4>
            <p className="text-sm">
              Se continuar com problemas de permissão, entre em contato com o suporte da Yampi 
              para verificar se sua conta tem acesso liberado à API.
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      {connectionStatus === 'connected' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700"
            >
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600 dark:text-gray-400">
                    Produtos
                  </p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {typeof stats.totalProducts === 'number' ? stats.totalProducts.toLocaleString('pt-BR') : '--'}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700"
            >
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600 dark:text-gray-400">
                    Pedidos
                  </p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {typeof stats.totalOrders === 'number' ? stats.totalOrders.toLocaleString('pt-BR') : '--'}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700"
            >
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600 dark:text-gray-400">
                    Clientes
                  </p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {typeof stats.totalCustomers === 'number' ? stats.totalCustomers.toLocaleString('pt-BR') : '--'}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700"
            >
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600 dark:text-gray-400">
                    Receita
                  </p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    R$ {typeof stats.totalRevenue === 'number' ? stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Dados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Produtos */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Produtos Recentes
                </h3>
                <button
                  onClick={() => fetchDashboardData()}
                  disabled={isLoading}
                  className="text-primary-600 hover:text-primary-500 text-sm font-medium flex items-center"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>
              
              <div className="space-y-3">
                {products.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-10 h-10 bg-neutral-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                      {product.images?.[0] ? (
                        <img 
                          src={product.images[0].url} 
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-neutral-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-gray-400">
                        R$ {typeof product.price === 'number' ? product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {product.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pedidos */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Pedidos Recentes
                </h3>
              </div>
              
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        Pedido #{order.number}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-gray-400">
                        {order.customer?.name || '--'} • {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : '--'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        R$ {typeof order.total === 'number' ? order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--'}
                      </p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sucesso */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              ✅ Sucesso! API funcionando perfeitamente
            </h3>
            <p className="text-neutral-600 dark:text-gray-400">
              Sua integração Yampi está funcionando corretamente. Para usar no sistema principal, você precisa configurar o banco de dados Supabase.
            </p>
          </div>
        </>
      )}
    </div>
  )
} 