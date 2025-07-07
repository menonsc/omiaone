#!/bin/bash

# Script para deploy no Portainer com Traefik
# Autor: Sistema Agentes de IA
# Data: $(date)

set -e

echo "🚀 Iniciando deploy no Portainer..."

# Verificar se os arquivos existem
if [ ! -f "portainer-stack.yml" ]; then
    echo "❌ Arquivo portainer-stack.yml não encontrado!"
    exit 1
fi

if [ ! -f "portainer-stack-simple.yml" ]; then
    echo "❌ Arquivo portainer-stack-simple.yml não encontrado!"
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado. Copiando env.example..."
    cp env.example .env
    echo "📝 Por favor, edite o arquivo .env com suas configurações antes de continuar."
    echo "💡 Execute: nano .env"
    exit 1
fi

# Verificar se as variáveis essenciais estão configuradas
echo "🔍 Verificando configurações..."

if grep -q "your-supabase-url" .env; then
    echo "❌ Configure VITE_SUPABASE_URL no arquivo .env"
    exit 1
fi

if grep -q "your-supabase-anon-key" .env; then
    echo "❌ Configure VITE_SUPABASE_ANON_KEY no arquivo .env"
    exit 1
fi

if grep -q "your-gemini-api-key" .env; then
    echo "❌ Configure VITE_GOOGLE_GEMINI_API_KEY no arquivo .env"
    exit 1
fi

echo "✅ Configurações básicas verificadas!"

# Verificar se a rede network_public existe
echo "🌐 Verificando rede network_public..."
if ! docker network ls | grep -q "network_public"; then
    echo "❌ Rede network_public não encontrada!"
    echo "💡 Crie a rede no Portainer ou execute:"
    echo "   docker network create network_public"
    exit 1
fi

echo "✅ Rede network_public encontrada!"

# Verificar se o Traefik está configurado
echo "🔧 Verificando Traefik..."
if ! docker ps | grep -q "traefik"; then
    echo "⚠️  Traefik não encontrado. Certifique-se de que está configurado no Portainer."
fi

echo "✅ Verificações concluídas!"

# Instruções para deploy
echo ""
echo "📋 INSTRUÇÕES PARA DEPLOY NO PORTAINER:"
echo ""
echo "1. 📁 Faça upload dos arquivos para o Portainer:"
echo "   - portainer-stack.yml (versão completa)"
echo "   - portainer-stack-simple.yml (versão simples)"
echo "   - .env"
echo "   - Dockerfile"
echo "   - Dockerfile.websocket"
echo "   - websocket-server.js"
echo "   - prometheus.yml"
echo "   - pasta supabase/"
echo "   - pasta src/"
echo "   - package.json"
echo ""
echo "2. 🌐 Configure o DNS:"
echo "   - Aponte producao.elevroi.com para o IP do seu servidor"
echo ""
echo "3. 🔧 No Portainer:"
echo "   - Vá em 'Stacks'"
echo "   - Clique em 'Add stack'"
echo "   - Nome: agentes-ia"
echo ""
echo "4. 📄 Escolha o arquivo de stack:"
echo "   - Se der erro com portainer-stack.yml, use portainer-stack-simple.yml"
echo "   - Cole o conteúdo do arquivo escolhido"
echo "   - Configure as variáveis de ambiente (.env)"
echo "   - Clique em 'Deploy the stack'"
echo ""
echo "5. 🔐 Configure autenticação (opcional):"
echo "   - Para Prometheus/Grafana, gere senhas hash:"
echo "     htpasswd -nb admin senha123"
echo "   - Substitua nos labels do Traefik"
echo ""
echo "6. 🌍 URLs de acesso:"
echo "   - Frontend: https://producao.elevroi.com"
echo "   - WebSocket: wss://producao.elevroi.com/socket.io/"
echo "   - Prometheus: https://producao.elevroi.com/prometheus/"
echo "   - Grafana: https://producao.elevroi.com/grafana/"
echo ""
echo "7. 🔍 Verificar logs:"
echo "   - No Portainer, vá em 'Containers'"
echo "   - Clique em cada container para ver os logs"
echo ""
echo "8. 🧪 Testar conexão:"
echo "   - curl -f https://producao.elevroi.com/health"
echo "   - curl -f https://producao.elevroi.com/socket.io/"
echo ""
echo "9. 🛠️ Se der erro de compatibilidade:"
echo "   - Use portainer-stack-simple.yml"
echo "   - Remova labels complexos se necessário"
echo "   - Verifique a versão do Docker Compose no Portainer"
echo ""

echo "🎯 Deploy configurado para Portainer com Traefik!"
echo "📧 Domínio: producao.elevroi.com"
echo "🔒 SSL: Automático via Let's Encrypt"
echo "🌐 Rede: network_public"
echo ""
echo "📝 ARQUIVOS DISPONÍVEIS:"
echo "   - portainer-stack.yml (versão completa)"
echo "   - portainer-stack-simple.yml (versão compatível)" 