# 🛠️ Troubleshooting - Erros de Compatibilidade no Portainer

## ❌ Erro: "Ignoring unsupported options: build, restart"

### 🔍 Causa do Problema

Este erro ocorre quando o Portainer está usando uma versão mais antiga do Docker Compose que não suporta algumas opções modernas.

### ✅ Soluções

#### **Solução 1: Usar arquivo simplificado**

Use o arquivo `portainer-stack-simple.yml` que é compatível com versões antigas:

```yaml
# Use este arquivo no Portainer
portainer-stack-simple.yml
```

#### **Solução 2: Remover opções problemáticas**

Se ainda der erro, remova estas opções do arquivo:

```yaml
# ❌ REMOVER estas opções:
# - container_name: nome-do-container
# - restart: unless-stopped
# - healthcheck: {...}
# - build: { context: ., dockerfile: ... }

# ✅ USAR estas opções:
build: .
environment:
  - VARIAVEL=valor
networks:
  - network_public
```

#### **Solução 3: Versão mínima**

Se ainda houver problemas, use esta versão mínima:

```yaml
version: '3.7'

services:
  frontend:
    build: .
    environment:
      - NODE_ENV=production
    networks:
      - network_public

  websocket-server:
    build:
      context: .
      dockerfile: Dockerfile.websocket
    environment:
      - NODE_ENV=production
      - PORT=3001
    networks:
      - network_public

  supabase:
    image: supabase/postgres:15.1.0.117
    environment:
      - POSTGRES_PASSWORD=${SUPABASE_DB_PASSWORD}
      - POSTGRES_DB=postgres
      - POSTGRES_USER=postgres
    volumes:
      - supabase_data:/var/lib/postgresql/data
    networks:
      - network_public

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - network_public

volumes:
  supabase_data:
  redis_data:

networks:
  network_public:
    external: true
```

## 🔧 Verificar Versão do Docker Compose

### No Portainer:

1. Vá em **Settings** > **About**
2. Verifique a versão do Docker Compose
3. Se for muito antiga, considere atualizar o Portainer

### Via SSH:

```bash
# Verificar versão do Docker Compose
docker-compose --version

# Verificar versão do Docker
docker --version
```

## 📋 Checklist de Compatibilidade

### ✅ Opções Suportadas (usar):
- `version: '3.7'`
- `build: .`
- `image: nome-da-imagem`
- `environment:`
- `volumes:`
- `networks:`
- `labels:` (para Traefik)

### ❌ Opções Não Suportadas (remover):
- `container_name:`
- `restart:`
- `healthcheck:`
- `build: { context: ., dockerfile: ... }`
- `depends_on:`

## 🚀 Deploy Alternativo

### Se o Portainer continuar com problemas:

1. **Use Docker Compose diretamente:**
   ```bash
   # No servidor via SSH
   docker-compose -f portainer-stack-simple.yml up -d
   ```

2. **Use Docker Swarm:**
   ```bash
   # Converter para Docker Swarm
   docker-compose -f portainer-stack-simple.yml config > docker-stack.yml
   docker stack deploy -c docker-stack.yml agentes-ia
   ```

3. **Use Docker Run:**
   ```bash
   # Executar containers individualmente
   docker run -d --name frontend --network network_public -p 80:80 frontend
   docker run -d --name websocket --network network_public -p 3001:3001 websocket
   ```

## 🔍 Verificar Logs

### Se o deploy funcionar mas os containers não iniciarem:

```bash
# Verificar logs dos containers
docker logs frontend
docker logs websocket-server
docker logs supabase

# Verificar status
docker ps -a
docker-compose ps
```

## 📞 Suporte

### Se o problema persistir:

1. **Verifique a versão do Portainer**
2. **Atualize o Portainer se necessário**
3. **Use a versão mínima do stack**
4. **Considere usar Docker Compose diretamente**

### Comandos úteis:

```bash
# Verificar versões
docker --version
docker-compose --version
portainer --version

# Limpar e recriar
docker-compose down
docker system prune -f
docker-compose up --build -d

# Verificar rede
docker network ls
docker network inspect network_public
```

---

**💡 Dica:** Sempre teste primeiro com a versão mais simples (`portainer-stack-simple.yml`) antes de usar a versão completa. 