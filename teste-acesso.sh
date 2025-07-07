#!/bin/bash

echo "🔍 DIAGNÓSTICO DE ACESSO - ElevROI"
echo "================================="

# Variáveis
DOMAIN="producao.elevroi.com"
SERVER_IP=$(curl -s ifconfig.me)

echo "📊 Informações do Servidor:"
echo "- IP Público: $SERVER_IP"
echo "- Domínio: $DOMAIN"
echo ""

echo "🌐 Testando DNS:"
echo "- Resolvendo domínio..."
nslookup $DOMAIN
echo ""

echo "🔥 Testando Firewall:"
echo "- Verificando portas abertas..."
sudo netstat -tlnp | grep -E ':(80|443|3001|3000|9090|5432|6379)\s'
echo ""

echo "🐳 Testando Docker:"
echo "- Containers rodando:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "🔌 Testando Conectividade:"
echo "- Testando porta 80 (HTTP)..."
curl -I http://localhost:80 2>/dev/null || echo "❌ Porta 80 não responde"

echo "- Testando porta 443 (HTTPS)..."
curl -I https://localhost:443 2>/dev/null || echo "❌ Porta 443 não responde"

echo "- Testando porta 3001 (WebSocket)..."
curl -I http://localhost:3001 2>/dev/null || echo "❌ Porta 3001 não responde"

echo ""
echo "🔧 Testando via IP público:"
echo "- Testando http://$SERVER_IP:80"
curl -I http://$SERVER_IP:80 2>/dev/null || echo "❌ Não acessível via IP:80"

echo ""
echo "📋 Resumo:"
echo "- Se as portas locais funcionam mas IP público não, problema é firewall/VPS"
echo "- Se DNS não resolve, problema é configuração domínio"
echo "- Se Docker não está rodando, problema é na stack"
echo ""
echo "✅ Próximos passos:"
echo "1. Liberar portas 80,443,3001 no firewall da VPS"
echo "2. Configurar DNS do domínio para apontar para $SERVER_IP"
echo "3. Testar com IP direto: http://$SERVER_IP" 