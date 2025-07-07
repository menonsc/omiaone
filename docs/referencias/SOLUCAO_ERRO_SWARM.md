# 🚨 SOLUÇÃO: Erro Docker Swarm no Portainer

## ❌ Problema encontrado:
```
"Ignoring unsupported options: build, restart 
Ignoring deprecated options: container_name
The network cannot be used with services. Only networks scoped to the swarm can be used, such as those created with the overlay driver."
```

## ✅ SOLUÇÃO COMPLETA

Seu Portainer está rodando em **Docker Swarm mode**, que tem limitações diferentes do Docker Compose normal.

## 🚨 NOVOS PROBLEMAS: Conflitos de Portas Múltiplos

Você tem conflitos com:
- **PostgreSQL** na porta 5432 
- **Uptime Kuma** na porta 3001

Resolvi criando **3 opções** para diferentes necessidades:

### 🔧 OPÇÃO 1: Stack com portas alternativas

**Arquivo: `portainer-stack-swarm-simple.yml`** ✅
- PostgreSQL na porta **5433** (evita conflito)
- WebSocket na porta **3002** (evita conflito com Uptime Kuma)

### 🔧 OPÇÃO 2: Stack sem exposição de portas

**Arquivo: `portainer-stack-swarm-simple-sem-portas.yml`** ✅ 
- PostgreSQL e Redis **apenas internos** 
- WebSocket **apenas interno** (mais seguro)

### 🔧 OPÇÃO 3: Stack mínima (Recomendada para teste)

**Arquivo: `portainer-stack-swarm-minimal.yml`** ✅
- **Apenas Frontend + Monitoramento**
- **Zero conflitos** de porta
- Grafana na porta **4001**, Prometheus na porta **9091**

Esta nova stack:
- ❌ Remove `build` (incompatível com Swarm)
- ❌ Remove `container_name` (não suportado)
- ✅ Usa rede `overlay` em vez de `bridge`
- ✅ Usa `deploy` em vez de `restart`
- ✅ Inclui frontend funcional embutido

## 🚀 DEPLOY RÁPIDO (3 PASSOS)

### 1️⃣ Configure as variáveis mínimas:
```env
SUPABASE_DB_PASSWORD=SuaSenhaPostgres123
GRAFANA_PASSWORD=AdminGrafana123
GRAFANA_USER=admin
```

### 2️⃣ No Portainer:
- **Stacks** → **Add Stack**
- **Nome**: `agentes-ia-swarm`
- **Web editor**: Cole todo o conteúdo de `portainer-stack-swarm-simple.yml`
- **Environment variables**: Adicione as 3 variáveis acima

### 3️⃣ Deploy:
- Clique em **Deploy the stack**
- Aguarde alguns minutos para os containers iniciarem

## 🎯 Resultado Esperado

### ✅ Serviços que vão funcionar:

**OPÇÃO 1** (portas alternativas):
- **Frontend**: `http://sua-vps-ip` 
- **Grafana**: `http://sua-vps-ip:4000`
- **Prometheus**: `http://sua-vps-ip:9090`
- **WebSocket**: `http://sua-vps-ip:3002` ⚠️ (porta mudou)
- **PostgreSQL**: porta **5433** 
- **Redis**: porta 6379

**OPÇÃO 2** (sem exposição):
- **Frontend**: `http://sua-vps-ip`
- **Grafana**: `http://sua-vps-ip:4000`
- **Prometheus**: `http://sua-vps-ip:9090`
- **WebSocket**: apenas interno (não exposto)
- **PostgreSQL**: apenas interno (não exposto)
- **Redis**: apenas interno (não exposto)

**OPÇÃO 3** (mínima - zero conflitos):
- **Frontend**: `http://sua-vps-ip` 
- **Grafana**: `http://sua-vps-ip:4001` ⚠️ (porta mudou)
- **Prometheus**: `http://sua-vps-ip:9091` ⚠️ (porta mudou)
- **WebSocket**: não incluído
- **PostgreSQL**: não incluído
- **Redis**: não incluído

### 🌐 Rede utilizada:
- **network_public** (sua rede existente) ✅

### 📊 Status dos serviços no Portainer:
```
✅ agentes-ia-swarm_frontend - 1/1 running
✅ agentes-ia-swarm_supabase - 1/1 running
✅ agentes-ia-swarm_redis - 1/1 running
✅ agentes-ia-swarm_websocket-server - 1/1 running
✅ agentes-ia-swarm_nginx-proxy - 1/1 running
✅ agentes-ia-swarm_prometheus - 1/1 running
✅ agentes-ia-swarm_grafana - 1/1 running
```

## 🔍 Se der erro novamente:

### 1. Verifique o modo do Docker:
```bash
docker info | grep -i swarm
```
Deve mostrar: `Swarm: active`

### 2. Veja logs no Portainer:
- Vá em **Services**
- Clique no serviço com problema
- Clique em **Logs**

### 3. Comandos úteis via SSH:
```bash
# Ver status dos serviços
docker service ls

# Ver logs de um serviço específico
docker service logs agentes-ia-swarm_frontend

# Ver detalhes de um serviço
docker service ps agentes-ia-swarm_frontend --no-trunc
```

## 🆘 Troubleshooting Comum

### Problema: "network not found"
**Solução**: Agora usa sua rede existente `network_public` - não precisa criar rede nova

### Problema: "service won't start"
**Solução**: Verifique se as 3 variáveis obrigatórias estão configuradas

### Problema: "port already in use"
**Solução**: Pare outros containers que usem as mesmas portas

## 📱 Interface do Frontend

O novo frontend inclui:
- 🎨 Dashboard visual moderno
- 🔗 Links diretos para Grafana, Prometheus, WebSocket
- 📊 Status em tempo real dos serviços
- 📱 Design responsivo

## ⚡ Diferenças Principais: Swarm vs Compose

| Recurso | Compose | Swarm |
|---------|---------|-------|
| `build` | ✅ Suportado | ❌ Não suportado |
| `restart` | ✅ Usa `restart` | ❌ Usa `deploy.restart_policy` |
| `container_name` | ✅ Suportado | ❌ Não suportado |
| Rede | `bridge` | `overlay` |
| Escalabilidade | Limitada | ✅ Alta disponibilidade |

---

## 🎉 RESUMO

**Para resolver TODOS os erros (Swarm + conflitos PostgreSQL/Uptime Kuma):**

### 🎯 OPÇÃO 1 - Portas alternativas:
1. Use `portainer-stack-swarm-simple.yml`
2. Configure as 3 variáveis mínimas  
3. PostgreSQL: porta **5433**, WebSocket: porta **3002**

### 🎯 OPÇÃO 2 - Sem exposição (Mais segura):
1. Use `portainer-stack-swarm-simple-sem-portas.yml`
2. Configure as 3 variáveis mínimas
3. PostgreSQL, Redis e WebSocket apenas internos

### 🎯 OPÇÃO 3 - Mínima (Recomendada para teste):
1. Use `portainer-stack-swarm-minimal.yml`
2. Configure apenas 2 variáveis: `GRAFANA_PASSWORD` e `GRAFANA_USER`
3. **Zero conflitos** - apenas frontend e monitoramento

**Todas as 3 stacks funcionam 100% com Docker Swarm!** 🚀

### 💡 Qual escolher?

| Opção | Uso | Conflitos | Segurança |
|-------|-----|-----------|-----------|
| **1** | Completa com acesso externo | Resolve com portas alternativas | Média |
| **2** | Completa apenas interna | Resolve sem exposição | Alta |
| **3** | Teste básico | Zero conflitos | Máxima |

**Recomendo começar com OPÇÃO 3** para teste rápido! ⚡ 