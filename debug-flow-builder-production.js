// Script para debug do Flow Builder em produção
// Execute este script no console do navegador

console.log('🔍 Debug do Flow Builder em Produção...')

// Função para verificar se o Flow Builder está carregado
function checkFlowBuilderLoad() {
  try {
    console.log('📋 Verificando carregamento do Flow Builder...')
    
    // Verificar se estamos na página correta
    const isFlowBuilderPage = window.location.pathname.includes('/flow-builder')
    console.log('📍 Página do Flow Builder:', isFlowBuilderPage)
    
    // Verificar se há erros no console
    const consoleErrors = window.consoleErrors || []
    console.log('❌ Erros no console:', consoleErrors.length)
    
    // Verificar se os componentes estão carregados
    const flowBuilderElements = document.querySelectorAll('[data-testid*="flow"], [class*="flow"]')
    console.log('🔗 Elementos do Flow Builder:', flowBuilderElements.length)
    
    // Verificar se o React Flow está carregado
    const reactFlowElements = document.querySelectorAll('.react-flow, .react-flow__node, .react-flow__edge')
    console.log('🎯 Elementos do React Flow:', reactFlowElements.length)
    
    // Verificar se há nós no canvas
    const nodes = document.querySelectorAll('.react-flow__node')
    console.log('🔗 Nós no canvas:', nodes.length)
    
    // Verificar se há conexões no canvas
    const edges = document.querySelectorAll('.react-flow__edge')
    console.log('🔗 Conexões no canvas:', edges.length)
    
    // Verificar se há botões de ação
    const actionButtons = document.querySelectorAll('button[onclick*="handleSave"], button[onclick*="handleExecute"]')
    console.log('🖱️ Botões de ação:', actionButtons.length)
    
    return {
      isFlowBuilderPage,
      consoleErrors: consoleErrors.length,
      flowBuilderElements: flowBuilderElements.length,
      reactFlowElements: reactFlowElements.length,
      nodes: nodes.length,
      edges: edges.length,
      actionButtons: actionButtons.length
    }
  } catch (error) {
    console.error('❌ Erro ao verificar carregamento:', error)
    return null
  }
}

// Função para verificar permissões
async function checkPermissions() {
  try {
    console.log('🔐 Verificando permissões...')
    
    // Verificar se o usuário está autenticado
    const user = window.supabase?.auth?.user()
    console.log('👤 Usuário autenticado:', !!user)
    
    if (!user) {
      console.error('❌ Usuário não está autenticado')
      return false
    }
    
    // Verificar permissões do usuário
    const { data: userRoles, error } = await window.supabase
      .from('user_roles')
      .select(`
        *,
        roles (
          name,
          permissions
        )
      `)
      .eq('user_id', user.id)
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
    
    // Verificar permissões específicas
    const permissions = userRoles.map(ur => ur.roles?.permissions?.flow_builder || []).flat()
    console.log('📋 Permissões específicas:', permissions)
    
    return {
      userAuthenticated: !!user,
      hasFlowBuilderPermissions,
      permissions
    }
  } catch (error) {
    console.error('❌ Erro ao verificar permissões:', error)
    return false
  }
}

// Função para verificar se há problemas de rede
function checkNetworkIssues() {
  try {
    console.log('🌐 Verificando problemas de rede...')
    
    // Verificar se há erros de rede no console
    const networkErrors = window.consoleErrors?.filter(error => 
      error.includes('fetch') || 
      error.includes('network') || 
      error.includes('CORS') ||
      error.includes('404') ||
      error.includes('500')
    ) || []
    
    console.log('❌ Erros de rede:', networkErrors.length)
    
    // Verificar se o Supabase está acessível
    const supabaseUrl = window.supabase?.supabaseUrl
    console.log('🔗 URL do Supabase:', supabaseUrl)
    
    // Verificar se há problemas de CORS
    const corsErrors = window.consoleErrors?.filter(error => 
      error.includes('CORS') || 
      error.includes('Access-Control')
    ) || []
    
    console.log('🚫 Erros de CORS:', corsErrors.length)
    
    return {
      networkErrors: networkErrors.length,
      supabaseUrl,
      corsErrors: corsErrors.length
    }
  } catch (error) {
    console.error('❌ Erro ao verificar rede:', error)
    return null
  }
}

// Função para verificar se há problemas de build
function checkBuildIssues() {
  try {
    console.log('🏗️ Verificando problemas de build...')
    
    // Verificar se há erros de JavaScript
    const jsErrors = window.consoleErrors?.filter(error => 
      error.includes('Uncaught') || 
      error.includes('ReferenceError') ||
      error.includes('TypeError') ||
      error.includes('SyntaxError')
    ) || []
    
    console.log('❌ Erros de JavaScript:', jsErrors.length)
    
    // Verificar se há erros de módulos
    const moduleErrors = window.consoleErrors?.filter(error => 
      error.includes('Module') || 
      error.includes('import') ||
      error.includes('export')
    ) || []
    
    console.log('📦 Erros de módulos:', moduleErrors.length)
    
    // Verificar se há erros de React
    const reactErrors = window.consoleErrors?.filter(error => 
      error.includes('React') || 
      error.includes('Component') ||
      error.includes('Hook')
    ) || []
    
    console.log('⚛️ Erros de React:', reactErrors.length)
    
    return {
      jsErrors: jsErrors.length,
      moduleErrors: moduleErrors.length,
      reactErrors: reactErrors.length
    }
  } catch (error) {
    console.error('❌ Erro ao verificar build:', error)
    return null
  }
}

// Função para verificar diferenças entre local e produção
function checkEnvironmentDifferences() {
  try {
    console.log('🌍 Verificando diferenças de ambiente...')
    
    // Verificar variáveis de ambiente
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
      REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY,
      BASE_URL: window.location.origin,
      PATHNAME: window.location.pathname
    }
    
    console.log('🔧 Variáveis de ambiente:', envVars)
    
    // Verificar se há diferenças na URL
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    console.log('🏠 É localhost:', isLocalhost)
    
    // Verificar se há problemas de roteamento
    const currentPath = window.location.pathname
    const expectedPaths = ['/flow-builder', '/flows']
    const isExpectedPath = expectedPaths.some(path => currentPath.startsWith(path))
    console.log('🛣️ Rota esperada:', isExpectedPath)
    
    return {
      isLocalhost,
      isExpectedPath,
      envVars
    }
  } catch (error) {
    console.error('❌ Erro ao verificar ambiente:', error)
    return null
  }
}

// Função principal de diagnóstico
async function diagnoseFlowBuilderProduction() {
  console.log('🚀 Iniciando diagnóstico do Flow Builder em produção...')
  
  // 1. Verificar carregamento
  const loadStatus = checkFlowBuilderLoad()
  console.log('📊 Status de carregamento:', loadStatus)
  
  // 2. Verificar permissões
  const permissions = await checkPermissions()
  console.log('🔐 Permissões:', permissions)
  
  // 3. Verificar problemas de rede
  const networkIssues = checkNetworkIssues()
  console.log('🌐 Problemas de rede:', networkIssues)
  
  // 4. Verificar problemas de build
  const buildIssues = checkBuildIssues()
  console.log('🏗️ Problemas de build:', buildIssues)
  
  // 5. Verificar diferenças de ambiente
  const envDifferences = checkEnvironmentDifferences()
  console.log('🌍 Diferenças de ambiente:', envDifferences)
  
  // Resumo
  console.log('📋 RESUMO DO DIAGNÓSTICO:')
  console.log('- Página do Flow Builder:', loadStatus?.isFlowBuilderPage ? '✅ OK' : '❌ PROBLEMA')
  console.log('- Usuário autenticado:', permissions?.userAuthenticated ? '✅ OK' : '❌ PROBLEMA')
  console.log('- Permissões de flow_builder:', permissions?.hasFlowBuilderPermissions ? '✅ OK' : '❌ PROBLEMA')
  console.log('- Erros de rede:', networkIssues?.networkErrors > 0 ? '❌ PROBLEMA' : '✅ OK')
  console.log('- Erros de build:', buildIssues?.jsErrors > 0 ? '❌ PROBLEMA' : '✅ OK')
  console.log('- Ambiente:', envDifferences?.isLocalhost ? '🏠 Localhost' : '🌐 Produção')
  
  if (!loadStatus?.isFlowBuilderPage) {
    console.log('💡 SUGESTÃO: Verificar se está na URL correta (/flow-builder)')
  }
  
  if (!permissions?.userAuthenticated) {
    console.log('💡 SUGESTÃO: Usuário não está autenticado')
  }
  
  if (!permissions?.hasFlowBuilderPermissions) {
    console.log('💡 SUGESTÃO: Usuário não tem permissões para Flow Builder')
  }
  
  if (networkIssues?.networkErrors > 0) {
    console.log('💡 SUGESTÃO: Há problemas de conectividade com o backend')
  }
  
  if (buildIssues?.jsErrors > 0) {
    console.log('💡 SUGESTÃO: Há erros de JavaScript que impedem o carregamento')
  }
  
  return {
    loadStatus,
    permissions,
    networkIssues,
    buildIssues,
    envDifferences
  }
}

// Função para testar acesso direto
function testDirectAccess() {
  try {
    console.log('🎯 Testando acesso direto...')
    
    // Tentar acessar diretamente
    const testUrls = [
      '/flow-builder',
      '/flows',
      '/flow-builder/new'
    ]
    
    console.log('🔗 URLs para testar:', testUrls)
    
    // Verificar se há redirecionamentos
    const currentUrl = window.location.href
    console.log('📍 URL atual:', currentUrl)
    
    // Verificar se há problemas de roteamento
    const router = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.getCurrentFiber?.()?.memoizedState?.element?.type
    console.log('🛣️ Router disponível:', !!router)
    
    return {
      currentUrl,
      testUrls,
      routerAvailable: !!router
    }
  } catch (error) {
    console.error('❌ Erro ao testar acesso:', error)
    return null
  }
}

// Expor funções para uso manual
window.flowBuilderProductionDebug = {
  checkFlowBuilderLoad,
  checkPermissions,
  checkNetworkIssues,
  checkBuildIssues,
  checkEnvironmentDifferences,
  diagnoseFlowBuilderProduction,
  testDirectAccess
}

console.log('✅ Debug do Flow Builder em produção carregado!')
console.log('💡 Use window.flowBuilderProductionDebug.diagnoseFlowBuilderProduction() para diagnóstico completo') 