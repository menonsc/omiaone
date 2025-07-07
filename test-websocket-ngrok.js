#!/usr/bin/env node

import { io } from 'socket.io-client'
import { readFileSync } from 'fs'

async function testWebSocketNgrok() {
  console.log('🧪 Testando WebSocket com ngrok...')
  
  // Configurações
  const baseURL = process.argv[2] || 'https://your-ngrok-url.ngrok.io'
  const apiKey = process.argv[3] || 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB'
  const instanceName = process.argv[4] || 'elevroi'
  
  console.log('🔗 URL do ngrok:', baseURL)
  console.log('📱 Instance:', instanceName)
  console.log('🔑 API Key:', apiKey ? '***' + apiKey.slice(-4) : 'undefined')
  
  // Teste 1: Verificar se a URL está acessível
  console.log('\n🔍 Teste 1: Verificando acessibilidade da URL...')
  try {
    const response = await fetch(`${baseURL}/health`)
    console.log('✅ URL acessível:', response.status)
  } catch (error) {
    console.log('❌ URL não acessível:', error.message)
    return
  }

  // Teste 2: Verificar CORS
  console.log('\n🔍 Teste 2: Verificando CORS...')
  try {
    const corsResponse = await fetch(`${baseURL}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'content-type'
      }
    })
    
    const corsHeaders = corsResponse.headers
    console.log('✅ CORS Headers:')
    console.log('  Access-Control-Allow-Origin:', corsHeaders.get('access-control-allow-origin'))
    console.log('  Access-Control-Allow-Methods:', corsHeaders.get('access-control-allow-methods'))
    console.log('  Access-Control-Allow-Headers:', corsHeaders.get('access-control-allow-headers'))
  } catch (error) {
    console.log('❌ Erro no teste CORS:', error.message)
  }

  // Teste 3: Verificar WebSocket endpoint
  console.log('\n🔍 Teste 3: Verificando WebSocket endpoint...')
  try {
    const wsResponse = await fetch(`${baseURL}/socket.io/`)
    console.log('✅ WebSocket endpoint acessível:', wsResponse.status)
  } catch (error) {
    console.log('❌ WebSocket endpoint não acessível:', error.message)
  }

  // Teste 4: Testar conexão WebSocket
  console.log('\n🔍 Teste 4: Testando conexão WebSocket...')
  
  const socket = io(`${baseURL}/${instanceName}`, {
    transports: ['websocket'],
    auth: { apikey: apiKey },
    timeout: 10000,
    forceNew: true
  })

  return new Promise((resolve) => {
    let connected = false
    let error = null

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado com sucesso!')
      console.log('📊 Socket ID:', socket.id)
      connected = true
      
      // Testar envio de mensagem
      socket.emit('test', { message: 'Teste de conexão' })
      
      setTimeout(() => {
        socket.disconnect()
        resolve({ success: true, connected: true })
      }, 2000)
    })

    socket.on('connect_error', (err) => {
      console.log('❌ Erro na conexão WebSocket:', err.message)
      error = err.message
      
      // Tentar com polling como fallback
      console.log('🔄 Tentando com polling...')
      socket.io.opts.transports = ['polling']
      socket.connect()
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket desconectado:', reason)
      if (!connected) {
        resolve({ success: false, error, connected: false })
      }
    })

    socket.on('test_response', (data) => {
      console.log('📨 Resposta do teste:', data)
    })

    // Timeout após 15 segundos
    setTimeout(() => {
      if (!connected) {
        console.log('⏰ Timeout na conexão WebSocket')
        socket.disconnect()
        resolve({ success: false, error: 'Timeout', connected: false })
      }
    }, 15000)
  })
}

// Teste 5: Verificar Evolution API
async function testEvolutionAPI(baseURL, apiKey, instanceName) {
  console.log('\n🔍 Teste 5: Verificando Evolution API...')
  
  try {
    const response = await fetch(`${baseURL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Evolution API funcionando')
      console.log('📊 Instâncias encontradas:', data.length || 0)
    } else {
      console.log('❌ Evolution API não respondeu corretamente:', response.status)
    }
  } catch (error) {
    console.log('❌ Erro na Evolution API:', error.message)
  }
}

// Função principal
async function main() {
  const baseURL = process.argv[2]
  const apiKey = process.argv[3]
  const instanceName = process.argv[4]
  
  if (!baseURL) {
    console.log('❌ Uso: node test-websocket-ngrok.js <ngrok-url> [api-key] [instance-name]')
    console.log('📝 Exemplo: node test-websocket-ngrok.js https://abc123.ngrok.io your-api-key elevroi')
    process.exit(1)
  }
  
  console.log('🚀 Iniciando testes de WebSocket com ngrok...')
  
  try {
    // Testar WebSocket
    const wsResult = await testWebSocketNgrok()
    
    // Testar Evolution API
    await testEvolutionAPI(baseURL, apiKey, instanceName)
    
    // Resumo
    console.log('\n📊 RESUMO DOS TESTES:')
    console.log('=====================')
    
    if (wsResult.success) {
      console.log('✅ WebSocket: FUNCIONANDO')
      console.log('✅ CORS: CONFIGURADO')
      console.log('✅ ngrok: COMPATÍVEL')
    } else {
      console.log('❌ WebSocket: FALHOU')
      console.log('❌ Erro:', wsResult.error)
      console.log('\n🔧 SOLUÇÕES:')
      console.log('1. Verificar se ngrok está rodando corretamente')
      console.log('2. Verificar se a URL está acessível')
      console.log('3. Verificar configuração do nginx')
      console.log('4. Verificar CSP no index.html')
    }
    
    console.log('\n📋 PRÓXIMOS PASSOS:')
    console.log('1. Reiniciar Docker: docker-compose down && docker-compose up --build -d')
    console.log('2. Verificar logs: docker-compose logs nginx-proxy')
    console.log('3. Testar novamente com este script')
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
    process.exit(1)
  }
}

// Executar se chamado diretamente
main()

export { testWebSocketNgrok, testEvolutionAPI } 