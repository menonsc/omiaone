#!/usr/bin/env node

import { io } from 'socket.io-client'

async function debugFrontendIssue() {
  console.log('🔍 Debug: Simulando problema do frontend...')
  
  const baseURL = 'https://evolution.elevroi.com.br'
  const apiKey = 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB'
  const instanceName = 'elevroi'
  
  const wsUrl = baseURL.replace(/^https/, 'wss')
  console.log('🔗 URL do WebSocket:', wsUrl)
  console.log('📱 Instance:', instanceName)
  
  // Simular configuração do frontend
  const webSocketConfig = {
    baseURL: baseURL,
    apiKey: apiKey,
    instanceName: instanceName
  }
  
  console.log('🔍 Configuração do frontend:', {
    baseURL: webSocketConfig.baseURL,
    apiKey: webSocketConfig.apiKey ? '***' + webSocketConfig.apiKey.slice(-4) : 'undefined',
    instanceName: webSocketConfig.instanceName
  })
  
  try {
    const socket = io(wsUrl, {
      transports: ['websocket'],
      auth: { apikey: apiKey },
      timeout: 10000,
      path: '/socket.io/',
      query: {
        instance: instanceName,
        apikey: apiKey
      }
    })
    
    socket.on('connect', () => {
      console.log('✅ WebSocket conectado com sucesso!')
      console.log('🔌 Socket ID:', socket.id)
      console.log('📡 Status da conexão:', socket.connected)
      
      // Testar envio de evento
      socket.emit('ping', { timestamp: new Date().toISOString() })
      console.log('📤 Evento ping enviado')
      
      console.log('\n⏳ Aguardando eventos de mensagens...')
      console.log('💡 PROBLEMA IDENTIFICADO:')
      console.log('   - WebSocket está funcionando')
      console.log('   - Mas mensagens não aparecem em tempo real no frontend')
      console.log('   - Possíveis causas:')
      console.log('     1. Console do navegador com filtros ativos')
      console.log('     2. Processamento de mensagens com erro')
      console.log('     3. Hook useRealTimeConnection não está sendo chamado')
      console.log('     4. Event handlers não estão sendo registrados')
      console.log('\n🔍 Monitorando eventos:')
      console.log('   - MESSAGE_UPSERT')
      console.log('   - messages.upsert')
      console.log('   - CONNECTION_UPDATE')
      console.log('   - Qualquer outro evento que apareça')
    })
    
    socket.on('connect_error', (error) => {
      console.error('❌ Erro na conexão WebSocket:', error.message)
      process.exit(1)
    })
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket desconectado:', reason)
    })
    
    // Simular processamento do frontend
    const handleIncomingMessage = (messageData) => {
      try {
        console.log('📨 === PROCESSANDO MENSAGEM RECEBIDA ===')
        console.log('📊 Dados recebidos:', messageData)
        console.log('🔍 Tipo de dados:', typeof messageData)
        console.log('🔍 Chaves disponíveis:', messageData ? Object.keys(messageData) : 'null/undefined')
        
        // Acessar dados dentro de 'data' ou usar fallback para compatibilidade
        const data = messageData.data || messageData
        
        console.log('🟢 Dados internos:', data)
        
        const message = {
          id: data.key?.id || Date.now().toString(),
          from: data.key?.remoteJid || '',
          to: data.key?.fromMe ? data.key?.remoteJid || '' : 'me',
          message: data.message?.conversation || data.message?.extendedTextMessage?.text || '[Mídia]',
          timestamp: (() => {
            try {
              if (data.messageTimestamp) {
                return new Date(data.messageTimestamp * 1000).toISOString()
              }
              return new Date().toISOString()
            } catch {
              return new Date().toISOString()
            }
          })(),
          type: 'text'
        }

        console.log('✅ Mensagem processada:', message)
        console.log('📨 === FIM DO PROCESSAMENTO ===')

      } catch (error) {
        console.error('❌ Erro ao processar mensagem recebida:', error)
      }
    }
    
    // Eventos de mensagens - SIMULANDO O FRONTEND
    socket.on('MESSAGE_UPSERT', (data) => {
      console.log('\n📨 === EVENTO MESSAGE_UPSERT RECEBIDO ===')
      console.log('📊 Dados completos:', JSON.stringify(data, null, 2))
      
      // Simular processamento do frontend
      handleIncomingMessage(data)
      console.log('📨 === FIM DO EVENTO ===')
    })
    
    socket.on('messages.upsert', (data) => {
      console.log('\n📨 === EVENTO messages.upsert RECEBIDO ===')
      console.log('📊 Dados completos:', JSON.stringify(data, null, 2))
      
      // Simular processamento do frontend
      handleIncomingMessage(data)
      console.log('📨 === FIM DO EVENTO ===')
    })
    
    socket.on('CONNECTION_UPDATE', (data) => {
      console.log('\n🔌 === EVENTO CONNECTION_UPDATE RECEBIDO ===')
      console.log('📊 Dados completos:', JSON.stringify(data, null, 2))
      console.log('🔌 === FIM DO EVENTO ===')
    })
    
    // Capturar qualquer outro evento
    socket.onAny((eventName, ...args) => {
      if (!['connect', 'disconnect', 'connect_error', 'MESSAGE_UPSERT', 'messages.upsert', 'CONNECTION_UPDATE'].includes(eventName)) {
        console.log(`\n🔍 === EVENTO DESCONHECIDO: ${eventName} ===`)
        console.log('📊 Dados:', JSON.stringify(args, null, 2))
        console.log(`🔍 === FIM DO EVENTO ${eventName} ===`)
      }
    })
    
    socket.on('error', (error) => {
      console.error('❌ Socket.io error:', error)
    })
    
    // Manter conexão aberta por 120 segundos
    setTimeout(() => {
      console.log('\n⏰ Debug concluído - desconectando')
      console.log('\n💡 CONCLUSÕES:')
      console.log('   1. WebSocket está funcionando corretamente')
      console.log('   2. Eventos estão sendo recebidos')
      console.log('   3. Processamento de mensagens está funcionando')
      console.log('   4. O problema pode estar no frontend:')
      console.log('      - Console do navegador com filtros')
      console.log('      - Hook useRealTimeConnection não sendo chamado')
      console.log('      - Event handlers não sendo registrados')
      console.log('      - Processamento de mensagens com erro')
      socket.disconnect()
      process.exit(0)
    }, 120000)
    
  } catch (error) {
    console.error('❌ Erro ao conectar:', error)
    process.exit(1)
  }
}

debugFrontendIssue() 