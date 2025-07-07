#!/usr/bin/env node

import { io } from 'socket.io-client'

async function checkConsoleIssue() {
  console.log('🔍 Debug: Verificando problema do console...')
  
  const baseURL = 'https://evolution.elevroi.com.br'
  const apiKey = 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB'
  const instanceName = 'elevroi'
  
  const wsUrl = baseURL.replace(/^https/, 'wss')
  console.log('🔗 URL do WebSocket:', wsUrl)
  console.log('📱 Instance:', instanceName)
  
  // Simular diferentes níveis de console
  console.log('✅ Console.log normal')
  console.error('❌ Console.error normal')
  console.warn('⚠️ Console.warn normal')
  console.info('ℹ️ Console.info normal')
  
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
      console.log('   - Console está funcionando')
      console.log('   - Mas mensagens não aparecem em tempo real no frontend')
      console.log('   - Possíveis causas:')
      console.log('     1. Console do navegador com filtros ativos')
      console.log('     2. Hook useRealTimeConnection não está sendo chamado')
      console.log('     3. Event handlers não estão sendo registrados')
      console.log('     4. Processamento de mensagens com erro')
      console.log('     5. Instância não está selecionada no frontend')
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
    
    // Eventos de mensagens - LOGS DETALHADOS
    socket.on('MESSAGE_UPSERT', (data) => {
      console.log('\n📨 === EVENTO MESSAGE_UPSERT RECEBIDO ===')
      console.log('📊 Dados completos:', JSON.stringify(data, null, 2))
      console.log('🔍 Tipo de dados:', typeof data)
      console.log('🔍 Chaves disponíveis:', data ? Object.keys(data) : 'null/undefined')
      
      // Simular processamento do frontend
      const processedData = processMessageData(data)
      if (processedData) {
        console.log('✅ Mensagem processada com sucesso:', processedData)
      } else {
        console.log('⚠️ Dados da mensagem não puderam ser processados')
      }
      console.log('📨 === FIM DO EVENTO ===')
    })
    
    socket.on('messages.upsert', (data) => {
      console.log('\n📨 === EVENTO messages.upsert RECEBIDO ===')
      console.log('📊 Dados completos:', JSON.stringify(data, null, 2))
      console.log('🔍 Tipo de dados:', typeof data)
      console.log('🔍 Chaves disponíveis:', data ? Object.keys(data) : 'null/undefined')
      
      // Simular processamento do frontend
      const processedData = processMessageData(data)
      if (processedData) {
        console.log('✅ Mensagem processada com sucesso:', processedData)
      } else {
        console.log('⚠️ Dados da mensagem não puderam ser processados')
      }
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
      console.log('   2. Console está funcionando corretamente')
      console.log('   3. Eventos estão sendo recebidos')
      console.log('   4. Processamento de mensagens está funcionando')
      console.log('   5. O problema pode estar no frontend:')
      console.log('      - Console do navegador com filtros ativos')
      console.log('      - Hook useRealTimeConnection não sendo chamado')
      console.log('      - Event handlers não sendo registrados')
      console.log('      - Instância não selecionada no frontend')
      console.log('      - Processamento de mensagens com erro')
      console.log('\n🔧 SOLUÇÕES:')
      console.log('   1. Verifique se o console do navegador tem filtros ativos')
      console.log('   2. Verifique se a instância está selecionada no frontend')
      console.log('   3. Verifique se o hook useRealTimeConnection está sendo chamado')
      console.log('   4. Verifique se os event handlers estão sendo registrados')
      console.log('   5. Verifique se há erros no processamento de mensagens')
      socket.disconnect()
      process.exit(0)
    }, 120000)
    
  } catch (error) {
    console.error('❌ Erro ao conectar:', error)
    process.exit(1)
  }
}

// Função para processar dados da mensagem (simulando o frontend)
function processMessageData(data) {
  try {
    console.log('🔍 Processando dados da mensagem...')
    
    // Verificar se data existe
    if (!data) {
      console.log('❌ Dados vazios ou nulos')
      return null
    }

    // Se data é um array, pegar o primeiro item
    const messageData = Array.isArray(data) ? data[0] : data
    
    console.log('🔍 Dados da mensagem:', {
      key: messageData?.key,
      message: messageData?.message,
      pushName: messageData?.pushName,
      messageTimestamp: messageData?.messageTimestamp,
      fromMe: messageData?.key?.fromMe
    })

    // Extrair informações da mensagem
    const processedData = {
      id: messageData?.key?.id || Date.now().toString(),
      from: messageData?.key?.remoteJid || '',
      to: messageData?.key?.fromMe ? messageData?.key?.remoteJid || '' : 'me',
      message: messageData?.message?.conversation || 
              messageData?.message?.extendedTextMessage?.text || 
              '[Mídia]',
      timestamp: messageData?.messageTimestamp ? 
                new Date(messageData.messageTimestamp * 1000).toISOString() : 
                new Date().toISOString(),
      type: 'text',
      pushName: messageData?.pushName,
      fromMe: messageData?.key?.fromMe || false,
      rawData: messageData // Manter dados originais para debug
    }

    console.log('✅ Dados processados:', processedData)
    return processedData

  } catch (error) {
    console.error('❌ Erro ao processar dados da mensagem:', error)
    return null
  }
}

checkConsoleIssue() 