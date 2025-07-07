# Guia Completo do Sistema RBAC

## Índice
1. [Visão Geral](#visão-geral)
2. [Estrutura do Sistema](#estrutura-do-sistema)
3. [Como Usar](#como-usar)
4. [Componentes Disponíveis](#componentes-disponíveis)
5. [Hooks e Queries](#hooks-e-queries)
6. [Permissões e Recursos](#permissões-e-recursos)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Solução de Problemas](#solução-de-problemas)

## Visão Geral

O Sistema RBAC (Role-Based Access Control) implementado fornece controle granular de acesso baseado em papéis e permissões específicas. O sistema é construído sobre:

- **Backend**: PostgreSQL com funções SQL e RLS (Row Level Security)
- **Frontend**: React Query para cache e React Components para proteção
- **Estado**: Zustand para cache local e otimização de performance

### Características Principais

- ✅ **Hierarquia de Papéis**: Super Admin > Admin > Moderador > Usuário
- ✅ **Permissões Granulares**: Por recurso e ação específica
- ✅ **Cache Inteligente**: Multi-camadas para performance
- ✅ **Componentes de Proteção**: Guards, HOCs e Componentes condicionais
- ✅ **Rotas Protegidas**: Sistema robusto de proteção de rotas
- ✅ **Interface Administrativa**: Gerenciamento completo de papéis
- ✅ **Auditoria**: Sistema de logs para compliance

## Estrutura do Sistema

### 1. Banco de Dados

```sql
-- Tabelas principais
- roles: Definição de papéis do sistema
- user_roles: Atribuição de papéis aos usuários
- permission_logs: Auditoria de verificações de permissões

-- Funções PostgreSQL
- check_user_permission(user_id, resource, action)
- get_user_permissions(user_id)
- log_permission_check(...)
```

### 2. Camadas do Frontend

```
├── src/services/permissions.ts      # Serviço principal
├── src/hooks/usePermissionsQueries.ts # React Query hooks
├── src/store/permissionsStore.ts    # Cache Zustand
├── src/components/PermissionGuard.tsx # Componentes de proteção
├── src/components/ProtectedRoute.tsx  # Proteção de rotas
└── src/pages/RoleManagement.tsx     # Interface administrativa
```

## Como Usar

### 1. Verificar Permissão Simples

```tsx
import { usePermissionCheck } from '../hooks/usePermissionsQueries'

function MyComponent() {
  const { data: canEdit } = usePermissionCheck('users', 'update')
  
  return (
    <div>
      {canEdit && <button>Editar Usuário</button>}
    </div>
  )
}
```

### 2. Proteger Componente

```tsx
import { PermissionGuard } from '../components/PermissionGuard'

function ProtectedComponent() {
  return (
    <PermissionGuard 
      resource="documents" 
      action="create"
      fallback={<div>Sem permissão</div>}
    >
      <DocumentForm />
    </PermissionGuard>
  )
}
```

### 3. Proteger Rota

```tsx
import { PermissionProtectedRoute } from '../components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/admin" element={
        <PermissionProtectedRoute resource="system" action="maintain">
          <AdminPanel />
        </PermissionProtectedRoute>
      } />
    </Routes>
  )
}
```

### 4. Verificar Múltiplas Permissões

```tsx
import { useMultiplePermissionChecks } from '../hooks/usePermissionsQueries'

function AdvancedComponent() {
  const { data: permissions } = useMultiplePermissionChecks([
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'create' },
    { resource: 'documents', action: 'delete' }
  ])
  
  return (
    <div>
      {permissions?.['users.read'] && <UserList />}
      {permissions?.['users.create'] && <CreateUserButton />}
      {permissions?.['documents.delete'] && <DeleteDocButton />}
    </div>
  )
}
```

## Componentes Disponíveis

### Guards e Proteções

#### PermissionGuard
```tsx
<PermissionGuard 
  resource="users" 
  action="read"
  fallback={<AccessDenied />}
>
  <UserList />
</PermissionGuard>
```

#### RoleGuard
```tsx
<RoleGuard 
  roles={['admin', 'moderator']}
  requireAll={false} // OR lógico
  fallback={<AccessDenied />}
>
  <AdminContent />
</RoleGuard>
```

#### AdminGuard
```tsx
<AdminGuard 
  requireSuperAdmin={true}
  fallback={<NotAuthorized />}
>
  <SuperAdminPanel />
</AdminGuard>
```

### Componentes Especializados

#### PermissionButton
```tsx
<PermissionButton
  resource="users"
  action="delete"
  onClick={handleDelete}
  hideWhenNoPermission={true}
>
  Deletar Usuário
</PermissionButton>
```

#### PermissionLink
```tsx
<PermissionLink
  resource="agents"
  action="create"
  href="/agents/new"
  hideWhenNoPermission={false}
>
  Criar Agente
</PermissionLink>
```

### HOCs (Higher-Order Components)

#### withPermission
```tsx
const ProtectedComponent = withPermission(
  MyComponent,
  'users',
  'read',
  <AccessDenied />
)
```

#### withRole
```tsx
const AdminComponent = withRole(
  MyComponent,
  ['admin', 'super_admin'],
  false, // requireAll
  <NotAuthorized />
)
```

#### withAdminOnly
```tsx
const SuperAdminComponent = withAdminOnly(
  MyComponent,
  true, // requireSuperAdmin
  <NotAuthorized />
)
```

## Hooks e Queries

### Hooks Básicos

```tsx
// Permissões do usuário atual
const { data: permissions } = useCurrentUserPermissions()

// Verificar permissão específica
const { data: canRead } = usePermissionCheck('users', 'read')

// Roles do usuário
const { data: userRoles } = useUserRoles()

// Todos os roles disponíveis
const { data: allRoles } = useAllRoles()

// Verificar se é admin
const { isAdmin, isSuperAdmin } = useIsAdmin()
```

### Hooks de Mutação

```tsx
// Atribuir role
const assignRole = useAssignRole()
assignRole.mutate({
  userId: 'user123',
  roleId: 'role456',
  expiresAt: '2024-12-31T23:59:59Z'
})

// Revogar role
const revokeRole = useRevokeRole()
revokeRole.mutate({
  userId: 'user123',
  roleId: 'role456'
})

// Criar novo role
const createRole = useCreateRole()
createRole.mutate({
  name: 'custom_role',
  display_name: 'Role Customizado',
  permissions: { users: ['read'] },
  hierarchy_level: 5
})
```

### Cache e Otimização

```tsx
// Refresh de permissões
const { refreshUserPermissions, refreshAllPermissions } = useRefreshPermissions()

// Store Zustand para cache local
const { hasPermission, isAdmin } = usePermissionsStore()

// Verificação rápida sem network
const canEdit = hasPermission('user123', 'documents', 'update')
```

## Permissões e Recursos

### Recursos Disponíveis

| Recurso | Label | Descrição |
|---------|-------|-----------|
| `users` | Usuários | Gestão de usuários |
| `roles` | Papéis | Gestão de papéis RBAC |
| `agents` | Agentes de IA | Agentes do sistema |
| `documents` | Documentos | Documentos e uploads |
| `chat` | Chat | Sistema de chat |
| `whatsapp` | WhatsApp | Integração WhatsApp |
| `email_marketing` | Email Marketing | Campanhas de email |
| `integrations` | Integrações | Integrações externas |
| `analytics` | Analytics | Dados e relatórios |
| `system` | Sistema | Configurações do sistema |

### Ações Disponíveis

| Ação | Label | Descrição |
|------|-------|-----------|
| `create` | Criar | Criar novos recursos |
| `read` | Visualizar | Visualizar recursos |
| `update` | Editar | Editar recursos existentes |
| `delete` | Deletar | Remover recursos |
| `manage_roles` | Gerenciar Papéis | Gestão avançada de papéis |
| `manage_public` | Gerenciar Públicos | Recursos públicos |
| `manage_all` | Gerenciar Todos | Gestão completa |
| `moderate` | Moderar | Moderação de conteúdo |
| `manage_instances` | Gerenciar Instâncias | Instâncias de serviços |
| `send_campaigns` | Enviar Campanhas | Campanhas de marketing |
| `configure` | Configurar | Configurações avançadas |
| `export` | Exportar | Exportação de dados |
| `maintain` | Manter | Manutenção do sistema |
| `backup` | Backup | Backup e restore |
| `logs` | Logs | Visualização de logs |

### Hierarquia de Papéis

1. **Super Admin** (Nível 1)
   - Acesso total ao sistema
   - Gestão de papéis e usuários
   - Configurações críticas

2. **Admin** (Nível 2)
   - Gestão de usuários
   - Configurações gerais
   - Acesso a analytics

3. **Moderador** (Nível 3)
   - Moderação de conteúdo
   - Gestão limitada de usuários
   - Acesso a relatórios

4. **Usuário** (Nível 4)
   - Acesso básico ao sistema
   - Suas próprias informações
   - Funcionalidades principais

## Exemplos Práticos

### Exemplo 1: Página com Múltiplas Proteções

```tsx
import { PermissionGuard, AdminGuard } from '../components/PermissionGuard'
import { usePermissionCheck } from '../hooks/usePermissionsQueries'

function UserManagementPage() {
  const { data: canCreate } = usePermissionCheck('users', 'create')
  const { data: canExport } = usePermissionCheck('users', 'export')

  return (
    <div>
      <h1>Gestão de Usuários</h1>
      
      {/* Lista sempre visível se pode ler */}
      <PermissionGuard resource="users" action="read">
        <UserList />
      </PermissionGuard>
      
      {/* Botão condicional */}
      {canCreate && (
        <button>Criar Usuário</button>
      )}
      
      {/* Seção apenas para admins */}
      <AdminGuard>
        <div>
          <h2>Funções Administrativas</h2>
          {canExport && <button>Exportar Usuários</button>}
        </div>
      </AdminGuard>
    </div>
  )
}
```

### Exemplo 2: Menu Dinâmico

```tsx
import { PermissionGuard } from '../components/PermissionGuard'

const menuItems = [
  { label: 'Usuários', resource: 'users', action: 'read', href: '/users' },
  { label: 'Documentos', resource: 'documents', action: 'read', href: '/docs' },
  { label: 'Analytics', resource: 'analytics', action: 'read', href: '/analytics' }
]

function DynamicMenu() {
  return (
    <nav>
      {menuItems.map(item => (
        <PermissionGuard
          key={item.href}
          resource={item.resource}
          action={item.action}
          fallback={null}
        >
          <a href={item.href}>{item.label}</a>
        </PermissionGuard>
      ))}
    </nav>
  )
}
```

### Exemplo 3: Formulário com Validação de Permissões

```tsx
import { usePermissionCheck } from '../hooks/usePermissionsQueries'
import { PermissionButton } from '../components/PermissionGuard'

function UserForm({ user, isEditing }) {
  const { data: canUpdate } = usePermissionCheck('users', 'update')
  const { data: canDelete } = usePermissionCheck('users', 'delete')
  
  return (
    <form>
      <input 
        value={user.name}
        disabled={!canUpdate}
        onChange={handleNameChange}
      />
      
      <div className="actions">
        <PermissionButton
          resource="users"
          action="update"
          onClick={handleSave}
        >
          Salvar
        </PermissionButton>
        
        {isEditing && (
          <PermissionButton
            resource="users"
            action="delete"
            onClick={handleDelete}
            hideWhenNoPermission={true}
          >
            Deletar
          </PermissionButton>
        )}
      </div>
    </form>
  )
}
```

## Interface Administrativa

### Acesso ao Gerenciamento de Papéis

A página de gerenciamento está disponível em `/roles` e é protegida para **Super Admins apenas**.

### Funcionalidades Disponíveis

1. **Dashboard de Estatísticas**
   - Total de papéis
   - Papéis do sistema vs customizados
   - Papéis ativos

2. **Gestão de Papéis**
   - Criar novos papéis
   - Editar papéis existentes
   - Ativar/desativar papéis
   - Visualizar permissões detalhadas

3. **Atribuição de Usuários**
   - Interface para atribuir papéis
   - Revogar papéis
   - Definir expirações
   - Histórico de mudanças

4. **Editor de Permissões**
   - Interface visual (em desenvolvimento)
   - Editor JSON para configurações avançadas
   - Validação de estrutura

## Cache e Performance

### Sistema de Cache Multi-Camadas

1. **Serviço (PermissionsService)**
   - Cache interno com expiração (5 min)
   - Invalidação automática

2. **React Query**
   - Cache de queries (5-10 min)
   - Invalidação inteligente
   - Background refetch

3. **Zustand Store**
   - Cache local persistente
   - Verificações rápidas
   - Estado da UI

### Otimizações

```tsx
// Verificação rápida sem network
const hasAccess = usePermissionsStore(state => 
  state.hasPermission('user123', 'users', 'read')
)

// Invalidação manual
const { refreshUserPermissions } = useRefreshPermissions()
await refreshUserPermissions('user123')

// Múltiplas verificações em paralelo
const checks = [
  { resource: 'users', action: 'read' },
  { resource: 'users', action: 'write' }
]
const results = await permissionsService.checkMultiplePermissions('user123', checks)
```

## Solução de Problemas

### Problemas Comuns

#### 1. Permissões não atualizando
```tsx
// Forçar refresh
const { refreshUserPermissions } = useRefreshPermissions()
refreshUserPermissions(userId)

// Limpar cache
permissionsService.clearUserCache(userId)
```

#### 2. Loading infinito
```tsx
// Verificar se o usuário está disponível
const { user } = useAuthStore()
const { data } = usePermissionCheck('users', 'read', user?.id)

// enabled só quando tem user
enabled: !!user?.id
```

#### 3. Componente não renderizando
```tsx
// Verificar fallback
<PermissionGuard 
  resource="users" 
  action="read"
  fallback={<div>Carregando...</div>} // Sempre fornecer fallback
>
  <Component />
</PermissionGuard>
```

### Debug e Monitoramento

#### 1. Logs de Permissões
```tsx
const { data: logs } = usePermissionLogs({
  userId: 'user123',
  dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24h
  limit: 100
})
```

#### 2. Status do Cache
```tsx
const cacheStats = usePermissionsStore(state => 
  state.getCacheStats()
)
console.log('Cache stats:', cacheStats)
```

#### 3. Verificação Manual
```tsx
// No console do navegador
const canAccess = await permissionsService.checkPermission(
  'user123', 
  'users', 
  'read'
)
console.log('Can access:', canAccess)
```

### Configuração de Desenvolvimento

#### 1. Mock de Permissões (para testes)
```tsx
// jest.setup.js
jest.mock('../services/permissions', () => ({
  permissionsService: {
    checkPermission: jest.fn().mockResolvedValue(true),
    getUserPermissions: jest.fn().mockResolvedValue({
      permissions: { users: ['read', 'write'] },
      roles: ['admin']
    })
  }
}))
```

#### 2. Modo Debug
```tsx
// Em desenvolvimento
localStorage.setItem('rbac_debug', 'true')

// Logs detalhados no console
window.rbacDebug = true
```

## Migração e Atualizações

### Aplicar Migrations

```bash
# Verificar status
npx supabase status

# Aplicar migration RBAC
npx supabase db reset
```

### Migração de Dados Existentes

A migration `005_rbac_system.sql` inclui:
- Migração automática de roles existentes
- Preservação de dados de usuários
- Configuração de papéis padrão

### Backup Antes de Migrations

```bash
# Backup do banco
pg_dump supabase_db > backup_pre_rbac.sql

# Restaurar se necessário
psql supabase_db < backup_pre_rbac.sql
```

## Considerações de Segurança

### Row Level Security (RLS)

O sistema utiliza RLS do PostgreSQL para garantir segurança a nível de banco:

```sql
-- Exemplo de policy
CREATE POLICY "Users can only see permitted data" ON users
FOR SELECT USING (
  auth.uid() = id OR 
  check_user_permission(auth.uid(), 'users', 'read')
);
```

### Validação Client-Side vs Server-Side

⚠️ **Importante**: As verificações no frontend são para UX. A segurança real está no backend.

```tsx
// ✅ Correto - UX + Segurança
<PermissionGuard resource="users" action="delete">
  <DeleteButton onClick={handleDelete} /> // handleDelete valida no servidor
</PermissionGuard>

// ❌ Incorreto - Apenas UX
if (hasPermission) {
  deleteUser() // Sem validação no servidor
}
```

### Auditoria e Compliance

```tsx
// Logs automáticos de verificações
const { data: logs } = usePermissionLogs({
  dateFrom: startDate,
  dateTo: endDate,
  userId: auditUserId
})

// Relatório de acessos
logs.forEach(log => {
  console.log(`${log.user_id} tentou ${log.action} em ${log.resource}: ${log.granted}`)
})
```

---

## Suporte e Contato

Para dúvidas sobre o sistema RBAC:
1. Consulte esta documentação
2. Verifique os exemplos práticos
3. Use o modo debug para troubleshooting
4. Contate a equipe de desenvolvimento

**Última atualização**: Janeiro 2024  
**Versão do Sistema**: 1.0.0 