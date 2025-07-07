import React from 'react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  DollarSign,
  RefreshCw,
  Calendar,
  Eye,
  ExternalLink
} from 'lucide-react'
import { useIntegrationsStore } from '../store/integrationsStore'
import { useUIStore } from '../store/uiStore'
import type { YampiProduct, YampiOrder, YampiCustomer } from '../services/yampiAPI'

export default function YampiDashboard() {
  const { yampiAPI, getIntegration } = useIntegrationsStore()
  const { addNotification } = useUIStore()
  
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

  const yampiIntegration = getIntegration('yampi')

  useEffect(() => {
    if (yampiAPI) {
      fetchDashboardData()
    }
  }, [yampiAPI])

  const fetchDashboardData = async () => {
    if (!yampiAPI) return
    
    setIsLoading(true)
    
    try {
      // Buscar produtos, pedidos e clientes em paralelo
      const [productsResponse, ordersResponse, customersResponse] = await Promise.all([
        yampiAPI.getProducts({ limit: 10, include: ['images', 'skus'] }),
        yampiAPI.getOrders({ limit: 10, include: ['customer', 'items'] }),
        yampiAPI.getCustomers({ limit: 10 })
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
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao carregar dados da Yampi'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!yampiIntegration || yampiIntegration.status !== 'active') {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-8">
          <ShoppingCart className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            Integração Yampi não configurada
          </h2>
          <p className="text-neutral-600 dark:text-gray-400 mb-4">
            Configure sua integração com a Yampi nas configurações para visualizar o dashboard.
          </p>
          <button
            onClick={() => window.location.href = '/settings'}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
          >
            Ir para Configurações
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Dashboard Yampi
          </h1>
          <p className="text-neutral-600 dark:text-gray-400 mt-1">
            Visão geral da sua loja: {yampiIntegration.config.store_name || yampiIntegration.credentials.merchantAlias}
          </p>
        </div>
        
        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

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
                {stats.totalProducts.toLocaleString('pt-BR')}
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
                {stats.totalOrders.toLocaleString('pt-BR')}
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
                {stats.totalCustomers.toLocaleString('pt-BR')}
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
                Receita Total
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos Recentes */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Produtos Recentes
            </h3>
            <button className="text-primary-600 hover:text-primary-500 text-sm font-medium flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              Ver todos
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
                    R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
        </motion.div>

        {/* Pedidos Recentes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Pedidos Recentes
            </h3>
            <button className="text-primary-600 hover:text-primary-500 text-sm font-medium flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              Ver todos
            </button>
          </div>
          
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    Pedido #{order.number}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-gray-400">
                    {order.customer.name} • {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
        </motion.div>
      </div>

      {/* Link para Yampi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Acesse sua loja Yampi
            </h3>
            <p className="text-neutral-600 dark:text-gray-400">
              Gerencie produtos, pedidos e configurações diretamente no painel da Yampi
            </p>
          </div>
          <a
            href={`https://${yampiIntegration.credentials.merchantAlias}.yampi.io/admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors flex items-center"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Yampi
          </a>
        </div>
      </motion.div>
    </div>
  )
} 