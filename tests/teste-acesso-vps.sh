#!/bin/bash
echo "🔍 Testando acesso da VPS 157.180.113.99"
echo "========================================"

echo "📊 Teste Local:"
curl -I http://localhost:8080 && echo "✅ Frontend OK local" || echo "❌ Frontend falhou local"
curl -I http://localhost:3002 && echo "✅ WebSocket OK local" || echo "❌ WebSocket falhou local"

echo ""
echo "📊 Teste Público:"
curl -I http://157.180.113.99:8080 && echo "✅ Frontend OK público" || echo "❌ Frontend falhou público"
curl -I http://157.180.113.99:3002 && echo "✅ WebSocket OK público" || echo "❌ WebSocket falhou público"

echo ""
echo "🔥 Status Firewall:"
sudo ufw status | grep -E "(8080|3002)" || echo "⚠️ Portas não liberadas no firewall"
