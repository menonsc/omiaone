#!/usr/bin/env node

async function checkEnvConfig() {
  console.log('🔍 Verificando configuração das variáveis de ambiente...')
  
  // Simular as variáveis de ambiente do frontend
  const env = {
    VITE_EVOLUTION_API_URL: 'https://evolution.elevroi.com.br',
    VITE_EVOLUTION_API_KEY: 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB',
    VITE_EVOLUTION_INSTANCE_NAME: 'elevroi'
  }
  
  console.log('\n🔍 Teste 1: Verificando variáveis de ambiente...')
  console.log('   VITE_EVOLUTION_API_URL:', env.VITE_EVOLUTION_API_URL)
  console.log('   VITE_EVOLUTION_API_KEY:', env.VITE_EVOLUTION_API_KEY ? '***' + env.VITE_EVOLUTION_API_KEY.slice(-4) : 'undefined')
  console.log('   VITE_EVOLUTION_INSTANCE_NAME:', env.VITE_EVOLUTION_INSTANCE_NAME)
  
  // Teste 2: Verificar se as URLs estão corretas
  console.log('\n🔍 Teste 2: Verificando URLs...')
  const baseURL = env.VITE_EVOLUTION_API_URL
  const wsUrl = baseURL.replace(/^https/, 'wss')
  console.log('   Base URL:', baseURL)
  console.log('   WebSocket URL:', wsUrl)
  console.log('   URL completa:', `${wsUrl}/socket.io/`)
  
  // Teste 3: Verificar configuração do WebSocket
  console.log('\n🔍 Teste 3: Configuração do WebSocket...')
  const webSocketConfig = {
    baseURL: env.VITE_EVOLUTION_API_URL || 'http://localhost:8080',
    apiKey: env.VITE_EVOLUTION_API_KEY || 'your-api-key',
    instanceName: env.VITE_EVOLUTION_INSTANCE_NAME || 'elevroi'
  }
  
  console.log('   Base URL configurada:', webSocketConfig.baseURL)
  console.log('   API Key configurada:', webSocketConfig.apiKey ? '***' + webSocketConfig.apiKey.slice(-4) : 'undefined')
  console.log('   Instance Name configurada:', webSocketConfig.instanceName)
  
  // Teste 4: Verificar se as URLs são válidas
  console.log('\n🔍 Teste 4: Validando URLs...')
  try {
    const url = new URL(baseURL)
    console.log('   ✅ Base URL é válida:', url.toString())
  } catch (error) {
    console.log('   ❌ Base URL inválida:', error.message)
  }
  
  try {
    const wsUrlObj = new URL(wsUrl)
    console.log('   ✅ WebSocket URL é válida:', wsUrlObj.toString())
  } catch (error) {
    console.log('   ❌ WebSocket URL inválida:', error.message)
  }
  
  // Teste 5: Verificar se as configurações estão corretas
  console.log('\n🔍 Teste 5: Verificando configurações...')
  
  if (!webSocketConfig.baseURL || webSocketConfig.baseURL === 'http://localhost:8080') {
    console.log('   ⚠️ Base URL não configurada ou é padrão')
  } else {
    console.log('   ✅ Base URL configurada corretamente')
  }
  
  if (!webSocketConfig.apiKey || webSocketConfig.apiKey === 'your-api-key') {
    console.log('   ⚠️ API Key não configurada ou é padrão')
  } else {
    console.log('   ✅ API Key configurada corretamente')
  }
  
  if (!webSocketConfig.instanceName || webSocketConfig.instanceName === 'elevroi') {
    console.log('   ⚠️ Instance Name não configurada ou é padrão')
  } else {
    console.log('   ✅ Instance Name configurada corretamente')
  }
  
  // Teste 6: Simular configuração do frontend
  console.log('\n🔍 Teste 6: Simulando configuração do frontend...')
  const defaultWebSocketConfig = {
    baseURL: env.VITE_EVOLUTION_API_URL || 'http://localhost:8080',
    apiKey: env.VITE_EVOLUTION_API_KEY || 'your-api-key',
    instanceName: env.VITE_EVOLUTION_INSTANCE_NAME || 'elevroi'
  }
  
  console.log('   Configuração padrão:', {
    baseURL: defaultWebSocketConfig.baseURL,
    apiKey: defaultWebSocketConfig.apiKey ? '***' + defaultWebSocketConfig.apiKey.slice(-4) : 'undefined',
    instanceName: defaultWebSocketConfig.instanceName
  })
  
  // Teste 7: Verificar se há problemas conhecidos
  console.log('\n🔍 Teste 7: Verificando problemas conhecidos...')
  
  if (baseURL.includes('localhost') || baseURL.includes('127.0.0.1')) {
    console.log('   ⚠️ Usando localhost - pode não funcionar em produção')
  }
  
  if (baseURL.startsWith('http://')) {
    console.log('   ⚠️ Usando HTTP - considere usar HTTPS para produção')
  }
  
  if (!baseURL.includes('evolution.elevroi.com.br')) {
    console.log('   ⚠️ URL não é a esperada para produção')
  }
  
  console.log('\n✅ Verificação de configuração concluída')
  console.log('\n💡 Se houver problemas:')
  console.log('   1. Verifique se as variáveis de ambiente estão definidas')
  console.log('   2. Verifique se as URLs estão corretas')
  console.log('   3. Verifique se a API key está correta')
  console.log('   4. Verifique se a instância existe no servidor')
}

checkEnvConfig() 