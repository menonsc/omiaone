#!/bin/bash

# Script para deploy do stack sem exposição de portas (para usar com Traefik)
# Uso: ./deploy-portainer-swarm-no-ports.sh

set -e

echo "🚀 Iniciando deploy do stack Agentes de IA (sem portas) no Docker Swarm..."

# Verificar se o Docker Swarm está inicializado
if ! docker info | grep -q "Swarm: active"; then
    echo "❌ Docker Swarm não está ativo. Inicializando..."
    docker swarm init
fi

# Verificar se as imagens existem ou precisam ser construídas
echo "📦 Verificando imagens..."

# Construir imagem do frontend se necessário
if [[ "$(docker images -q agentes-ia-frontend:latest 2> /dev/null)" == "" ]]; then
    echo "🔨 Construindo imagem do frontend..."
    docker build -t agentes-ia-frontend:latest -f Dockerfile .
fi

# Construir imagem do websocket se necessário
if [[ "$(docker images -q websocket-server:latest 2> /dev/null)" == "" ]]; then
    echo "🔨 Construindo imagem do websocket server..."
    docker build -t websocket-server:latest -f Dockerfile.websocket .
fi

# Verificar se o arquivo de ambiente existe
if [ ! -f "env.production" ]; then
    echo "❌ Arquivo env.production não encontrado!"
    echo "📝 Criando arquivo de exemplo..."
    cp env.example env.production
    echo "⚠️  Por favor, edite o arquivo env.production com suas configurações antes de continuar."
    exit 1
fi

# Carregar variáveis de ambiente
echo "📋 Carregando variáveis de ambiente..."
export $(cat env.production | grep -v '^#' | xargs)

# Deploy do stack
echo "🚀 Fazendo deploy do stack (sem portas)..."
docker stack deploy -c portainer-stack-swarm-no-ports.yml agentes-ia

echo "✅ Stack deployado com sucesso!"
echo ""
echo "📊 Status dos serviços:"
docker stack services agentes-ia

echo ""
echo "ℹ️  Esta versão não expõe portas externas."
echo "🌐 Para acessar a aplicação, configure o Traefik ou outro ingress controller."
echo ""
echo "🔍 Para ver logs: docker service logs agentes-ia_frontend"
echo "🛑 Para remover: docker stack rm agentes-ia" 