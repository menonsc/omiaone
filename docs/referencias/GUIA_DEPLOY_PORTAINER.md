# 🚀 Guia de Deploy no Portainer - Agentes de IA

## 📋 Pré-requisitos

- ✅ Docker instalado na VPS
- ✅ Portainer instalado e funcionando
- ✅ Acesso SSH à VPS
- ✅ Domínio configurado (opcional)

## 🛠️ Preparação da VPS

### 1. Criar diretórios de dados persistentes

```bash
sudo mkdir -p /opt/agentes-ia/data/{supabase,redis,prometheus,grafana}
sudo chown -R 1000:1000 /opt/agentes-ia/data
sudo chmod -R 755 /opt/agentes-ia/data
```

### 2. Copiar arquivos de configuração

Faça upload dos seguintes arquivos para sua VPS:

- `nginx-proxy.conf`
- `prometheus.yml`
- Diretório `supabase/migrations/`
- Certificados SSL (se usar HTTPS)

## 🐳 Deploy no Portainer

### 1. Acessar o Portainer

- Acesse: `http://sua-vps-ip:9000`
- Faça login com suas credenciais

### 2. Criar nova Stack

1. Vá em **Stacks** → **Add Stack**
2. Nome da stack: `agentes-ia-production`
3. Build method: **Web editor**

### 3. Configurar variáveis de ambiente

Na seção **Environment variables**, adicione:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-supabase
SUPABASE_DB_PASSWORD=senha-super-secreta-postgres-123
VITE_GOOGLE_GEMINI_API_KEY=sua-chave-gemini-ai
VITE_EVOLUTION_API_URL=https://api.seudominio.com.br
VITE_EVOLUTION_API_KEY=sua-chave-evolution-api
VITE_EVOLUTION_INSTANCE_NAME=elevroi
VITE_WEBSOCKET_URL=wss://seudominio.com.br:3001
REDIS_PASSWORD=senha-redis-123
GRAFANA_PASSWORD=admin-grafana-123
GRAFANA_USER=admin
DOMAIN=seudominio.com.br
```

### 4. Cole o conteúdo da stack

Copie todo o conteúdo do arquivo `portainer-stack-production.yml` no editor.

### 5. Deploy

1. Clique em **Deploy the stack**
2. Aguarde o download das imagens e inicialização dos containers

## 🔍 Verificação do Deploy

### 1. Status dos containers

No Portainer, vá em **Containers** e verifique se todos os containers estão com status **running**:

- ✅ agentes-ia-frontend
- ✅ agentes-ia-supabase  
- ✅ agentes-ia-redis
- ✅ agentes-ia-websocket
- ✅ agentes-ia-nginx
- ✅ agentes-ia-prometheus
- ✅ agentes-ia-grafana

### 2. Testar aplicação

- **Frontend**: `http://sua-vps-ip` ou `https://seudominio.com.br`
- **WebSocket**: `http://sua-vps-ip:3001/health`
- **Grafana**: `http://sua-vps-ip:4000`
- **Prometheus**: `http://sua-vps-ip:9090`

### 3. Logs dos containers

Se algum container não subir:
1. Clique no container
2. Vá em **Logs**
3. Verifique erros

## 🔧 Configurações Adicionais

### SSL/HTTPS (Recomendado)

1. Copie seus certificados para `/opt/agentes-ia/ssl/`
2. Atualize as variáveis de ambiente:
   ```env
   SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
   SSL_KEY_PATH=/etc/nginx/ssl/key.pem
   ```

### Backup automático

Crie scripts de backup para:
- `/opt/agentes-ia/data/supabase` (banco de dados)
- `/opt/agentes-ia/data/grafana` (dashboards)

### Monitoramento

- **Grafana**: Acesse `http://sua-vps-ip:4000`
  - Usuário: `admin`
  - Senha: definida em `GRAFANA_PASSWORD`

- **Prometheus**: Acesse `http://sua-vps-ip:9090`

## 🚨 Troubleshooting

### Problema: Container não inicia

**Solução**:
```bash
# Verificar logs
docker logs agentes-ia-frontend

# Verificar volumes
sudo ls -la /opt/agentes-ia/data/

# Verificar permissões
sudo chown -R 1000:1000 /opt/agentes-ia/data
```

### Problema: Erro de conexão com banco

**Verificação**:
1. Container `agentes-ia-supabase` está rodando?
2. Variável `SUPABASE_DB_PASSWORD` está correta?
3. Migrations foram aplicadas?

### Problema: WebSocket não conecta

**Verificação**:
1. Container `agentes-ia-websocket` está rodando?
2. Porta 3001 está acessível?
3. Variável `VITE_WEBSOCKET_URL` está correta?

## 📊 Portas utilizadas

- **80**: HTTP (Nginx)
- **443**: HTTPS (Nginx)
- **3001**: WebSocket Server
- **4000**: Grafana
- **5432**: PostgreSQL
- **6379**: Redis
- **9090**: Prometheus

## 🔄 Atualizações

Para atualizar a aplicação:

1. No Portainer, vá na stack `agentes-ia-production`
2. Clique em **Editor**
3. Faça as alterações necessárias
4. Clique em **Update the stack**

## 📝 Comandos úteis

```bash
# Verificar status dos containers
docker ps

# Ver logs de um container específico
docker logs agentes-ia-frontend

# Acessar bash do container
docker exec -it agentes-ia-frontend sh

# Verificar uso de recursos
docker stats

# Backup do banco
docker exec agentes-ia-supabase pg_dump -U postgres postgres > backup.sql
```

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs dos containers
2. Confirme que todas as variáveis de ambiente estão corretas
3. Verifique se as portas estão abertas no firewall
4. Teste a conectividade de rede entre os containers

## ✅ Checklist de Deploy

- [ ] Diretórios criados em `/opt/agentes-ia/data/`
- [ ] Arquivos de configuração copiados
- [ ] Variáveis de ambiente configuradas
- [ ] Stack implantada no Portainer
- [ ] Todos os containers rodando
- [ ] Frontend acessível
- [ ] WebSocket funcionando
- [ ] Grafana acessível
- [ ] Backup configurado
- [ ] SSL configurado (se aplicável)

---

🎉 **Parabéns!** Sua aplicação Agentes de IA está rodando em produção! 