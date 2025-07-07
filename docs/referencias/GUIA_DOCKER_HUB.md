# 🐳 Guia para Subir Imagens no Docker Hub

## 📋 Pré-requisitos

1. **Conta no Docker Hub**
   - Crie uma conta em: https://hub.docker.com/
   - Anote seu username

2. **Docker instalado**
   - Verifique se o Docker está instalado: `docker --version`

3. **Login no Docker Hub**
   ```bash
   docker login
   # Digite seu username e password
   ```

## 🚀 Passo a Passo

### 1. Preparação

```bash
# Verificar se está logado
docker info | grep Username

# Verificar arquivos necessários
ls -la Dockerfile Dockerfile.websocket package.json
```

### 2. Executar o Script

```bash
# Executar o script automatizado
./deploy-dockerhub.sh
```

O script vai:
- ✅ Verificar se você está logado no Docker Hub
- ✅ Fazer build das imagens (frontend e websocket)
- ✅ Fazer push para o Docker Hub
- ✅ Criar arquivo de stack atualizado

### 3. Comandos Manuais (Alternativa)

Se preferir fazer manualmente:

```bash
# 1. Login no Docker Hub
docker login

# 2. Build das imagens
docker build -t SEU_USERNAME/agentes-ia-frontend:latest -f Dockerfile .
docker build -t SEU_USERNAME/agentes-ia-websocket:latest -f Dockerfile.websocket .

# 3. Push para Docker Hub
docker push SEU_USERNAME/agentes-ia-frontend:latest
docker push SEU_USERNAME/agentes-ia-websocket:latest
```

## 📁 Arquivos Criados

Após executar o script, você terá:

- `portainer-stack-dockerhub.yml` - Stack atualizado para usar imagens do Docker Hub

## 🔧 Configuração no Portainer

### 1. Upload dos Arquivos

No Portainer, faça upload de:
- `portainer-stack-dockerhub.yml`
- `.env` (com suas configurações)
- `prometheus.yml`
- Pasta `supabase/`

### 2. Criar Stack

1. Vá em **Stacks** → **Add stack**
2. Nome: `agentes-ia`
3. Cole o conteúdo do `portainer-stack-dockerhub.yml`
4. Configure as variáveis de ambiente
5. Clique em **Deploy the stack**

## 🌐 URLs de Acesso

Após o deploy:
- **Frontend**: https://producao.elevroi.com
- **WebSocket**: wss://producao.elevroi.com/socket.io/
- **Prometheus**: https://producao.elevroi.com/prometheus/
- **Grafana**: https://producao.elevroi.com/grafana/

## 🔍 Verificações

### Verificar Imagens Locais
```bash
docker images | grep SEU_USERNAME
```

### Verificar Imagens no Docker Hub
```bash
# Frontend
docker pull SEU_USERNAME/agentes-ia-frontend:latest

# WebSocket
docker pull SEU_USERNAME/agentes-ia-websocket:latest
```

### Testar Imagens Localmente
```bash
# Testar frontend
docker run -p 3000:80 SEU_USERNAME/agentes-ia-frontend:latest

# Testar websocket
docker run -p 3001:3001 SEU_USERNAME/agentes-ia-websocket:latest
```

## 🛠️ Troubleshooting

### Erro: "denied: requested access to the resource is denied"
```bash
# Faça login novamente
docker login
```

### Erro: "no such file or directory"
```bash
# Verifique se os arquivos existem
ls -la Dockerfile Dockerfile.websocket package.json
```

### Erro: "build failed"
```bash
# Verifique os logs
docker build -t test-image -f Dockerfile . 2>&1 | head -20
```

### Erro: "push failed"
```bash
# Verifique se está logado
docker info | grep Username

# Tente fazer login novamente
docker login
```

## 📝 Variáveis de Ambiente

Certifique-se de que seu arquivo `.env` contém:

```env
# Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima

# Google Gemini
VITE_GOOGLE_GEMINI_API_KEY=sua_chave_gemini

# Evolution API
VITE_EVOLUTION_API_URL=sua_url_evolution
VITE_EVOLUTION_API_KEY=sua_chave_evolution
VITE_EVOLUTION_INSTANCE_NAME=sua_instancia

# Banco de dados
SUPABASE_DB_PASSWORD=sua_senha_postgres

# Grafana
GRAFANA_PASSWORD=admin
```

## 🔄 Atualizações

Para atualizar as imagens:

1. Faça as alterações no código
2. Execute o script novamente:
   ```bash
   ./deploy-dockerhub.sh
   ```
3. No Portainer, atualize a stack

## 📊 Monitoramento

### Verificar Logs
```bash
# No Portainer, vá em Containers
# Clique em cada container para ver os logs
```

### Health Checks
```bash
# Frontend
curl -f https://producao.elevroi.com/health

# WebSocket
curl -f https://producao.elevroi.com/socket.io/
```

## 🎯 Próximos Passos

1. ✅ Configure o DNS (producao.elevroi.com → IP do servidor)
2. ✅ Deploy a stack no Portainer
3. ✅ Teste as URLs de acesso
4. ✅ Configure monitoramento
5. ✅ Configure backups

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Portainer
2. Teste as imagens localmente
3. Verifique as configurações de rede
4. Confirme se o Traefik está configurado

---

**🎉 Parabéns! Suas imagens estão no Docker Hub e prontas para deploy!** 