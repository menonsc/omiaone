#!/usr/bin/env node

// Script para testar conexão com EvolutionAPI
// Execute: node check-evolution-connection.js

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Teste de Conexão EvolutionAPI\n');

rl.question('Digite a URL da sua VPS (ex: https://evolution.meudominio.com): ', (apiUrl) => {
  rl.question('Digite sua chave API: ', (apiKey) => {
    
    console.log('\n🔍 Testando conexão...\n');
    
    const testConnection = async () => {
      try {
        const response = await fetch(`${apiUrl}/instance/fetchInstances`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!');
          console.log('📊 Status:', response.status);
          console.log('📝 Instâncias encontradas:', Array.isArray(data) ? data.length : 'N/A');
          
          console.log('\n📋 Configuração para .env.local:');
          console.log('VITE_EVOLUTION_API_URL=' + apiUrl);
          console.log('VITE_EVOLUTION_API_KEY=' + apiKey);
          console.log('VITE_EVOLUTION_INSTANCE_NAME=default-instance');
          
        } else {
          console.log('❌ ERRO NA CONEXÃO');
          console.log('📊 Status:', response.status);
          console.log('📝 Resposta:', await response.text());
          
          if (response.status === 401) {
            console.log('\n💡 Dica: Verifique se a chave API está correta');
          } else if (response.status === 404) {
            console.log('\n💡 Dica: Verifique se a URL está correta e se o EvolutionAPI está rodando');
          }
        }
        
      } catch (error) {
        console.log('❌ ERRO DE CONEXÃO:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
          console.log('\n💡 Dicas:');
          console.log('- Verifique se o EvolutionAPI está rodando na VPS');
          console.log('- Confirme se a porta 8080 está aberta no firewall');
          console.log('- Teste acesso direto: curl ' + apiUrl + '/instance/fetchInstances');
        }
      }
      
      rl.close();
    };

    testConnection();
  });
});

// Função para fazer fetch em Node.js (caso não tenha)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
} 