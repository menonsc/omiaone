// Script para verificar migrations do Flow Builder em produção
// Execute este script no console do navegador

console.log('🗄️ Verificando migrations do Flow Builder em produção...')

// Função para verificar se as tabelas do Flow Builder existem
async function checkFlowBuilderTables() {
  try {
    console.log('📋 Verificando tabelas do Flow Builder...')
    
    const tables = [
      'flows',
      'flow_nodes', 
      'flow_connections',
      'flow_executions',
      'flow_execution_steps',
      'flow_triggers',
      'flow_templates',
      'flow_variables'
    ]
    
    const results = {}
    
    for (const table of tables) {
      try {
        const { data, error } = await window.supabase
          .from(table)
          .select('id')
          .limit(1)
        
        if (error) {
          console.error(`❌ Erro ao acessar tabela ${table}:`, error)
          results[table] = { exists: false, error: error.message }
        } else {
          console.log(`✅ Tabela ${table} acessível`)
          results[table] = { exists: true, count: data?.length || 0 }
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar tabela ${table}:`, error)
        results[table] = { exists: false, error: error.message }
      }
    }
    
    return results
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error)
    return null
  }
}

// Função para verificar se as políticas RLS foram aplicadas
async function checkRLSPolicies() {
  try {
    console.log('🔒 Verificando políticas RLS...')
    
    const tables = [
      'flows',
      'flow_nodes',
      'flow_connections',
      'flow_executions',
      'flow_execution_steps',
      'flow_triggers',
      'flow_templates',
      'flow_variables'
    ]
    
    const results = {}
    
    for (const table of tables) {
      try {
        // Tentar inserir um registro de teste
        const testData = {
          name: `Teste RLS ${table}`,
          description: 'Teste para verificar políticas RLS',
          user_id: window.supabase.auth.user().id,
          is_active: false,
          is_template: false,
          category: 'test',
          flow_data: { nodes: [], connections: [] },
          variables: {},
          settings: {}
        }
        
        // Ajustar dados para cada tabela
        let insertData = {}
        if (table === 'flows') {
          insertData = testData
        } else if (table === 'flow_nodes') {
          insertData = {
            flow_id: '00000000-0000-0000-0000-000000000000', // UUID inválido para teste
            node_id: 'test-node',
            node_type: 'test',
            config: {},
            position: { x: 0, y: 0 }
          }
        } else if (table === 'flow_connections') {
          insertData = {
            flow_id: '00000000-0000-0000-0000-000000000000',
            source_node_id: 'test-source',
            target_node_id: 'test-target'
          }
        } else {
          // Para outras tabelas, usar dados básicos
          insertData = { name: `Teste ${table}` }
        }
        
        const { data, error } = await window.supabase
          .from(table)
          .insert(insertData)
          .select()
        
        if (error) {
          console.log(`🔒 Política RLS ativa para ${table}:`, error.message.includes('new row violates row-level security policy'))
          results[table] = { rlsActive: true, error: error.message }
        } else {
          console.log(`⚠️ Política RLS não ativa para ${table} - inserção permitida`)
          results[table] = { rlsActive: false, inserted: data }
          
          // Deletar o registro de teste se foi inserido
          if (data && data[0]) {
            await window.supabase
              .from(table)
              .delete()
              .eq('id', data[0].id)
          }
        }
        
      } catch (error) {
        console.error(`❌ Erro ao verificar RLS para ${table}:`, error)
        results[table] = { rlsActive: false, error: error.message }
      }
    }
    
    return results
    
  } catch (error) {
    console.error('❌ Erro ao verificar RLS:', error)
    return null
  }
}

// Função para verificar se as funções foram criadas
async function checkFlowBuilderFunctions() {
  try {
    console.log('🔧 Verificando funções do Flow Builder...')
    
    const functions = [
      'get_flow_stats',
      'update_updated_at',
      'calculate_execution_duration',
      'calculate_step_duration',
      'check_flow_builder_permission',
      'get_user_accessible_flows'
    ]
    
    const results = {}
    
    for (const funcName of functions) {
      try {
        // Tentar executar a função (pode falhar, mas verifica se existe)
        const { data, error } = await window.supabase
          .rpc(funcName, {})
        
        if (error) {
          // Se a função existe mas falha por parâmetros, ainda está OK
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            console.error(`❌ Função ${funcName} não existe`)
            results[funcName] = { exists: false, error: error.message }
          } else {
            console.log(`✅ Função ${funcName} existe (erro esperado por parâmetros)`)
            results[funcName] = { exists: true, error: error.message }
          }
        } else {
          console.log(`✅ Função ${funcName} existe e executável`)
          results[funcName] = { exists: true, result: data }
        }
        
      } catch (error) {
        console.error(`❌ Erro ao verificar função ${funcName}:`, error)
        results[funcName] = { exists: false, error: error.message }
      }
    }
    
    return results
    
  } catch (error) {
    console.error('❌ Erro ao verificar funções:', error)
    return null
  }
}

// Função para verificar se as views foram criadas
async function checkFlowBuilderViews() {
  try {
    console.log('👁️ Verificando views do Flow Builder...')
    
    const views = [
      'flow_builder_stats',
      'flow_execution_monitoring'
    ]
    
    const results = {}
    
    for (const viewName of views) {
      try {
        const { data, error } = await window.supabase
          .from(viewName)
          .select('*')
          .limit(1)
        
        if (error) {
          console.error(`❌ Erro ao acessar view ${viewName}:`, error)
          results[viewName] = { exists: false, error: error.message }
        } else {
          console.log(`✅ View ${viewName} acessível`)
          results[viewName] = { exists: true, count: data?.length || 0 }
        }
        
      } catch (error) {
        console.error(`❌ Erro ao verificar view ${viewName}:`, error)
        results[viewName] = { exists: false, error: error.message }
      }
    }
    
    return results
    
  } catch (error) {
    console.error('❌ Erro ao verificar views:', error)
    return null
  }
}

// Função para verificar se os índices foram criados
async function checkFlowBuilderIndexes() {
  try {
    console.log('📊 Verificando índices do Flow Builder...')
    
    // Lista de índices esperados
    const expectedIndexes = [
      'idx_flows_user_id',
      'idx_flows_active',
      'idx_flows_category',
      'idx_flows_updated_at',
      'idx_flow_nodes_flow_id',
      'idx_flow_nodes_type',
      'idx_flow_connections_flow_id',
      'idx_flow_connections_source',
      'idx_flow_connections_target',
      'idx_flow_executions_flow_id',
      'idx_flow_executions_status',
      'idx_flow_executions_started_at',
      'idx_flow_executions_user_id',
      'idx_flow_execution_steps_execution_id',
      'idx_flow_execution_steps_order',
      'idx_flow_execution_steps_status',
      'idx_flow_triggers_flow_id',
      'idx_flow_triggers_type',
      'idx_flow_triggers_active',
      'idx_flow_triggers_next_run',
      'idx_flow_templates_category',
      'idx_flow_templates_public',
      'idx_flow_templates_featured',
      'idx_flow_variables_scope',
      'idx_flow_variables_name'
    ]
    
    console.log('📋 Índices esperados:', expectedIndexes.length)
    console.log('💡 Nota: Verificação de índices requer acesso direto ao banco')
    
    return {
      expectedCount: expectedIndexes.length,
      note: 'Verificação completa requer acesso direto ao banco de dados'
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar índices:', error)
    return null
  }
}

// Função para verificar se as triggers foram criadas
async function checkFlowBuilderTriggers() {
  try {
    console.log('⚡ Verificando triggers do Flow Builder...')
    
    // Lista de triggers esperados
    const expectedTriggers = [
      'flows_updated_at_trigger',
      'flow_variables_updated_at_trigger',
      'flow_executions_duration_trigger',
      'flow_execution_steps_duration_trigger'
    ]
    
    console.log('📋 Triggers esperados:', expectedTriggers.length)
    console.log('💡 Nota: Verificação de triggers requer acesso direto ao banco')
    
    return {
      expectedCount: expectedTriggers.length,
      note: 'Verificação completa requer acesso direto ao banco de dados'
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar triggers:', error)
    return null
  }
}

// Função principal de diagnóstico
async function diagnoseFlowBuilderMigrations() {
  console.log('🚀 Iniciando diagnóstico de migrations do Flow Builder...')
  
  // 1. Verificar tabelas
  const tables = await checkFlowBuilderTables()
  console.log('🗄️ Tabelas:', tables)
  
  // 2. Verificar políticas RLS
  const rls = await checkRLSPolicies()
  console.log('🔒 RLS:', rls)
  
  // 3. Verificar funções
  const functions = await checkFlowBuilderFunctions()
  console.log('🔧 Funções:', functions)
  
  // 4. Verificar views
  const views = await checkFlowBuilderViews()
  console.log('👁️ Views:', views)
  
  // 5. Verificar índices
  const indexes = await checkFlowBuilderIndexes()
  console.log('📊 Índices:', indexes)
  
  // 6. Verificar triggers
  const triggers = await checkFlowBuilderTriggers()
  console.log('⚡ Triggers:', triggers)
  
  // Resumo
  console.log('📋 RESUMO DO DIAGNÓSTICO:')
  
  const tableCount = tables ? Object.keys(tables).length : 0
  const existingTables = tables ? Object.values(tables).filter(t => t.exists).length : 0
  console.log(`- Tabelas (${existingTables}/${tableCount}):`, existingTables === tableCount ? '✅ OK' : '❌ PROBLEMA')
  
  const rlsCount = rls ? Object.keys(rls).length : 0
  const activeRLS = rls ? Object.values(rls).filter(r => r.rlsActive).length : 0
  console.log(`- Políticas RLS (${activeRLS}/${rlsCount}):`, activeRLS === rlsCount ? '✅ OK' : '❌ PROBLEMA')
  
  const functionCount = functions ? Object.keys(functions).length : 0
  const existingFunctions = functions ? Object.values(functions).filter(f => f.exists).length : 0
  console.log(`- Funções (${existingFunctions}/${functionCount}):`, existingFunctions === functionCount ? '✅ OK' : '❌ PROBLEMA')
  
  const viewCount = views ? Object.keys(views).length : 0
  const existingViews = views ? Object.values(views).filter(v => v.exists).length : 0
  console.log(`- Views (${existingViews}/${viewCount}):`, existingViews === viewCount ? '✅ OK' : '❌ PROBLEMA')
  
  if (existingTables < tableCount) {
    console.log('💡 SUGESTÃO: Executar migration 012_flow_builder_system.sql')
  }
  
  if (activeRLS < rlsCount) {
    console.log('💡 SUGESTÃO: Executar migration 013_add_flow_builder_permissions_fixed.sql')
  }
  
  if (existingFunctions < functionCount) {
    console.log('💡 SUGESTÃO: Verificar se todas as funções foram criadas corretamente')
  }
  
  if (existingViews < viewCount) {
    console.log('💡 SUGESTÃO: Verificar se todas as views foram criadas corretamente')
  }
  
  return {
    tables,
    rls,
    functions,
    views,
    indexes,
    triggers
  }
}

// Expor funções para uso manual
window.flowBuilderMigrationsDebug = {
  checkFlowBuilderTables,
  checkRLSPolicies,
  checkFlowBuilderFunctions,
  checkFlowBuilderViews,
  checkFlowBuilderIndexes,
  checkFlowBuilderTriggers,
  diagnoseFlowBuilderMigrations
}

console.log('✅ Debug de migrations do Flow Builder carregado!')
console.log('💡 Use window.flowBuilderMigrationsDebug.diagnoseFlowBuilderMigrations() para diagnóstico completo') 