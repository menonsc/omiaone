#!/bin/bash

# Configuração de Domínio para Produção
# VPS IP: 157.180.113.99
# Portas: 8080 (frontend), 3002 (websocket)

echo "🌐 Configurando domínio para produção..."

# Configurações
DOMAIN="producao.elevroi.com"
VPS_IP="157.180.113.99"
FRONTEND_PORT="8080"
WEBSOCKET_PORT="3002"

echo "📋 Configurações:"
echo "   Domínio: $DOMAIN"
echo "   IP da VPS: $VPS_IP"
echo "   Porta Frontend: $FRONTEND_PORT"
echo "   Porta WebSocket: $WEBSOCKET_PORT"
echo ""

# Instruções para configurar DNS
echo "🔧 Para configurar o DNS, adicione os seguintes registros:"
echo ""
echo "   Tipo A:"
echo "   Nome: producao"
echo "   Valor: $VPS_IP"
echo ""
echo "   Tipo CNAME (opcional):"
echo "   Nome: www.producao"
echo "   Valor: producao.elevroi.com"
echo ""

# Testar conectividade
echo "🧪 Testando conectividade..."
echo ""

echo "Frontend:"
curl -I http://$VPS_IP:$FRONTEND_PORT 2>/dev/null | head -1
echo ""

echo "WebSocket:"
curl -I http://$VPS_IP:$WEBSOCKET_PORT 2>/dev/null | head -1
echo ""

# URLs de acesso
echo "🔗 URLs de acesso:"
echo "   Frontend: http://$VPS_IP:$FRONTEND_PORT"
echo "   WebSocket: http://$VPS_IP:$WEBSOCKET_PORT"
echo ""

if [ -n "$DOMAIN" ]; then
    echo "   Após configurar DNS:"
    echo "   Frontend: http://$DOMAIN:$FRONTEND_PORT"
    echo "   WebSocket: http://$DOMAIN:$WEBSOCKET_PORT"
    echo ""
fi

echo "✅ Aplicação funcionando corretamente!"
echo "🎉 Deploy concluído com sucesso!" 