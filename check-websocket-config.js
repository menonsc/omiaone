#!/usr/bin/env node

import { io } from 'socket.io-client'

async function checkWebSocketConfig() {
  console.log('🔍 Verificando configuração do WebSocket...')
  
  const baseURL = 'https://evolution.elevroi.com.br'
  const apiKey = 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB'
  const instanceName = 'elevroi'
  
  const wsUrl = baseURL.replace(/^https/, 'wss')
  console.log('🔗 URL do WebSocket:', wsUrl)
  console.log('📱 Instance:', instanceName)
  console.log('🔑 API Key:', apiKey ? '***' + apiKey.slice(-4) : 'undefined')
  
  // Teste 1: Verificar se a URL está correta
  console.log('\n🔍 Teste 1: Verificando URL...')
  console.log('   Base URL:', baseURL)
  console.log('   WebSocket URL:', wsUrl)
  console.log('   URL completa:', `${wsUrl}/socket.io/`)
  
  // Teste 2: Verificar configuração do socket.io
  const socketConfig = {
    transports: ['websocket'],
    auth: { apikey: apiKey },
    timeout: 10000,
    path: '/socket.io/',
    query: {
      instance: instanceName,
      apikey: apiKey
    }
  }
  
  console.log('\n🔍 Teste 2: Configuração do Socket.io...')
  console.log('   Transports:', socketConfig.transports)
  console.log('   Auth:', { apikey: '***' + apiKey.slice(-4) })
  console.log('   Timeout:', socketConfig.timeout)
  console.log('   Path:', socketConfig.path)
  console.log('   Query:', {
    instance: instanceName,
    apikey: '***' + apiKey.slice(-4)
  })
  
  try {
    console.log('\n🔌 Tentando conectar...')
    const socket = io(wsUrl, socketConfig)
    
    const connectionPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect()
        reject(new Error('Timeout - 10 segundos'))
      }, 10000)
      
      socket.on('connect', () => {
        clearTimeout(timeout)
        console.log('✅ Conectado com sucesso!')
        console.log('🔌 Socket ID:', socket.id)
        console.log('📡 Status da conexão:', socket.connected)
        
        // Testar envio de evento
        socket.emit('ping', { timestamp: new Date().toISOString() })
        console.log('📤 Evento ping enviado')
        
        // Aguardar 5 segundos para ver se recebe eventos
        setTimeout(() => {
          socket.disconnect()
          resolve('Conectado')
        }, 5000)
      })
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout)
        console.log('❌ Erro na conexão:', error.message)
        console.log('💡 Possíveis causas:')
        console.log('   1. Evolution API não está rodando')
        console.log('   2. Instância não existe ou não está conectada')
        console.log('   3. API key incorreta')
        console.log('   4. WebSocket não habilitado no servidor')
        socket.disconnect()
        reject(error)
      })
      
      socket.on('disconnect', (reason) => {
        console.log('🔌 Desconectado:', reason)
      })
      
      socket.on('MESSAGE_UPSERT', (data) => {
        console.log('📨 MESSAGE_UPSERT recebido:', data)
      })
      
      socket.on('messages.upsert', (data) => {
        console.log('📨 messages.upsert recebido:', data)
      })
      
      socket.on('CONNECTION_UPDATE', (data) => {
        console.log('🔌 CONNECTION_UPDATE recebido:', data)
      })
      
      socket.on('error', (error) => {
        console.error('❌ Socket.io error:', error)
      })
    })
    
    await connectionPromise
    console.log('✅ Teste de configuração concluído com sucesso')
    
  } catch (error) {
    console.log('❌ Teste de configuração falhou:', error.message)
    
    // Sugestões de correção
    console.log('\n💡 Sugestões de correção:')
    console.log('   1. Verifique se o Evolution API está rodando')
    console.log('   2. Verifique se a instância "elevroi" existe')
    console.log('   3. Verifique se a API key está correta')
    console.log('   4. Verifique se o WebSocket está habilitado no servidor')
    console.log('   5. Tente conectar via HTTP primeiro para verificar a API')
  }
}

checkWebSocketConfig() 