#!/bin/bash

echo "🔄 Reiniciando Docker com configurações atualizadas para ngrok..."

# Parar containers
echo "⏹️ Parando containers..."
docker-compose down

# Remover containers antigos (opcional)
echo "🧹 Removendo containers antigos..."
docker-compose rm -f

# Rebuild com novas configurações
echo "🔨 Rebuild com novas configurações..."
docker-compose up --build -d

# Aguardar containers subirem
echo "⏳ Aguardando containers subirem..."
sleep 10

# Verificar status
echo "📊 Verificando status dos containers..."
docker-compose ps

# Verificar logs do nginx
echo "📋 Logs do nginx-proxy:"
docker-compose logs --tail=20 nginx-proxy

# Verificar logs do frontend
echo "📋 Logs do frontend:"
docker-compose logs --tail=10 frontend

# Testar health check
echo "🏥 Testando health check..."
curl -f http://localhost/health || echo "❌ Health check falhou"

echo ""
echo "✅ Docker reiniciado com sucesso!"
echo ""
echo "🔗 Para testar com ngrok:"
echo "1. Inicie o ngrok: ngrok http --host-header=rewrite 80"
echo "2. Teste o WebSocket: node test-websocket-ngrok.js <sua-url-ngrok>"
echo "3. Verifique os logs: docker-compose logs -f"
echo ""
echo "📝 URLs para testar:"
echo "   Local: http://localhost"
echo "   ngrok: https://sua-url-ngrok.ngrok.io" 