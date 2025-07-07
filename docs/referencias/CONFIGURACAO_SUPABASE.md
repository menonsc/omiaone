# 🗄️ Configuração do Supabase

Este guia explica como configurar o banco de dados Supabase para que o sistema funcione completamente, incluindo a integração Yampi.

## 📋 **Pré-requisitos**

- Conta no [Supabase](https://supabase.com)
- Node.js instalado

## 🚀 **Passo a Passo**

### 1. **Criar Projeto no Supabase**

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login ou crie uma conta
4. Clique em "New Project"
5. Escolha sua organização
6. Preencha:
   - **Name**: Nome do seu projeto (ex: "agentes-ia")
   - **Database Password**: Senha forte (anote!)
   - **Region**: Escolha a região mais próxima

### 2. **Obter Credenciais**

1. Após criar o projeto, vá em **Settings** → **API**
2. Copie as seguintes informações:
   - **Project URL**: https://seu-projeto.supabase.co
   - **anon public key**: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...`
   - **service_role key**: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...`

### 3. **Configurar Variáveis de Ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Para desenvolvimento
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### 4. **Executar Migrations**

Execute as migrations para criar as tabelas:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Conectar ao projeto
supabase link --project-ref SEU_PROJECT_REF

# Executar migrations
supabase db push
```

**Ou execute manualmente no SQL Editor do Supabase:**

#### 4.1 **Schema Inicial**
```sql
-- Copie e cole o conteúdo de: supabase/migrations/001_initial_schema.sql
```

#### 4.2 **Email Marketing**
```sql
-- Copie e cole o conteúdo de: supabase/migrations/002_email_marketing_schema.sql
```

#### 4.3 **Integrações**
```sql
-- Copie e cole o conteúdo de: supabase/migrations/003_integrations_schema.sql
```

### 5. **Configurar Autenticação**

1. Vá em **Authentication** → **Settings**
2. Configure:
   - **Site URL**: `http://localhost:3000` (para desenvolvimento)
   - **Redirect URLs**: `http://localhost:3000/**`

### 6. **Testar Conexão**

Execute o projeto e teste se está funcionando:

```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 🛒 **Testar Integração Yampi**

### Opção 1: **Versão Local (Sem Banco)**
Para testar rapidamente sem configurar o banco:

1. Acesse: `http://localhost:3000/yampi-test`
2. Preencha suas credenciais Yampi
3. Teste a conexão

### Opção 2: **Versão Completa (Com Banco)**
Para usar o sistema completo:

1. Faça login no sistema
2. Vá em **Configurações** → **Integrações**
3. Configure a integração Yampi
4. Teste a conexão

## 🔑 **Credenciais Yampi**

Para obter suas credenciais Yampi:

1. Acesse o painel da sua loja Yampi
2. Vá em **Configurações** → **Integrações** → **API**
3. Copie:
   - **Token de Acesso** (User-Token)
   - **Chave Secreta** (User-Secret-Key)
   - **Alias da Loja** (está na URL da sua loja)

## 📂 **Estrutura do Banco**

O sistema criará as seguintes tabelas:

### **profiles**
- Perfis de usuário
- Configurações pessoais

### **integrations**
- Configurações de integrações
- Credenciais criptografadas
- Status de conexão

### **integration_sync_logs**
- Histórico de sincronizações
- Logs de erros
- Métricas de performance

### **email_campaigns**
- Campanhas de email marketing
- Templates e configurações

## 🔒 **Segurança**

- ✅ **Row Level Security (RLS)** habilitado
- ✅ **Credenciais criptografadas**
- ✅ **Acesso por usuário**
- ✅ **Tokens de acesso limitados**

## 🐛 **Troubleshooting**

### Erro: "Invalid API key"
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o projeto está ativo no Supabase

### Erro: "Forbidden"
- Verifique se o RLS está configurado corretamente
- Confirme se o usuário tem permissões

### Erro: "Connection failed"
- Verifique a conexão com internet
- Confirme se a URL do Supabase está correta

### Yampi: "Missing User-Secret-Key header"
- Certifique-se de preencher o campo "Chave Secreta"
- Verifique se copiou a chave correta do painel Yampi

## 📞 **Suporte**

Se precisar de ajuda:

1. **Logs**: Abra o console do navegador (F12)
2. **Network**: Veja as requisições na aba Network
3. **Supabase**: Verifique os logs no painel do Supabase

## 🚀 **Próximos Passos**

Após configurar:

1. ✅ **Teste a integração Yampi**
2. 🔄 **Configure outras integrações**
3. 📊 **Explore o dashboard**
4. 🤖 **Configure seus agentes de IA**
5. 📧 **Configure email marketing**

---

**Versão**: 1.1 | **Data**: Dezembro 2024 