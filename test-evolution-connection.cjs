#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configurações do Evolution API
const EVOLUTION_API_URL = 'https://evolution.elevroi.com.br';
const EVOLUTION_API_KEY = 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB';

console.log('🔍 Testando conectividade com Evolution API...');
console.log(`URL: ${EVOLUTION_API_URL}`);
console.log(`API Key: ${EVOLUTION_API_KEY.substring(0, 10)}...`);

// Função para fazer requisição HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Testes
async function runTests() {
  try {
    console.log('\n📡 Teste 1: Verificar se a API está online...');
    const healthCheck = await makeRequest(`${EVOLUTION_API_URL}/health`);
    console.log('✅ Health check:', healthCheck.status, healthCheck.data);

    console.log('\n📡 Teste 2: Listar instâncias...');
    const instances = await makeRequest(`${EVOLUTION_API_URL}/instance/fetchInstances`);
    console.log('✅ Instâncias:', instances.status, instances.data);

    if (instances.data && Array.isArray(instances.data)) {
      const firstInstance = instances.data[0];
      if (firstInstance) {
        console.log(`\n📡 Teste 3: Status da instância ${firstInstance.instance}...`);
        const status = await makeRequest(`${EVOLUTION_API_URL}/instance/connectionState/${firstInstance.instance}`);
        console.log('✅ Status da instância:', status.status, status.data);

        console.log(`\n📡 Teste 4: Buscar chats da instância ${firstInstance.instance}...`);
        try {
          const chats = await makeRequest(`${EVOLUTION_API_URL}/chat/findChats/${firstInstance.instance}`, {
            method: 'POST'
          });
          console.log('✅ Chats:', chats.status, chats.data);
        } catch (error) {
          console.log('❌ Erro ao buscar chats:', error.message);
        }
      }
    }

    console.log('\n📡 Teste 5: Testar WebSocket...');
    console.log('⚠️ WebSocket precisa ser testado no navegador devido a limitações do Node.js');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }
}

runTests(); 