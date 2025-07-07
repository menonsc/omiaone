const { io } = require('socket.io-client');

// Configurações do .env
const config = {
  evolutionApiUrl: 'https://evolution.elevroi.com.br',
  apiKey: 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB',
  instanceName: 'elevroi'
};

console.log('🔍 DIAGNÓSTICO WEBSOCKET CONNECTION');
console.log('=====================================');
console.log('📋 Configurações:');
console.log('   Evolution API URL:', config.evolutionApiUrl);
console.log('   API Key:', config.apiKey.substring(0, 10) + '...');
console.log('   Instance Name:', config.instanceName);
console.log('');

// Função para testar conexão WebSocket
async function testWebSocketConnection() {
  console.log('🔌 TESTE 1: Conexão WebSocket Direta');
  console.log('-----------------------------------');
  
  // URL do WebSocket baseada na Evolution API
  const wsUrl = config.evolutionApiUrl.replace(/^http/, 'ws') + '/' + config.instanceName;
  console.log('   URL do WebSocket:', wsUrl);
  
  return new Promise((resolve) => {
    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      auth: { 
        apikey: config.apiKey,
        instance: config.instanceName
      },
      reconnection: false,
      timeout: 10000
    });

    const timeout = setTimeout(() => {
      console.log('   ❌ TIMEOUT: Conexão demorou mais de 10 segundos');
      socket.disconnect();
      resolve({ success: false, error: 'Timeout' });
    }, 10000);

    socket.on('connect', () => {
      console.log('   ✅ SUCESSO: WebSocket conectado!');
      console.log('   🔌 Socket ID:', socket.id);
      clearTimeout(timeout);
      
      // Testar eventos específicos da Evolution API
      socket.emit('join', { instance: config.instanceName });
      console.log('   📡 Enviado evento "join" com instância:', config.instanceName);
      
      setTimeout(() => {
        socket.disconnect();
        resolve({ success: true });
      }, 2000);
    });

    socket.on('connect_error', (error) => {
      console.log('   ❌ ERRO DE CONEXÃO:', error.message);
      console.log('   📋 Detalhes do erro:', {
        type: error.type,
        description: error.description,
        context: error.context
      });
      clearTimeout(timeout);
      resolve({ success: false, error: error.message });
    });

    socket.on('disconnect', (reason) => {
      console.log('   🔌 Desconectado:', reason);
    });

    socket.on('error', (error) => {
      console.log('   ❌ ERRO GERAL:', error);
    });

    // Log todos os eventos recebidos
    socket.onAny((event, ...args) => {
      console.log('   📨 Evento recebido:', event, args);
    });
  });
}

// Função para testar diferentes URLs de WebSocket
async function testMultipleWebSocketUrls() {
  console.log('\n🔍 TESTE 2: Diferentes URLs de WebSocket');
  console.log('---------------------------------------');
  
  const urlsToTest = [
    config.evolutionApiUrl + '/' + config.instanceName,
    config.evolutionApiUrl + '/socket.io/' + config.instanceName,
    config.evolutionApiUrl + '/ws/' + config.instanceName,
    config.evolutionApiUrl + '/websocket/' + config.instanceName,
    config.evolutionApiUrl + '/socket.io',
    config.evolutionApiUrl.replace('https://', 'wss://') + '/' + config.instanceName,
  ];

  for (const url of urlsToTest) {
    console.log(`\n   🔗 Testando: ${url}`);
    
    try {
      const wsUrl = url.replace(/^http/, 'ws');
      console.log(`   📡 URL WebSocket: ${wsUrl}`);
      
      const result = await new Promise((resolve) => {
        const socket = io(wsUrl, {
          transports: ['websocket'],
          auth: { 
            apikey: config.apiKey,
            instance: config.instanceName
          },
          reconnection: false,
          timeout: 5000
        });

        const timeout = setTimeout(() => {
          socket.disconnect();
          resolve({ success: false, error: 'Timeout (5s)' });
        }, 5000);

        socket.on('connect', () => {
          clearTimeout(timeout);
          socket.disconnect();
          resolve({ success: true });
        });

        socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          resolve({ success: false, error: error.message });
        });
      });

      if (result.success) {
        console.log(`   ✅ SUCESSO com ${url}`);
      } else {
        console.log(`   ❌ FALHOU: ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ EXCEÇÃO: ${error.message}`);
    }
  }
}

// Função para testar HTTP API primeiro
async function testHttpApi() {
  console.log('\n🌐 TESTE 3: HTTP API (antes do WebSocket)');
  console.log('----------------------------------------');
  
  try {
    const response = await fetch(`${config.evolutionApiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('   📊 Status da resposta:', response.status);
    console.log('   📋 Headers da resposta:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ HTTP API funcionando!');
      console.log('   📋 Instâncias encontradas:', data.length || 'Nenhuma');
      
      if (Array.isArray(data)) {
        data.forEach((instance, index) => {
          console.log(`     ${index + 1}. ${instance.name || instance.instanceName} - ${instance.connectionStatus || 'status desconhecido'}`);
        });
      }
    } else {
      console.log('   ❌ HTTP API com problema:', response.statusText);
    }
  } catch (error) {
    console.log('   ❌ ERRO HTTP API:', error.message);
  }
}

// Executar todos os testes
async function runAllTests() {
  await testHttpApi();
  await testWebSocketConnection();
  await testMultipleWebSocketUrls();
  
  console.log('\n🎯 RESUMO DO DIAGNÓSTICO');
  console.log('========================');
  console.log('1. Verifique se a Evolution API está rodando corretamente');
  console.log('2. Confirme se o WebSocket está habilitado na Evolution API');
  console.log('3. Verifique se não há proxy/firewall bloqueando WebSocket');
  console.log('4. Considere usar polling como fallback se WebSocket não funcionar');
  console.log('');
  console.log('💡 DICA: Se nenhuma URL de WebSocket funcionar, o sistema');
  console.log('   automaticamente usará polling, que é mais confiável mas menos eficiente.');
}

runAllTests().catch(console.error); 