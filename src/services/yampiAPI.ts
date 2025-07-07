interface YampiConfig {
  merchantAlias: string
  token: string
  secretKey?: string
  apiKey?: string
}

interface YampiPagination {
  total: number
  count: number
  per_page: number
  current_page: number
  total_pages: number
  links?: {
    next?: string
    prev?: string
  }
}

interface YampiResponse<T = any> {
  data: T
  meta?: {
    pagination?: YampiPagination
  }
}

interface YampiProduct {
  id: number
  name: string
  description?: string
  price: number
  promotional_price?: number
  sku: string
  status: 'active' | 'inactive'
  images?: YampiImage[]
  skus?: YampiSku[]
  categories?: YampiCategory[]
  created_at: string
  updated_at: string
}

interface YampiSku {
  id: number
  sku: string
  price: number
  promotional_price?: number
  stock: number
  weight?: number
  height?: number
  width?: number
  length?: number
  status: 'active' | 'inactive'
}

interface YampiImage {
  id: number
  url: string
  alt?: string
  position: number
}

interface YampiCategory {
  id: number
  name: string
  slug: string
  parent_id?: number
}

interface YampiOrder {
  id: number
  number: string
  status: string
  payment_status: string
  total: number
  customer: YampiCustomer
  items: YampiOrderItem[]
  created_at: string
  updated_at: string
}

interface YampiCustomer {
  id: number
  name: string
  email: string
  phone?: string
  document?: string
  created_at: string
  updated_at: string
}

interface YampiOrderItem {
  id: number
  quantity: number
  price: number
  total: number
  product: YampiProduct
  sku?: YampiSku
}

interface YampiConnectionTest {
  success: boolean
  merchant_alias?: string
  store_name?: string
  error?: string
}

class YampiAPIService {
  private config: YampiConfig
  private baseURL: string

  constructor(config: YampiConfig) {
    this.config = config
    this.baseURL = `https://api.dooki.com.br/v2/${config.merchantAlias}`
  }

  updateConfig(config: YampiConfig) {
    this.config = config
    this.baseURL = `https://api.dooki.com.br/v2/${config.merchantAlias}`
  }

  private async makeRequest<T = any>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    params?: Record<string, string>
  ): Promise<YampiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`)
    
    // Adicionar parâmetros de query
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    console.log(`🛒 Yampi API Request:`, {
      url: url.toString(),
      method,
      merchantAlias: this.config.merchantAlias,
      data
    })

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Adicionar token de autenticação
      if (this.config.token) {
        headers['User-Token'] = this.config.token
      }

      if (this.config.secretKey) {
        headers['User-Secret-Key'] = this.config.secretKey
      }

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`
      }

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      })

      console.log(`📥 Yampi Response Status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Yampi HTTP Error ${response.status}:`, errorText)
        throw new Error(`Erro na API Yampi: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log(`✅ Yampi Response Success:`, result)
      return result
    } catch (error) {
      console.error('❌ Yampi API request failed:', error)
      throw error
    }
  }

  // Teste de conectividade progressivo
  async testConnection(): Promise<YampiConnectionTest> {
    // Lista de endpoints em ordem crescente de permissões necessárias
    const endpoints = [
      { 
        path: '/merchants/me', 
        name: 'Informações da Loja',
        description: 'Endpoint mais básico - informações da conta'
      },
      { 
        path: '/catalog/products', 
        name: 'Produtos', 
        params: { limit: '1' },
        description: 'Catálogo de produtos - requer permissão de leitura'
      },
      { 
        path: '/customers',
        name: 'Clientes',
        params: { limit: '1' },
        description: 'Lista de clientes - requer permissão específica'
      },
      { 
        path: '/orders',
        name: 'Pedidos',
        params: { limit: '1' },
        description: 'Lista de pedidos - requer permissão específica'
      }
    ]

    let lastError = ''
    const testedEndpoints: string[] = []
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🧪 Testando: ${endpoint.name} (${endpoint.description})`)
        testedEndpoints.push(`✅ ${endpoint.name}`)
        
        const response = await this.makeRequest(endpoint.path, 'GET', undefined, endpoint.params)
        
        // Se chegou aqui, o endpoint funcionou!
        let storeName = this.config.merchantAlias
        
        // Tentar extrair informações mais específicas se disponível
        if (endpoint.path === '/merchants/me' && response.data?.name) {
          storeName = response.data.name
        } else if (endpoint.path === '/merchants/me' && response.data?.alias) {
          storeName = response.data.alias
        }
        
        console.log(`✅ Conectado com sucesso via ${endpoint.name}`)
        
        return {
          success: true,
          merchant_alias: this.config.merchantAlias,
          store_name: storeName
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
        lastError = errorMsg
        testedEndpoints[testedEndpoints.length - 1] = `❌ ${endpoint.name}: ${errorMsg}`
        
        console.log(`❌ ${endpoint.name} falhou:`, errorMsg)
        
        // Se for erro 403 (permissão), continuar tentando outros endpoints
        // Se for erro 401 (credenciais), parar imediatamente
        if (errorMsg.includes('401')) {
          return {
            success: false,
            error: `Credenciais inválidas: ${errorMsg}`
          }
        }
        
        continue
      }
    }
    
    // Se chegou aqui, todos os endpoints falharam
    return {
      success: false,
      error: `Falha em todos os endpoints testados:\n${testedEndpoints.join('\n')}\n\nÚltimo erro: ${lastError}`
    }
  }

  // Gerenciamento de Produtos
  async getProducts(params?: {
    page?: number
    limit?: number
    include?: string[]
    search?: string
    category_id?: number
    status?: 'active' | 'inactive'
    skipCache?: boolean
  }): Promise<YampiResponse<YampiProduct[]>> {
    const queryParams: Record<string, string> = {}
    
    if (params?.page) queryParams.page = params.page.toString()
    if (params?.limit) queryParams.limit = params.limit.toString()
    if (params?.include) queryParams.include = params.include.join(',')
    if (params?.search) queryParams.search = params.search
    if (params?.category_id) queryParams.category_id = params.category_id.toString()
    if (params?.status) queryParams.status = params.status
    if (params?.skipCache) queryParams.skipCache = 'true'

    return this.makeRequest<YampiProduct[]>('/catalog/products', 'GET', undefined, queryParams)
  }

  async getProduct(id: number, include?: string[]): Promise<YampiResponse<YampiProduct>> {
    const params: Record<string, string> = {}
    if (include) params.include = include.join(',')
    
    return this.makeRequest<YampiProduct>(`/catalog/products/${id}`, 'GET', undefined, params)
  }

  async createProduct(product: Partial<YampiProduct>): Promise<YampiResponse<YampiProduct>> {
    return this.makeRequest<YampiProduct>('/catalog/products', 'POST', product)
  }

  async updateProduct(id: number, product: Partial<YampiProduct>): Promise<YampiResponse<YampiProduct>> {
    return this.makeRequest<YampiProduct>(`/catalog/products/${id}`, 'PUT', product)
  }

  async deleteProduct(id: number): Promise<YampiResponse<void>> {
    return this.makeRequest<void>(`/catalog/products/${id}`, 'DELETE')
  }

  // Gerenciamento de Pedidos
  async getOrders(params?: {
    page?: number
    limit?: number
    include?: string[]
    status?: string
    payment_status?: string
    date_from?: string
    date_to?: string
    skipCache?: boolean
  }): Promise<YampiResponse<YampiOrder[]>> {
    const queryParams: Record<string, string> = {}
    
    if (params?.page) queryParams.page = params.page.toString()
    if (params?.limit) queryParams.limit = params.limit.toString()
    if (params?.include) queryParams.include = params.include.join(',')
    if (params?.status) queryParams.status = params.status
    if (params?.payment_status) queryParams.payment_status = params.payment_status
    if (params?.date_from) queryParams.date_from = params.date_from
    if (params?.date_to) queryParams.date_to = params.date_to
    if (params?.skipCache) queryParams.skipCache = 'true'

    return this.makeRequest<YampiOrder[]>('/orders', 'GET', undefined, queryParams)
  }

  async getOrder(id: number, include?: string[]): Promise<YampiResponse<YampiOrder>> {
    const params: Record<string, string> = {}
    if (include) params.include = include.join(',')
    
    return this.makeRequest<YampiOrder>(`/orders/${id}`, 'GET', undefined, params)
  }

  // Gerenciamento de Clientes
  async getCustomers(params?: {
    page?: number
    limit?: number
    search?: string
    skipCache?: boolean
  }): Promise<YampiResponse<YampiCustomer[]>> {
    const queryParams: Record<string, string> = {}
    
    if (params?.page) queryParams.page = params.page.toString()
    if (params?.limit) queryParams.limit = params.limit.toString()
    if (params?.search) queryParams.search = params.search
    if (params?.skipCache) queryParams.skipCache = 'true'

    return this.makeRequest<YampiCustomer[]>('/customers', 'GET', undefined, queryParams)
  }

  async getCustomer(id: number): Promise<YampiResponse<YampiCustomer>> {
    return this.makeRequest<YampiCustomer>(`/customers/${id}`)
  }

  // Gerenciamento de Categorias
  async getCategories(params?: {
    page?: number
    limit?: number
    parent_id?: number
    skipCache?: boolean
  }): Promise<YampiResponse<YampiCategory[]>> {
    const queryParams: Record<string, string> = {}
    
    if (params?.page) queryParams.page = params.page.toString()
    if (params?.limit) queryParams.limit = params.limit.toString()
    if (params?.parent_id) queryParams.parent_id = params.parent_id.toString()
    if (params?.skipCache) queryParams.skipCache = 'true'

    return this.makeRequest<YampiCategory[]>('/catalog/categories', 'GET', undefined, queryParams)
  }

  // Webhook management
  async setWebhook(url: string, events: string[]): Promise<YampiResponse<any>> {
    return this.makeRequest('/webhooks', 'POST', {
      url,
      events
    })
  }

  async getWebhooks(): Promise<YampiResponse<any[]>> {
    return this.makeRequest('/webhooks')
  }
}

// Função para criar uma instância do serviço
export const createYampiAPI = (config: YampiConfig) => {
  return new YampiAPIService(config)
}

export {
  YampiAPIService,
  type YampiConfig,
  type YampiProduct,
  type YampiOrder,
  type YampiCustomer,
  type YampiSku,
  type YampiImage,
  type YampiCategory,
  type YampiOrderItem,
  type YampiConnectionTest,
  type YampiResponse,
  type YampiPagination
} 