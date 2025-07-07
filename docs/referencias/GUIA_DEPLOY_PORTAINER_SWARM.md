# 🚀 Guia de Deploy no Portainer - Docker Swarm Mode

## ⚠️ Diferenças do Docker Swarm

Seu Portainer está rodando em **Docker Swarm mode**, que tem algumas limitações:

- ❌ Não suporta `build` (imagens devem estar prontas)
- ❌ Não suporta `container_name`
- ❌ Usa rede `overlay` em vez de `bridge`
- ✅ Suporta alta disponibilidade e escalabilidade

## 📋 Pré-requisitos

- ✅ Docker Swarm inicializado
- ✅ Portainer instalado no Swarm
- ✅ Acesso SSH à VPS (se necessário)

## 🛠️ Opções de Deploy

### **OPÇÃO 1: Stack Simples (Recomendada)**

Use `portainer-stack-swarm-simple.yml` que não precisa de imagens customizadas.

#### Passos:

1. **No Portainer:**
   - Vá em **Stacks** → **Add Stack**
   - Nome: `agentes-ia-swarm`
   - Cole o conteúdo de `portainer-stack-swarm-simple.yml`

2. **Configure as variáveis:**
   ```env
   SUPABASE_DB_PASSWORD=senha-super-secreta-123
   GRAFANA_PASSWORD=admin-grafana-123
   GRAFANA_USER=admin
   ```

3. **Deploy da stack**

### **OPÇÃO 2: Stack Completa (Avançada)**

Use `portainer-stack-swarm.yml` com suas imagens customizadas.

#### Pré-requisitos adicionais:
- Construir e fazer push das imagens para um registry
- Configurar configs no Swarm

## 🎯 Deploy da Stack Simples (Recomendado)

### 1. Acesse o Portainer
```
http://sua-vps-ip:9000
```

### 2. Criar a Stack

1. **Stacks** → **Add Stack**
2. **Nome**: `agentes-ia-swarm`
3. **Build method**: Web editor

### 3. Cole a configuração

Copie e cole o conteúdo completo de `portainer-stack-swarm-simple.yml`

### 4. Configure variáveis de ambiente

**MÍNIMAS OBRIGATÓRIAS:**
```env
SUPABASE_DB_PASSWORD=SuaSenhaPostgres123
GRAFANA_PASSWORD=SuaSenhaGrafana123
GRAFANA_USER=admin
```

**COMPLETAS (se quiser integrar com APIs):**
```env
SUPABASE_DB_PASSWORD=senha-super-secreta-123
GRAFANA_PASSWORD=admin-grafana-123
GRAFANA_USER=admin
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-supabase
VITE_GOOGLE_GEMINI_API_KEY=sua-chave-gemini-ai
VITE_EVOLUTION_API_URL=https://api.seudominio.com.br
VITE_EVOLUTION_API_KEY=sua-chave-evolution-api
VITE_EVOLUTION_INSTANCE_NAME=elevroi
VITE_WEBSOCKET_URL=wss://seudominio.com.br:3001
```

### 5. Deploy

Clique em **Deploy the stack**

## 🔍 Verificação do Deploy

### Status dos Serviços

No Portainer, vá em **Services** e verifique:

- ✅ `agentes-ia-swarm_frontend` - 1/1 running
- ✅ `agentes-ia-swarm_supabase` - 1/1 running  
- ✅ `agentes-ia-swarm_redis` - 1/1 running
- ✅ `agentes-ia-swarm_websocket-server` - 1/1 running
- ✅ `agentes-ia-swarm_nginx-proxy` - 1/1 running
- ✅ `agentes-ia-swarm_prometheus` - 1/1 running
- ✅ `agentes-ia-swarm_grafana` - 1/1 running

### Testar Acesso

- **🌐 Frontend**: `http://sua-vps-ip`
- **📊 Grafana**: `http://sua-vps-ip:4000`
  - Login: `admin` / `sua-senha-grafana`
- **🔍 Prometheus**: `http://sua-vps-ip:9090`
- **🔌 WebSocket**: `http://sua-vps-ip:3001`
- **🗄️ PostgreSQL**: `sua-vps-ip:5432`

## 🏗️ Arquitetura do Swarm

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Swarm                        │
├─────────────────────────────────────────────────────────┤
│  Nginx (80/443) → Frontend + WebSocket                 │
│  ↓                                                      │
│  PostgreSQL (5432) ← Redis (6379)                      │
│  ↓                                                      │
│  Prometheus (9090) → Grafana (4000)                    │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Comandos Docker Swarm

```bash
# Ver serviços da stack
docker service ls

# Ver logs de um serviço
docker service logs agentes-ia-swarm_frontend

# Escalar um serviço
docker service scale agentes-ia-swarm_frontend=2

# Ver tasks de um serviço
docker service ps agentes-ia-swarm_frontend

# Atualizar um serviço
docker service update agentes-ia-swarm_frontend

# Remover a stack
docker stack rm agentes-ia-swarm
```

## 🚨 Troubleshooting

### Problema: Serviço não inicia

**Verificar:**
```bash
docker service ps agentes-ia-swarm_frontend --no-trunc
docker service logs agentes-ia-swarm_frontend
```

### Problema: Rede não conecta

**Verificar:**
```bash
docker network ls
docker network inspect agentes-ia-swarm_agentes-ia-network
```

### Problema: Volume não persiste

**Verificar:**
```bash
docker volume ls
docker volume inspect agentes-ia-swarm_supabase_data
```

## 🔄 Atualizações

Para atualizar a stack:

1. No Portainer, vá na stack `agentes-ia-swarm`
2. Clique em **Editor**
3. Faça as modificações
4. Clique em **Update the stack**

## 📊 Monitoramento

### Grafana Dashboards

Acesse: `http://sua-vps-ip:4000`

**Dashboards sugeridos:**
- Node Exporter Full
- Docker Swarm Overview  
- PostgreSQL Database
- Redis Overview

### Prometheus Targets

Acesse: `http://sua-vps-ip:9090/targets`

Verifique se todos os targets estão **UP**.

## 🎯 Próximos Passos

1. ✅ **Deploy realizado**
2. 🔒 **Configurar SSL** (se necessário)
3. 📊 **Configurar dashboards** no Grafana
4. 💾 **Configurar backups**
5. 🔍 **Monitorar logs** e métricas
6. 🚀 **Escalar serviços** conforme necessário

## 📝 Backup no Swarm

```bash
# Backup do banco
docker exec $(docker ps -q -f name=agentes-ia-swarm_supabase) pg_dump -U postgres postgres > backup.sql

# Backup dos volumes
docker run --rm -v agentes-ia-swarm_grafana_data:/data -v $(pwd):/backup alpine tar czf /backup/grafana-backup.tar.gz -C /data .
```

---

🎉 **Parabéns!** Sua aplicação está rodando no Docker Swarm com alta disponibilidade! 