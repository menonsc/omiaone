// Script para verificar o problema de salvamento dos nós
// Execute este script no console do navegador na página do Flow Builder

console.log('🔍 Verificando problema de salvamento dos nós...')

// Função para verificar o estado atual do flow
function checkFlowState() {
  try {
    console.log('📊 Verificando estado atual do flow...')
    
    // Verificar se há um flow no estado
    const flowElements = document.querySelectorAll('[data-flow-id]')
    console.log('📋 Elementos com data-flow-id:', flowElements.length)
    
    // Verificar se há nós no canvas
    const nodes = document.querySelectorAll('.react-flow__node')
    console.log('🔗 Nós visíveis no canvas:', nodes.length)
    
    // Verificar se há conexões no canvas
    const edges = document.querySelectorAll('.react-flow__edge')
    console.log('🔗 Conexões visíveis no canvas:', edges.length)
    
    // Verificar se o React Flow está funcionando
    const reactFlowInstance = document.querySelector('.react-flow__viewport')
    console.log('🎯 React Flow instance encontrada:', !!reactFlowInstance)
    
    // Verificar se há erros no console
    const consoleErrors = window.consoleErrors || []
    console.log('❌ Erros no console:', consoleErrors.length)
    
    return {
      flowElements: flowElements.length,
      visibleNodes: nodes.length,
      visibleEdges: edges.length,
      reactFlowAvailable: !!reactFlowInstance,
      consoleErrors: consoleErrors.length
    }
  } catch (error) {
    console.error('❌ Erro ao verificar estado:', error)
    return null
  }
}

// Função para verificar se os dados estão sendo enviados corretamente
async function checkDataTransmission() {
  try {
    console.log('📡 Verificando transmissão de dados...')
    
    // Verificar se o flowBuilderService está disponível
    if (typeof window.flowBuilderService === 'undefined') {
      console.error('❌ flowBuilderService não está disponível')
      return false
    }
    
    // Verificar se o supabase está disponível
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase não está disponível')
      return false
    }
    
    // Verificar se o usuário está autenticado
    const user = window.supabase.auth.user()
    if (!user) {
      console.error('❌ Usuário não está autenticado')
      return false
    }
    
    console.log('✅ Serviços e autenticação OK')
    
    // Criar um flow de teste simples
    const testFlow = {
      name: 'Teste Salvamento',
      description: 'Teste para verificar salvamento',
      userId: user.id,
      isActive: false,
      isTemplate: false,
      category: 'test',
      flowData: {
        nodes: [
          {
            id: 'test-node-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            config: { triggerType: 'manual' },
            data: {
              id: 'test-node-1',
              type: 'trigger',
              label: 'Trigger Manual',
              config: { triggerType: 'manual' },
              isActive: true
            },
            isActive: true,
            label: 'Trigger Manual',
            description: 'Trigger manual para teste'
          }
        ],
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
    
    console.log('📝 Flow de teste:', testFlow)
    
    // Tentar criar o flow
    console.log('💾 Tentando criar flow...')
    const createdFlow = await window.flowBuilderService.createFlow(testFlow)
    
    if (createdFlow) {
      console.log('✅ Flow criado:', createdFlow)
      
      // Verificar se os nós foram salvos
      if (createdFlow.flowData && createdFlow.flowData.nodes) {
        console.log('✅ Nós salvos:', createdFlow.flowData.nodes.length)
        console.log('📋 Detalhes dos nós:', createdFlow.flowData.nodes)
      } else {
        console.error('❌ Nós não foram salvos')
      }
      
      // Tentar atualizar com mais nós
      console.log('🔄 Adicionando mais nós...')
      const updatedFlow = await window.flowBuilderService.updateFlow(createdFlow.id, {
        ...createdFlow,
        flowData: {
          ...createdFlow.flowData,
          nodes: [
            ...createdFlow.flowData.nodes,
            {
              id: 'test-node-2',
              type: 'action',
              position: { x: 300, y: 100 },
              config: { actionType: 'log' },
              data: {
                id: 'test-node-2',
                type: 'action',
                label: 'Log Action',
                config: { actionType: 'log' },
                isActive: true
              },
              isActive: true,
              label: 'Log Action',
              description: 'Ação de log para teste'
            }
          ]
        }
      })
      
      if (updatedFlow) {
        console.log('✅ Flow atualizado:', updatedFlow)
        
        if (updatedFlow.flowData && updatedFlow.flowData.nodes) {
          console.log('✅ Nós após atualização:', updatedFlow.flowData.nodes.length)
          console.log('📋 Detalhes dos nós atualizados:', updatedFlow.flowData.nodes)
        } else {
          console.error('❌ Nós não foram atualizados')
        }
      } else {
        console.error('❌ Falha ao atualizar flow')
      }
      
      // Limpar o flow de teste
      console.log('🧹 Limpando flow de teste...')
      await window.flowBuilderService.deleteFlow(createdFlow.id)
      console.log('✅ Flow de teste removido')
      
      return true
    } else {
      console.error('❌ Falha ao criar flow')
      return false
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error)
    console.error('Stack trace:', error.stack)
    return false
  }
}

// Função para verificar se há problemas de permissão
async function checkPermissions() {
  try {
    console.log('🔐 Verificando permissões...')
    
    // Verificar se o usuário tem permissões para flows
    const { data: userRoles, error } = await window.supabase
      .from('user_roles')
      .select(`
        *,
        roles (
          name,
          permissions
        )
      `)
      .eq('user_id', window.supabase.auth.user().id)
      .eq('is_active', true)
    
    if (error) {
      console.error('❌ Erro ao verificar permissões:', error)
      return false
    }
    
    console.log('📋 Roles do usuário:', userRoles)
    
    // Verificar se há permissões de flow_builder
    const hasFlowBuilderPermissions = userRoles.some(ur => 
      ur.roles && 
      ur.roles.permissions && 
      ur.roles.permissions.flow_builder
    )
    
    console.log('✅ Permissões de flow_builder:', hasFlowBuilderPermissions)
    
    return hasFlowBuilderPermissions
    
  } catch (error) {
    console.error('❌ Erro ao verificar permissões:', error)
    return false
  }
}

// Função para verificar se há problemas de RLS
async function checkRLS() {
  try {
    console.log('🔒 Verificando RLS...')
    
    // Tentar acessar a tabela flows
    const { data: flows, error } = await window.supabase
      .from('flows')
      .select('id, name')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro ao acessar tabela flows:', error)
      return false
    }
    
    console.log('✅ Acesso à tabela flows OK')
    return true
    
  } catch (error) {
    console.error('❌ Erro ao verificar RLS:', error)
    return false
  }
}

// Função principal de diagnóstico
async function diagnoseFlowSaveIssue() {
  console.log('🚀 Iniciando diagnóstico completo...')
  
  // 1. Verificar estado atual
  const state = checkFlowState()
  console.log('📊 Estado atual:', state)
  
  // 2. Verificar permissões
  const permissionsOK = await checkPermissions()
  console.log('🔐 Permissões:', permissionsOK ? 'OK' : 'PROBLEMA')
  
  // 3. Verificar RLS
  const rlsOK = await checkRLS()
  console.log('🔒 RLS:', rlsOK ? 'OK' : 'PROBLEMA')
  
  // 4. Verificar transmissão de dados
  const dataOK = await checkDataTransmission()
  console.log('📡 Transmissão de dados:', dataOK ? 'OK' : 'PROBLEMA')
  
  // Resumo
  console.log('📋 RESUMO DO DIAGNÓSTICO:')
  console.log('- Estado atual:', state ? 'Verificado' : 'Erro')
  console.log('- Permissões:', permissionsOK ? '✅ OK' : '❌ PROBLEMA')
  console.log('- RLS:', rlsOK ? '✅ OK' : '❌ PROBLEMA')
  console.log('- Transmissão de dados:', dataOK ? '✅ OK' : '❌ PROBLEMA')
  
  if (!permissionsOK) {
    console.log('💡 SUGESTÃO: Verificar permissões do usuário no sistema RBAC')
  }
  
  if (!rlsOK) {
    console.log('💡 SUGESTÃO: Verificar políticas RLS da tabela flows')
  }
  
  if (!dataOK) {
    console.log('💡 SUGESTÃO: Verificar conexão com Supabase e estrutura de dados')
  }
  
  return {
    state,
    permissionsOK,
    rlsOK,
    dataOK
  }
}

// Expor funções para uso manual
window.flowSaveDiagnostic = {
  checkFlowState,
  checkDataTransmission,
  checkPermissions,
  checkRLS,
  diagnoseFlowSaveIssue
}

console.log('✅ Diagnóstico do Flow Builder carregado!')
console.log('💡 Use window.flowSaveDiagnostic.diagnoseFlowSaveIssue() para diagnóstico completo') 