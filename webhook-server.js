import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const app = express()
const port = process.env.WEBHOOK_PORT || 3001

// Configurar CORS para permitir requisições do frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }))

// Inicializar Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://wfvzqxdcmhilrslahvfu.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdnpxeGRjbWhpbHJzbGFodmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1OTEzNTcsImV4cCI6MjA0NjE2NzM1N30.fRPiUJhxELK5QrZwfFGqzOzOYZQpKWNzjIxHLDjkF3s'
)

// Função para gerar assinatura HMAC
function generateHMACSignature(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

// Função para buscar webhooks ativos para um evento
async function getActiveWebhooks(eventType) {
  try {
    const { data, error } = await supabase
      .rpc('get_webhooks_for_event', { event_type_param: eventType })

    if (error) {
      console.error('❌ Erro ao buscar webhooks:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar webhooks:', error)
    return []
  }
}

// Função para registrar entrega de webhook
async function registerDelivery(webhookId, eventType, eventData, status, statusCode, responseBody, errorMessage) {
  try {
    await supabase.rpc('register_webhook_delivery', {
      p_webhook_id: webhookId,
      p_event_type: eventType,
      p_event_data: eventData,
      p_status: status,
      p_http_status_code: statusCode,
      p_response_body: responseBody,
      p_error_message: errorMessage
    })
  } catch (error) {
    console.error('❌ Erro ao registrar entrega:', error)
  }
}

// Função para enviar webhook
async function sendWebhook(webhook, payload) {
  try {
    console.log('📤 Enviando webhook:', webhook.name, 'para:', webhook.url)

    // Preparar headers
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'ElevROI-Webhook/1.0',
      ...webhook.headers
    }

    // Adicionar assinatura HMAC se secret_key estiver configurada
    if (webhook.secret_key) {
      const signature = generateHMACSignature(JSON.stringify(payload), webhook.secret_key)
      headers['X-Webhook-Signature'] = signature
    }

    // Enviar requisição
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000) // 30 segundos timeout
    })

    const responseText = await response.text()
    const success = response.ok
    const statusCode = response.status

    // Registrar entrega
    await registerDelivery(
      webhook.id,
      'whatsapp_message',
      payload,
      success ? 'delivered' : 'failed',
      statusCode,
      responseText,
      success ? null : `HTTP ${statusCode}: ${responseText}`
    )

    console.log(success ? '✅' : '❌', `Webhook ${webhook.name}: ${statusCode}`)
    return { success, statusCode, response: responseText }
  } catch (error) {
    const errorMessage = error.message || 'Erro desconhecido'
    console.error('❌ Erro ao enviar webhook:', webhook.name, errorMessage)

    // Registrar entrega com erro
    await registerDelivery(
      webhook.id,
      'whatsapp_message',
      payload,
      'failed',
      null,
      null,
      errorMessage
    )

    return { success: false, error: errorMessage }
  }
}

// Função para disparar webhooks de WhatsApp
async function triggerWhatsAppWebhooks(eventType, eventData) {
  try {
    console.log('🔔 Disparando webhooks para evento:', eventType)

    // Buscar webhooks ativos para este evento
    const webhooks = await getActiveWebhooks(eventType)
    
    if (webhooks.length === 0) {
      console.log('ℹ️ Nenhum webhook ativo encontrado para:', eventType)
      return
    }

    console.log(`📋 Encontrados ${webhooks.length} webhooks ativos`)

    // Preparar payload do evento
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: eventData
    }

    // Enviar para todos os webhooks em paralelo
    const promises = webhooks.map(webhook => sendWebhook(webhook, payload))
    const results = await Promise.allSettled(promises)

    // Log resultados
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ Webhook ${webhooks[index].name}: ${result.value.success ? 'Sucesso' : 'Falha'}`)
      } else {
        console.error(`❌ Webhook ${webhooks[index].name}: ${result.reason}`)
      }
    })

  } catch (error) {
    console.error('❌ Erro ao disparar webhooks:', error)
  }
}

// Endpoint GET para teste (navegador)
app.get('/api/webhooks/whatsapp/:instanceName', (req, res) => {
  const { instanceName } = req.params
  
  res.json({
    success: true,
    message: `Endpoint de webhook funcionando para instância: ${instanceName}`,
    info: {
      method: 'GET (para teste)',
      instance: instanceName,
      timestamp: new Date().toISOString(),
      note: 'Para receber webhooks reais, use POST neste endpoint'
    }
  })
})

// Endpoint para receber webhooks do Evolution API
app.post('/api/webhooks/whatsapp/:instanceName', async (req, res) => {
  const { instanceName } = req.params
  const webhookData = req.body

  console.log('🔔 Webhook recebido do Evolution API:', {
    instance: instanceName,
    event: webhookData.event,
    timestamp: new Date().toISOString()
  })

  try {
    // Processar diferentes tipos de eventos
    switch (webhookData.event) {
      case 'message.upsert':
      case 'messages.upsert':
        await processMessageEvent(instanceName, webhookData)
        break
      
      case 'connection.update':
        await processConnectionEvent(instanceName, webhookData)
        break
      
      default:
        console.log('ℹ️ Evento não processado:', webhookData.event)
    }

    res.status(200).json({ success: true, message: 'Webhook processado' })
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Função para processar eventos de mensagem
async function processMessageEvent(instanceName, webhookData) {
  try {
    console.log('📨 Processando evento de mensagem para:', instanceName)

    // Extrair dados da mensagem
    const message = webhookData.data
    if (!message || !message.key) {
      console.log('⚠️ Dados de mensagem inválidos')
      return
    }

    // Só processar mensagens recebidas (não enviadas por nós)
    if (message.key.fromMe) {
      console.log('ℹ️ Mensagem enviada por nós - ignorando')
      return
    }

    // Preparar dados do evento
    const eventData = {
      instanceName,
      messageId: message.key.id,
      from: message.key.remoteJid,
      to: instanceName,
      message: message.message?.conversation || 
               message.message?.extendedTextMessage?.text || 
               '[Mídia]',
      timestamp: new Date(message.messageTimestamp * 1000).toISOString(),
      type: message.messageType || 'text',
      isGroup: message.key.remoteJid?.includes('@g.us') || false,
      pushName: message.pushName || null,
      originalData: message
    }

    console.log('📤 Disparando webhooks para mensagem de:', eventData.from)

    // Disparar webhooks do usuário
    await triggerWhatsAppWebhooks('whatsapp_message', eventData)

  } catch (error) {
    console.error('❌ Erro ao processar evento de mensagem:', error)
  }
}

// Função para processar eventos de conexão
async function processConnectionEvent(instanceName, webhookData) {
  try {
    console.log('🔌 Processando evento de conexão para:', instanceName)

    const eventData = {
      instanceName,
      status: webhookData.data?.state || 'unknown',
      timestamp: new Date().toISOString(),
      originalData: webhookData.data
    }

    console.log('📤 Disparando webhooks para conexão:', eventData.status)

    // Disparar webhooks do usuário
    await triggerWhatsAppWebhooks('whatsapp_connection', eventData)

  } catch (error) {
    console.error('❌ Erro ao processar evento de conexão:', error)
  }
}

// Endpoint para teste de webhook
app.get('/api/webhooks/test/:instanceName', (req, res) => {
  const { instanceName } = req.params
  
  console.log('🧪 Teste de webhook para:', instanceName)
  
  res.json({
    success: true,
    message: 'Endpoint de webhook funcionando',
    instance: instanceName,
    timestamp: new Date().toISOString()
  })
})

// Endpoint para health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'webhook-server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err)
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  })
})

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor de webhooks iniciado na porta ${port}`)
  console.log(`📡 Endpoint: http://localhost:${port}/api/webhooks/whatsapp/{instanceName}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Encerrando servidor de webhooks...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🔄 Encerrando servidor de webhooks...')
  process.exit(0)
}) 