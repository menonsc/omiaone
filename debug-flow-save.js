// Script para debug do salvamento de flows
// Execute este script no console do navegador na página do Flow Builder

console.log('🔍 Iniciando debug do salvamento de flows...')

// Função para testar o salvamento
async function testFlowSave() {
  try {
    console.log('📋 Testando salvamento de flow...')
    
    // Verificar se estamos na página correta
    if (!window.location.pathname.includes('/flow-builder')) {
      console.error('❌ Não estamos na página do Flow Builder')
      return
    }
    
    // Verificar se o flowBuilderService está disponível
    if (typeof window.flowBuilderService === 'undefined') {
      console.error('❌ flowBuilderService não está disponível globalmente')
      return
    }
    
    // Verificar se o supabase está disponível
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase não está disponível globalmente')
      return
    }
    
    console.log('✅ Serviços disponíveis')
    
    // Criar um flow de teste
    const testFlow = {
      name: 'Teste Debug Flow',
      description: 'Flow criado para teste de debug',
      userId: window.supabase.auth.user()?.id,
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
    
    console.log('📝 Flow de teste criado:', testFlow)
    
    // Tentar criar o flow
    console.log('💾 Tentando criar flow...')
    const createdFlow = await window.flowBuilderService.createFlow(testFlow)
    
    if (createdFlow) {
      console.log('✅ Flow criado com sucesso:', createdFlow)
      
      // Tentar atualizar o flow
      console.log('🔄 Tentando atualizar flow...')
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
        console.log('✅ Flow atualizado com sucesso:', updatedFlow)
        
        // Verificar se os nós foram salvos
        if (updatedFlow.flowData.nodes.length === 2) {
          console.log('✅ Nós salvos corretamente:', updatedFlow.flowData.nodes)
        } else {
          console.error('❌ Nós não foram salvos corretamente')
        }
      } else {
        console.error('❌ Falha ao atualizar flow')
      }
      
      // Limpar o flow de teste
      console.log('🧹 Limpando flow de teste...')
      await window.flowBuilderService.deleteFlow(createdFlow.id)
      console.log('✅ Flow de teste removido')
      
    } else {
      console.error('❌ Falha ao criar flow')
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
    console.error('Stack trace:', error.stack)
  }
}

// Função para verificar o estado atual do flow
function checkCurrentFlow() {
  try {
    console.log('🔍 Verificando estado atual do flow...')
    
    // Verificar se há um flow carregado
    const flowElements = document.querySelectorAll('[data-flow-id]')
    console.log('📋 Elementos com data-flow-id:', flowElements.length)
    
    // Verificar se há nós no canvas
    const nodes = document.querySelectorAll('.react-flow__node')
    console.log('🔗 Nós no canvas:', nodes.length)
    
    // Verificar se há conexões no canvas
    const edges = document.querySelectorAll('.react-flow__edge')
    console.log('🔗 Conexões no canvas:', edges.length)
    
    // Verificar se o botão de salvar está disponível
    const saveButton = document.querySelector('button[onclick*="handleSave"], button:has(svg[data-testid="save"])')
    console.log('💾 Botão de salvar encontrado:', !!saveButton)
    
    // Verificar se há erros no console
    console.log('📊 Estado do flow verificado')
    
  } catch (error) {
    console.error('❌ Erro ao verificar estado:', error)
  }
}

// Função para monitorar eventos de salvamento
function monitorSaveEvents() {
  console.log('👀 Monitorando eventos de salvamento...')
  
  // Interceptar chamadas para o flowBuilderService
  const originalCreateFlow = window.flowBuilderService?.createFlow
  const originalUpdateFlow = window.flowBuilderService?.updateFlow
  
  if (originalCreateFlow) {
    window.flowBuilderService.createFlow = async function(...args) {
      console.log('📝 createFlow chamado com:', args)
      try {
        const result = await originalCreateFlow.apply(this, args)
        console.log('✅ createFlow retornou:', result)
        return result
      } catch (error) {
        console.error('❌ createFlow falhou:', error)
        throw error
      }
    }
  }
  
  if (originalUpdateFlow) {
    window.flowBuilderService.updateFlow = async function(...args) {
      console.log('📝 updateFlow chamado com:', args)
      try {
        const result = await originalUpdateFlow.apply(this, args)
        console.log('✅ updateFlow retornou:', result)
        return result
      } catch (error) {
        console.error('❌ updateFlow falhou:', error)
        throw error
      }
    }
  }
  
  // Monitorar cliques no botão de salvar
  document.addEventListener('click', (event) => {
    const target = event.target.closest('button')
    if (target && (target.textContent.includes('Salvar') || target.querySelector('svg[data-testid="save"]'))) {
      console.log('🖱️ Botão de salvar clicado')
    }
  })
  
  console.log('✅ Monitoramento de eventos ativado')
}

// Executar verificações
console.log('🚀 Iniciando verificações...')
checkCurrentFlow()
monitorSaveEvents()

// Expor funções para uso manual
window.debugFlowSave = {
  testFlowSave,
  checkCurrentFlow,
  monitorSaveEvents
}

console.log('✅ Debug do Flow Builder carregado!')
console.log('💡 Use window.debugFlowSave.testFlowSave() para testar o salvamento') 