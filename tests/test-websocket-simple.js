#!/usr/bin/env node

import { io } from 'socket.io-client'

async function testWebSocket() {
  console.log('🧪 Testando WebSocket localmente...')
  
  const baseURL = 'http://localhost'
  const instanceName = 'elevroi'
  const apiKey = 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB'
  
  console.log('🔗 URL:', baseURL)
  console.log('📱 Instance:', instanceName)
  
  // Teste 1: Verificar se a URL está acessível
  console.log('\n🔍 Teste 1: Verificando acessibilidade da URL...')
  try {
    const response = await fetch(`${baseURL}/health`)
    console.log('✅ URL acessível:', response.status)
  } catch (error) {
    console.log('❌ URL não acessível:', error.message)
    return
  }

  // Teste 2: Testar conexão WebSocket
  console.log('\n🔍 Teste 2: Testando conexão WebSocket...')
  
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
      
      setTimeout(() => {
        socket.disconnect()
        resolve({ success: true, connected: true })
      }, 2000)
    })

    socket.on('connect_error', (err) => {
      console.log('❌ Erro na conexão WebSocket:', err.message)
      error = err.message
      
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

    // Timeout após 10 segundos
    setTimeout(() => {
      if (!connected) {
        console.log('⏰ Timeout na conexão WebSocket')
        socket.disconnect()
        resolve({ success: false, error: 'Timeout', connected: false })
      }
    }, 10000)
  })
}

// Função principal
async function main() {
  console.log('🚀 Iniciando testes de WebSocket...')
  
  const result = await testWebSocket()
  
  console.log('\n📊 RESULTADO:')
  if (result.success) {
    console.log('✅ WebSocket: FUNCIONANDO')
  } else {
    console.log('❌ WebSocket: FALHOU')
    console.log('❌ Erro:', result.error)
  }
}

main().catch(console.error) 