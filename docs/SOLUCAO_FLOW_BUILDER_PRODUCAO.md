# 🔧 Solução para Flow Builder em Produção

## 📋 **PROBLEMA**

O Flow Builder não aparece no domínio de produção, mas funciona no localhost.

## 🚀 **SOLUÇÃO RÁPIDA**

### **1. Teste Inicial**
Execute este script no console do navegador (F12):

```javascript
// Copie e cole no console
(async () => {
  console.log('🚀 Teste rápido...');
  const user = window.supabase?.auth?.user();
  console.log('Usuário:', !!user);
  
  const { data: flows } = await window.supabase.from('flows').select('id').limit(1);
  console.log('Tabela flows:', !!flows);
  
  const { data: userRoles } = await window.supabase
    .from('user_roles')
    .select('roles(permissions)')
    .eq('user_id', user?.id);
  
  const hasPermissions = userRoles?.some(ur => 
    ur.roles?.permissions?.flow_builder?.length > 0
  );
  console.log('Permissões:', hasPermissions);
  
  console.log('Resumo:', {
    user: !!user,
    tables: !!flows,
    permissions: hasPermissions,
    page: window.location.pathname.includes('/flow-builder')
  });
})();
```

### **2. Soluções Baseadas no Resultado**

#### **Se "user: false"**
```bash
# Faça login na aplicação primeiro
```

#### **Se "tables: false"**
```bash
# Execute as migrations
npx supabase db reset
```

#### **Se "permissions: false"**
```sql
-- No SQL Editor do Supabase
UPDATE roles 
SET permissions = permissions || '{
  "flow_builder": ["create", "read", "update", "delete", "execute"]
}'::jsonb
WHERE name IN ('super_admin', 'admin', 'moderator', 'user');
```

#### **Se "page: false"**
```
# Acesse a URL correta:
https://seu-dominio.com/flow-builder
https://seu-dominio.com/flows
```

## 🔍 **DIAGNÓSTICO DETALHADO**

### **Opção 1: Script Completo**
```javascript
// Execute no console
fetch('https://raw.githubusercontent.com/seu-repo/teste-rapido-flow-builder.js')
  .then(response => response.text())
  .then(script => eval(script));
```

### **Opção 2: Verificação Manual**

1. **Abra o console** (F12)
2. **Verifique erros** no console
3. **Teste as URLs**:
   - `/flow-builder`
   - `/flows`
4. **Verifique permissões**:
   ```javascript
   const user = window.supabase?.auth?.user();
   console.log('Usuário:', user?.email);
   ```

## 🛠️ **SOLUÇÕES ESPECÍFICAS**

### **1. Migrations Não Executadas**

**Sintoma:** Erro "relation 'flows' does not exist"

**Solução:**
```bash
# Reset completo do banco
npx supabase db reset

# Ou executar manualmente no SQL Editor:
# 012_flow_builder_system.sql
# 013_add_flow_builder_permissions_fixed.sql
```

### **2. Permissões Não Aplicadas**

**Sintoma:** Usuário não tem acesso ao Flow Builder

**Solução:**
```sql
-- Aplicar permissões para todos os roles
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

**Sintoma:** Erro "new row violates row-level security policy"

**Solução:**
```sql
-- Habilitar RLS
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

# Verificar variáveis de ambiente
cat .env.production

# Fazer deploy novamente
```

### **5. Problemas de Roteamento**

**Sintoma:** Página não encontrada (404)

**Solução:**
```javascript
// Verificar se o React Router está funcionando
console.log('Pathname:', window.location.pathname);
console.log('Router:', !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);

// Testar navegação programática
window.history.pushState({}, '', '/flow-builder');
window.location.reload();
```

### **6. Problemas de CORS/Network**

**Sintoma:** Erros de CORS ou network

**Solução:**
```javascript
// Verificar Supabase
const supabaseUrl = window.supabase?.supabaseUrl;
console.log('Supabase URL:', supabaseUrl);

// Testar conexão
window.supabase
  .from('flows')
  .select('id')
  .limit(1)
  .then(({ data, error }) => {
    console.log('Conexão:', error ? 'FALHOU' : 'OK');
  });
```

## 📊 **CHECKLIST DE VERIFICAÇÃO**

### **✅ Pré-requisitos**
- [ ] Usuário autenticado
- [ ] Migrations executadas
- [ ] Permissões aplicadas
- [ ] Políticas RLS ativas

### **✅ Frontend**
- [ ] Sem erros de JavaScript
- [ ] React Router funcionando
- [ ] Componentes carregados
- [ ] React Flow disponível

### **✅ Backend**
- [ ] Supabase acessível
- [ ] Tabelas existem
- [ ] Serviços funcionando
- [ ] Sem erros de CORS

## 🚀 **COMANDOS PARA EXECUTAR**

### **1. Reset Completo**
```bash
# Reset do banco
npx supabase db reset

# Rebuild da aplicação
npm run build

# Deploy
# (depende da sua plataforma de deploy)
```

### **2. Verificação Manual**
```bash
# Verificar se o Docker está rodando
docker ps

# Verificar logs do Supabase
npx supabase logs

# Verificar status
npx supabase status
```

### **3. Teste de Conectividade**
```bash
# Testar conexão com Supabase
curl -X GET "https://seu-projeto.supabase.co/rest/v1/flows" \
  -H "apikey: sua-chave-anon" \
  -H "Authorization: Bearer seu-token"
```

## 📞 **SUPORTE**

Se o problema persistir:

1. **Execute o teste rápido** no console
2. **Verifique os logs** do console
3. **Teste em navegador incógnito**
4. **Verifique se as migrations foram executadas**
5. **Confirme se as permissões foram aplicadas**

## 🔄 **TESTE FINAL**

Após aplicar as soluções, execute:

```javascript
// Teste final
(async () => {
  const user = window.supabase?.auth?.user();
  const { data: flows } = await window.supabase.from('flows').select('id').limit(1);
  const { data: userRoles } = await window.supabase
    .from('user_roles')
    .select('roles(permissions)')
    .eq('user_id', user?.id);
  
  const hasPermissions = userRoles?.some(ur => 
    ur.roles?.permissions?.flow_builder?.length > 0
  );
  
  const allOK = !!user && !!flows && hasPermissions;
  
  console.log('🎉 Flow Builder funcionando:', allOK);
  
  if (allOK) {
    console.log('✅ Tudo OK! Acesse /flow-builder');
  } else {
    console.log('❌ Ainda há problemas. Verifique os logs acima.');
  }
})();
``` 