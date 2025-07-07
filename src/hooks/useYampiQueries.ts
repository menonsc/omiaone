import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createYampiAPI, YampiConfig } from '../services/yampiAPI'

// Query Keys
export const yampiKeys = {
  all: ['yampi'] as const,
  connection: (config: YampiConfig) => [...yampiKeys.all, 'connection', config.merchantAlias] as const,
  products: (config: YampiConfig, params?: any) => 
    [...yampiKeys.all, 'products', config.merchantAlias, params] as const,
  product: (config: YampiConfig, id: number) => 
    [...yampiKeys.all, 'product', config.merchantAlias, id] as const,
  orders: (config: YampiConfig, params?: any) => 
    [...yampiKeys.all, 'orders', config.merchantAlias, params] as const,
  order: (config: YampiConfig, id: number) => 
    [...yampiKeys.all, 'order', config.merchantAlias, id] as const,
  customers: (config: YampiConfig, params?: any) => 
    [...yampiKeys.all, 'customers', config.merchantAlias, params] as const,
  customer: (config: YampiConfig, id: number) => 
    [...yampiKeys.all, 'customer', config.merchantAlias, id] as const,
  categories: (config: YampiConfig, params?: any) => 
    [...yampiKeys.all, 'categories', config.merchantAlias, params] as const,
  dashboard: (config: YampiConfig) => 
    [...yampiKeys.all, 'dashboard', config.merchantAlias] as const,
}

// Hook para Teste de Conexão
export const useYampiConnection = (config: YampiConfig) => {
  return useQuery({
    queryKey: yampiKeys.connection(config),
    queryFn: async () => {
      const api = createYampiAPI(config)
      return api.testConnection()
    },
    enabled: !!config.merchantAlias && !!config.token,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  })
}

// Hook para Produtos
export const useYampiProducts = (config: YampiConfig, params?: {
  page?: number
  limit?: number
  include?: string[]
  search?: string
  category_id?: number
  status?: 'active' | 'inactive'
}) => {
  return useQuery({
    queryKey: yampiKeys.products(config, params),
    queryFn: async () => {
      const api = createYampiAPI(config)
      return api.getProducts(params)
    },
    enabled: !!config.merchantAlias && !!config.token,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para Produto Específico
export const useYampiProduct = (config: YampiConfig, productId: number, include?: string[]) => {
  return useQuery({
    queryKey: yampiKeys.product(config, productId),
    queryFn: async () => {
      const api = createYampiAPI(config)
      return api.getProduct(productId, include)
    },
    enabled: !!config.merchantAlias && !!config.token && !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para Pedidos
export const useYampiOrders = (config: YampiConfig, params?: {
  page?: number
  limit?: number
  include?: string[]
  status?: string
  payment_status?: string
  date_from?: string
  date_to?: string
}) => {
  return useQuery({
    queryKey: yampiKeys.orders(config, params),
    queryFn: async () => {
      const api = createYampiAPI(config)
      return api.getOrders(params)
    },
    enabled: !!config.merchantAlias && !!config.token,
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  })
}

// Hook para Pedido Específico
export const useYampiOrder = (config: YampiConfig, orderId: number, include?: string[]) => {
  return useQuery({
    queryKey: yampiKeys.order(config, orderId),
    queryFn: async () => {
      const api = createYampiAPI(config)
      return api.getOrder(orderId, include)
    },
    enabled: !!config.merchantAlias && !!config.token && !!orderId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

// Hook para Clientes
export const useYampiCustomers = (config: YampiConfig, params?: {
  page?: number
  limit?: number
  search?: string
}) => {
  return useQuery({
    queryKey: yampiKeys.customers(config, params),
    queryFn: async () => {
      const api = createYampiAPI(config)
      return api.getCustomers(params)
    },
    enabled: !!config.merchantAlias && !!config.token,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // 10 minutos
  })
}

// Hook para Cliente Específico
export const useYampiCustomer = (config: YampiConfig, customerId: number) => {
  return useQuery({
    queryKey: yampiKeys.customer(config, customerId),
    queryFn: async () => {
      const api = createYampiAPI(config)
      return api.getCustomer(customerId)
    },
    enabled: !!config.merchantAlias && !!config.token && !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para Categorias
export const useYampiCategories = (config: YampiConfig, params?: {
  page?: number
  limit?: number
  parent_id?: number
}) => {
  return useQuery({
    queryKey: yampiKeys.categories(config, params),
    queryFn: async () => {
      const api = createYampiAPI(config)
      return api.getCategories(params)
    },
    enabled: !!config.merchantAlias && !!config.token,
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchInterval: 30 * 60 * 1000, // 30 minutos
  })
}

// Hook para Dashboard (métricas)
export const useYampiDashboard = (config: YampiConfig) => {
  return useQuery({
    queryKey: yampiKeys.dashboard(config),
    queryFn: async () => {
      const api = createYampiAPI(config)
      
      // Buscar dados em paralelo
      const [products, orders, customers] = await Promise.all([
        api.getProducts({ limit: 1 }),
        api.getOrders({ limit: 1 }),
        api.getCustomers({ limit: 1 })
      ])

      // Calcular receita total dos pedidos
      const ordersResponse = await api.getOrders({ 
        limit: 1000, 
        status: 'completed',
        include: ['customer']
      })

      const totalRevenue = ordersResponse.data.reduce((sum: number, order: any) => {
        return sum + (order.total || 0)
      }, 0)

      return {
        totalProducts: products.meta?.pagination?.total || 0,
        totalOrders: orders.meta?.pagination?.total || 0,
        totalCustomers: customers.meta?.pagination?.total || 0,
        totalRevenue,
        recentProducts: await api.getProducts({ limit: 5, include: ['images'] }),
        recentOrders: await api.getOrders({ limit: 5, include: ['customer'] }),
      }
    },
    enabled: !!config.merchantAlias && !!config.token,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // 5 minutos
  })
}

// Mutations
export const useCreateYampiProduct = (config: YampiConfig) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productData: any) => {
      const api = createYampiAPI(config)
      return api.createProduct(productData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: yampiKeys.products(config) })
    },
  })
}

export const useUpdateYampiProduct = (config: YampiConfig) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const api = createYampiAPI(config)
      return api.updateProduct(id, data)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: yampiKeys.products(config) })
      queryClient.invalidateQueries({ queryKey: yampiKeys.product(config, id) })
    },
  })
}

export const useDeleteYampiProduct = (config: YampiConfig) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: number) => {
      const api = createYampiAPI(config)
      return api.deleteProduct(productId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: yampiKeys.products(config) })
    },
  })
} 