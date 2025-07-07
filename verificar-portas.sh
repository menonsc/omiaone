#!/bin/bash

echo "🔍 VERIFICAÇÃO COMPLETA DE PORTAS E SERVIÇOS"
echo "============================================"

echo "📋 Verificando serviços Docker Swarm:"
docker service ls 2>/dev/null || echo "❌ Docker Swarm não está ativo ou sem permissões"
echo ""

echo "🐳 Verificando containers rodando:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "🔌 Verificando portas ocupadas:"
echo "- Porta 80 (HTTP):"
sudo netstat -tlnp | grep :80 || echo "  ✅ Porta 80 livre"

echo "- Porta 443 (HTTPS):"
sudo netstat -tlnp | grep :443 || echo "  ✅ Porta 443 livre"

echo "- Porta 3000 (Grafana):"
sudo netstat -tlnp | grep :3000 || echo "  ✅ Porta 3000 livre"

echo "- Porta 3001 (WebSocket original):"
sudo netstat -tlnp | grep :3001 || echo "  ✅ Porta 3001 livre"

echo "- Porta 3002 (WebSocket alternativa):"
sudo netstat -tlnp | grep :3002 || echo "  ✅ Porta 3002 livre"

echo "- Porta 8080 (Frontend alternativo):"
sudo netstat -tlnp | grep :8080 || echo "  ✅ Porta 8080 livre"

echo "- Porta 8443 (HTTPS alternativo):"
sudo netstat -tlnp | grep :8443 || echo "  ✅ Porta 8443 livre"

echo "- Porta 9090 (Prometheus):"
sudo netstat -tlnp | grep :9090 || echo "  ✅ Porta 9090 livre"

echo ""
echo "🚨 Serviços identificados na VPS:"
echo "- Traefik:"
docker service ls | grep traefik || echo "  ✅ Nenhum Traefik via swarm"

echo "- Uptime Kuma:"
docker service ls | grep uptime || echo "  ✅ Nenhum Uptime Kuma via swarm"
docker ps | grep uptime || echo "  ✅ Nenhum Uptime Kuma via containers"

echo "- Outros serviços:"
docker service ls | grep -v 'ID\|traefik\|uptime' || echo "  ✅ Nenhum outro serviço"

echo ""
echo "📊 Resumo de conflitos encontrados:"
CONFLICTS=0

if sudo netstat -tlnp | grep -q :80; then
    echo "❌ Porta 80 ocupada (provavelmente Traefik)"
    CONFLICTS=$((CONFLICTS + 1))
fi

if sudo netstat -tlnp | grep -q :443; then
    echo "❌ Porta 443 ocupada (provavelmente Traefik)"
    CONFLICTS=$((CONFLICTS + 1))
fi

if sudo netstat -tlnp | grep -q :3001; then
    echo "❌ Porta 3001 ocupada (provavelmente Uptime Kuma)"
    CONFLICTS=$((CONFLICTS + 1))
fi

if [ $CONFLICTS -eq 0 ]; then
    echo "✅ Nenhum conflito detectado"
else
    echo "⚠️  Total de conflitos: $CONFLICTS"
fi

echo ""
echo "💡 SOLUÇÕES RECOMENDADAS:"
echo ""
echo "🎯 OPÇÃO 1 - TESTE RÁPIDO (Recomendada):"
echo "- Use portainer-stack-test.yml com portas alternativas"
echo "- Frontend: http://SEU_IP:8080"
echo "- WebSocket: http://SEU_IP:3002"
echo ""
echo "🔧 OPÇÃO 2 - INTEGRAÇÃO COM TRAEFIK:"
echo "- Configure labels para usar Traefik existente"
echo "- Acesse via domínio: https://producao.elevroi.com"
echo "- Mantenha serviços existentes intactos"
echo ""
echo "🔥 OPÇÃO 3 - LIMPEZA COMPLETA (Cuidado!):"
echo "- docker service rm traefik_traefik uptime_kuma_uptime-kuma"
echo "- Use portas originais 80, 443, 3001"
echo "- ⚠️  ATENÇÃO: Pode afetar outros serviços!"
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "1. Teste com portas alternativas primeiro"
echo "2. Se funcionar, configure para produção"
echo "3. Configure firewall para novas portas se necessário" 