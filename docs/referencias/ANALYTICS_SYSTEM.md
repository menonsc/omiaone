# Sistema de Analytics Interno

## 📊 Visão Geral

Sistema completo de analytics administrativo implementado para monitoramento de uso, logs de atividade e métricas de performance. Disponível apenas para usuários com perfil de administrador.

## 🏗️ Arquitetura

### 1. Schema do Banco de Dados (`004_analytics_schema.sql`)

**Tabelas Principais:**
- `analytics_events`: Eventos de analytics com rastreamento completo
- `analytics_daily_metrics`: Métricas agregadas diárias
- `system_logs`: Logs detalhados do sistema com busca full-text
- `performance_metrics`: Métricas de performance (counter, gauge, histogram, timer)
- `system_alerts`: Sistema de alertas com severidade e status
- `dashboard_configs`: Configurações personalizáveis de dashboard

**Funcionalidades Avançadas:**
- Enums para tipos de eventos e níveis de severidade
- Índices otimizados para performance
- Busca full-text em português nos logs
- Funções automáticas de agregação
- RLS (Row Level Security) para admins
- Triggers para atualização automática

### 2. Serviço de Analytics (`src/services/analytics.ts`)

**Classe AnalyticsService:**
```typescript
// Rastreamento automático
- Dispositivo, browser, OS
- Performance tracking com PerformanceObserver
- Session ID automático
- Geolocalização básica

// Métodos principais
- trackEvent() - Rastrear eventos
- logSystem() - Logs estruturados
- trackPerformanceMetric() - Métricas de performance
- createSystemAlert() - Criar alertas
- getDashboardMetrics() - Métricas do dashboard

// Métodos de conveniência
- trackPageView()
- trackUserLogin()
- trackError()
- trackFeatureUsage()
- trackApiCall()
```

### 3. Hooks React Query (`src/hooks/useAnalyticsQueries.ts`)

**Hooks Especializados:**
- `useDashboardMetrics()` - Métricas do dashboard
- `useSystemLogs()` - Logs com filtros
- `useSystemAlerts()` - Alertas com filtros
- `usePerformanceMetrics()` - Métricas de performance
- `useAdminAnalytics()` - Hook composto para admins
- `useRealTimeStats()` - Estatísticas em tempo real

**Mutations:**
- `useAcknowledgeAlert()` - Reconhecer alerta
- `useResolveAlert()` - Resolver alerta
- `useTrackEvent()` - Rastrear evento
- `useLogSystem()` - Criar log

### 4. Interface Administrativa (`src/pages/Analytics.tsx`)

**Sistema de Tabs:**
- **Dashboard**: Métricas principais e de performance
- **Logs**: Interface de logs (em desenvolvimento)
- **Alertas**: Sistema de alertas (em desenvolvimento)
- **Performance**: Gráficos detalhados (em desenvolvimento)

**Métricas Exibidas:**
- Usuários ativos, mensagens WhatsApp, interações IA
- Campanhas email, tempo de carregamento, tempo de API
- Erros de API, alertas do sistema
- Resumos por funcionalidade

## 🚀 Como Usar

### 1. Aplicar Migration

```bash
# Se usando Supabase local
npx supabase db push

# Ou aplicar diretamente no Supabase Dashboard
```

### 2. Configurar Permissões

No Supabase Dashboard, configure RLS para permitir acesso apenas a administradores:

```sql
-- Exemplo de política RLS
CREATE POLICY "Admins can view analytics" ON analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
```

### 3. Usar o Sistema

```typescript
import { useAnalytics } from '../services/analytics'

// Em qualquer componente
const analytics = useAnalytics()

// Rastrear eventos
analytics.trackPageView('Dashboard')
analytics.trackFeatureUsage('whatsapp', 'send_message')
analytics.trackError(error, 'whatsapp', 'send_message')

// Usar hooks nas páginas
import { useAdminAnalytics } from '../hooks/useAnalyticsQueries'

const { dashboardMetrics, isLoading } = useAdminAnalytics()
```

## 📈 Métricas Coletadas

### Eventos de Analytics
- Login/logout de usuários
- Visualizações de página
- Uso de funcionalidades
- Chamadas de API
- Erros ocorridos
- Sincronizações de integração
- Mensagens enviadas
- Uploads de documentos
- Campanhas enviadas
- Interações com agentes IA

### Logs do Sistema
- Níveis: debug, info, warn, error, fatal
- Severidade: low, medium, high, critical
- Componente e ação
- Stack trace para erros
- Contexto completo (usuário, sessão, request)

### Métricas de Performance
- Tempo de carregamento de páginas
- Tempo de resposta de APIs
- Métricas de sistema (CPU, memória)
- Contadores personalizados

### Alertas do Sistema
- Alertas automáticos baseados em thresholds
- Severidade configurável
- Status de acknowledgment e resolução
- Notas de resolução

## 🔧 Configuração Avançada

### Personalizar Dashboard

```typescript
// Configurar métricas personalizadas
const customMetrics = {
  metricName: 'custom_metric',
  metricType: 'counter',
  value: 100,
  component: 'my_component'
}

analytics.trackPerformanceMetric(customMetrics)
```

### Criar Alertas Personalizados

```typescript
const alert = {
  alertType: 'high_error_rate',
  severity: 'high',
  title: 'Taxa de erro elevada',
  description: 'API com mais de 5% de erros',
  component: 'api',
  affectedUsers: 50
}

analytics.createSystemAlert(alert)
```

## 🎯 Funcionalidades Implementadas

### ✅ Completas
- [x] Schema completo do banco de dados
- [x] Serviço de analytics com rastreamento automático
- [x] Hooks React Query especializados
- [x] Dashboard administrativo funcional
- [x] Roteamento e navegação
- [x] Controle de acesso para admins
- [x] Métricas de performance automáticas

### 🚧 Em Desenvolvimento
- [ ] Interface completa de logs com filtros
- [ ] Sistema de alertas com notificações
- [ ] Gráficos detalhados de performance
- [ ] Relatórios exportáveis
- [ ] Dashboards personalizáveis
- [ ] Alertas em tempo real

## 📋 Próximos Passos

1. **Aplicar Migration**: `npx supabase db push`
2. **Configurar RLS**: Políticas de segurança para admins
3. **Testar em Produção**: Verificar coleta de dados
4. **Implementar Interfaces**: Completar logs e alertas
5. **Adicionar Gráficos**: Charts interativos com recharts
6. **Sistema de Notificações**: Alertas em tempo real
7. **Relatórios**: Exportação de dados em PDF/Excel

## 🔒 Segurança

- **RLS Configurado**: Acesso apenas para administradores
- **Dados Sensíveis**: IPs e dados pessoais tratados com cuidado
- **Logs Estruturados**: Sem exposição de informações sensíveis
- **Controle de Acesso**: Verificação de perfil de usuário

## 📊 Performance

- **Lazy Loading**: Página carregada sob demanda
- **React Query**: Cache inteligente e atualizações automáticas
- **Índices Otimizados**: Consultas rápidas no banco
- **Agregações**: Métricas pré-calculadas para performance
- **Paginação**: Suporte a grandes volumes de dados

---

**Status**: ✅ Sistema base implementado e pronto para uso
**Acesso**: Apenas administradores
**Rota**: `/analytics` 