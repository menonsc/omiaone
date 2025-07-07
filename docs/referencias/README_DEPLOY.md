# 🚀 Deploy Docker - Agentes de IA

Este documento contém todas as instruções necessárias para fazer o deploy da aplicação Agentes de IA usando Docker e Portainer.

## 📋 Pré-requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Portainer (opcional, para gerenciamento via interface web)
- Git

## 🏗️ Estrutura do Projeto

```
Agentes de IA/
├── Dockerfile                 # Build da aplicação React
├── docker-compose.yml         # Stack completa
├── nginx.conf                 # Configuração do nginx (frontend)
├── nginx-proxy.conf           # Configuração do reverse proxy
├── prometheus.yml             # Configuração do monitoramento
├── deploy.sh                  # Script de deploy automatizado
├── env.example                # Exemplo de variáveis de ambiente
├── .dockerignore              # Arquivos ignorados no build
└── README_DEPLOY.md           # Esta documentação
```

## 🔧 Configuração Inicial

### 1. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar as variáveis necessárias
nano .env
```

**Variáveis obrigatórias:**

```env
# Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
SUPABASE_DB_PASSWORD=sua-senha-super-secreta

# Google Gemini AI
VITE_GOOGLE_GEMINI_API_KEY=sua-chave-do-gemini

# Evolution API (WhatsApp)
VITE_EVOLUTION_API_URL=http://localhost:8080
VITE_EVOLUTION_API_KEY=sua-chave-da-evolution-api
VITE_EVOLUTION_INSTANCE_NAME=nome-da-sua-instancia

# Grafana
GRAFANA_PASSWORD=admin
```

### 2. Configurar SSL (Opcional)

Para produção com HTTPS:

```bash
# Criar diretório para certificados
mkdir -p ssl

# Copiar seus certificados
cp seu-certificado.pem ssl/cert.pem
cp sua-chave-privada.pem ssl/key.pem

# Descomentar seção HTTPS no nginx-proxy.conf
```

## 🚀 Deploy Rápido

### Usando o Script Automatizado

```bash
# Dar permissão de execução
chmod +x deploy.sh

# Iniciar todos os serviços
./deploy.sh start

# Verificar status
./deploy.sh status

# Ver logs
./deploy.sh logs
```

### Usando Docker Compose Diretamente

```bash
# Build e iniciar
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

## 📊 Serviços Disponíveis

| Serviço | Porta | Descrição | Acesso |
|---------|-------|-----------|--------|
| Frontend | 3000 | Aplicação React | http://localhost:3000 |
| Nginx Proxy | 80 | Reverse Proxy | http://localhost |
| Supabase | 5432 | Banco de dados | Local apenas |
| Redis | 6379 | Cache | Local apenas |
| Prometheus | 9090 | Métricas | http://localhost:9090 |
| Grafana | 3001 | Dashboard | http://localhost:3001 |

### Credenciais Padrão

- **Grafana**: admin / admin
- **Supabase**: postgres / (senha definida em .env)

## 🔍 Monitoramento

### Prometheus
- URL: http://localhost:9090
- Métricas coletadas:
  - Frontend (health checks)
  - Supabase (banco de dados)
  - Redis (cache)
  - Nginx (proxy)

### Grafana
- URL: http://localhost:3001
- Login: admin / admin
- Dashboards pré-configurados para monitoramento

## 🛠️ Comandos Úteis

### Script de Deploy

```bash
./deploy.sh start      # Iniciar serviços
./deploy.sh stop       # Parar serviços
./deploy.sh restart    # Reiniciar serviços
./deploy.sh logs       # Ver logs
./deploy.sh status     # Status dos serviços
./deploy.sh health     # Health check
./deploy.sh backup     # Criar backup
./deploy.sh restore    # Restaurar backup
./deploy.sh cleanup    # Limpar tudo
```

### Docker Compose

```bash
# Ver status
docker-compose ps

# Ver logs de um serviço específico
docker-compose logs frontend

# Executar comando em um container
docker-compose exec supabase psql -U postgres

# Rebuild de um serviço
docker-compose up -d --build frontend
```

## 🔧 Deploy no Portainer

### 1. Acessar Portainer
- URL: http://seu-servidor:9000
- Login com suas credenciais

### 2. Criar Stack
1. Vá em **Stacks** → **Add stack**
2. Nome: `agentes-ia`
3. Cole o conteúdo do `docker-compose.yml`
4. Configure as variáveis de ambiente
5. Clique em **Deploy the stack**

### 3. Configurar Variáveis de Ambiente no Portainer

No Portainer, adicione as seguintes variáveis de ambiente:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=sua-chave
VITE_GOOGLE_GEMINI_API_KEY=sua-chave
VITE_EVOLUTION_API_URL=http://localhost:8080
VITE_EVOLUTION_API_KEY=sua-chave
VITE_EVOLUTION_INSTANCE_NAME=sua-instancia
SUPABASE_DB_PASSWORD=sua-senha
GRAFANA_PASSWORD=admin
```

### 4. Monitorar no Portainer
- **Containers**: Ver status de todos os containers
- **Logs**: Acessar logs em tempo real
- **Console**: Executar comandos nos containers
- **Volumes**: Gerenciar dados persistentes

## 🔒 Segurança

### Configurações Implementadas

1. **Headers de Segurança** (nginx):
   - X-Frame-Options
   - X-XSS-Protection
   - X-Content-Type-Options
   - Referrer-Policy

2. **Rate Limiting**:
   - API: 10 requests/segundo
   - Login: 5 requests/minuto

3. **Autenticação Básica**:
   - Prometheus e Grafana protegidos
   - Credenciais configuráveis

4. **Volumes Isolados**:
   - Dados persistentes em volumes Docker
   - Backup automático disponível

## 📈 Escalabilidade

### Para Produção

1. **Load Balancer**:
   ```yaml
   # Adicionar ao docker-compose.yml
   nginx-lb:
     image: nginx:alpine
     ports:
       - "80:80"
       - "443:443"
     volumes:
       - ./nginx-lb.conf:/etc/nginx/nginx.conf
   ```

2. **Múltiplas Instâncias**:
   ```bash
   # Escalar frontend
   docker-compose up -d --scale frontend=3
   ```

3. **Monitoramento Avançado**:
   - Alertas no Prometheus
   - Dashboards customizados no Grafana
   - Log aggregation com ELK Stack

## 🚨 Troubleshooting

### Problemas Comuns

1. **Porta já em uso**:
   ```bash
   # Verificar portas em uso
   netstat -tulpn | grep :80
   
   # Alterar porta no docker-compose.yml
   ports:
     - "8080:80"  # Mudar de 80 para 8080
   ```

2. **Erro de permissão**:
   ```bash
   # Dar permissão ao script
   chmod +x deploy.sh
   
   # Verificar permissões dos volumes
   sudo chown -R 1000:1000 ./data
   ```

3. **Container não inicia**:
   ```bash
   # Ver logs detalhados
   docker-compose logs frontend
   
   # Verificar variáveis de ambiente
   docker-compose config
   ```

4. **Banco de dados não conecta**:
   ```bash
   # Verificar se Supabase está rodando
   docker-compose ps supabase
   
   # Testar conexão
   docker-compose exec supabase pg_isready -U postgres
   ```

### Logs Úteis

```bash
# Logs de todos os serviços
docker-compose logs

# Logs de um serviço específico
docker-compose logs frontend

# Logs em tempo real
docker-compose logs -f

# Logs com timestamps
docker-compose logs -t
```

## 🔄 Backup e Restore

### Backup Automático

```bash
# Criar backup
./deploy.sh backup

# Restaurar backup
./deploy.sh restore backup_20231201_143022
```

### Backup Manual

```bash
# Backup do banco
docker-compose exec -T supabase pg_dump -U postgres postgres > backup.sql

# Backup dos volumes
docker run --rm -v agentes-ia-supabase_data:/data -v $(pwd):/backup alpine tar czf /backup/data.tar.gz -C /data .
```

## 📞 Suporte

Para problemas ou dúvidas:

1. Verificar logs: `./deploy.sh logs`
2. Health check: `./deploy.sh health`
3. Status dos serviços: `./deploy.sh status`
4. Verificar configuração: `docker-compose config`

## 🔄 Atualizações

### Atualizar Aplicação

```bash
# Parar serviços
./deploy.sh stop

# Pull das últimas mudanças
git pull origin main

# Rebuild e iniciar
./deploy.sh start
```

### Atualizar Imagens Docker

```bash
# Pull das últimas imagens
docker-compose pull

# Rebuild com novas imagens
docker-compose up -d --build
```