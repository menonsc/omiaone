# 🔐 Permissões do Flow Builder - Sistema RBAC

## 📋 **RESUMO**

O Flow Builder foi integrado ao sistema RBAC (Role-Based Access Control) com permissões granulares para diferentes níveis de usuário.

## 🎯 **PERMISSÕES IMPLEMENTADAS**

### **SUPER ADMIN** (Nível 1)
- ✅ **create** - Criar novos flows
- ✅ **read** - Visualizar todos os flows
- ✅ **update** - Editar qualquer flow
- ✅ **delete** - Deletar qualquer flow
- ✅ **execute** - Executar qualquer flow
- ✅ **manage_templates** - Gerenciar templates
- ✅ **manage_triggers** - Gerenciar triggers
- ✅ **export** - Exportar flows
- ✅ **import** - Importar flows
- ✅ **configure** - Configurar o sistema

### **ADMIN** (Nível 2)
- ✅ **create** - Criar novos flows
- ✅ **read** - Visualizar todos os flows
- ✅ **update** - Editar qualquer flow
- ✅ **delete** - Deletar qualquer flow
- ✅ **execute** - Executar qualquer flow
- ✅ **manage_templates** - Gerenciar templates
- ✅ **export** - Exportar flows
- ✅ **import** - Importar flows

### **MODERATOR** (Nível 3)
- ✅ **read** - Visualizar flows
- ✅ **update** - Editar flows
- ✅ **execute** - Executar flows

### **USER** (Nível 4)
- ✅ **read** - Visualizar flows próprios
- ✅ **execute** - Executar flows próprios

## 🔧 **COMO APLICAR AS PERMISSÕES**

### **Opção 1: Via Migration (Recomendado)**
```bash
# 1. Iniciar Docker Desktop
# 2. Executar migration
npx supabase db reset
```

### **Opção 2: Via SQL Editor**
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Execute o script `apply-flow-builder-permissions.sql`

### **Opção 3: Manualmente**
Execute no SQL Editor:

```sql
-- Atualizar SUPER ADMIN
UPDATE roles 
SET permissions = permissions || '{
  "flow_builder": ["create", "read", "update", "delete", "execute", "manage_templates", "manage_triggers", "export", "import", "configure"]
}'::jsonb
WHERE name = 'super_admin';

-- Atualizar outros roles...
```

## 🛡️ **PROTEÇÕES IMPLEMENTADAS**

### **Frontend**
- ✅ Componentes `CanCreateFlow`, `CanEditFlow`, `CanExecuteFlow`
- ✅ HOC `withFlowBuilderPermission`
- ✅ Botões e ações protegidas por permissão
- ✅ Interface adaptativa baseada em permissões

### **Backend**
- ✅ Políticas RLS para todas as tabelas do Flow Builder
- ✅ Funções PostgreSQL para verificação de permissões
- ✅ Middleware de autorização específico
- ✅ Rate limiting configurado

### **Componentes Protegidos**
```tsx
// Exemplo de uso
<CanCreateFlow>
  <button>Novo Flow</button>
</CanCreateFlow>

<CanExecuteFlow>
  <button>Executar</button>
</CanExecuteFlow>

<CanManageTemplates>
  <button>Gerenciar Templates</button>
</CanManageTemplates>
```

## 📊 **VERIFICAÇÃO DE PERMISSÕES**

### **Teste Manual**
```sql
-- Verificar permissões do usuário atual
SELECT 
  check_user_permission(auth.uid(), 'flow_builder', 'create') as can_create,
  check_user_permission(auth.uid(), 'flow_builder', 'execute') as can_execute,
  check_user_permission(auth.uid(), 'flow_builder', 'manage_templates') as can_manage_templates;
```

### **Verificar Roles Atualizados**
```sql
SELECT 
  name,
  display_name,
  permissions->'flow_builder' as flow_builder_permissions
FROM roles 
WHERE name IN ('super_admin', 'admin', 'moderator', 'user')
ORDER BY hierarchy_level;
```

## 🚀 **PRÓXIMOS PASSOS**

### **1. Aplicar Permissões**
- [ ] Executar migration ou script SQL
- [ ] Verificar se as permissões foram aplicadas
- [ ] Testar com diferentes usuários

### **2. Testar Funcionalidades**
- [ ] Testar criação de flows
- [ ] Testar execução de flows
- [ ] Testar gerenciamento de templates
- [ ] Testar exportação/importação

### **3. Monitoramento**
- [ ] Verificar logs de acesso
- [ ] Monitorar tentativas de acesso negado
- [ ] Ajustar permissões se necessário

## 🔍 **SOLUÇÃO DE PROBLEMAS**

### **Problema: Usuário não consegue acessar Flow Builder**
**Solução:**
1. Verificar se o usuário tem role atribuído
2. Verificar se as permissões foram aplicadas
3. Testar com usuário SUPER ADMIN

### **Problema: Botões não aparecem**
**Solução:**
1. Verificar se os componentes de proteção estão importados
2. Verificar se as permissões estão corretas
3. Verificar console por erros

### **Problema: Erro 403 ao salvar flow**
**Solução:**
1. Verificar políticas RLS
2. Verificar se o usuário tem permissão de update
3. Verificar logs de autorização

## 📝 **NOTAS IMPORTANTES**

- **Cache**: As permissões são cacheadas por 5 minutos
- **Hierarquia**: Roles de nível mais alto sobrescrevem permissões
- **Auditoria**: Todas as verificações são logadas
- **Rate Limiting**: Aplicado para operações sensíveis

## 🎉 **STATUS**

✅ **Migration criada**: `013_add_flow_builder_permissions.sql`
✅ **Script manual criado**: `apply-flow-builder-permissions.sql`
✅ **Componentes protegidos**: Implementados
✅ **Middleware atualizado**: Com métodos específicos
✅ **Documentação**: Completa

**Próximo passo**: Aplicar as permissões quando o Docker estiver disponível. 