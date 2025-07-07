# 🛠️ Correção do Erro 401 - Integração Yampi

## 🚨 **Problema Identificado**

O erro 401 com a mensagem `"Missing User-Secret-Key header"` ocorreu porque a API da Yampi requer **dois headers de autenticação**:

1. **User-Token**: Token de acesso
2. **User-Secret-Key**: Chave secreta

A implementação inicial só enviava o `User-Token`.

## ✅ **Correções Implementadas**

### 1. **Atualização da Interface YampiConfig**

```typescript
interface YampiConfig {
  merchantAlias: string
  token: string
  secretKey?: string  // ← NOVO CAMPO
  apiKey?: string
}
```

### 2. **Correção do Serviço yampiAPI.ts**

Adicionado o header `User-Secret-Key`:

```typescript
if (this.config.secretKey) {
  headers['User-Secret-Key'] = this.config.secretKey
}
```

### 3. **Atualização do Modal de Configuração**

- ✅ Novo campo obrigatório: **Chave Secreta**
- ✅ Validação atualizada para incluir `secretKey`
- ✅ Instruções atualizadas

### 4. **Atualização do Store de Integrações**

Todas as referências às credenciais agora incluem `secretKey`:

```typescript
credentials: {
  merchantAlias: config.merchantAlias,
  token: config.token,
  secretKey: config.secretKey,  // ← NOVO
  apiKey: config.apiKey
}
```

## 🧪 **Solução para Teste Local**

### **Página de Teste: `/yampi-test`**

Criada uma página especial para testar a integração Yampi **sem precisar de banco de dados**:

- 🔗 **URL**: `http://localhost:3000/yampi-test`
- ✅ **Funcionalidade**: Teste completo da API
- 📊 **Dashboard**: Visualização de produtos, pedidos, clientes
- 🚀 **Sem dependências**: Não precisa do Supabase

### **Como Usar**

1. Execute o projeto: `npm run dev`
2. Acesse: `http://localhost:3000/yampi-test`
3. Preencha os campos obrigatórios:
   - **Alias da Loja**: (ex: "sua-loja")
   - **Token de Acesso**: Token da API Yampi
   - **Chave Secreta**: User-Secret-Key da Yampi
4. Clique em **"Testar Conexão"**

## 🔑 **Como Obter Credenciais Yampi**

### **Passo a Passo Atualizado**

1. **Acesse** o painel da sua loja Yampi
2. **Navegue** para: **Configurações** → **Integrações** → **API**
3. **Copie** as seguintes informações:
   - ✅ **Token de Acesso** (User-Token)
   - ✅ **Chave Secreta** (User-Secret-Key) ← **NOVO**
   - ✅ **Alias da Loja** (URL da loja)

### **Localização das Chaves**

```
Painel Yampi → Configurações → Integrações → API
├── User-Token: abc123... (Token de Acesso)
├── User-Secret-Key: def456... (Chave Secreta)
└── Alias: sua-loja (da URL)
```

## 🆚 **Duas Opções Disponíveis**

### **Opção 1: Teste Rápido (Recomendado)**
- 🔗 **URL**: `/yampi-test`
- ⚡ **Vantagem**: Não precisa configurar banco
- 🎯 **Uso**: Validar credenciais e testar API

### **Opção 2: Sistema Completo**
- 🔗 **URL**: `/settings` → Integrações
- 💾 **Vantagem**: Salva configurações
- 🎯 **Uso**: Integração permanente
- ⚠️ **Requer**: Configuração do Supabase

## 🔧 **Status das Correções**

- ✅ **yampiAPI.ts**: Header User-Secret-Key adicionado
- ✅ **Settings.tsx**: Campo Chave Secreta obrigatório
- ✅ **integrationsStore.ts**: Suporte a secretKey
- ✅ **YampiTestLocal.tsx**: Página de teste criada
- ✅ **App.tsx**: Rota `/yampi-test` adicionada
- ✅ **types/index.ts**: Interface atualizada

## 🎯 **Teste Agora**

Para testar imediatamente:

```bash
# Execute o projeto
npm run dev

# Acesse no navegador
http://localhost:3000/yampi-test
```

## 📊 **Recursos do Teste**

Após conectar com sucesso, você verá:

- 📈 **Métricas**: Total de produtos, pedidos, clientes, receita
- 🛍️ **Produtos**: Lista dos produtos mais recentes
- 📦 **Pedidos**: Histórico de pedidos
- 🔄 **Atualização**: Botão para refresh dos dados
- ✅ **Confirmação**: Integração funcionando

## 🚀 **Próximos Passos**

1. ✅ **Teste** a integração com `/yampi-test`
2. 🔗 **Configure** o Supabase (se necessário)
3. 📊 **Explore** os dados da sua loja
4. 🔄 **Integre** com o sistema principal

---

**Erro Corrigido** ✅ | **Teste Disponível** ✅ | **Documentação Atualizada** ✅ 