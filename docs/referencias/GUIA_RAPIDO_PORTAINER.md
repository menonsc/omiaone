# 🚀 Guia Rápido - Stack no Portainer

## ❌ Erro: "Ignoring unsupported options: build"

### ✅ Solução Imediata

Use o arquivo **`portainer-stack-basic.yml`** que é compatível com qualquer versão do Docker Compose.

## 📋 Passos no Portainer

### 1. Criar Stack
- Vá em **Stacks** no Portainer
- Clique em **Add stack**
- Nome: `agentes-ia`

### 2. Cole este conteúdo:

```yaml
version: '3'

services:
  frontend:
    image: nginx:alpine
    networks:
      - network_public

  supabase:
    image: supabase/postgres:15.1.0.117
    environment:
      - POSTGRES_PASSWORD=your-password
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

### 3. Deploy
- Clique em **Deploy the stack**

## 🔧 Se ainda der erro:

### Versão Ultra Básica:
```yaml
version: '2'

services:
  frontend:
    image: nginx:alpine
    networks:
      - network_public

  supabase:
    image: supabase/postgres:15.1.0.117
    environment:
      - POSTGRES_PASSWORD=your-password
    volumes:
      - supabase_data:/var/lib/postgresql/data
    networks:
      - network_public

volumes:
  supabase_data:

networks:
  network_public:
    external: true
```

## 📝 Arquivos Disponíveis:

1. **`portainer-stack-basic.yml`** - Versão básica (recomendada)
2. **`portainer-stack-minimal.yml`** - Versão mínima
3. **`portainer-stack-simple.yml`** - Versão simples
4. **`portainer-stack.yml`** - Versão completa

## 🎯 Resultado Esperado:

Após o deploy, você terá:
- ✅ Frontend (nginx)
- ✅ Supabase (PostgreSQL)
- ✅ Redis

## 🔍 Verificar:

- Vá em **Containers** no Portainer
- Verifique se os containers estão rodando
- Clique em cada container para ver os logs

---

**💡 Dica:** Comece com a versão mais básica e depois adicione mais serviços conforme necessário. 