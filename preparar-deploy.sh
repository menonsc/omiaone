#!/bin/bash

# Script de Preparação dos Arquivos de Deploy
# Torna todos os scripts executáveis e organiza documentação

echo "🛠️ Preparando arquivos para deploy do Agentes de IA..."

# Tornar scripts executáveis
echo "📄 Tornando scripts executáveis..."
chmod +x setup-servidor-zero.sh
chmod +x configurar-dominio-ssl.sh  
chmod +x deploy-completo-automatico.sh

# Verificar se arquivos existem
echo "✅ Verificando arquivos criados..."

files=(
    "setup-servidor-zero.sh"
    "configurar-dominio-ssl.sh"
    "deploy-completo-automatico.sh"
    "docker-compose.production.yml"
    "env.producao.example"
    "GUIA_COMPLETO_SERVIDOR_ZERO.md"
    "RESUMO_EXECUTIVO_SERVIDOR_ZERO.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (arquivo não encontrado)"
    fi
done

echo ""
echo "🚀 INSTRUÇÕES DE USO:"
echo "==================="
echo ""
echo "🎯 OPÇÃO 1 - Deploy Automático (Recomendado):"
echo "   sudo bash deploy-completo-automatico.sh"
echo ""
echo "🎯 OPÇÃO 2 - Deploy Manual:"
echo "   1. sudo bash setup-servidor-zero.sh"
echo "   2. bash configurar-dominio-ssl.sh"
echo "   3. cp env.producao.example .env.production"
echo "   4. nano .env.production (editar variáveis)"
echo "   5. docker-compose -f docker-compose.production.yml up -d"
echo ""
echo "📚 DOCUMENTAÇÃO:"
echo "   - GUIA_COMPLETO_SERVIDOR_ZERO.md (passo a passo)"
echo "   - RESUMO_EXECUTIVO_SERVIDOR_ZERO.md (visão geral)"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Tenha seu domínio apontando para o servidor"
echo "   - Prepare suas credenciais (Supabase, Evolution, etc.)"
echo "   - Execute como root: sudo bash script.sh"
echo ""
echo "✅ Arquivos prontos para uso!" 