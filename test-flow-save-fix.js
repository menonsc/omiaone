// Script para testar se o problema de salvamento foi resolvido
// Execute este script no console do navegador na página do Flow Builder

console.log('🧪 Testando correção do salvamento de flows...')

// Função para testar o salvamento completo
async function testFlowSaveComplete() {
  try {
    console.log('📋 Iniciando teste completo de salvamento...')
    
    // Verificar se estamos na página correta
    if (!window.location.pathname.includes('/flow-builder')) {
      console.error('❌ Não estamos na página do Flow Builder')
      return
    }
    
    // Verificar se o flowBuilderService está disponível
    if (typeof window.flowBuilderService === 'undefined') {
      console.error('❌ flowBuilderService não está disponível')
      return
    }
    
    // Verificar se o supabase está disponível
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase não está disponível')
      return
    }
    
    console.log('✅ Serviços disponíveis')
    
    // Verificar se o usuário está autenticado
    const user = window.supabase.auth.user()
    if (!user) {
      console.error('❌ Usuário não está autenticado')
      return
    }
    
    console.log('✅ Usuário autenticado:', user.id)
    
    // Criar um flow de teste com múltiplos nós
    const testFlow = {
      name: 'Teste Salvamento Completo',
      description: 'Teste para verificar salvamento de múltiplos nós',
      userId: user.id,
      isActive: false,
      isTemplate: false,
      category: 'test',
      flowData: {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            config: { triggerType: 'manual' },
            data: {
              id: 'trigger-1',
              type: 'trigger',
              label: 'Trigger Manual',
              config: { triggerType: 'manual' },
              isActive: true
            },
            isActive: true,
            label: 'Trigger Manual',
            description: 'Trigger manual para teste'
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 300, y: 100 },
            config: { actionType: 'log' },
            data: {
              id: 'action-1',
              type: 'action',
              label: 'Log Action',
              config: { actionType: 'log' },
              isActive: true
            },
            isActive: true,
            label: 'Log Action',
            description: 'Ação de log para teste'
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 500, y: 100 },
            config: { conditionType: 'if' },
            data: {
              id: 'condition-1',
              type: 'condition',
              label: 'If Condition',
              config: { conditionType: 'if' },
              isActive: true
            },
            isActive: true,
            label: 'If Condition',
            description: 'Condição if para teste'
          }
        ],
        connections: [
          {
            id: 'edge-1',
            source: 'trigger-1',
            target: 'action-1',
            sourceHandle: 'output',
            targetHandle: 'input',
            condition: {}
          },
          {
            id: 'edge-2',
            source: 'action-1',
            target: 'condition-1',
            sourceHandle: 'output',
            targetHandle: 'input',
            condition: {}
          }
        ],
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
    
    console.log('📝 Flow de teste criado com 3 nós e 2 conexões')
    
    // Tentar criar o flow
    console.log('💾 Tentando criar flow...')
    const createdFlow = await window.flowBuilderService.createFlow(testFlow)
    
    if (createdFlow) {
      console.log('✅ Flow criado com sucesso:', createdFlow)
      
      // Verificar se os nós foram salvos
      if (createdFlow.flowData && createdFlow.flowData.nodes) {
        console.log('✅ Nós salvos:', createdFlow.flowData.nodes.length)
        console.log('📋 Detalhes dos nós:', createdFlow.flowData.nodes.map(n => ({ id: n.id, type: n.type, label: n.label })))
        
        if (createdFlow.flowData.nodes.length === 3) {
          console.log('✅ Todos os 3 nós foram salvos corretamente')
        } else {
          console.error('❌ Número incorreto de nós salvos:', createdFlow.flowData.nodes.length)
        }
      } else {
        console.error('❌ Nós não foram salvos')
      }
      
      // Verificar se as conexões foram salvas
      if (createdFlow.flowData && createdFlow.flowData.connections) {
        console.log('✅ Conexões salvas:', createdFlow.flowData.connections.length)
        console.log('📋 Detalhes das conexões:', createdFlow.flowData.connections.map(c => ({ id: c.id, source: c.source, target: c.target })))
        
        if (createdFlow.flowData.connections.length === 2) {
          console.log('✅ Todas as 2 conexões foram salvas corretamente')
        } else {
          console.error('❌ Número incorreto de conexões salvas:', createdFlow.flowData.connections.length)
        }
      } else {
        console.error('❌ Conexões não foram salvas')
      }
      
      // Tentar atualizar o flow com mais nós
      console.log('🔄 Adicionando mais nós ao flow...')
      const updatedFlow = await window.flowBuilderService.updateFlow(createdFlow.id, {
        ...createdFlow,
        flowData: {
          ...createdFlow.flowData,
          nodes: [
            ...createdFlow.flowData.nodes,
            {
              id: 'action-2',
              type: 'action',
              position: { x: 700, y: 100 },
              config: { actionType: 'email' },
              data: {
                id: 'action-2',
                type: 'action',
                label: 'Email Action',
                config: { actionType: 'email' },
                isActive: true
              },
              isActive: true,
              label: 'Email Action',
              description: 'Ação de email para teste'
            }
          ],
          connections: [
            ...createdFlow.flowData.connections,
            {
              id: 'edge-3',
              source: 'condition-1',
              target: 'action-2',
              sourceHandle: 'output',
              targetHandle: 'input',
              condition: {}
            }
          ]
        }
      })
      
      if (updatedFlow) {
        console.log('✅ Flow atualizado com sucesso:', updatedFlow)
        
        // Verificar se os novos nós foram salvos
        if (updatedFlow.flowData && updatedFlow.flowData.nodes) {
          console.log('✅ Nós após atualização:', updatedFlow.flowData.nodes.length)
          
          if (updatedFlow.flowData.nodes.length === 4) {
            console.log('✅ Todos os 4 nós foram salvos corretamente')
          } else {
            console.error('❌ Número incorreto de nós após atualização:', updatedFlow.flowData.nodes.length)
          }
        }
        
        // Verificar se as novas conexões foram salvas
        if (updatedFlow.flowData && updatedFlow.flowData.connections) {
          console.log('✅ Conexões após atualização:', updatedFlow.flowData.connections.length)
          
          if (updatedFlow.flowData.connections.length === 3) {
            console.log('✅ Todas as 3 conexões foram salvas corretamente')
          } else {
            console.error('❌ Número incorreto de conexões após atualização:', updatedFlow.flowData.connections.length)
          }
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
    console.error('❌ Erro durante o teste:', error)
    console.error('Stack trace:', error.stack)
    return false
  }
}

// Função para verificar se o problema foi resolvido
function checkIfFixed() {
  try {
    console.log('🔍 Verificando se o problema foi resolvido...')
    
    // Verificar se há nós no canvas
    const nodes = document.querySelectorAll('.react-flow__node')
    console.log('🔗 Nós visíveis no canvas:', nodes.length)
    
    // Verificar se há conexões no canvas
    const edges = document.querySelectorAll('.react-flow__edge')
    console.log('🔗 Conexões visíveis no canvas:', edges.length)
    
    // Verificar se o botão de salvar está disponível
    const saveButton = document.querySelector('button[onclick*="handleSave"], button:has(svg[data-testid="save"])')
    console.log('💾 Botão de salvar encontrado:', !!saveButton)
    
    // Verificar se há erros no console
    const consoleErrors = window.consoleErrors || []
    console.log('❌ Erros no console:', consoleErrors.length)
    
    return {
      visibleNodes: nodes.length,
      visibleEdges: edges.length,
      saveButtonAvailable: !!saveButton,
      consoleErrors: consoleErrors.length
    }
  } catch (error) {
    console.error('❌ Erro ao verificar estado:', error)
    return null
  }
}

// Função para testar o salvamento manual
async function testManualSave() {
  try {
    console.log('🖱️ Testando salvamento manual...')
    
    // Simular clique no botão de salvar
    const saveButton = document.querySelector('button[onclick*="handleSave"], button:has(svg[data-testid="save"])')
    if (saveButton) {
      console.log('🖱️ Clicando no botão de salvar...')
      saveButton.click()
      
      // Aguardar um pouco para ver se há erros
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('✅ Salvamento manual testado')
      return true
    } else {
      console.error('❌ Botão de salvar não encontrado')
      return false
    }
  } catch (error) {
    console.error('❌ Erro ao testar salvamento manual:', error)
    return false
  }
}

// Expor funções para uso manual
window.testFlowSaveFix = {
  testFlowSaveComplete,
  checkIfFixed,
  testManualSave
}

console.log('✅ Teste de correção do Flow Builder carregado!')
console.log('💡 Use window.testFlowSaveFix.testFlowSaveComplete() para teste completo')
console.log('💡 Use window.testFlowSaveFix.checkIfFixed() para verificar estado')
console.log('💡 Use window.testFlowSaveFix.testManualSave() para testar salvamento manual') 