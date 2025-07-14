// Script para testar a movimentação dos nós
// Execute este script no console do navegador na página do Flow Builder

console.log('🧪 Testando movimentação dos nós...')

// Função para verificar se os nós podem ser movidos
function testNodeMovement() {
  try {
    console.log('🔍 Verificando movimentação dos nós...')
    
    // Verificar se há nós no canvas
    const nodes = document.querySelectorAll('.react-flow__node')
    console.log('🔗 Nós encontrados:', nodes.length)
    
    if (nodes.length === 0) {
      console.log('⚠️ Nenhum nó encontrado. Adicione alguns nós primeiro.')
      return false
    }
    
    // Verificar se os nós têm a classe de draggable
    const draggableNodes = document.querySelectorAll('.react-flow__node[draggable="true"]')
    console.log('🎯 Nós draggable:', draggableNodes.length)
    
    // Verificar se há nós selecionáveis
    const selectableNodes = document.querySelectorAll('.react-flow__node')
    console.log('📌 Nós selecionáveis:', selectableNodes.length)
    
    // Verificar se o React Flow está funcionando
    const reactFlowInstance = document.querySelector('.react-flow__viewport')
    console.log('🎯 React Flow instance:', !!reactFlowInstance)
    
    // Verificar se há erros no console
    const consoleErrors = window.consoleErrors || []
    console.log('❌ Erros no console:', consoleErrors.length)
    
    return {
      totalNodes: nodes.length,
      draggableNodes: draggableNodes.length,
      selectableNodes: selectableNodes.length,
      reactFlowAvailable: !!reactFlowInstance,
      consoleErrors: consoleErrors.length
    }
  } catch (error) {
    console.error('❌ Erro ao verificar movimentação:', error)
    return null
  }
}

// Função para simular movimentação de um nó
function simulateNodeMovement() {
  try {
    console.log('🖱️ Simulando movimentação de nó...')
    
    // Encontrar o primeiro nó
    const firstNode = document.querySelector('.react-flow__node')
    if (!firstNode) {
      console.error('❌ Nenhum nó encontrado para testar')
      return false
    }
    
    console.log('📌 Nó encontrado:', firstNode)
    
    // Verificar se o nó tem eventos de mouse
    const hasMouseEvents = firstNode.onmousedown || firstNode.onmousedown !== null
    console.log('🖱️ Eventos de mouse disponíveis:', hasMouseEvents)
    
    // Verificar se o nó tem a propriedade draggable
    const isDraggable = firstNode.draggable
    console.log('🎯 Nó é draggable:', isDraggable)
    
    // Verificar se o nó tem cursor pointer
    const hasPointerCursor = window.getComputedStyle(firstNode).cursor === 'pointer'
    console.log('👆 Cursor pointer:', hasPointerCursor)
    
    return {
      nodeFound: !!firstNode,
      hasMouseEvents,
      isDraggable,
      hasPointerCursor
    }
  } catch (error) {
    console.error('❌ Erro ao simular movimentação:', error)
    return false
  }
}

// Função para verificar se há conflitos de CSS
function checkCSSConflicts() {
  try {
    console.log('🎨 Verificando conflitos de CSS...')
    
    // Verificar se há estilos que podem interferir na movimentação
    const nodes = document.querySelectorAll('.react-flow__node')
    const conflicts = []
    
    nodes.forEach((node, index) => {
      const styles = window.getComputedStyle(node)
      
      // Verificar propriedades que podem interferir
      const problematicProps = {
        'pointer-events': styles.pointerEvents,
        'user-select': styles.userSelect,
        'position': styles.position,
        'z-index': styles.zIndex
      }
      
      // Verificar se há problemas
      if (problematicProps['pointer-events'] === 'none') {
        conflicts.push(`Node ${index}: pointer-events: none`)
      }
      if (problematicProps['user-select'] === 'none') {
        conflicts.push(`Node ${index}: user-select: none`)
      }
      
      console.log(`📋 Node ${index} styles:`, problematicProps)
    })
    
    console.log('⚠️ Possíveis conflitos:', conflicts)
    return conflicts
  } catch (error) {
    console.error('❌ Erro ao verificar CSS:', error)
    return []
  }
}

// Função para verificar se o React Flow está configurado corretamente
function checkReactFlowConfig() {
  try {
    console.log('⚙️ Verificando configuração do React Flow...')
    
    // Verificar se o ReactFlow está renderizado
    const reactFlow = document.querySelector('.react-flow')
    console.log('🎯 ReactFlow encontrado:', !!reactFlow)
    
    // Verificar se há controles
    const controls = document.querySelector('.react-flow__controls')
    console.log('🎮 Controles encontrados:', !!controls)
    
    // Verificar se há background
    const background = document.querySelector('.react-flow__background')
    console.log('🎨 Background encontrado:', !!background)
    
    // Verificar se há viewport
    const viewport = document.querySelector('.react-flow__viewport')
    console.log('🔍 Viewport encontrado:', !!viewport)
    
    // Verificar se há pane
    const pane = document.querySelector('.react-flow__pane')
    console.log('📋 Pane encontrado:', !!pane)
    
    return {
      reactFlow: !!reactFlow,
      controls: !!controls,
      background: !!background,
      viewport: !!viewport,
      pane: !!pane
    }
  } catch (error) {
    console.error('❌ Erro ao verificar configuração:', error)
    return null
  }
}

// Função principal de diagnóstico
function diagnoseNodeMovement() {
  console.log('🚀 Iniciando diagnóstico de movimentação...')
  
  // 1. Verificar estado atual
  const state = testNodeMovement()
  console.log('📊 Estado atual:', state)
  
  // 2. Verificar configuração do React Flow
  const config = checkReactFlowConfig()
  console.log('⚙️ Configuração:', config)
  
  // 3. Verificar conflitos de CSS
  const conflicts = checkCSSConflicts()
  console.log('🎨 Conflitos CSS:', conflicts.length)
  
  // 4. Simular movimentação
  const movement = simulateNodeMovement()
  console.log('🖱️ Movimentação:', movement)
  
  // Resumo
  console.log('📋 RESUMO DO DIAGNÓSTICO:')
  console.log('- Nós encontrados:', state?.totalNodes || 0)
  console.log('- Nós draggable:', state?.draggableNodes || 0)
  console.log('- React Flow configurado:', config?.reactFlow ? '✅ OK' : '❌ PROBLEMA')
  console.log('- Conflitos CSS:', conflicts.length > 0 ? '❌ PROBLEMA' : '✅ OK')
  console.log('- Movimentação possível:', movement?.isDraggable ? '✅ OK' : '❌ PROBLEMA')
  
  if (state?.draggableNodes === 0) {
    console.log('💡 SUGESTÃO: Os nós não estão configurados como draggable')
  }
  
  if (conflicts.length > 0) {
    console.log('💡 SUGESTÃO: Há conflitos de CSS que podem interferir na movimentação')
  }
  
  if (!config?.reactFlow) {
    console.log('💡 SUGESTÃO: React Flow não está configurado corretamente')
  }
  
  return {
    state,
    config,
    conflicts,
    movement
  }
}

// Função para testar movimentação manual
function testManualMovement() {
  try {
    console.log('🖱️ Testando movimentação manual...')
    
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
    
    // Simular movimento do mouse
    const mouseMoveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientX: 150,
      clientY: 150
    })
    
    document.dispatchEvent(mouseMoveEvent)
    console.log('🖱️ Mouse move disparado')
    
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
    return true
    
  } catch (error) {
    console.error('❌ Erro no teste manual:', error)
    return false
  }
}

// Expor funções para uso manual
window.nodeMovementTest = {
  testNodeMovement,
  simulateNodeMovement,
  checkCSSConflicts,
  checkReactFlowConfig,
  diagnoseNodeMovement,
  testManualMovement
}

console.log('✅ Teste de movimentação dos nós carregado!')
console.log('💡 Use window.nodeMovementTest.diagnoseNodeMovement() para diagnóstico completo')
console.log('💡 Use window.nodeMovementTest.testManualMovement() para teste manual') 