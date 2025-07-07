#!/usr/bin/env node

import { io } from 'socket.io-client'

async function debugConsoleTest() {
  console.log('🔍 Debug: Testando console e logs...')
  
  const baseURL = 'https://evolution.elevroi.com.br'
  const apiKey = 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB'
  const instanceName = 'elevroi'
  
  const wsUrl = baseURL.replace(/^https/, 'wss')
  console.log('🔗 URL do WebSocket:', wsUrl)
  console.log('📱 Instance:', instanceName)
  
  // Teste 1: Verificar se console.log funciona
  console.log('✅ Teste 1: Console.log funcionando')
  console.error('❌ Teste 2: Console.error funcionando')
  console.warn('⚠️ Teste 3: Console.warn funcionando')
  
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
      console.log('💡 INSTRUÇÕES:')
      console.log('   1. Abra o console do navegador (F12)')
      console.log('   2. Envie uma mensagem do WhatsApp para o número conectado')
      console.log('   3. Verifique se os logs aparecem no console')
      console.log('   4. Se não aparecer, pode ser problema de configuração')
      console.log('\n🔍 Monitorando eventos:')
      console.log('   - MESSAGE_UPSERT')
      console.log('   - messages.upsert')
      console.log('   - CONNECTION_UPDATE')
      console.log('   - Qualquer outro evento que apareça')
    })
    
    socket.on('connect_error', (error) => {
      console.error('❌ Erro na conexão WebSocket:', error.message)
      console.log('💡 Verifique se:')
      console.log('   1. O Evolution API está rodando')
      console.log('   2. A instância existe e está conectada')
      console.log('   3. A API key está correta')
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

debugConsoleTest() 