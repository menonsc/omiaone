#!/bin/bash

# Script para verificar imagens no Docker Hub
# Autor: Sistema Agentes de IA

set -e

echo "🔍 Verificando imagens no Docker Hub..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
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

# Obter username do Docker Hub
DOCKER_USERNAME=$(docker info 2>/dev/null | grep "Username" | awk '{print $2}')
if [ -z "$DOCKER_USERNAME" ]; then
    print_error "Não foi possível obter o username do Docker Hub!"
    echo "Execute: docker login"
    exit 1
fi

print_info "Username do Docker Hub: $DOCKER_USERNAME"

# Verificar imagens locais
echo ""
print_info "📋 Verificando imagens locais..."

LOCAL_FRONTEND=$(docker images | grep "$DOCKER_USERNAME/agentes-ia-frontend" | head -1)
LOCAL_WEBSOCKET=$(docker images | grep "$DOCKER_USERNAME/agentes-ia-websocket" | head -1)

if [ -n "$LOCAL_FRONTEND" ]; then
    print_success "Imagem frontend encontrada localmente"
    echo "   $LOCAL_FRONTEND"
else
    print_warning "Imagem frontend não encontrada localmente"
fi

if [ -n "$LOCAL_WEBSOCKET" ]; then
    print_success "Imagem websocket encontrada localmente"
    echo "   $LOCAL_WEBSOCKET"
else
    print_warning "Imagem websocket não encontrada localmente"
fi

# Testar pull das imagens
echo ""
print_info "🌐 Testando pull das imagens do Docker Hub..."

print_info "Testando pull da imagem frontend..."
if docker pull $DOCKER_USERNAME/agentes-ia-frontend:latest > /dev/null 2>&1; then
    print_success "Pull da imagem frontend bem-sucedido!"
else
    print_error "Erro ao fazer pull da imagem frontend"
fi

print_info "Testando pull da imagem websocket..."
if docker pull $DOCKER_USERNAME/agentes-ia-websocket:latest > /dev/null 2>&1; then
    print_success "Pull da imagem websocket bem-sucedido!"
else
    print_error "Erro ao fazer pull da imagem websocket"
fi

# Verificar se o arquivo de stack foi criado
echo ""
print_info "📁 Verificando arquivos criados..."

if [ -f "portainer-stack-dockerhub.yml" ]; then
    print_success "Arquivo portainer-stack-dockerhub.yml encontrado"
    
    # Verificar se as imagens estão corretas no arquivo
    if grep -q "$DOCKER_USERNAME/agentes-ia-frontend" portainer-stack-dockerhub.yml; then
        print_success "Imagem frontend configurada corretamente no stack"
    else
        print_error "Imagem frontend não encontrada no arquivo de stack"
    fi
    
    if grep -q "$DOCKER_USERNAME/agentes-ia-websocket" portainer-stack-dockerhub.yml; then
        print_success "Imagem websocket configurada corretamente no stack"
    else
        print_error "Imagem websocket não encontrada no arquivo de stack"
    fi
else
    print_warning "Arquivo portainer-stack-dockerhub.yml não encontrado"
    print_info "Execute: ./deploy-dockerhub.sh"
fi

# Testar imagens localmente
echo ""
print_info "🧪 Testando imagens localmente..."

print_info "Testando imagem frontend..."
if docker run --rm -d --name test-frontend $DOCKER_USERNAME/agentes-ia-frontend:latest > /dev/null 2>&1; then
    print_success "Imagem frontend iniciou corretamente"
    docker stop test-frontend > /dev/null 2>&1
else
    print_error "Erro ao iniciar imagem frontend"
fi

print_info "Testando imagem websocket..."
if docker run --rm -d --name test-websocket $DOCKER_USERNAME/agentes-ia-websocket:latest > /dev/null 2>&1; then
    print_success "Imagem websocket iniciou corretamente"
    docker stop test-websocket > /dev/null 2>&1
else
    print_error "Erro ao iniciar imagem websocket"
fi

# Informações finais
echo ""
print_info "📋 RESUMO:"
echo "   Username: $DOCKER_USERNAME"
echo "   Repositório: agentes-ia"
echo "   Versão: latest"
echo ""
print_info "🔗 Links das imagens:"
echo "   Frontend: https://hub.docker.com/r/$DOCKER_USERNAME/agentes-ia-frontend"
echo "   WebSocket: https://hub.docker.com/r/$DOCKER_USERNAME/agentes-ia-websocket"
echo ""
print_info "📝 Próximos passos:"
echo "1. Use o arquivo portainer-stack-dockerhub.yml no Portainer"
echo "2. Configure as variáveis de ambiente"
echo "3. Deploy a stack"
echo "4. Teste as URLs de acesso"

echo ""
print_success "✅ Verificação concluída!" 