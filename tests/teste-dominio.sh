#!/bin/bash

# Script para testar o domínio usando ngrok
# Uso: ./teste-dominio.sh

echo "🌐 Testando domínio com ngrok..."

# Verificar se ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "❌ Ngrok não está instalado."
    echo "📦 Instalando ngrok..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install ngrok
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok
    else
        echo "❌ Sistema operacional não suportado. Instale ngrok manualmente: https://ngrok.com/download"
        exit 1
    fi
fi

# Verificar se o sistema está rodando
echo "🔍 Verificando se o sistema está rodando..."
if ! curl -f http://localhost/health > /dev/null 2>&1; then
    echo "❌ Sistema não está rodando. Execute: docker-compose up -d"
    exit 1
fi

echo "✅ Sistema está rodando!"

# Iniciar ngrok
echo "🚀 Iniciando ngrok..."
echo "📋 URL pública será exibida abaixo:"
echo ""

# Executar ngrok em background
ngrok http 80 --log=stdout &

# Aguardar ngrok inicializar
sleep 3

# Obter URL pública
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | cut -d'"' -f4)

if [ -n "$NGROK_URL" ]; then
    echo ""
    echo "🎉 SUCESSO! Seu sistema está acessível em:"
    echo "   $NGROK_URL"
    echo ""
    echo "🌐 Para testar o domínio:"
    echo "   1. Acesse: $NGROK_URL"
    echo "   2. Configure o DNS do producao.elevroi.com para apontar para:"
    echo "      $(echo $NGROK_URL | sed 's|https://||')"
    echo ""
    echo "⚠️  ATENÇÃO: Esta é uma solução temporária para teste."
    echo "   Para produção, use uma VPS real."
    echo ""
    echo "🛑 Para parar: Ctrl+C"
    
    # Manter script rodando
    wait
else
    echo "❌ Erro ao obter URL do ngrok"
    pkill ngrok
    exit 1
fi 