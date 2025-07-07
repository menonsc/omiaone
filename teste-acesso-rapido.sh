#!/bin/bash

echo "🚀 TESTE RÁPIDO DE ACESSO - ElevROI"
echo "==================================="

# Obter IP público do servidor
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "ERRO_IP")

echo "📊 Configuração atual:"
echo "- IP do Servidor: $SERVER_IP"
echo "- Portas de teste: 8080 (frontend), 3002 (websocket)"
echo ""

echo "🔌 Testando conectividade local:"

echo "- Porta 8080 (Frontend)..."
if curl -I http://localhost:8080 >/dev/null 2>&1; then
    echo "  ✅ Frontend respondendo em localhost:8080"
else
    echo "  ❌ Frontend não responde em localhost:8080"
fi

echo "- Porta 3002 (WebSocket)..."
if curl -I http://localhost:3002 >/dev/null 2>&1; then
    echo "  ✅ WebSocket respondendo em localhost:3002"
else
    echo "  ❌ WebSocket não responde em localhost:3002"
fi

echo ""
echo "🌍 Testando acesso público:"

if [ "$SERVER_IP" != "ERRO_IP" ]; then
    echo "- Testando http://$SERVER_IP:8080 (Frontend)..."
    if curl -I http://$SERVER_IP:8080 >/dev/null 2>&1; then
        echo "  ✅ Frontend acessível via IP público"
        echo "  🔗 Acesse: http://$SERVER_IP:8080"
    else
        echo "  ❌ Frontend não acessível via IP público"
        echo "  💡 Verifique: firewall, VPS security groups"
    fi

    echo "- Testando http://$SERVER_IP:3002 (WebSocket)..."
    if curl -I http://$SERVER_IP:3002 >/dev/null 2>&1; then
        echo "  ✅ WebSocket acessível via IP público"
        echo "  🔗 WebSocket: http://$SERVER_IP:3002"
    else
        echo "  ❌ WebSocket não acessível via IP público"
        echo "  💡 Verifique: firewall, VPS security groups"
    fi
else
    echo "❌ Não foi possível obter IP público do servidor"
fi

echo ""
echo "🔥 Verificando firewall local:"
if command -v ufw >/dev/null 2>&1; then
    echo "- Status UFW:"
    sudo ufw status | grep -E "(8080|3002)" || echo "  ⚠️  Portas 8080/3002 não liberadas no UFW"
elif command -v firewall-cmd >/dev/null 2>&1; then
    echo "- Status Firewalld:"
    sudo firewall-cmd --list-ports | grep -E "(8080|3002)" || echo "  ⚠️  Portas 8080/3002 não liberadas no Firewalld"
else
    echo "  ℹ️  Sistema de firewall não detectado (UFW/Firewalld)"
fi

echo ""
echo "🐳 Status dos containers:"
docker ps --filter "name=test" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "❌ Erro ao verificar containers"

echo ""
echo "📋 RESUMO DO TESTE:"
echo ""

# Verificar se pelo menos frontend local funciona
if curl -I http://localhost:8080 >/dev/null 2>&1; then
    echo "✅ STACK FUNCIONANDO LOCALMENTE"
    
    # Verificar acesso público
    if [ "$SERVER_IP" != "ERRO_IP" ] && curl -I http://$SERVER_IP:8080 >/dev/null 2>&1; then
        echo "✅ STACK ACESSÍVEL PUBLICAMENTE"
        echo ""
        echo "🎉 SUCESSO! Acesse sua aplicação:"
        echo "   Frontend: http://$SERVER_IP:8080"
        echo "   WebSocket: http://$SERVER_IP:3002"
    else
        echo "⚠️  STACK FUNCIONA LOCAL, MAS NÃO PÚBLICO"
        echo ""
        echo "🔧 PRÓXIMOS PASSOS:"
        echo "1. Configure firewall da VPS:"
        echo "   sudo ufw allow 8080/tcp"
        echo "   sudo ufw allow 3002/tcp"
        echo "2. Verifique security groups da VPS"
        echo "3. Teste novamente"
    fi
else
    echo "❌ STACK NÃO ESTÁ FUNCIONANDO"
    echo ""
    echo "🔧 PRÓXIMOS PASSOS:"
    echo "1. Verifique se a stack foi implantada no Portainer"
    echo "2. Execute: docker ps | grep test"
    echo "3. Verifique logs dos containers"
    echo "4. Execute: ./verificar-portas.sh"
fi

echo ""
echo "📞 Para suporte adicional:"
echo "- Execute: ./verificar-portas.sh (diagnóstico completo)"
echo "- Verifique logs: docker service logs NOME_DO_SERVICO"
echo "- Consulte: GUIA_RESOLUCAO_ACESSO.md" 