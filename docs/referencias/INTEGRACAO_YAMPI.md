# Integração Yampi - Guia Completo

## 📋 Visão Geral

A integração com a Yampi permite que seus clientes conectem suas lojas de e-commerce diretamente ao sistema de IA, possibilitando:

- Sincronização automática de produtos, pedidos e clientes
- Dashboard em tempo real com métricas da loja
- Configuração simples pelo frontend (self-service)
- API completa para operações de e-commerce

## 🏗️ Arquitetura Implementada

### 1. **Database Schema** (`supabase/migrations/003_integrations_schema.sql`)
- Tabela `integrations` para armazenar configurações
- Tabela `integration_sync_logs` para histórico de sincronizações
- Suporte a múltiplos tipos de integração
- Segurança RLS implementada

### 2. **API Service** (`src/services/yampiAPI.ts`)
- Baseado na [documentação oficial da Yampi](https://docs.yampi.com.br/api-reference/introduction)
- Endpoints para produtos, pedidos, clientes e categorias
- Autenticação via User-Token
- Suporte a paginação e includes
- Tratamento completo de erros

### 3. **Store Management** (`src/store/integrationsStore.ts`)
- Gerenciamento de estado com Zustand
- Funções para configurar, testar e sincronizar
- Cache automático de configurações
- Estados de conexão em tempo real

### 4. **Frontend Interface** (`src/pages/Settings.tsx`)
- Modal de configuração user-friendly
- Validação de credenciais em tempo real
- Status visual das integrações
- Instruções passo-a-passo

### 5. **Dashboard** (`src/pages/YampiDashboard.tsx`)
- Métricas em tempo real da loja
- Listagem de produtos e pedidos recentes
- Link direto para o painel Yampi
- Design responsivo e atrativo

## 🚀 Como Configurar

### Para o Cliente (Frontend)

1. **Acesse as Configurações**
   - Vá para Settings → Integrações
   - Clique em "Conectar" no card da Yampi

2. **Preencha as Credenciais**
   - **Alias da Loja**: O identificador único da sua loja (ex: `minha-loja`)
   - **Token de Acesso**: Token disponível no painel Yampi
   - **API Key** (opcional): Chave adicional se necessário

3. **Teste a Conexão**
   - O sistema testa automaticamente as credenciais
   - Status visual indica sucesso ou erro
   - Mensagens de erro detalhadas para troubleshooting

### Para Obter Credenciais Yampi

1. Acesse o painel da sua loja Yampi
2. Vá em **Configurações → Integrações → API**
3. Copie o token de acesso gerado
4. O alias da loja está na URL da sua loja

## 📊 Recursos Disponíveis

### API Yampi Implementada

```typescript
// Produtos
yampiAPI.getProducts({ limit: 10, include: ['images', 'skus'] })
yampiAPI.getProduct(id, ['images', 'categories'])
yampiAPI.createProduct(productData)
yampiAPI.updateProduct(id, updates)

// Pedidos
yampiAPI.getOrders({ status: 'completed', include: ['customer'] })
yampiAPI.getOrder(id, ['items', 'customer'])

// Clientes
yampiAPI.getCustomers({ search: 'joão' })
yampiAPI.getCustomer(id)

// Categorias
yampiAPI.getCategories()

// Webhooks
yampiAPI.setWebhook(url, events)
```

### Dashboard Metrics

- **Produtos Totais**: Contagem e listagem recente
- **Pedidos**: Valor total e status dos pedidos
- **Clientes**: Total de clientes cadastrados
- **Receita**: Cálculo automático da receita total

## 🔧 Configuração Técnica

### Environment Variables

```env
# Não são necessárias - configuração é feita pelo frontend
# Cada cliente configura suas próprias credenciais
```

### Database Tables

```sql
-- Integrações do usuário
SELECT * FROM integrations WHERE user_id = auth.uid();

-- Logs de sincronização
SELECT * FROM integration_sync_logs 
WHERE integration_id IN (
  SELECT id FROM integrations WHERE user_id = auth.uid()
);
```

## 🚦 Estados da Integração

- **`inactive`**: Não configurada
- **`testing`**: Testando conectividade
- **`active`**: Conectada e funcionando
- **`error`**: Erro na conexão (credenciais inválidas, etc.)

## 🛡️ Segurança

### Armazenamento de Credenciais
- Credenciais armazenadas de forma segura no Supabase
- Row Level Security (RLS) ativo
- Cada usuário acessa apenas suas próprias integrações
- Tokens nunca expostos nos logs

### Validação
- Teste de conectividade obrigatório
- Validação de formato das credenciais
- Tratamento de erros da API Yampi
- Timeout de requisições configurado

## 📱 Interface do Usuário

### Cards de Status
- 🟢 **Conectado**: Integração ativa e funcionando
- 🔵 **Testando**: Validando credenciais
- 🔴 **Erro**: Problema na conexão
- ⚫ **Inativo**: Não configurado

### Funcionalidades
- **Configurar**: Abrir modal de configuração
- **Testar**: Validar conexão atual
- **Status em Tempo Real**: Indicadores visuais
- **Mensagens de Erro**: Detalhamento de problemas

## 🔄 Sincronização

### Tipos de Sync
- **`full`**: Sincronização completa
- **`incremental`**: Apenas alterações
- **`manual`**: Executada pelo usuário

### Logs Automáticos
- Timestamp de início e fim
- Registros processados com sucesso/erro
- Duração da sincronização
- Detalhes de erros para debugging

## 🎯 Próximos Passos

### Funcionalidades Futuras
1. **Webhooks Yampi**: Receber notificações em tempo real
2. **Sincronização Automática**: Scheduled jobs para sync
3. **Relatórios Avançados**: Analytics detalhados
4. **Múltiplas Lojas**: Suporte a várias lojas Yampi
5. **Automações**: Triggers baseados em eventos

### Integrações Adicionais
- **Mercado Pago**: Gateway de pagamento
- **Correios**: Cálculo de frete
- **Google Analytics**: Tracking avançado
- **Facebook Pixel**: Marketing digital

## 🐛 Troubleshooting

### Erros Comuns

**❌ "Erro na API Yampi: 401"**
- Verifique se o token está correto
- Confirme o alias da loja
- Token pode ter expirado

**❌ "Erro na API Yampi: 404"**
- Verifique se o alias da loja está correto
- Loja pode estar inativa

**❌ "Falha na conexão"**
- Verifique conexão com internet
- API Yampi pode estar indisponível
- Rate limiting atingido

### Debug Mode

```typescript
// Logs detalhados habilitados por padrão
console.log('🛒 Yampi API Request:', { url, method, data })
console.log('📥 Response Status:', response.status)
console.log('✅ Response Success:', result)
```

## 📞 Suporte

Para dúvidas sobre a integração Yampi:

1. **Documentação Yampi**: https://docs.yampi.com.br
2. **Status da API**: Verificar no painel Yampi
3. **Logs do Sistema**: Disponíveis no dashboard
4. **Suporte Técnico**: Contato via sistema

---

## 🎉 Conclusão

A integração Yampi foi implementada seguindo as melhores práticas:

- ✅ **Self-service**: Clientes configuram sozinhos
- ✅ **Segurança**: Credenciais protegidas e RLS ativo
- ✅ **Performance**: Requisições otimizadas e cache
- ✅ **UX**: Interface intuitiva e feedback visual
- ✅ **Escalabilidade**: Suporta múltiplos usuários
- ✅ **Monitoramento**: Logs detalhados e métricas

Os clientes agora podem conectar suas lojas Yampi de forma simples e segura, com acesso a dashboards em tempo real e dados sincronizados automaticamente. 