# 📊 Sistema de Monitoramento de Endpoints

> **Sistema completo para monitorar a saúde de todos os serviços e APIs da aplicação em tempo real.**

## 🎯 Visão Geral

O sistema de monitoramento de endpoints permite acompanhar o status de todos os serviços críticos da aplicação, incluindo:

- **Site**: Páginas públicas e aplicação
- **APIs**: WhatsApp, IA, Email, Banco de Dados, Yampi
- **Servidor**: Memória, performance e rede
- **Trackeamento**: Analytics interno e monitoramento

## 🚀 Funcionalidades Implementadas

### ✅ Monitoramento em Tempo Real
- Verificação automática a cada 30 segundos
- Status visual (Online/Offline/Degradado)
- Tempo de resposta de cada endpoint
- Histórico de verificações

### ✅ Categorização Inteligente
- **Site**: Páginas Publicadas, Aplicação, Trackeamento
- **API WhatsApp**: Evolution API
- **API Inteligência Artificial**: Google Gemini
- **API Email**: Mailgun
- **API Banco de Dados**: Supabase
- **API Yampi**: E-commerce
- **Servidor**: Performance e recursos

### ✅ Interface Moderna
- Dashboard visual com cards por categoria
- Status geral do sistema
- Estatísticas em tempo real
- Detalhes técnicos expandíveis
- Controle de atualização automática

## 📁 Arquivos Implementados

### 🔧 Core Services
```
src/services/healthCheckService.ts     # Serviço principal de monitoramento
```

### 🎣 React Hooks
```
src/hooks/useSystemHealth.ts           # Hooks para integração React
```

### 📱 Interface
```
src/pages/SystemStatus.tsx             # Página de status do sistema
```

### 🧭 Navegação
```
src/App.tsx                           # Rota /status (apenas admins)
src/components/layout/Sidebar.tsx     # Item "Status do Sistema"
```

## 🎮 Como Usar

### 1. Acessar a Página de Status
```bash
# Na aplicação, navegue para:
http://localhost:3000/status

# Ou clique em "Status do Sistema" na sidebar (apenas admins)
```

### 2. Usar os Hooks Programaticamente
```typescript
import { useSystemHealth, useSystemStats } from '../hooks/useSystemHealth'

function MeuComponente() {
  const { systemHealth, isLoading, refresh } = useSystemHealth({
    autoRefresh: true,
    refreshInterval: 30000
  })
  
  const stats = useSystemStats(systemHealth)
  
  return (
    <div>
      <p>Total: {stats.totalEndpoints}</p>
      <p>Online: {stats.onlineEndpoints}</p>
      <p>Offline: {stats.offlineEndpoints}</p>
    </div>
  )
}
```

### 3. Usar o Serviço Diretamente
```typescript
import { healthCheckService } from '../services/healthCheckService'

// Verificar todos os endpoints
const health = await healthCheckService.checkAllEndpoints()

// Iniciar monitoramento contínuo
healthCheckService.startMonitoring(30000)

// Parar monitoramento
healthCheckService.stopMonitoring()
```

## 🔧 Configuração dos Endpoints

### Site - Páginas Publicadas
- ✅ Página Inicial (/)
- ✅ Login (/login)
- ✅ Cadastro (/signup)

### Site - Páginas de Aplicação
- ✅ Dashboard (/dashboard)
- ✅ Chat IA (/chat)
- ✅ WhatsApp (/whatsapp)
- ✅ Analytics (/analytics)

### Site - Trackeamento
- ✅ Analytics Interno
- ✅ Performance Monitor
- ✅ Error Tracking

### API WhatsApp
- ✅ Evolution API
- ✅ Status de instâncias
- ✅ Conectividade

### API Inteligência Artificial
- ✅ Google Gemini AI
- ✅ Teste de resposta
- ✅ Consumo de tokens

### API Email
- ✅ Mailgun API
- ✅ Validação de email
- ✅ Conectividade

### API Banco de Dados
- ✅ Supabase Connection
- ✅ Query test
- ✅ Latência

### API Yampi
- ✅ Conexão com loja
- ✅ Status da API
- ✅ Autenticação

### Servidor
- ✅ Uso de memória
- ✅ Performance
- ✅ Status da rede

## 📊 Métricas Coletadas

### Por Endpoint
```typescript
interface EndpointStatus {
  id: string
  name: string
  category: string
  url?: string
  status: 'online' | 'offline' | 'degraded' | 'unknown'
  responseTime?: number      // Tempo em ms
  lastCheck: string         // ISO timestamp
  error?: string           // Mensagem de erro
  details?: Record<string, any>  // Dados técnicos
}
```

### Sistema Geral
```typescript
interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  endpoints: EndpointStatus[]
  lastUpdate: string
}
```

## 🎨 Interface Visual

### Status Geral
- 🟢 **Healthy**: Todos os serviços online
- 🟡 **Degraded**: Alguns serviços com problemas
- 🔴 **Unhealthy**: Múltiplos serviços offline

### Cards por Categoria
- Ícone específico para cada categoria
- Contador de serviços online/total
- Lista detalhada de cada endpoint
- Tempo de resposta
- Detalhes técnicos expandíveis

### Controles
- ⚡ Atualização manual
- 🔄 Auto-refresh (liga/desliga)
- ⏱️ Última verificação
- 📊 Estatísticas resumidas

## 🔒 Segurança e Permissões

### Acesso Restrito
- Apenas **admins** podem acessar `/status`
- Proteção via `AdminProtectedRoute`
- Validação de roles no backend

### Logs de Auditoria
- Todas as verificações são logadas
- Histórico salvo no banco de dados
- Alertas automáticos para problemas críticos

## 🚀 Configuração e Deploy

### Variáveis de Ambiente Necessárias
```env
# Para monitoramento completo
VITE_GOOGLE_GEMINI_API_KEY=sua-chave-gemini
VITE_SUPABASE_URL=sua-url-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-supabase
VITE_EVOLUTION_API_URL=url-evolution-api
VITE_EVOLUTION_API_KEY=chave-evolution-api
```

### Inicialização
```typescript
// O sistema inicia automaticamente quando:
// 1. Usuário acessa /status
// 2. Hook useSystemHealth é usado
// 3. healthCheckService.startMonitoring() é chamado
```

## 📈 Monitoramento Avançado

### Alertas Automáticos
- Serviços críticos offline
- Tempo de resposta alto (>5s)
- Falhas consecutivas
- Status geral degradado

### Histórico e Tendências
- Salvamento automático no banco
- Análise de disponibilidade
- Relatórios de performance
- Identificação de padrões

### Integração com Analytics
- Logs estruturados
- Métricas de sistema
- Alertas personalizáveis
- Dashboard de administrador

## 🔧 Customização

### Adicionar Novos Endpoints
```typescript
// Em healthCheckService.ts
private async checkMeuNovoServico(): Promise<EndpointStatus[]> {
  try {
    // Sua lógica de verificação
    const response = await fetch('https://meu-servico.com/health')
    
    return [{
      id: 'meu-servico',
      name: 'Meu Serviço',
      category: 'APIs Externas',
      status: response.ok ? 'online' : 'offline',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString()
    }]
  } catch (error) {
    return [{
      id: 'meu-servico',
      name: 'Meu Serviço',
      category: 'APIs Externas',
      status: 'offline',
      lastCheck: new Date().toISOString(),
      error: error.message
    }]
  }
}

// Adicionar no checkAllEndpoints()
const endpoints = await Promise.all([
  // ... outros checks
  this.checkMeuNovoServico()
])
```

### Personalizar Intervalos
```typescript
// Intervalo personalizado
healthCheckService.startMonitoring(60000) // 1 minuto

// Ou via hook
const { systemHealth } = useSystemHealth({
  autoRefresh: true,
  refreshInterval: 120000 // 2 minutos
})
```

## 🎯 Benefícios

### Para Desenvolvedores
- 🔍 Visibilidade completa do sistema
- 🚨 Detecção precoce de problemas
- 📊 Métricas de performance
- 🛠️ Debug facilitado

### Para Administradores
- 📈 Monitoramento centralizado
- ⚡ Resposta rápida a incidentes
- 📋 Relatórios automáticos
- 🎛️ Controle total do sistema

### Para Usuários
- 🔄 Sistema mais estável
- ⚡ Performance melhor
- 🛡️ Maior confiabilidade
- 📱 Experiência consistente

## 🆘 Troubleshooting

### Erro: Endpoint não responde
```bash
# Verificar configuração
console.log(import.meta.env.VITE_SUPABASE_URL)

# Testar manualmente
curl -X GET "https://sua-api.com/health"

# Ver logs detalhados
# Abrir DevTools > Console > Filtrar por "health"
```

### Erro: Permissão negada
```bash
# Verificar role do usuário
# Apenas admins podem acessar /status

# Verificar no banco:
SELECT role FROM profiles WHERE id = 'user-id'
```

### Performance lenta
```typescript
// Ajustar intervalo de monitoramento
healthCheckService.startMonitoring(60000) // Menos frequente

// Desabilitar auto-refresh
const { systemHealth } = useSystemHealth({
  autoRefresh: false
})
```

## 🎉 Próximos Passos

### Melhorias Planejadas
- [ ] Gráficos de tendência histórica
- [ ] Alertas por email/SMS
- [ ] Integração com Slack/Discord
- [ ] API pública de status
- [ ] Dashboard público (/status-public)
- [ ] Métricas de SLA
- [ ] Comparação com versões anteriores

### Integrações Futuras
- [ ] Prometheus/Grafana
- [ ] New Relic
- [ ] DataDog
- [ ] Sentry
- [ ] CloudWatch

---

## 📝 Resumo

O sistema de monitoramento de endpoints fornece visibilidade completa sobre a saúde de todos os serviços da aplicação. Com interface moderna, monitoramento em tempo real e alertas automáticos, é uma ferramenta essencial para manter alta disponibilidade e performance.

**Acesse `/status` como administrador para começar a usar!** 🚀 