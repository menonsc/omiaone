# ⚡ DEPLOY RÁPIDO - Escolha sua Opção

## 🌐 Domínio: `producao.elevroi.com.br`

## 🚨 Problema: Conflitos de Porta + Serviços não iniciam
- ❌ PostgreSQL (porta 5432) ocupada
- ❌ Uptime Kuma (porta 3001) ocupada  
- ❌ Docker Swarm mode (limitações)
- ❌ nginx-proxy, prometheus, websocket não iniciam

## ✅ 4 SOLUÇÕES PRONTAS

### 🎯 OPÇÃO 1: Portas Alternativas
```yaml
Arquivo: portainer-stack-swarm-simple.yml
Portas: PostgreSQL 5433, WebSocket 3002
Variáveis: 3 obrigatórias
```

### 🎯 OPÇÃO 2: Sem Exposição  
```yaml
Arquivo: portainer-stack-swarm-simple-sem-portas.yml
Portas: Apenas internas (mais seguro)
Variáveis: 3 obrigatórias
```

### 🎯 OPÇÃO 3: Mínima ⭐
```yaml
Arquivo: portainer-stack-swarm-minimal.yml
Portas: Zero conflitos
Variáveis: Apenas 2 obrigatórias
```

### 🎯 OPÇÃO 4: Ultra-Simples (FUNCIONANDO) ✅
```yaml
Arquivo: portainer-stack-swarm-simples.yml
Serviços: Frontend + PostgreSQL + Redis + Grafana + Prometheus
Portas: 4000 (Grafana), 9090 (Prometheus), 5433 (PostgreSQL)
Variáveis: Apenas 2 obrigatórias
Remove: nginx-proxy e websocket que não iniciam
Domínio: Configurado para producao.elevroi.com.br
Status: ✅ TODOS OS SERVIÇOS 1/1
```

### 🎯 OPÇÃO 5: Com WebSocket (UPGRADE) 🔌
```yaml
Arquivo: portainer-stack-swarm-com-websocket.yml
Serviços: OPÇÃO 4 + WebSocket Server
Portas: 4000 (Grafana), 9090 (Prometheus), 3002 (WebSocket)
Variáveis: Apenas 2 obrigatórias
WebSocket: Servidor simplificado com página de teste
Ideal: Para upgrade após OPÇÃO 4 funcionar
```

---

## 🚀 DEPLOY EM 3 PASSOS

### 1️⃣ Escolha a stack
- **✅ Você já tem OPÇÃO 4 funcionando?** → Use **OPÇÃO 5** (adiciona WebSocket)
- **🚨 Problemas de inicialização?** → Use **OPÇÃO 4** (estável)

### 2️⃣ Configure variáveis

**Para OPÇÃO 3, 4 e 5** (apenas 2):
```env
SUPABASE_DB_PASSWORD=SuaSenhaPostgres123
GRAFANA_PASSWORD=SuaSenhaGrafana123
```

**Para OPÇÃO 1 e 2** (3 variáveis):
```env
SUPABASE_DB_PASSWORD=SuaSenhaPostgres123
GRAFANA_PASSWORD=SuaSenhaGrafana123
GRAFANA_USER=admin
```

### 3️⃣ Deploy no Portainer
1. **Stacks** → **Add Stack**
2. **Nome**: `agentes-ia-swarm`
3. **Cole a stack** escolhida
4. **Adicione as variáveis**
5. **Deploy** ✅

---

## 📱 Acessos Após Deploy

### OPÇÃO 1 (portas alternativas):
- Frontend: `http://sua-vps-ip`
- Grafana: `http://sua-vps-ip:4000`
- Prometheus: `http://sua-vps-ip:9090`
- WebSocket: `http://sua-vps-ip:3002`

### OPÇÃO 2 (sem exposição):
- Frontend: `http://sua-vps-ip`
- Grafana: `http://sua-vps-ip:4000`
- Prometheus: `http://sua-vps-ip:9090`
- WebSocket: apenas interno

### OPÇÃO 3 (mínima):
- Frontend: `http://sua-vps-ip`
- Grafana: `http://sua-vps-ip:4001`
- Prometheus: `http://sua-vps-ip:9091`

### OPÇÃO 4 (ultra-simples - FUNCIONANDO):
- Frontend: `http://producao.elevroi.com.br` ou `http://sua-vps-ip`
- Grafana: `http://producao.elevroi.com.br:4000`
- Prometheus: `http://producao.elevroi.com.br:9090`
- PostgreSQL: porta 5433

### OPÇÃO 5 (com WebSocket):
- Frontend: `http://producao.elevroi.com.br`
- WebSocket: `http://producao.elevroi.com.br:3002`
- Grafana: `http://producao.elevroi.com.br:4000`
- Prometheus: `http://producao.elevroi.com.br:9090`
- PostgreSQL: porta 5433

---

## ⚡ Qual Escolher?

| Se você quer... | Use |
|------------------|-----|
| **✅ Stack funcionando (base estável)** | **OPÇÃO 4** |
| **🔌 Adicionar WebSocket (upgrade)** | **OPÇÃO 5** |
| **Testar rapidamente** | OPÇÃO 3 |
| **Sistema completo com acesso externo** | OPÇÃO 1 |
| **Sistema completo mais seguro** | OPÇÃO 2 |

---

## 🆘 Se der erro:

1. **Verifique se as variáveis estão corretas**
2. **Veja os logs no Portainer** (Services → Logs)
3. **Confirme que está usando Docker Swarm**

**Pronto! Sistema funcionando! 🎉** 