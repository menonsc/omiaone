# 📡 Endpoints para Monitoramento Externo

> **Lista completa de todos os endpoints monitorados pelo sistema interno, prontos para configuração no Uptime Kuma**

## 🎯 Como Usar

1. **Copie as URLs** abaixo para o seu Uptime Kuma
2. **Configure cada monitor** com os parâmetros recomendados
3. **Ajuste os intervalos** conforme sua necessidade

## 📋 Lista de Endpoints

### 🌐 Site - Páginas Públicas

| Nome | URL | Método | Intervalo Recomendado |
|------|-----|--------|----------------------|
| Página Inicial | `https://localhost:3000/` | HTTP(S) | 60s |
| Login | `https://localhost:3000/login` | HTTP(S) | 120s |
| Cadastro | `https://localhost:3000/signup` | HTTP(S) | 120s |

### 📱 Aplicação - Páginas Internas

| Nome | URL | Método | Intervalo Recomendado | Nota |
|------|-----|--------|----------------------|------|
| Dashboard | `https://localhost:3000/dashboard` | HTTP(S) | 120s | Requer autenticação |
| Chat IA | `https://localhost:3000/chat` | HTTP(S) | 180s | Requer autenticação |
| WhatsApp | `https://localhost:3000/whatsapp` | HTTP(S) | 180s | Requer autenticação |
| Analytics | `https://localhost:3000/analytics` | HTTP(S) | 300s | Apenas admins |
| Configurações | `https://localhost:3000/settings` | HTTP(S) | 300s | Requer autenticação |

### 🔌 APIs Externas

| Nome | URL Base | Método | Headers Necessários | Intervalo |
|------|----------|--------|-------------------|-----------|
| WhatsApp Evolution API | `{VITE_EVOLUTION_API_URL}` | GET | `apikey: {VITE_EVOLUTION_API_KEY}` | 60s |
| Supabase Database | `{VITE_SUPABASE_URL}/rest/v1/` | GET | `apikey: {VITE_SUPABASE_ANON_KEY}` | 120s |
| Google Gemini AI | `https://generativelanguage.googleapis.com/v1beta/models` | GET | `x-goog-api-key: {VITE_GOOGLE_GEMINI_API_KEY}` | 300s |
| Mailgun API | `https://api.mailgun.net/v3/` | GET | `Authorization: Basic {MAILGUN_API_KEY}` | 300s |

## ⚙️ Configuração no Uptime Kuma

### 📝 Configurações Gerais

```yaml
# Configurações recomendadas para todos os monitors
Timeout: 30 seconds
Retries: 3
Retry Interval: 60 seconds
Heartbeat Interval: 60-300 seconds (conforme tabela)
Max Redirects: 5
```

### 🔐 Monitors com Autenticação

Para páginas que requerem autenticação, você pode:

1. **Usar Health Check Endpoints** (mais recomendado):
   - Criar endpoints `/health` específicos sem autenticação
   - Monitorar apenas a disponibilidade do servidor

2. **Configurar HTTP Basic Auth** (se disponível):
   - Username: `monitor`
   - Password: `{MONITOR_PASSWORD}`

3. **Usar Keywords** para verificar se a página de login carrega:
   - Keyword: "Login" ou "Entrar"
   - Verify SSL: true

### 🚨 Alertas Recomendados

```yaml
# Configuração de notificações
Down Alert:
  - Quando: Serviço fica offline por mais de 2 verificações
  - Ação: Notificar equipe técnica

Performance Alert:
  - Quando: Tempo de resposta > 5000ms por 3 verificações
  - Ação: Investigar performance

SSL Certificate:
  - Quando: Certificado expira em menos de 30 dias
  - Ação: Renovar certificado
```

## 🎯 Configuração Específica por Tipo

### 🌐 Para Páginas Web (HTTP/HTTPS)

```yaml
Monitor Type: HTTP(S)
URL: https://localhost:3000/
Method: HEAD (mais eficiente) ou GET
Expected Status Codes: 200
Keyword: [opcional] - texto que deve aparecer na página
Heartbeat Interval: 60 seconds
```

### 🔌 Para APIs REST

```yaml
Monitor Type: HTTP(S)
URL: https://api.example.com/health
Method: GET
Headers:
  - Authorization: Bearer {TOKEN}
  - Content-Type: application/json
Expected Status Codes: 200
Expected Response: {"status": "ok"}
Heartbeat Interval: 120 seconds
```

### 📊 Para Banco de Dados

```yaml
# Para Supabase (via REST API)
Monitor Type: HTTP(S)
URL: https://your-project.supabase.co/rest/v1/profiles?select=count&limit=1
Method: HEAD
Headers:
  - apikey: your-anon-key
  - Authorization: Bearer your-anon-key
Expected Status Codes: 200, 206
Heartbeat Interval: 180 seconds
```

## 🔄 Script de Importação Automática

Você pode importar todos os endpoints de uma vez usando este script:

```bash
# endpoints.json - arquivo gerado pelo sistema
curl -X POST "http://uptime-kuma:3001/api/monitor" \
  -H "Content-Type: application/json" \
  -d @endpoints.json
```

## 📊 Monitoramento Avançado

### 🎯 Health Checks Personalizados

Para um monitoramento mais preciso, considere criar endpoints específicos:

```typescript
// /api/health/database
{
  "status": "ok",
  "database": "connected",
  "response_time": 45
}

// /api/health/external-apis
{
  "status": "ok",
  "whatsapp": "connected",
  "ai": "connected",
  "email": "connected"
}
```

### 📈 Métricas de Performance

Configure alerts baseados em:

- **Tempo de resposta** > 5 segundos
- **Taxa de erro** > 5% em 10 minutos
- **Disponibilidade** < 99% em 24 horas
- **Certificado SSL** expirando em 30 dias

## 🛠️ Troubleshooting

### ❌ Problemas Comuns

| Problema | Solução |
|----------|---------|
| 403 Forbidden | Verificar headers de autenticação |
| 404 Not Found | Confirmar URL e rotas disponíveis |
| Timeout | Aumentar timeout ou verificar conectividade |
| SSL Error | Verificar certificado e configuração TLS |

### 🔧 Comandos Úteis

```bash
# Testar endpoint manualmente
curl -I https://localhost:3000/

# Testar API com headers
curl -H "Authorization: Bearer token" https://api.example.com/health

# Verificar certificado SSL
openssl s_client -connect localhost:443 -servername localhost
```

## 📞 Suporte

Para questões específicas sobre configuração:

1. **Logs do Sistema**: `/status` (apenas super admins)
2. **Documentação Técnica**: `docs/SISTEMA_MONITORAMENTO_ENDPOINTS.md`
3. **Health Check Interno**: Sistema já monitora automaticamente

---

**Última atualização**: Dezembro 2024  
**Versão**: 1.0.0  
**Compatibilidade**: Uptime Kuma v1.21+ 