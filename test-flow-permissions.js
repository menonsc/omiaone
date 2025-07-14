const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFlowPermissions() {
  console.log('🔍 Testando permissões do Flow Builder...')
  
  try {
    // 1. Testar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Erro de autenticação:', authError)
      return
    }
    
    if (!user) {
      console.error('❌ Usuário não autenticado')
      return
    }
    
    console.log('✅ Usuário autenticado:', user.id)
    
    // 2. Testar permissões do Flow Builder
    const { data: permissions, error: permError } = await supabase
      .rpc('check_flow_builder_permission', {
        user_id_param: user.id,
        action_param: 'create'
      })
    
    if (permError) {
      console.error('❌ Erro ao verificar permissão:', permError)
    } else {
      console.log('✅ Permissão de criação:', permissions)
    }
    
    // 3. Testar inserção na tabela flows
    const testFlow = {
      name: 'Test Flow',
      description: 'Flow de teste',
      user_id: user.id,
      is_active: false,
      is_template: false,
      category: 'general',
      flow_data: { nodes: [], connections: [] },
      variables: {},
      settings: {},
      created_by: user.id
    }
    
    console.log('📝 Tentando inserir flow de teste...')
    
    const { data: insertedFlow, error: insertError } = await supabase
      .from('flows')
      .insert(testFlow)
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Erro ao inserir flow:', insertError)
      
      // Verificar se é erro de permissão
      if (insertError.code === '42501') {
        console.error('🔒 Erro de permissão - RLS bloqueando inserção')
      }
    } else {
      console.log('✅ Flow inserido com sucesso:', insertedFlow)
      
      // Limpar o flow de teste
      const { error: deleteError } = await supabase
        .from('flows')
        .delete()
        .eq('id', insertedFlow.id)
      
      if (deleteError) {
        console.error('⚠️ Erro ao deletar flow de teste:', deleteError)
      } else {
        console.log('🧹 Flow de teste removido')
      }
    }
    
    // 4. Testar consulta de flows
    console.log('📋 Testando consulta de flows...')
    
    const { data: flows, error: selectError } = await supabase
      .from('flows')
      .select('*')
      .eq('user_id', user.id)
      .limit(5)
    
    if (selectError) {
      console.error('❌ Erro ao consultar flows:', selectError)
    } else {
      console.log('✅ Flows encontrados:', flows?.length || 0)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar teste
testFlowPermissions() 