// Script para testar se a movimentação dos nós foi corrigida
// Execute este script no console do navegador na página do Flow Builder

console.log('🧪 Testando correção da movimentação dos nós...')

// Função para verificar se a movimentação está funcionando
function testMovementFix() {
  try {
    console.log('🔍 Verificando correção da movimentação...')
    
    // Verificar se há nós no canvas
    const nodes = document.querySelectorAll('.react-flow__node')
    console.log('🔗 Nós encontrados:', nodes.length)
    
    if (nodes.length === 0) {
      console.log('⚠️ Nenhum nó encontrado. Adicione alguns nós primeiro.')
      return false
    }
    
    // Verificar se os nós têm a propriedade draggable
    const draggableNodes = document.querySelectorAll('.react-flow__node[draggable="true"]')
    console.log('🎯 Nós draggable:', draggableNodes.length)
    
    // Verificar se há logs de mudanças de posição
    const hasPositionLogs = console.log.toString().includes('📍 Atualizando posição do nó')
    console.log('📝 Logs de posição ativos:', hasPositionLogs)
    
    // Verificar se o React Flow está funcionando
    const reactFlowInstance = document.querySelector('.react-flow__viewport')
    console.log('🎯 React Flow instance:', !!reactFlowInstance)
    
    // Verificar se há erros no console
    const consoleErrors = window.consoleErrors || []
    console.log('❌ Erros no console:', consoleErrors.length)
    
    return {
      totalNodes: nodes.length,
      draggableNodes: draggableNodes.length,
      hasPositionLogs,
      reactFlowAvailable: !!reactFlowInstance,
      consoleErrors: consoleErrors.length
    }
  } catch (error) {
    console.error('❌ Erro ao verificar movimentação:', error)
    return null
  }
}

// Função para simular movimentação e verificar se funciona
function simulateMovementAndCheck() {
  try {
    console.log('🖱️ Simulando movimentação e verificando...')
    
    // Encontrar o primeiro nó
    const firstNode = document.querySelector('.react-flow__node')
    if (!firstNode) {
      console.error('❌ Nenhum nó encontrado para testar')
      return false
    }
    
    console.log('📌 Nó encontrado:', firstNode)
    
    // Obter posição inicial
    const initialPosition = {
      x: firstNode.style.left || firstNode.offsetLeft,
      y: firstNode.style.top || firstNode.offsetTop
    }
    console.log('📍 Posição inicial:', initialPosition)
    
    // Verificar se o nó tem eventos de mouse
    const hasMouseEvents = firstNode.onmousedown || firstNode.onmousedown !== null
    console.log('🖱️ Eventos de mouse disponíveis:', hasMouseEvents)
    
    // Verificar se o nó tem a propriedade draggable
    const isDraggable = firstNode.draggable
    console.log('🎯 Nó é draggable:', isDraggable)
    
    // Verificar se o nó tem cursor pointer
    const hasPointerCursor = window.getComputedStyle(firstNode).cursor === 'pointer'
    console.log('👆 Cursor pointer:', hasPointerCursor)
    
    // Verificar se há estilos que impedem a movimentação
    const styles = window.getComputedStyle(firstNode)
    const problematicStyles = {
      'pointer-events': styles.pointerEvents,
      'user-select': styles.userSelect,
      'position': styles.position,
      'z-index': styles.zIndex
    }
    console.log('🎨 Estilos do nó:', problematicStyles)
    
    return {
      nodeFound: !!firstNode,
      hasMouseEvents,
      isDraggable,
      hasPointerCursor,
      initialPosition,
      problematicStyles
    }
  } catch (error) {
    console.error('❌ Erro ao simular movimentação:', error)
    return false
  }
}

// Função para verificar se o useEffect está funcionando corretamente
function checkUseEffectBehavior() {
  try {
    console.log('⚙️ Verificando comportamento do useEffect...')
    
    // Verificar se há logs de inicialização
    const hasInitLogs = console.log.toString().includes('🔄 Inicializando nós e edges')
    console.log('📝 Logs de inicialização ativos:', hasInitLogs)
    
    // Verificar se há logs de mudanças
    const hasChangeLogs = console.log.toString().includes('🔄 Mudanças nos nós')
    console.log('📝 Logs de mudanças ativos:', hasChangeLogs)
    
    // Verificar se há logs de atualização de flow
    const hasFlowUpdateLogs = console.log.toString().includes('🔄 Atualizando flow com novas posições')
    console.log('📝 Logs de atualização de flow ativos:', hasFlowUpdateLogs)
    
    return {
      hasInitLogs,
      hasChangeLogs,
      hasFlowUpdateLogs
    }
  } catch (error) {
    console.error('❌ Erro ao verificar useEffect:', error)
    return null
  }
}

// Função para testar movimentação manual e verificar logs
function testManualMovementWithLogs() {
  try {
    console.log('🖱️ Testando movimentação manual com logs...')
    
    // Limpar console para ver apenas os logs novos
    console.clear()
    
    // Encontrar um nó
    const node = document.querySelector('.react-flow__node')
    if (!node) {
      console.log('⚠️ Nenhum nó encontrado para testar')
      return false
    }
    
    console.log('📌 Testando movimentação do nó:', node)
    
    // Simular evento de mouse down
    const mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100
    })
    
    node.dispatchEvent(mouseDownEvent)
    console.log('🖱️ Mouse down disparado')
    
    // Aguardar um pouco
    setTimeout(() => {
      // Simular movimento do mouse
      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: 150,
        clientY: 150
      })
      
      document.dispatchEvent(mouseMoveEvent)
      console.log('🖱️ Mouse move disparado')
      
      // Aguardar um pouco mais
      setTimeout(() => {
        // Simular mouse up
        const mouseUpEvent = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: 150,
          clientY: 150
        })
        
        document.dispatchEvent(mouseUpEvent)
        console.log('🖱️ Mouse up disparado')
        
        console.log('✅ Teste de movimentação manual concluído')
        console.log('📋 Verifique os logs acima para ver se houve mudanças de posição')
      }, 100)
    }, 100)
    
    return true
    
  } catch (error) {
    console.error('❌ Erro no teste manual:', error)
    return false
  }
}

// Função principal de diagnóstico da correção
function diagnoseMovementFix() {
  console.log('🚀 Iniciando diagnóstico da correção de movimentação...')
  
  // 1. Verificar estado atual
  const state = testMovementFix()
  console.log('📊 Estado atual:', state)
  
  // 2. Verificar comportamento do useEffect
  const useEffectBehavior = checkUseEffectBehavior()
  console.log('⚙️ Comportamento do useEffect:', useEffectBehavior)
  
  // 3. Simular movimentação
  const movement = simulateMovementAndCheck()
  console.log('🖱️ Movimentação:', movement)
  
  // Resumo
  console.log('📋 RESUMO DO DIAGNÓSTICO:')
  console.log('- Nós encontrados:', state?.totalNodes || 0)
  console.log('- Nós draggable:', state?.draggableNodes || 0)
  console.log('- Logs de posição ativos:', state?.hasPositionLogs ? '✅ OK' : '❌ PROBLEMA')
  console.log('- Logs de mudanças ativos:', useEffectBehavior?.hasChangeLogs ? '✅ OK' : '❌ PROBLEMA')
  console.log('- Logs de atualização ativos:', useEffectBehavior?.hasFlowUpdateLogs ? '✅ OK' : '❌ PROBLEMA')
  console.log('- Movimentação possível:', movement?.isDraggable ? '✅ OK' : '❌ PROBLEMA')
  
  if (state?.draggableNodes === 0) {
    console.log('💡 SUGESTÃO: Os nós não estão configurados como draggable')
  }
  
  if (!state?.hasPositionLogs) {
    console.log('💡 SUGESTÃO: Os logs de posição não estão ativos')
  }
  
  if (!useEffectBehavior?.hasChangeLogs) {
    console.log('💡 SUGESTÃO: Os logs de mudanças não estão ativos')
  }
  
  return {
    state,
    useEffectBehavior,
    movement
  }
}

// Função para testar movimentação real
function testRealMovement() {
  try {
    console.log('🎯 Testando movimentação real...')
    
    // Encontrar um nó
    const node = document.querySelector('.react-flow__node')
    if (!node) {
      console.log('⚠️ Nenhum nó encontrado para testar')
      return false
    }
    
    console.log('📌 Instruções para teste manual:')
    console.log('1. Clique e arraste um nó no canvas')
    console.log('2. Observe se o nó se move')
    console.log('3. Verifique os logs no console')
    console.log('4. Clique em Salvar para verificar se a posição foi salva')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro no teste real:', error)
    return false
  }
}

// Expor funções para uso manual
window.nodeMovementFixTest = {
  testMovementFix,
  simulateMovementAndCheck,
  checkUseEffectBehavior,
  diagnoseMovementFix,
  testManualMovementWithLogs,
  testRealMovement
}

console.log('✅ Teste de correção da movimentação carregado!')
console.log('💡 Use window.nodeMovementFixTest.diagnoseMovementFix() para diagnóstico completo')
console.log('💡 Use window.nodeMovementFixTest.testRealMovement() para instruções de teste manual') 