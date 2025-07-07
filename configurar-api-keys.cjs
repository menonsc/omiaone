#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔑 CONFIGURADOR DE API KEYS - Evolution API');
console.log('==========================================');

// Lê o arquivo .env atual
const envPath = path.join(__dirname, '.env');

try {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  console.log('📁 Arquivo .env encontrado');
  
  // API Keys conhecidas
  const globalApiKey = 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB';
  const elevroisInstanceApiKey = '22C851B89258-404F-8305-349B325745BF';
  
  // Verificar se já tem a API key da instância
  if (envContent.includes('VITE_EVOLUTION_INSTANCE_API_KEY')) {
    console.log('✅ VITE_EVOLUTION_INSTANCE_API_KEY já configurado');
  } else {
    console.log('➕ Adicionando VITE_EVOLUTION_INSTANCE_API_KEY...');
    envContent += `\n# API Key específica da instância elevroi\nVITE_EVOLUTION_INSTANCE_API_KEY=${elevroisInstanceApiKey}\n`;
  }
  
  // Verificar se a API key global está correta
  if (envContent.includes(`VITE_EVOLUTION_API_KEY=${globalApiKey}`)) {
    console.log('✅ VITE_EVOLUTION_API_KEY (global) está correto');
  } else {
    console.log('🔄 Atualizando VITE_EVOLUTION_API_KEY (global)...');
    envContent = envContent.replace(
      /VITE_EVOLUTION_API_KEY=.*/,
      `VITE_EVOLUTION_API_KEY=${globalApiKey}`
    );
  }
  
  // Verificar se o nome da instância está correto
  if (envContent.includes('VITE_EVOLUTION_INSTANCE_NAME=elevroi')) {
    console.log('✅ VITE_EVOLUTION_INSTANCE_NAME está correto');
  } else {
    console.log('🔄 Atualizando VITE_EVOLUTION_INSTANCE_NAME...');
    envContent = envContent.replace(
      /VITE_EVOLUTION_INSTANCE_NAME=.*/,
      'VITE_EVOLUTION_INSTANCE_NAME=elevroi'
    );
  }
  
  // Escrever o arquivo atualizado
  fs.writeFileSync(envPath, envContent);
  
  console.log('');
  console.log('✅ CONFIGURAÇÃO CONCLUÍDA!');
  console.log('========================');
  console.log('📋 Configurações aplicadas:');
  console.log(`   🌐 API Global (admin): ${globalApiKey.substring(0, 10)}...`);
  console.log(`   🎯 API Instância (elevroi): ${elevroisInstanceApiKey.substring(0, 10)}...`);
  console.log(`   📱 Nome da Instância: elevroi`);
  console.log('');
  console.log('🚀 PRÓXIMOS PASSOS:');
  console.log('1. Reinicie a aplicação (pare e inicie novamente)');
  console.log('2. Recarregue a página no navegador');
  console.log('3. Verifique o console para mensagens de WebSocket');
  console.log('4. Teste enviando uma mensagem no WhatsApp');
  console.log('');
  console.log('🎯 RESULTADO ESPERADO:');
  console.log('- ✅ WebSocket conectará com sucesso');
  console.log('- ✅ Não haverá mais erros 404');
  console.log('- ✅ Mensagens aparecerão em tempo real');
  console.log('- ✅ Novas conversas serão criadas automaticamente');
  
} catch (error) {
  console.error('❌ Erro ao configurar API keys:', error.message);
  console.log('');
  console.log('📝 CONFIGURAÇÃO MANUAL:');
  console.log('Adicione estas linhas ao seu arquivo .env:');
  console.log('');
  console.log('# API Keys da Evolution API');
  console.log(`VITE_EVOLUTION_API_KEY=${globalApiKey}`);
  console.log(`VITE_EVOLUTION_INSTANCE_API_KEY=${elevroisInstanceApiKey}`);
  console.log('VITE_EVOLUTION_INSTANCE_NAME=elevroi');
} 