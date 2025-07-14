// Script para verificar permissões do Flow Builder em produção
// Execute este script no console do navegador

console.log('🔐 Verificando permissões do Flow Builder em produção...')

// Função para verificar se as permissões foram aplicadas
async function checkFlowBuilderPermissions() {
  try {
    console.log('📋 Verificando permissões do Flow Builder...')
    
    // Verificar se o usuário está autenticado
    const user = window.supabase?.auth?.user()
    if (!user) {
      console.error('❌ Usuário não está autenticado')
      return false
    }
    
    console.log('👤 Usuário:', user.id)
    
    // Verificar roles do usuário
    const { data: userRoles, error: userRolesError } = await window.supabase
      .from('user_roles')
      .select(`
        *,
        roles (
          id,
          name,
          permissions
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
    
    if (userRolesError) {
      console.error('❌ Erro ao buscar roles do usuário:', userRolesError)
      return false
    }
    
    console.log('📋 Roles do usuário:', userRoles)
    
    if (userRoles.length === 0) {
      console.error('❌ Usuário não tem roles atribuídos')
      return false
    }
    
    // Verificar permissões de flow_builder
    const flowBuilderPermissions = userRoles.map(ur => {
      const role = ur.roles
      const permissions = role?.permissions?.flow_builder || []
      return {
        roleName: role?.name,
        permissions: permissions
      }
    })
    
    console.log('🔐 Permissões de flow_builder:', flowBuilderPermissions)
    
    // Verificar se há pelo menos uma permissão de flow_builder
    const hasFlowBuilderPermissions = flowBuilderPermissions.some(fp => 
      fp.permissions.length > 0
    )
    
    console.log('✅ Tem permissões de flow_builder:', hasFlowBuilderPermissions)
    
    // Verificar permissões específicas
    const allPermissions = flowBuilderPermissions.flatMap(fp => fp.permissions)
    const uniquePermissions = [...new Set(allPermissions)]
    
    console.log('📋 Todas as permissões:', uniquePermissions)
    
    // Verificar se tem permissões essenciais
    const essentialPermissions = ['read', 'create']
    const hasEssentialPermissions = essentialPermissions.every(perm => 
      uniquePermissions.includes(perm)
    )
    
    console.log('✅ Tem permissões essenciais:', hasEssentialPermissions)
    
    return {
      userAuthenticated: true,
      hasFlowBuilderPermissions,
      hasEssentialPermissions,
      roles: userRoles.map(ur => ur.roles?.name),
      permissions: uniquePermissions
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar permissões:', error)
    return false
  }
}

// Função para verificar se as tabelas do Flow Builder existem
async function checkFlowBuilderTables() {
  try {
    console.log('🗄️ Verificando tabelas do Flow Builder...')
    
    // Verificar tabela flows
    const { data: flows, error: flowsError } = await window.supabase
      .from('flows')
      .select('id')
      .limit(1)
    
    if (flowsError) {
      console.error('❌ Erro ao acessar tabela flows:', flowsError)
      return false
    }
    
    console.log('✅ Tabela flows acessível')
    
    // Verificar tabela flow_templates
    const { data: templates, error: templatesError } = await window.supabase
      .from('flow_templates')
      .select('id')
      .limit(1)
    
    if (templatesError) {
      console.error('❌ Erro ao acessar tabela flow_templates:', templatesError)
      return false
    }
    
    console.log('✅ Tabela flow_templates acessível')
    
    // Verificar tabela flow_executions
    const { data: executions, error: executionsError } = await window.supabase
      .from('flow_executions')
      .select('id')
      .limit(1)
    
    if (executionsError) {
      console.error('❌ Erro ao acessar tabela flow_executions:', executionsError)
      return false
    }
    
    console.log('✅ Tabela flow_executions acessível')
    
    return {
      flowsAccessible: true,
      templatesAccessible: true,
      executionsAccessible: true
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error)
    return false
  }
}

// Função para verificar se as políticas RLS estão funcionando
async function checkRLSPolicies() {
  try {
    console.log('🔒 Verificando políticas RLS...')
    
    // Tentar inserir um flow de teste
    const testFlow = {
      name: 'Teste RLS',
      description: 'Teste para verificar políticas RLS',
      user_id: window.supabase.auth.user().id,
      is_active: false,
      is_template: false,
      category: 'test',
      flow_data: { nodes: [], connections: [] },
      variables: {},
      settings: {}
    }
    
    const { data: insertedFlow, error: insertError } = await window.supabase
      .from('flows')
      .insert(testFlow)
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Erro ao inserir flow de teste:', insertError)
      return false
    }
    
    console.log('✅ Inserção de flow funcionou')
    
    // Tentar ler o flow inserido
    const { data: readFlow, error: readError } = await window.supabase
      .from('flows')
      .select('*')
      .eq('id', insertedFlow.id)
      .single()
    
    if (readError) {
      console.error('❌ Erro ao ler flow:', readError)
      return false
    }
    
    console.log('✅ Leitura de flow funcionou')
    
    // Tentar atualizar o flow
    const { data: updatedFlow, error: updateError } = await window.supabase
      .from('flows')
      .update({ name: 'Teste RLS Atualizado' })
      .eq('id', insertedFlow.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Erro ao atualizar flow:', updateError)
      return false
    }
    
    console.log('✅ Atualização de flow funcionou')
    
    // Deletar o flow de teste
    const { error: deleteError } = await window.supabase
      .from('flows')
      .delete()
      .eq('id', insertedFlow.id)
    
    if (deleteError) {
      console.error('❌ Erro ao deletar flow:', deleteError)
      return false
    }
    
    console.log('✅ Deleção de flow funcionou')
    
    return {
      insertWorks: true,
      readWorks: true,
      updateWorks: true,
      deleteWorks: true
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar RLS:', error)
    return false
  }
}

// Função para verificar se o serviço Flow Builder está funcionando
async function checkFlowBuilderService() {
  try {
    console.log('🔧 Verificando serviço Flow Builder...')
    
    // Verificar se o flowBuilderService está disponível
    if (typeof window.flowBuilderService === 'undefined') {
      console.error('❌ flowBuilderService não está disponível')
      return false
    }
    
    console.log('✅ flowBuilderService disponível')
    
    // Tentar criar um flow de teste
    const testFlow = {
      name: 'Teste Serviço',
      description: 'Teste do serviço Flow Builder',
      userId: window.supabase.auth.user().id,
      isActive: false,
      isTemplate: false,
      category: 'test',
      flowData: {
        nodes: [],
        connections: [],
        variables: {},
        settings: {}
      },
      variables: {},
      settings: {
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        errorHandling: 'stop',
        logging: 'errors'
      }
    }
    
    const createdFlow = await window.flowBuilderService.createFlow(testFlow)
    
    if (!createdFlow) {
      console.error('❌ Falha ao criar flow via serviço')
      return false
    }
    
    console.log('✅ Criação via serviço funcionou:', createdFlow.id)
    
    // Tentar ler o flow criado
    const readFlow = await window.flowBuilderService.getFlow(createdFlow.id)
    
    if (!readFlow) {
      console.error('❌ Falha ao ler flow via serviço')
      return false
    }
    
    console.log('✅ Leitura via serviço funcionou')
    
    // Tentar atualizar o flow
    const updatedFlow = await window.flowBuilderService.updateFlow(createdFlow.id, {
      ...readFlow,
      name: 'Teste Serviço Atualizado'
    })
    
    if (!updatedFlow) {
      console.error('❌ Falha ao atualizar flow via serviço')
      return false
    }
    
    console.log('✅ Atualização via serviço funcionou')
    
    // Deletar o flow de teste
    const deleted = await window.flowBuilderService.deleteFlow(createdFlow.id)
    
    if (!deleted) {
      console.error('❌ Falha ao deletar flow via serviço')
      return false
    }
    
    console.log('✅ Deleção via serviço funcionou')
    
    return {
      serviceAvailable: true,
      createWorks: true,
      readWorks: true,
      updateWorks: true,
      deleteWorks: true
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar serviço:', error)
    return false
  }
}

// Função principal de diagnóstico
async function diagnoseFlowBuilderPermissions() {
  console.log('🚀 Iniciando diagnóstico de permissões do Flow Builder...')
  
  // 1. Verificar permissões do usuário
  const permissions = await checkFlowBuilderPermissions()
  console.log('🔐 Permissões:', permissions)
  
  // 2. Verificar tabelas
  const tables = await checkFlowBuilderTables()
  console.log('🗄️ Tabelas:', tables)
  
  // 3. Verificar políticas RLS
  const rls = await checkRLSPolicies()
  console.log('🔒 RLS:', rls)
  
  // 4. Verificar serviço
  const service = await checkFlowBuilderService()
  console.log('🔧 Serviço:', service)
  
  // Resumo
  console.log('📋 RESUMO DO DIAGNÓSTICO:')
  console.log('- Usuário autenticado:', permissions?.userAuthenticated ? '✅ OK' : '❌ PROBLEMA')
  console.log('- Permissões de flow_builder:', permissions?.hasFlowBuilderPermissions ? '✅ OK' : '❌ PROBLEMA')
  console.log('- Permissões essenciais:', permissions?.hasEssentialPermissions ? '✅ OK' : '❌ PROBLEMA')
  console.log('- Tabelas acessíveis:', tables ? '✅ OK' : '❌ PROBLEMA')
  console.log('- Políticas RLS:', rls ? '✅ OK' : '❌ PROBLEMA')
  console.log('- Serviço funcionando:', service ? '✅ OK' : '❌ PROBLEMA')
  
  if (!permissions?.hasFlowBuilderPermissions) {
    console.log('💡 SUGESTÃO: Aplicar permissões de flow_builder ao usuário')
  }
  
  if (!permissions?.hasEssentialPermissions) {
    console.log('💡 SUGESTÃO: Verificar se o usuário tem as permissões essenciais (read, create)')
  }
  
  if (!tables) {
    console.log('💡 SUGESTÃO: Verificar se as migrations do Flow Builder foram executadas')
  }
  
  if (!rls) {
    console.log('💡 SUGESTÃO: Verificar se as políticas RLS foram aplicadas')
  }
  
  if (!service) {
    console.log('💡 SUGESTÃO: Verificar se o serviço Flow Builder está carregado corretamente')
  }
  
  return {
    permissions,
    tables,
    rls,
    service
  }
}

// Expor funções para uso manual
window.flowBuilderPermissionsDebug = {
  checkFlowBuilderPermissions,
  checkFlowBuilderTables,
  checkRLSPolicies,
  checkFlowBuilderService,
  diagnoseFlowBuilderPermissions
}

console.log('✅ Debug de permissões do Flow Builder carregado!')
console.log('💡 Use window.flowBuilderPermissionsDebug.diagnoseFlowBuilderPermissions() para diagnóstico completo') 