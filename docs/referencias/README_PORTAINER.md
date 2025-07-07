# 🚀 Deploy no Portainer com Traefik

Este guia explica como fazer o deploy do Sistema de Agentes de IA no Portainer usando Traefik como reverse proxy.

## 📋 Pré-requisitos

- ✅ Portainer configurado
- ✅ Traefik configurado no Portainer
- ✅ Rede `network_public` criada
- ✅ Domínio `producao.elevroi.com` apontando para o servidor
- ✅ Certificado SSL (automático via Let's Encrypt)

## 🔧 Configuração

### 1. Preparar arquivos

```bash
# Execute o script de verificação
./deploy-portainer.sh
```

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env` com suas configurações:

```bash
nano .env
```

**Variáveis obrigatórias:**
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_DB_PASSWORD=your-super-secret-password

# Google Gemini AI
VITE_GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Evolution API (WhatsApp)
VITE_EVOLUTION_API_URL=https://your-evolution-api.com
VITE_EVOLUTION_API_KEY=your-evolution-api-key
VITE_EVOLUTION_INSTANCE_NAME=default

# Grafana
GRAFANA_PASSWORD=admin123
```

### 3. Upload para Portainer

Faça upload dos seguintes arquivos para o Portainer:

```
📁 Arquivos necessários:
├── portainer-stack.yml
├── .env
├── Dockerfile
├── Dockerfile.websocket
├── websocket-server.js
├── prometheus.yml
├── package.json
├── src/ (pasta completa)
└── supabase/ (pasta completa)
```

## 🚀 Deploy no Portainer

### 1. Acessar Portainer
- Abra o Portainer no navegador
- Faça login com suas credenciais

### 2. Criar Stack
- Vá em **Stacks** no menu lateral
- Clique em **Add stack**
- Nome: `agentes-ia`
- Cole o conteúdo do `portainer-stack.yml`

### 3. Configurar variáveis
- Na seção **Environment variables**
- Adicione todas as variáveis do arquivo `.env`

### 4. Deploy
- Clique em **Deploy the stack**
- Aguarde a criação dos containers

## 🌐 URLs de Acesso

Após o deploy, você terá acesso a:

| Serviço | URL | Descrição |
|----------|-----|-----------|
| **Frontend** | https://producao.elevroi.com | Aplicação principal |
| **WebSocket** | wss://producao.elevroi.com/socket.io/ | Conexão tempo real |
| **Prometheus** | https://producao.elevroi.com/prometheus/ | Monitoramento |
| **Grafana** | https://producao.elevroi.com/grafana/ | Dashboards |

## 🔍 Verificação

### 1. Verificar containers
```bash
# No Portainer > Containers
# Verifique se todos os containers estão rodando:
# ✅ agentes-ia-frontend
# ✅ agentes-ia-websocket
# ✅ agentes-ia-supabase
# ✅ agentes-ia-redis
# ✅ agentes-ia-prometheus
# ✅ agentes-ia-grafana
```

### 2. Testar endpoints
```bash
# Health check
curl -f https://producao.elevroi.com/health

# WebSocket
curl -f https://producao.elevroi.com/socket.io/

# Prometheus
curl -f https://producao.elevroi.com/prometheus/

# Grafana
curl -f https://producao.elevroi.com/grafana/
```

### 3. Verificar logs
- No Portainer, vá em **Containers**
- Clique em cada container para ver os logs
- Verifique se não há erros

## 🔐 Configuração de Segurança

### Autenticação básica (opcional)

Para Prometheus e Grafana, você pode adicionar autenticação:

```bash
# Gerar senha hash
htpasswd -nb admin senha123

# Substituir nos labels do Traefik no portainer-stack.yml
# "traefik.http.middlewares.prometheus-auth.basicauth.users=admin:$2y$10$..."
```

### Firewall
```bash
# Abrir portas necessárias
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## 🛠️ Troubleshooting

### Problema: Container não inicia
```bash
# Verificar logs
docker logs agentes-ia-frontend
docker logs agentes-ia-websocket

# Verificar recursos
docker stats
```

### Problema: SSL não funciona
```bash
# Verificar Traefik
docker logs traefik

# Verificar DNS
nslookup producao.elevroi.com
```

### Problema: WebSocket não conecta
```bash
# Verificar configuração do Traefik
# Certifique-se de que os labels estão corretos
# Verificar logs do WebSocket
docker logs agentes-ia-websocket
```

## 📊 Monitoramento

### Prometheus
- URL: https://producao.elevroi.com/prometheus/
- Métricas do sistema, containers, aplicação

### Grafana
- URL: https://producao.elevroi.com/grafana/
- Login: admin / senha configurada
- Dashboards para visualização

## 🔄 Atualizações

### Atualizar aplicação
1. Faça as alterações no código
2. Faça commit e push
3. No Portainer, vá em **Stacks**
4. Clique em **Update the stack**
5. Aguarde o redeploy

### Backup
```bash
# Backup do banco
docker exec agentes-ia-supabase pg_dump -U postgres > backup.sql

# Backup dos volumes
docker run --rm -v agentes-ia_supabase_data:/data -v $(pwd):/backup alpine tar czf /backup/supabase_backup.tar.gz -C /data .
```

## 📞 Suporte

Se encontrar problemas:

1. ✅ Verifique os logs dos containers
2. ✅ Confirme as configurações do Traefik
3. ✅ Teste a conectividade de rede
4. ✅ Verifique as variáveis de ambiente

---

**🎯 Sistema configurado para produção com:**
- 🔒 SSL automático
- 🌐 Domínio personalizado
- 📊 Monitoramento completo
- 🔄 Deploy automatizado
- 🛡️ Segurança configurada 