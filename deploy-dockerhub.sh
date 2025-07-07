#!/bin/bash

# Script para build e push das imagens Docker multi-plataforma (amd64) para Docker Hub
# Autor: Sistema Agentes de IA
# Data: $(date)

set -e

echo "🐳 Iniciando build e push das imagens Docker multi-plataforma (amd64) para Docker Hub..."

# Configurações
DOCKER_USERNAME=""
DOCKER_REPO="agentes-ia"
VERSION="latest"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir mensagens coloridas
print_message() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker não está instalado!"
    exit 1
fi

# Verificar se está logado no Docker Hub
print_info "Verificando login no Docker Hub..."

# Tentar fazer um teste simples de autenticação
if ! docker search hello-world > /dev/null 2>&1; then
    print_warning "Problema com autenticação no Docker Hub!"
    echo "Execute: docker login"
    echo "Digite seu username e password do Docker Hub"
    exit 1
fi

# Solicitar username manualmente
echo ""
read -p "Digite seu username do Docker Hub: " DOCKER_USERNAME

if [ -z "$DOCKER_USERNAME" ]; then
    print_error "Username não pode estar vazio!"
    exit 1
fi

print_info "Username do Docker Hub: $DOCKER_USERNAME"

# Verificar se os arquivos necessários existem
if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile não encontrado!"
    exit 1
fi

if [ ! -f "Dockerfile.websocket" ]; then
    print_error "Dockerfile.websocket não encontrado!"
    exit 1
fi

if [ ! -f "package.json" ]; then
    print_error "package.json não encontrado!"
    exit 1
fi

print_message "Arquivos necessários encontrados!"

# Ativar buildx e emulação (apenas se necessário)
print_info "Ativando buildx e emulação multi-plataforma..."
docker buildx create --use || docker buildx use default
docker run --privileged --rm tonistiigi/binfmt --install all || true

# Build das imagens para linux/amd64
print_info "Construindo imagem do frontend (linux/amd64)..."
docker buildx build --platform linux/amd64 -t $DOCKER_USERNAME/$DOCKER_REPO-frontend:$VERSION -f Dockerfile . --push

print_info "Construindo imagem do WebSocket (linux/amd64)..."
docker buildx build --platform linux/amd64 -t $DOCKER_USERNAME/$DOCKER_REPO-websocket:$VERSION -f Dockerfile.websocket . --push

print_message "Build e push das imagens concluído com sucesso!"

# Exibir informações das imagens
echo ""
print_info "📋 INFORMAÇÕES DAS IMAGENS:"
echo "   Frontend: $DOCKER_USERNAME/$DOCKER_REPO-frontend:$VERSION"
echo "   WebSocket: $DOCKER_USERNAME/$DOCKER_REPO-websocket:$VERSION"
echo ""

# Criar arquivo de stack atualizado para usar as imagens do Docker Hub
print_info "Criando arquivo de stack atualizado..."

cat > portainer-stack-dockerhub.yml << EOF
version: '3.8'

services:
  # Frontend React
  frontend:
    image: $DOCKER_USERNAME/$DOCKER_REPO-frontend:$VERSION
    environment:
      - NODE_ENV=production
      - VITE_SUPABASE_URL=\${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=\${VITE_SUPABASE_ANON_KEY}
      - VITE_GOOGLE_GEMINI_API_KEY=\${VITE_GOOGLE_GEMINI_API_KEY}
      - VITE_EVOLUTION_API_URL=\${VITE_EVOLUTION_API_URL}
      - VITE_EVOLUTION_API_KEY=\${VITE_EVOLUTION_API_KEY}
      - VITE_EVOLUTION_INSTANCE_NAME=\${VITE_EVOLUTION_INSTANCE_NAME}
    depends_on:
      - supabase
    networks:
      - network_public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(\`producao.elevroi.com\`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.services.frontend.loadbalancer.server.port=80"
      - "traefik.http.middlewares.frontend-cors.headers.accesscontrolalloworigin=*"
      - "traefik.http.middlewares.frontend-cors.headers.accesscontrolallowmethods=GET,POST,OPTIONS,PUT,DELETE"
      - "traefik.http.middlewares.frontend-cors.headers.accesscontrolallowheaders=DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization"
      - "traefik.http.routers.frontend.middlewares=frontend-cors"

  # WebSocket Server
  websocket-server:
    image: $DOCKER_USERNAME/$DOCKER_REPO-websocket:$VERSION
    environment:
      - NODE_ENV=production
      - PORT=3001
    networks:
      - network_public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.websocket.rule=Host(\`producao.elevroi.com\`) && PathPrefix(\`/socket.io/\`)"
      - "traefik.http.routers.websocket.entrypoints=websecure"
      - "traefik.http.routers.websocket.tls.certresolver=letsencrypt"
      - "traefik.http.services.websocket.loadbalancer.server.port=3001"
      - "traefik.http.middlewares.websocket-cors.headers.accesscontrolalloworigin=*"
      - "traefik.http.middlewares.websocket-cors.headers.accesscontrolallowmethods=GET,POST,OPTIONS,PUT,DELETE"
      - "traefik.http.middlewares.websocket-cors.headers.accesscontrolallowheaders=DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization"
      - "traefik.http.routers.websocket.middlewares=websocket-cors"

  # Supabase (Banco de dados + API)
  supabase:
    image: supabase/postgres:15.1.0.117
    environment:
      POSTGRES_PASSWORD: \${SUPABASE_DB_PASSWORD:-your-super-secret-and-long-postgres-password}
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
    volumes:
      - supabase_data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d
    networks:
      - network_public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.supabase-api.rule=Host(\`producao.elevroi.com\`) && PathPrefix(\`/rest/v1/\`)"
      - "traefik.http.routers.supabase-api.entrypoints=websecure"
      - "traefik.http.routers.supabase-api.tls.certresolver=letsencrypt"
      - "traefik.http.services.supabase-api.loadbalancer.server.port=5432"
      - "traefik.http.routers.supabase-auth.rule=Host(\`producao.elevroi.com\`) && PathPrefix(\`/auth/v1/\`)"
      - "traefik.http.routers.supabase-auth.entrypoints=websecure"
      - "traefik.http.routers.supabase-auth.tls.certresolver=letsencrypt"
      - "traefik.http.services.supabase-auth.loadbalancer.server.port=5432"

  # Redis (para cache e sessões)
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - network_public

  # Monitoramento com Prometheus
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - network_public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.prometheus.rule=Host(\`producao.elevroi.com\`) && PathPrefix(\`/prometheus/\`)"
      - "traefik.http.routers.prometheus.entrypoints=websecure"
      - "traefik.http.routers.prometheus.tls.certresolver=letsencrypt"
      - "traefik.http.services.prometheus.loadbalancer.server.port=9090"
      - "traefik.http.middlewares.prometheus-auth.basicauth.users=admin:\$\$2y\$\$10\$\$HASHED_PASSWORD"
      - "traefik.http.routers.prometheus.middlewares=prometheus-auth"

  # Grafana para visualização
  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_PASSWORD:-admin}
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    networks:
      - network_public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.rule=Host(\`producao.elevroi.com\`) && PathPrefix(\`/grafana/\`)"
      - "traefik.http.routers.grafana.entrypoints=websecure"
      - "traefik.http.routers.grafana.tls.certresolver=letsencrypt"
      - "traefik.http.services.grafana.loadbalancer.server.port=3000"
      - "traefik.http.middlewares.grafana-auth.basicauth.users=admin:\$\$2y\$\$10\$\$HASHED_PASSWORD"
      - "traefik.http.routers.grafana.middlewares=grafana-auth"

volumes:
  supabase_data:
    driver: local
  redis_data:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local

networks:
  network_public:
    external: true
EOF

print_message "Arquivo portainer-stack-dockerhub.yml criado!"

# Instruções finais
echo ""
print_info "🎯 DEPLOY CONCLUÍDO COM SUCESSO!"
echo ""
print_info "📋 PRÓXIMOS PASSOS:"
echo "1. No Portainer, use o arquivo: portainer-stack-dockerhub.yml"
echo "2. Configure as variáveis de ambiente (.env)"
echo "3. Deploy a stack"
echo ""
print_info "🌐 URLs de acesso:"
echo "   - Frontend: https://producao.elevroi.com"
echo "   - WebSocket: wss://producao.elevroi.com/socket.io/"
echo "   - Prometheus: https://producao.elevroi.com/prometheus/"
echo "   - Grafana: https://producao.elevroi.com/grafana/"
echo ""
print_info "📝 ARQUIVOS CRIADOS:"
echo "   - portainer-stack-dockerhub.yml (para usar com Docker Hub)"
echo ""
print_info "🔍 Para verificar as imagens:"
echo "   docker images | grep $DOCKER_USERNAME"
echo ""
print_info "🔗 Links das imagens no Docker Hub:"
echo "   - Frontend: https://hub.docker.com/r/$DOCKER_USERNAME/$DOCKER_REPO-frontend"
echo "   - WebSocket: https://hub.docker.com/r/$DOCKER_USERNAME/$DOCKER_REPO-websocket"
echo ""

print_message "✅ Processo concluído com sucesso!" 