#!/usr/bin/env node

/**
 * Script para verificar se WebSocket está habilitado na Evolution API
 * Execute: node check-websocket-support.js
 */

const fetch = require('node-fetch')

async function checkWebSocketSupport() {
  const baseURL = process.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080'
  const apiKey = process.env.VITE_EVOLUTION_API_KEY || 'your-api-key'
  
  console.log('🔍 Verificando suporte a WebSocket na Evolution API...')
  console.log('📍 URL:', baseURL)
  console.log('🔑 API Key:', apiKey ? '***' + apiKey.slice(-4) : 'undefined')
  
  try {
    // Teste 1: Verificar se o servidor está rodando
    console.log('\n1️⃣ Testando conectividade básica...')
    const healthResponse = await fetch(`${baseURL}/health`, {
      method: 'GET',
      headers: { 'apikey': apiKey }
    })
    
    if (healthResponse.ok) {
      console.log('✅ Servidor Evolution API está rodando')
    } else {
      console.log('❌ Servidor não respondeu corretamente')
      return
    }
    
    // Teste 2: Verificar se WebSocket está habilitado
    console.log('\n2️⃣ Verificando suporte a WebSocket...')
    const wsTestResponse = await fetch(`${baseURL}/socket.io/`, {
      method: 'GET',
      headers: { 'apikey': apiKey }
    })
    
    if (wsTestResponse.ok) {
      console.log('✅ WebSocket está habilitado na Evolution API')
      console.log('📡 Endpoint WebSocket disponível')
    } else {
      console.log('❌ WebSocket não está habilitado')
      console.log('💡 Para habilitar, configure WEBSOCKET_ENABLED=true no servidor')
    }
    
    // Teste 3: Verificar instâncias disponíveis
    console.log('\n3️⃣ Verificando instâncias disponíveis...')
    const instancesResponse = await fetch(`${baseURL}/instance/fetchInstances`, {
      method: 'GET',
      headers: { 'apikey': apiKey }
    })
    
    if (instancesResponse.ok) {
      const instances = await instancesResponse.json()
      console.log('✅ Instâncias encontradas:', instances.length)
      instances.forEach(instance => {
        console.log(`   - ${instance.instance?.instanceName || 'N/A'}: ${instance.instance?.status || 'N/A'}`)
      })
    } else {
      console.log('❌ Erro ao buscar instâncias')
    }
    
    // Teste 4: Verificar estrutura do banco de dados
    console.log('\n4️⃣ Verificando estrutura do banco de dados...')
    try {
      const chatsResponse = await fetch(`${baseURL}/chat/findChats/test-instance`, {
        method: 'POST',
        headers: { 
          'apikey': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      
      if (chatsResponse.ok) {
        console.log('✅ Estrutura do banco de dados está OK')
      } else {
        const errorText = await chatsResponse.text()
        if (errorText.includes('updatedat')) {
          console.log('❌ Problema detectado: coluna "updatedat" não existe')
          console.log('💡 Solução: Atualizar o banco de dados da Evolution API')
        } else {
          console.log('❌ Erro no banco de dados:', errorText)
        }
      }
    } catch (error) {
      console.log('❌ Erro ao testar estrutura do banco:', error.message)
    }
    
    console.log('\n🎯 Resumo:')
    console.log('✅ Servidor Evolution API: OK')
    console.log(wsTestResponse.ok ? '✅ WebSocket: Habilitado' : '❌ WebSocket: Desabilitado')
    console.log('✅ Instâncias: Verificadas')
    
    if (wsTestResponse.ok) {
      console.log('\n🚀 WebSocket está pronto para uso!')
      console.log('📝 URL de conexão: ' + baseURL.replace(/^http/, 'ws') + '/{nome_instancia}')
    } else {
      console.log('\n⚠️  Para usar WebSocket, configure no servidor:')
      console.log('   WEBSOCKET_ENABLED=true')
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message)
  }
}

// Executar verificação
checkWebSocketSupport() 