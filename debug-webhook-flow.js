import { createClient } from '@supabase/supabase-js'

// Configurar Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://wfvzqxdcmhilrslahvfu.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdnpxeGRjbWhpbHJzbGFodmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1OTEzNTcsImV4cCI6MjA0NjE2NzM1N30.fRPiUJhxELK5QrZwfFGqzOzOYZQpKWNzjIxHLDjkF3s'
)

async function testWebhookFlow() {
  console.log('🧪 Iniciando teste do fluxo de webhooks...')
  
  try {
    // 1. Verificar se há webhooks configurados
    console.log('\n📋 1. Verificando webhooks configurados...')
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('status', 'active')
      
    if (webhooksError) {
      console.error('❌ Erro ao buscar webhooks:', webhooksError)
      return
    }
    
    if (!webhooks || webhooks.length === 0) {
      console.log('⚠️ Nenhum webhook ativo encontrado')
      console.log('📝 Para testar, crie um webhook em /settings/webhooks')
      return
    }
    
    console.log(`✅ Encontrados ${webhooks.length} webhooks ativos:`)
    webhooks.forEach(webhook => {
      console.log(`  - ${webhook.name} (${webhook.url}) - Eventos: ${webhook.events.join(', ')}`)
    })
    
    // 2. Buscar webhooks para evento whatsapp_message
    console.log('\n📋 2. Buscando webhooks para evento whatsapp_message...')
    const { data: whatsappWebhooks, error: whatsappError } = await supabase
      .rpc('get_webhooks_for_event', { event_type_param: 'whatsapp_message' })
      
    if (whatsappError) {
      console.error('❌ Erro ao buscar webhooks para whatsapp_message:', whatsappError)
      return
    }
    
    if (!whatsappWebhooks || whatsappWebhooks.length === 0) {
      console.log('⚠️ Nenhum webhook configurado para evento whatsapp_message')
      console.log('📝 Configure um webhook com o evento "Mensagem WhatsApp"')
      return
    }
    
    console.log(`✅ Encontrados ${whatsappWebhooks.length} webhooks para whatsapp_message`)
    
    // 3. Simular disparo de webhook
    console.log('\n📤 3. Simulando disparo de webhook...')
    
    const testPayload = {
      event: 'whatsapp_message',
      timestamp: new Date().toISOString(),
      data: {
        instanceName: 'test-instance',
        messageId: 'test-message-id',
        from: '5511999999999@s.whatsapp.net',
        to: 'test-instance',
        message: 'Mensagem de teste para webhook',
        timestamp: new Date().toISOString(),
        type: 'text',
        isGroup: false,
        pushName: 'Teste',
        originalData: {}
      }
    }
    
    for (const webhook of whatsappWebhooks) {
      console.log(`📤 Testando webhook: ${webhook.name}`)
      
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'ElevROI-Webhook-Test/1.0'
          },
          body: JSON.stringify(testPayload),
          signal: AbortSignal.timeout(10000)
        })
        
        const responseText = await response.text()
        
        console.log(`  Status: ${response.status}`)
        console.log(`  Response: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`)
        
        // Registrar teste no banco
        await supabase.rpc('register_webhook_delivery', {
          p_webhook_id: webhook.id,
          p_event_type: 'whatsapp_message',
          p_event_data: testPayload,
          p_status: response.ok ? 'delivered' : 'failed',
          p_http_status_code: response.status,
          p_response_body: responseText,
          p_error_message: response.ok ? null : `HTTP ${response.status}`
        })
        
        console.log(`  ${response.ok ? '✅' : '❌'} ${response.ok ? 'Sucesso' : 'Falha'}`)
        
      } catch (error) {
        console.error(`  ❌ Erro: ${error.message}`)
        
        // Registrar erro no banco
        await supabase.rpc('register_webhook_delivery', {
          p_webhook_id: webhook.id,
          p_event_type: 'whatsapp_message',
          p_event_data: testPayload,
          p_status: 'failed',
          p_http_status_code: null,
          p_response_body: null,
          p_error_message: error.message
        })
      }
    }
    
    // 4. Verificar estatísticas
    console.log('\n📊 4. Verificando estatísticas dos webhooks...')
    
    const { data: updatedWebhooks, error: statsError } = await supabase
      .from('webhooks')
      .select('name, total_deliveries, successful_deliveries, failed_deliveries, last_delivery_at, last_error_at')
      .eq('status', 'active')
      
    if (statsError) {
      console.error('❌ Erro ao buscar estatísticas:', statsError)
      return
    }
    
    updatedWebhooks.forEach(webhook => {
      console.log(`📊 ${webhook.name}:`)
      console.log(`  Total: ${webhook.total_deliveries}`)
      console.log(`  Sucesso: ${webhook.successful_deliveries}`)
      console.log(`  Falha: ${webhook.failed_deliveries}`)
      console.log(`  Última entrega: ${webhook.last_delivery_at || 'Nunca'}`)
      console.log(`  Último erro: ${webhook.last_error_at || 'Nunca'}`)
    })
    
    // 5. Verificar entregas recentes
    console.log('\n📋 5. Verificando entregas recentes...')
    
    const { data: deliveries, error: deliveriesError } = await supabase
      .from('webhook_deliveries')
      .select('*, webhooks(name)')
      .order('queued_at', { ascending: false })
      .limit(10)
      
    if (deliveriesError) {
      console.error('❌ Erro ao buscar entregas:', deliveriesError)
      return
    }
    
    if (deliveries && deliveries.length > 0) {
      console.log(`✅ Últimas ${deliveries.length} entregas:`)
      deliveries.forEach(delivery => {
        console.log(`  ${delivery.status === 'delivered' ? '✅' : '❌'} ${delivery.webhooks.name} - ${delivery.status} - ${delivery.queued_at}`)
      })
    } else {
      console.log('⚠️ Nenhuma entrega registrada')
    }
    
    console.log('\n🎉 Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testWebhookFlow().then(() => {
  console.log('\n👋 Teste finalizado')
  process.exit(0)
}).catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
}) 