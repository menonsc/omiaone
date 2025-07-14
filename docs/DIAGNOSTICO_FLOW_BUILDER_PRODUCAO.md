# 🔍 Diagnóstico do Flow Builder em Produção

## 📋 **PROBLEMA RELATADO**

O Flow Builder não está aparecendo no domínio de produção, mas funciona normalmente no localhost.

## 🚀 **PASSOS PARA DIAGNÓSTICO**

### **1. Verificar Console do Navegador**

Abra o console do navegador (F12) e execute os scripts de diagnóstico:

```javascript
// Script 1: Diagnóstico geral
// Copie e cole no console:
fetch('https://raw.githubusercontent.com/seu-repo/debug-flow-builder-production.js')
  .then(response => response.text())
  .then(script => eval(script))
  .then(() => window.flowBuilderProductionDebug.diagnoseFlowBuilderProduction());

// Script 2: Verificar permissões
// Copie e cole no console:
fetch('https://raw.githubusercontent.com/seu-repo/check-flow-builder-permissions-production.js')
  .then(response => response.text())
  .then(script => eval(script))
  .then(() => window.flowBuilderPermissionsDebug.diagnoseFlowBuilderPermissions());

// Script 3: Verificar migrations
// Copie e cole no console:
fetch('https://raw.githubusercontent.com/seu-repo/check-flow-builder-migrations-production.js')
  .then(response => response.text())
  .then(script => eval(script))
  .then(() => window.flowBuilderMigrationsDebug.diagnoseFlowBuilderMigrations());
```

### **2. Verificar URLs de Acesso**

Teste estas URLs no domínio de produção:

- `/flow-builder` - Criar novo flow
- `/flows` - Lista de flows
- `/flow-builder/new` - Criar novo flow (alternativo)

### **3. Verificar Permissões do Usuário**

No console do navegador:

```javascript
// Verificar se o usuário está autenticado
const user = window.supabase?.auth?.user();
console.log('Usuário autenticado:', !!user);

// Verificar roles do usuário
const { data: userRoles } = await window.supabase
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

console.log('Roles do usuário:', userRoles);

// Verificar permissões de flow_builder
const hasFlowBuilderPermissions = userRoles.some(ur => 
  ur.roles && 
  ur.roles.permissions && 
  ur.roles.permissions.flow_builder
);

console.log('Tem permissões de flow_builder:', hasFlowBuilderPermissions);
```

## 🔧 **POSSÍVEIS CAUSAS E SOLUÇÕES**

### **1. Migrations Não Executadas**

**Sintoma:** Tabelas do Flow Builder não existem

**Solução:**
```bash
# Executar migrations
npx supabase db reset

# Ou executar manualmente no SQL Editor:
# 012_flow_builder_system.sql
# 013_add_flow_builder_permissions_fixed.sql
```

### **2. Permissões Não Aplicadas**

**Sintoma:** Usuário não tem permissões de flow_builder

**Solução:**
```sql
-- Aplicar permissões manualmente
UPDATE roles 
SET permissions = permissions || '{
  "flow_builder": ["create", "read", "update", "delete", "execute", "manage_templates", "manage_triggers", "export", "import", "configure"]
}'::jsonb
WHERE name = 'super_admin';

UPDATE roles 
SET permissions = permissions || '{
  "flow_builder": ["create", "read", "update", "delete", "execute", "manage_templates", "export", "import"]
}'::jsonb
WHERE name = 'admin';

UPDATE roles 
SET permissions = permissions || '{
  "flow_builder": ["read", "update", "execute"]
}'::jsonb
WHERE name = 'moderator';

UPDATE roles 
SET permissions = permissions || '{
  "flow_builder": ["read", "execute"]
}'::jsonb
WHERE name = 'user';
```

### **3. Políticas RLS Não Aplicadas**

**Sintoma:** Erros de "row-level security policy"

**Solução:**
```sql
-- Habilitar RLS nas tabelas
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_variables ENABLE ROW LEVEL SECURITY;

-- Aplicar políticas (ver migration 013_add_flow_builder_permissions_fixed.sql)
```

### **4. Problemas de Build/Deploy**

**Sintoma:** Erros de JavaScript no console

**Solução:**
```bash
# Rebuild da aplicação
npm run build

# Verificar se todos os arquivos foram deployados
# Verificar se as variáveis de ambiente estão corretas
```

### **5. Problemas de Roteamento**

**Sintoma:** Página não encontrada (404)

**Solução:**
```javascript
// Verificar se o React Router está funcionando
console.log('Current pathname:', window.location.pathname);
console.log('Router available:', !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);

// Verificar se há redirecionamentos
window.addEventListener('beforeunload', () => {
  console.log('Page is being unloaded');
});
```

### **6. Problemas de CORS/Network**

**Sintoma:** Erros de CORS ou network no console

**Solução:**
```javascript
// Verificar se o Supabase está acessível
const supabaseUrl = window.supabase?.supabaseUrl;
console.log('Supabase URL:', supabaseUrl);

// Testar conexão
window.supabase
  .from('flows')
  .select('id')
  .limit(1)
  .then(({ data, error }) => {
    console.log('Supabase connection:', error ? 'FAILED' : 'OK');
    console.log('Error:', error);
  });
```

## 📊 **CHECKLIST DE VERIFICAÇÃO**

### **✅ Migrations**
- [ ] Tabela `flows` existe
- [ ] Tabela `flow_nodes` existe
- [ ] Tabela `flow_connections` existe
- [ ] Tabela `flow_executions` existe
- [ ] Tabela `flow_templates` existe
- [ ] Políticas RLS aplicadas

### **✅ Permissões**
- [ ] Usuário autenticado
- [ ] Usuário tem roles atribuídos
- [ ] Roles têm permissões de flow_builder
- [ ] Permissões essenciais (read, create)

### **✅ Frontend**
- [ ] Componente FlowBuilder carregado
- [ ] React Flow funcionando
- [ ] Sem erros de JavaScript
- [ ] Roteamento funcionando

### **✅ Backend**
- [ ] Supabase acessível
- [ ] Serviço flowBuilderService funcionando
- [ ] Sem erros de CORS
- [ ] Políticas RLS ativas

## 🛠️ **COMANDOS PARA RESOLVER**

### **1. Reset Completo do Banco**
```bash
npx supabase db reset
```

### **2. Aplicar Permissões Manualmente**
```sql
-- No SQL Editor do Supabase
-- Executar o conteúdo de 013_add_flow_builder_permissions_fixed.sql
```

### **3. Verificar Usuário**
```sql
-- Verificar se o usuário tem roles
SELECT 
  u.email,
  ur.is_active,
  r.name as role_name,
  r.permissions
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.id = 'SEU_USER_ID';
```

### **4. Rebuild e Deploy**
```bash
npm run build
# Fazer deploy novamente
```

## 📞 **SUPORTE**

Se o problema persistir após seguir todos os passos:

1. **Coletar logs do console**
2. **Executar todos os scripts de diagnóstico**
3. **Verificar se as migrations foram executadas**
4. **Confirmar se as permissões foram aplicadas**
5. **Testar em um navegador limpo/incógnito**

## 🔄 **TESTE RÁPIDO**

Para um teste rápido, execute no console:

```javascript
// Teste completo em uma linha
(async () => {
  console.log('🚀 Teste rápido do Flow Builder...');
  
  // 1. Verificar autenticação
  const user = window.supabase?.auth?.user();
  console.log('✅ Usuário:', !!user);
  
  // 2. Verificar tabelas
  const { data: flows } = await window.supabase.from('flows').select('id').limit(1);
  console.log('✅ Tabela flows:', !!flows);
  
  // 3. Verificar permissões
  const { data: userRoles } = await window.supabase
    .from('user_roles')
    .select('roles(permissions)')
    .eq('user_id', user?.id);
  
  const hasPermissions = userRoles?.some(ur => 
    ur.roles?.permissions?.flow_builder?.length > 0
  );
  console.log('✅ Permissões:', hasPermissions);
  
  // 4. Verificar rota
  const isFlowBuilderPage = window.location.pathname.includes('/flow-builder');
  console.log('✅ Página correta:', isFlowBuilderPage);
  
  // 5. Verificar componentes
  const flowElements = document.querySelectorAll('[class*="flow"]');
  console.log('✅ Elementos do Flow:', flowElements.length);
  
  console.log('📋 Resumo:', {
    user: !!user,
    tables: !!flows,
    permissions: hasPermissions,
    page: isFlowBuilderPage,
    elements: flowElements.length
  });
})();
``` 