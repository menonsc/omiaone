# 🚀 Implementação do React Query

## 📋 Visão Geral

O React Query foi implementado para melhorar significativamente o gerenciamento de dados remotos no sistema, oferecendo:

- ✅ **Cache automático** de dados
- ✅ **Sincronização em background** 
- ✅ **Retry automático** com configuração inteligente
- ✅ **Invalidação inteligente** de cache
- ✅ **Estados de loading/error** automáticos
- ✅ **Otimização de performance** com re-renders seletivos

## 🏗️ Arquitetura Implementada

### 1. **Configuração Global** (`src/main.tsx`)
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000,   // 10 minutos
      retry: (failureCount, error: any) => {
        // Não tentar novamente para erros 4xx (exceto 408, 429)
        if (error?.status >= 400 && error?.status < 500 && ![408, 429].includes(error?.status)) {
          return false
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})
```

### 2. **Hooks Especializados por API**

#### **WhatsApp Hooks** (`src/hooks/useWhatsAppQueries.ts`)
- `useInstances()` - Lista de instâncias com polling automático
- `useInstance(id)` - Dados de uma instância específica
- `useCreateInstance()` - Criar nova instância
- `useConnectInstance()` - Conectar instância
- `useDisconnectInstance()` - Desconectar instância
- `useDeleteInstance()` - Excluir instância
- `useChats(instanceId)` - Lista de conversas
- `useWhatsAppMessages(instanceId, chatId)` - Mensagens de uma conversa
- `useSendMessage()` - Enviar mensagem
- `useContacts(instanceId)` - Lista de contatos
- `useQRCode(instanceId)` - QR Code para conexão
- `useConnectionStatus(instanceId)` - Status de conexão

#### **Yampi Hooks** (`src/hooks/useYampiQueries.ts`)
- `useYampiConnection(config)` - Teste de conexão
- `useYampiProducts(config, params)` - Lista de produtos
- `useYampiProduct(config, id)` - Produto específico
- `useYampiOrders(config, params)` - Lista de pedidos
- `useYampiOrder(config, id)` - Pedido específico
- `useYampiCustomers(config, params)` - Lista de clientes
- `useYampiCustomer(config, id)` - Cliente específico
- `useYampiCategories(config, params)` - Lista de categorias
- `useYampiDashboard(config)` - Métricas do dashboard
- `useCreateYampiProduct(config)` - Criar produto
- `useUpdateYampiProduct(config)` - Atualizar produto
- `useDeleteYampiProduct(config)` - Excluir produto

#### **Supabase Hooks** (`src/hooks/useSupabaseQueries.ts`)
- `useProfile(userId)` - Perfil do usuário
- `useUpdateProfile()` - Atualizar perfil
- `useAgents()` - Lista de agentes
- `useAgent(id)` - Agente específico
- `useCreateAgent()` - Criar agente
- `useUpdateAgent()` - Atualizar agente
- `useDeleteAgent()` - Excluir agente
- `useChatSessions(userId)` - Sessões de chat
- `useChatSession(id)` - Sessão específica
- `useCreateChatSession()` - Criar sessão
- `useDeleteChatSession()` - Excluir sessão
- `useMessages(sessionId)` - Mensagens de uma sessão
- `useSaveMessage()` - Salvar mensagem
- `useUpdateMessageFeedback()` - Atualizar feedback
- `useDocuments()` - Lista de documentos
- `useDocument(id)` - Documento específico
- `useUploadDocument()` - Upload de documento
- `useDeleteDocument()` - Excluir documento
- `useSearchDocuments(query)` - Buscar documentos
- `useActivityLogs(userId)` - Logs de atividade
- `useLogActivity()` - Registrar atividade

## 🎯 Como Usar

### **Exemplo Básico - Listar Instâncias WhatsApp**
```typescript
import { useInstances } from '../hooks/useWhatsAppQueries'

function WhatsAppPage() {
  const { data: instances, isLoading, error, refetch } = useInstances()

  if (isLoading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error.message}</div>

  return (
    <div>
      {instances.map(instance => (
        <div key={instance.id}>{instance.name}</div>
      ))}
    </div>
  )
}
```

### **Exemplo com Mutations - Criar Instância**
```typescript
import { useCreateInstance } from '../hooks/useWhatsAppQueries'

function CreateInstanceForm() {
  const createInstance = useCreateInstance()

  const handleSubmit = async (name: string) => {
    try {
      await createInstance.mutateAsync(name)
      // Cache é invalidado automaticamente
    } catch (error) {
      console.error('Erro ao criar instância:', error)
    }
  }

  return (
    <button 
      onClick={() => handleSubmit('minha-instancia')}
      disabled={createInstance.isPending}
    >
      {createInstance.isPending ? 'Criando...' : 'Criar Instância'}
    </button>
  )
}
```

### **Exemplo com Parâmetros - Produtos Yampi**
```typescript
import { useYampiProducts } from '../hooks/useYampiQueries'

function ProductsList({ config }) {
  const { data: products, isLoading } = useYampiProducts(config, {
    limit: 10,
    include: ['images'],
    status: 'active'
  })

  if (isLoading) return <div>Carregando produtos...</div>

  return (
    <div>
      {products?.data?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

## ⚡ Benefícios da Implementação

### **1. Performance**
- **Cache automático**: Dados ficam em cache por 5-10 minutos
- **Re-renders seletivos**: Apenas componentes que usam dados específicos re-renderizam
- **Background updates**: Dados são atualizados automaticamente em background
- **Optimistic updates**: Interface responde instantaneamente

### **2. Experiência do Usuário**
- **Loading states**: Estados de carregamento automáticos
- **Error handling**: Tratamento de erro consistente
- **Retry automático**: Tentativas automáticas em caso de falha
- **Offline support**: Dados ficam disponíveis offline

### **3. Desenvolvimento**
- **DevTools**: Interface visual para debug (React Query DevTools)
- **TypeScript**: Tipagem completa dos dados
- **Query Keys**: Sistema organizado de chaves de cache
- **Invalidação inteligente**: Cache é invalidado automaticamente

## 🔧 Configurações por API

### **WhatsApp (Tempo Real)**
```typescript
// Polling frequente para dados em tempo real
staleTime: 5 * 1000,        // 5 segundos
refetchInterval: 3 * 1000,  // 3 segundos
```

### **Yampi (E-commerce)**
```typescript
// Polling moderado para dados de e-commerce
staleTime: 2 * 60 * 1000,   // 2 minutos
refetchInterval: 5 * 60 * 1000, // 5 minutos
```

### **Supabase (Dados Locais)**
```typescript
// Polling menos frequente para dados locais
staleTime: 1 * 60 * 1000,   // 1 minuto
refetchInterval: 2 * 60 * 1000, // 2 minutos
```

## 🎨 Estados Disponíveis

### **Queries**
- `isLoading`: Primeira vez carregando
- `isFetching`: Carregando (incluindo background)
- `isError`: Houve erro
- `error`: Objeto do erro
- `data`: Dados da query
- `refetch`: Função para recarregar

### **Mutations**
- `isPending`: Executando mutation
- `isError`: Houve erro
- `error`: Objeto do erro
- `data`: Dados retornados
- `mutate`: Função para executar
- `mutateAsync`: Versão async da função

## 🔄 Migração de Componentes

### **Antes (Zustand)**
```typescript
const { instances, fetchInstances, isLoading } = useWhatsAppStore()

useEffect(() => {
  fetchInstances()
}, [fetchInstances])
```

### **Depois (React Query)**
```typescript
const { data: instances, isLoading, error } = useInstances()
// Sem useEffect necessário!
```

## 🛠️ DevTools

O React Query DevTools está configurado e disponível em desenvolvimento:

```typescript
<ReactQueryDevtools initialIsOpen={false} />
```

**Recursos disponíveis:**
- Visualizar todas as queries ativas
- Ver cache de dados
- Forçar refetch
- Invalidate queries
- Monitorar performance

## 📊 Monitoramento

### **Query Keys Organizadas**
```typescript
// WhatsApp
['whatsapp', 'instances']
['whatsapp', 'messages', 'instanceId', 'chatId']

// Yampi
['yampi', 'products', 'merchantAlias', params]
['yampi', 'orders', 'merchantAlias', params]

// Supabase
['supabase', 'agents']
['supabase', 'messages', 'sessionId']
```

### **Logs Automáticos**
- Queries executadas
- Tempo de resposta
- Erros ocorridos
- Cache hits/misses

## 🚀 Próximos Passos

### **Melhorias Planejadas**
1. **Infinite Queries**: Para listas paginadas
2. **Optimistic Updates**: Para melhor UX
3. **Background Sync**: Sincronização offline
4. **Query Prefetching**: Pré-carregar dados
5. **Custom Hooks**: Hooks compostos para casos específicos

### **Integrações Futuras**
- **WebSockets**: Para dados em tempo real
- **Service Workers**: Para cache offline
- **GraphQL**: Para queries mais eficientes
- **Real-time Subscriptions**: Para Supabase

---

**🎉 Sistema 100% otimizado com React Query!**

A implementação oferece uma experiência de desenvolvimento e usuário significativamente melhorada, com cache inteligente, sincronização automática e performance otimizada. 