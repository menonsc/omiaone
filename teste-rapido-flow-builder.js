// Teste rápido do Flow Builder em produção
// Execute este script no console do navegador (F12)

console.log('🚀 Teste rápido do Flow Builder em produção...');

(async () => {
  try {
    // 1. Verificar autenticação
    const user = window.supabase?.auth?.user();
    console.log('✅ Usuário autenticado:', !!user);
    
    if (!user) {
      console.error('❌ Usuário não está autenticado');
      return;
    }
    
    // 2. Verificar tabelas do Flow Builder
    console.log('🗄️ Verificando tabelas...');
    const tables = ['flows', 'flow_nodes', 'flow_connections', 'flow_templates'];
    const tableResults = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await window.supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          console.error(`❌ Erro na tabela ${table}:`, error.message);
          tableResults[table] = false;
        } else {
          console.log(`✅ Tabela ${table} OK`);
          tableResults[table] = true;
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar ${table}:`, error);
        tableResults[table] = false;
      }
    }
    
    // 3. Verificar permissões
    console.log('🔐 Verificando permissões...');
    const { data: userRoles, error: rolesError } = await window.supabase
      .from('user_roles')
      .select(`
        *,
        roles (
          name,
          permissions
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    if (rolesError) {
      console.error('❌ Erro ao verificar roles:', rolesError);
    } else {
      console.log('✅ Roles do usuário:', userRoles?.length || 0);
      
      const hasFlowBuilderPermissions = userRoles?.some(ur => 
        ur.roles && 
        ur.roles.permissions && 
        ur.roles.permissions.flow_builder &&
        ur.roles.permissions.flow_builder.length > 0
      );
      
      console.log('✅ Permissões de flow_builder:', hasFlowBuilderPermissions);
      
      if (!hasFlowBuilderPermissions) {
        console.error('❌ Usuário não tem permissões de flow_builder');
      }
    }
    
    // 4. Verificar rota atual
    const currentPath = window.location.pathname;
    const isFlowBuilderPage = currentPath.includes('/flow-builder') || currentPath.includes('/flows');
    console.log('📍 Página atual:', currentPath);
    console.log('✅ É página do Flow Builder:', isFlowBuilderPage);
    
    // 5. Verificar elementos do Flow Builder
    const flowElements = document.querySelectorAll('[class*="flow"], [data-testid*="flow"]');
    const reactFlowElements = document.querySelectorAll('.react-flow, .react-flow__node, .react-flow__edge');
    console.log('🔗 Elementos do Flow Builder:', flowElements.length);
    console.log('🎯 Elementos do React Flow:', reactFlowElements.length);
    
    // 6. Verificar erros no console
    const consoleErrors = window.consoleErrors || [];
    const flowBuilderErrors = consoleErrors.filter(error => 
      error.includes('flow') || 
      error.includes('Flow') ||
      error.includes('react-flow')
    );
    console.log('❌ Erros relacionados ao Flow Builder:', flowBuilderErrors.length);
    
    // 7. Verificar se o serviço está disponível
    const flowBuilderService = window.flowBuilderService || 
      (window.supabase && window.supabase.flowBuilderService);
    console.log('🔧 Serviço Flow Builder disponível:', !!flowBuilderService);
    
    // 8. Testar criação de flow (se tiver permissões)
    if (hasFlowBuilderPermissions && flowBuilderService) {
      try {
        console.log('🧪 Testando criação de flow...');
        const testFlow = {
          name: 'Teste Rápido',
          description: 'Teste do diagnóstico',
          userId: user.id,
          isActive: false,
          isTemplate: false,
          category: 'test',
          flowData: {
            nodes: [],
            connections: [],
            variables: {},
            settings: {}
          }
        };
        
        const createdFlow = await flowBuilderService.createFlow(testFlow);
        console.log('✅ Criação de flow funcionou:', !!createdFlow);
        
        if (createdFlow) {
          // Deletar o flow de teste
          await flowBuilderService.deleteFlow(createdFlow.id);
          console.log('✅ Deleção de flow funcionou');
        }
      } catch (error) {
        console.error('❌ Erro ao testar criação de flow:', error);
      }
    }
    
    // 9. Resumo final
    const summary = {
      userAuthenticated: !!user,
      tablesExist: Object.values(tableResults).every(Boolean),
      hasPermissions: hasFlowBuilderPermissions,
      isCorrectPage: isFlowBuilderPage,
      hasElements: flowElements.length > 0,
      hasReactFlowElements: reactFlowElements.length > 0,
      hasErrors: flowBuilderErrors.length === 0,
      serviceAvailable: !!flowBuilderService
    };
    
    console.log('📋 RESUMO DO TESTE:');
    console.log('- Usuário autenticado:', summary.userAuthenticated ? '✅' : '❌');
    console.log('- Tabelas existem:', summary.tablesExist ? '✅' : '❌');
    console.log('- Tem permissões:', summary.hasPermissions ? '✅' : '❌');
    console.log('- Página correta:', summary.isCorrectPage ? '✅' : '❌');
    console.log('- Elementos carregados:', summary.hasElements ? '✅' : '❌');
    console.log('- React Flow carregado:', summary.hasReactFlowElements ? '✅' : '❌');
    console.log('- Sem erros:', summary.hasErrors ? '✅' : '❌');
    console.log('- Serviço disponível:', summary.serviceAvailable ? '✅' : '❌');
    
    // 10. Sugestões baseadas nos resultados
    console.log('\n💡 SUGESTÕES:');
    
    if (!summary.userAuthenticated) {
      console.log('- Faça login na aplicação');
    }
    
    if (!summary.tablesExist) {
      console.log('- Execute: npx supabase db reset');
    }
    
    if (!summary.hasPermissions) {
      console.log('- Aplique as permissões de flow_builder ao usuário');
    }
    
    if (!summary.isCorrectPage) {
      console.log('- Acesse: /flow-builder ou /flows');
    }
    
    if (!summary.hasElements && summary.isCorrectPage) {
      console.log('- Verifique se há erros de JavaScript no console');
    }
    
    if (!summary.hasReactFlowElements && summary.hasElements) {
      console.log('- Verifique se o React Flow está carregado corretamente');
    }
    
    if (!summary.hasErrors) {
      console.log('- Verifique os erros no console e corrija-os');
    }
    
    if (!summary.serviceAvailable) {
      console.log('- Verifique se o flowBuilderService está sendo carregado');
    }
    
    // 11. Teste de navegação
    console.log('\n🧪 Teste de navegação:');
    console.log('- Para acessar o Flow Builder, vá para: /flow-builder');
    console.log('- Para ver a lista de flows, vá para: /flows');
    
    return summary;
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return null;
  }
})(); 