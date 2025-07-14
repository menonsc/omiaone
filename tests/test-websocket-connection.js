#!/usr/bin/env node

import { io } from 'socket.io-client'

async function testWebSocketConnection() {
  console.log('🧪 Testando conexão WebSocket com Evolution API...')
  
  const baseURL = 'https://evolution.elevroi.com.br'
  const apiKey = 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB'
  const instanceName = 'elevroi' // ou qualquer instância que você tenha
  
  const wsUrl = `${baseURL}/${instanceName}`
  console.log('🔗 URL do WebSocket:', wsUrl)
  
  try {
    const socket = io(wsUrl, {
      transports: ['websocket'],
      auth: { apikey: apiKey },
      timeout: 10000
    })
    
    socket.on('connect', () => {
      console.log('✅ WebSocket conectado com sucesso!')
      console.log('🔌 Socket ID:', socket.id)
      console.log('📡 Status da conexão:', socket.connected)
      
      // Testar envio de evento
      socket.emit('ping', { timestamp: new Date().toISOString() })
      console.log('📤 Evento ping enviado')
      
      setTimeout(() => {
        socket.disconnect()
        console.log('🔌 Teste concluído - desconectando')
        process.exit(0)
      }, 3000)
    })
    
    socket.on('connect_error', (error) => {
      console.error('❌ Erro na conexão WebSocket:', error.message)
      console.log('💡 Verifique se:')
      console.log('   1. O Evolution API foi redeployado com WebSocket habilitado')
      console.log('   2. As configurações WEBSOCKET_ENABLED=true foram adicionadas')
      console.log('   3. A instância existe e está conectada')
      process.exit(1)
    })
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket desconectado:', reason)
    })
    
    socket.on('MESSAGE_UPSERT', (data) => {
      console.log('📨 Evento MESSAGE_UPSERT recebido:', data)
    })
    
    socket.on('CONNECTION_UPDATE', (data) => {
      console.log('🔌 Evento CONNECTION_UPDATE recebido:', data)
    })
    
    // Timeout para o teste
    setTimeout(() => {
      console.log('⏰ Timeout do teste - desconectando')
      socket.disconnect()
      process.exit(1)
    }, 15000)
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    process.exit(1)
  }
}

testWebSocketConnection() 