// Script manual para testar API Yampi
// Execute este código no console do navegador (F12) para diagnosticar problemas

async function testYampiManual() {
  console.log('🔍 === DIAGNÓSTICO YAMPI ===');
  
  // 1. Verificar todas as configurações
  const configs = {
    'localStorage yampi-config': localStorage.getItem('yampi-config'),
    'sessionStorage yampi-config': sessionStorage.getItem('yampi-config'),
  };
  
  // Tentar integrations-store
  try {
    const integrationsStore = localStorage.getItem('integrations-store');
    if (integrationsStore) {
      const parsed = JSON.parse(integrationsStore);
      const yampiIntegration = parsed?.state?.integrations?.find(i => i.name === 'yampi');
      configs['integrations-store yampi'] = yampiIntegration?.config ? JSON.stringify(yampiIntegration.config) : null;
    }
  } catch (e) {
    console.warn('Erro ao acessar integrations-store:', e);
  }
  
  console.log('📋 Configurações encontradas:');
  for (const [source, config] of Object.entries(configs)) {
    console.log(`  ${source}:`, config ? '✅ Encontrada' : '❌ Não encontrada');
    if (config) {
      try {
        const parsed = JSON.parse(config);
        console.log(`    merchantAlias: ${parsed.merchantAlias || 'N/A'}`);
        console.log(`    token: ${parsed.token ? '✅ Presente' : '❌ Ausente'}`);
        console.log(`    secretKey: ${parsed.secretKey ? '✅ Presente' : '❌ Ausente'}`);
        console.log(`    apiKey: ${parsed.apiKey ? '✅ Presente' : '❌ Ausente'}`);
      } catch (e) {
        console.log(`    ❌ Erro ao parsear JSON: ${e.message}`);
      }
    }
  }
  
  // 2. Encontrar primeira configuração válida
  let validConfig = null;
  let configSource = '';
  
  for (const [source, config] of Object.entries(configs)) {
    if (config) {
      try {
        const parsed = JSON.parse(config);
        if (parsed.merchantAlias && parsed.token) {
          validConfig = parsed;
          configSource = source;
          break;
        }
      } catch (e) {
        // Continuar
      }
    }
  }
  
  if (!validConfig) {
    console.log('❌ Nenhuma configuração válida encontrada!');
    console.log('💡 Dicas:');
    console.log('  1. Vá para /settings e configure a integração Yampi');
    console.log('  2. Certifique-se de que merchantAlias e token estão preenchidos');
    console.log('  3. Teste a conexão na página de configurações');
    return;
  }
  
  console.log(`✅ Configuração válida encontrada em: ${configSource}`);
  
  // 3. Testar conexão manualmente
  console.log('🧪 Testando conexão com API Yampi...');
  
  try {
    const baseURL = `https://${validConfig.merchantAlias}.api.yampi.me/v1`;
    const endpoints = [
      { path: '/merchants/me', name: 'Informações da Loja' },
      { path: '/catalog/products?limit=1', name: 'Produtos' },
      { path: '/customers?limit=1', name: 'Clientes' },
      { path: '/orders?limit=1', name: 'Pedidos' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`  🔄 Testando: ${endpoint.name}`);
        
        const headers = {
          'Content-Type': 'application/json',
          'User-Token': validConfig.token
        };
        
        if (validConfig.secretKey) {
          headers['User-Secret-Key'] = validConfig.secretKey;
        }
        
        if (validConfig.apiKey) {
          headers['Authorization'] = `Bearer ${validConfig.apiKey}`;
        }
        
        const response = await fetch(`${baseURL}${endpoint.path}`, {
          method: 'GET',
          headers
        });
        
        console.log(`    Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`    ✅ ${endpoint.name}: Sucesso!`);
          
          if (endpoint.path === '/merchants/me') {
            console.log(`    📊 Dados da loja:`, data.data);
          }
          return; // Parar no primeiro sucesso
        } else {
          const errorText = await response.text();
          console.log(`    ❌ ${endpoint.name}: ${errorText}`);
        }
      } catch (error) {
        console.log(`    ❌ ${endpoint.name}: ${error.message}`);
      }
    }
    
    console.log('❌ Todos os endpoints falharam');
    
  } catch (error) {
    console.log(`❌ Erro geral no teste: ${error.message}`);
  }
  
  console.log('🏁 === FIM DO DIAGNÓSTICO ===');
}

// Executar automaticamente
testYampiManual(); 