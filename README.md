# 🚀 Sistema de Agentes de IA

> **Plataforma completa de automação e IA** integrada com WhatsApp Business, e-commerce e email marketing.

## 📋 Início Rápido

```bash
# Clone e configure
git clone [repositorio]
cd "Agentes de IA"
npm install

# Execute
npm run dev
# Acesse: http://localhost:3000
```

## 🚀 Deploy para Produção

### Deploy Automático (Recomendado)
Configure um servidor de produção completo em **20-30 minutos**:

```bash
# Em seu VPS Ubuntu 22.04:
sudo bash deploy-completo-automatico.sh
```

### Deploy Manual
Para controle total do processo:

```bash
# 1. Configurar servidor
sudo bash setup-servidor-zero.sh

# 2. Configurar SSL e domínio
bash configurar-dominio-ssl.sh

# 3. Deploy da aplicação
cp env.producao.example .env.production
nano .env.production  # editar configurações
docker-compose -f docker-compose.production.yml up -d
```

### 📚 Documentação de Deploy
- **[GUIA_COMPLETO_SERVIDOR_ZERO.md](GUIA_COMPLETO_SERVIDOR_ZERO.md)** - Passo a passo detalhado
- **[RESUMO_EXECUTIVO_SERVIDOR_ZERO.md](RESUMO_EXECUTIVO_SERVIDOR_ZERO.md)** - Visão executiva

**Resultado**: Servidor completo com SSL, monitoramento, backup automático e todas as integrações funcionando.

## 🎯 O que Este Sistema Faz

- ✅ **WhatsApp Automatizado**: Conversas em tempo real com IA
- ✅ **E-commerce Yampi**: Dashboard e sincronização de vendas  
- ✅ **Email Marketing**: Campanhas automatizadas com Mailgun
- ✅ **Analytics Completo**: Monitoramento de usuários e performance
- ✅ **Agentes de IA**: Personalizados para diferentes tarefas

## 📚 Documentação

### 🎯 **Leia Primeiro**: [`GUIA_COMPLETO_SISTEMA.md`](GUIA_COMPLETO_SISTEMA.md)
**Seu guia principal!** Contém tudo que você precisa saber em um formato humanizado.

### 📁 **Documentação Técnica**: [`docs/`](docs/)
Referências detalhadas organizadas por tópico.

## 🚀 Tecnologias

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **IA**: Google Gemini AI
- **WhatsApp**: Evolution API
- **Email**: Mailgun
- **Estado**: Zustand + React Query

## ⚙️ Configuração Essencial

Crie `.env.local`:
```env
VITE_GOOGLE_GEMINI_API_KEY=sua-chave-gemini
VITE_SUPABASE_URL=sua-url-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-supabase
```

## 🔌 Integrações Disponíveis

### ✅ Funcionando
- **Google Gemini AI**: Sistema de IA completo
- **Supabase**: Banco de dados e autenticação
- **Analytics**: Sistema interno de monitoramento

### 🔄 Configure Conforme Necessário
- **WhatsApp**: Precisa de VPS com Evolution API
- **Yampi**: Precisa de credenciais da loja
- **Email Marketing**: Precisa de conta Mailgun

## 🎉 Status Atual

- ✅ **Sistema funcionando** localmente
- ✅ **IA configurada** e operacional
- ✅ **Interface moderna** e responsiva
- ✅ **Analytics implementado**
- ✅ **Documentação completa**
- ✅ **Performance otimizada** (lazy loading, React Query, WebSocket)

## 📊 Funcionalidades Principais

### 🤖 Agentes de IA
- **Knowledge Assistant**: Base de conhecimento empresarial
- **Buddy**: Onboarding de funcionários
- **Data Analyst**: Análise de dados
- **Agentes personalizáveis** com prompts específicos

### 💬 Chat Inteligente
- Interface de chat em tempo real
- Histórico de conversas
- Sistema de feedback
- Suporte a markdown

### 📱 WhatsApp Business
- Integração com Evolution API
- Resposta automática via IA
- Múltiplas instâncias
- Horários comerciais
- Interface igual WhatsApp Web

### 🛒 E-commerce Yampi
- Dashboard de vendas em tempo real
- Sincronização de produtos/pedidos
- Métricas automáticas

### 📧 Email Marketing
- Campanhas em massa
- Templates personalizáveis
- Recuperação de vendas
- Analytics de entrega

### 📊 Analytics Interno
- Métricas de usuários e performance
- Logs do sistema
- Alertas automáticos
- Dashboard para administradores

## 🚀 Performance

### Otimizações Implementadas
- **Lazy Loading**: Bundle reduzido de 2MB para 800KB
- **React Query**: Cache automático e sincronização
- **WebSocket**: Mensagens em tempo real
- **Stores Modulares**: Re-renders otimizados

### Capacidade
- **200-500 usuários** simultâneos
- **Múltiplas instâncias** WhatsApp
- **5.000 emails/mês** grátis
- **Performance profissional**

## 🎨 Design System

**Tema "Azul Inteligente"** com interface moderna e responsiva:
- Componentes Shadcn/ui
- Tailwind CSS
- Framer Motion
- Design mobile-first

## 📦 Como Usar

1. **Configure o básico**: Supabase + Gemini AI
2. **Execute localmente**: `npm run dev`
3. **Configure integrações**: WhatsApp, Yampi, Email conforme necessário
4. **Deploy**: Vercel, Netlify ou VPS

## 🧪 Testes Automatizados

Sistema completo de testes implementado para garantir qualidade:

### Configuração Rápida
```bash
# Instalar e configurar testes
node setup-tests.js

# Executar testes unitários
npm run test

# Executar testes E2E
npm run test:e2e
```

### Tipos de Teste
- ✅ **Testes Unitários** (Vitest): Stores e serviços
- ✅ **Testes E2E** (Playwright): Fluxos críticos
- ✅ **Cobertura de Código**: Relatórios detalhados
- ✅ **Testes Mobile**: Responsividade em dispositivos

### Fluxos Testados
- **Autenticação**: Login, logout, validações
- **Chat com IA**: Mensagens, agentes, respostas
- **WhatsApp**: Instâncias, conversas, QR codes
- **Performance**: Tempo de carregamento, erros JS

**📚 Documentação completa**: [`tests/README.md`](tests/README.md)

## 🛠️ Troubleshooting

**Problemas comuns? Consulte**: [`GUIA_COMPLETO_SISTEMA.md`](GUIA_COMPLETO_SISTEMA.md)

Lá você encontra soluções para:
- WhatsApp não conecta
- Supabase erro de conexão  
- Yampi erro de permissões
- Performance lenta

## 📞 Suporte

Para dúvidas:
1. Consulte a documentação
2. Verifique logs no console (F12)
3. Execute os testes: `npm run test`
4. Teste componentes individuais

# Testes unitários
`npm run test`                # Modo watch
`npm run test -- --run`       # Execução única
`npm run test:coverage`       # Com cobertura

# Testes E2E
`npm run test:e2e`            # Playwright headless
`npm run test:e2e:ui`         # Interface visual
`npm run test:e2e:headed`     # Com browser visível

# Todos os testes
`npm run test:all`            # Unitários + E2E

---

**Construído com ❤️ para automatizar e escalar seu negócio!** 🚀

**Próximos passos**: Leia o [`GUIA_COMPLETO_SISTEMA.md`](GUIA_COMPLETO_SISTEMA.md) para configuração completa. 