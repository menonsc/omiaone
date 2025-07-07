#!/bin/bash

# Script para deploy do stack alternativo no Portainer Docker Swarm
# Uso: ./deploy-portainer-swarm-alternative.sh

set -e

echo "🚀 Iniciando deploy do stack Agentes de IA (versão alternativa) no Docker Swarm..."

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

# Verificar se os certificados SSL existem
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "⚠️  Certificados SSL não encontrados em ssl/."
    echo "📝 Criando certificados auto-assinados para desenvolvimento..."
    mkdir -p ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/key.pem -out ssl/cert.pem \
        -subj "/C=BR/ST=SP/L=Sao Paulo/O=ElevROI/CN=producao.elevroi.com"
fi

# Carregar variáveis de ambiente
echo "📋 Carregando variáveis de ambiente..."
export $(cat env.production | grep -v '^#' | xargs)

# Deploy do stack
echo "🚀 Fazendo deploy do stack (versão alternativa)..."
docker stack deploy -c portainer-stack-swarm-alternative.yml agentes-ia

echo "✅ Stack deployado com sucesso!"
echo ""
echo "📊 Status dos serviços:"
docker stack services agentes-ia

echo ""
echo "🌐 Acesse sua aplicação em: https://producao.elevroi.com"
echo "📈 Grafana: http://localhost:4000 (admin/admin)"
echo "📊 Prometheus: http://localhost:9090"
echo ""
echo "🔍 Para ver logs: docker service logs agentes-ia_frontend"
echo "🛑 Para remover: docker stack rm agentes-ia" 