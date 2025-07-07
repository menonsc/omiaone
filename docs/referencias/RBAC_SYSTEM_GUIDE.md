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

## Hooks e Queries

### Hooks Básicos

```tsx
// Permissões do usuário atual
const { data: permissions } = useCurrentUserPermissions()

// Verificar permissão específica
const { data: canRead } = usePermissionCheck('users', 'read')

// Verificar se é admin
const { isAdmin, isSuperAdmin } = useIsAdmin()
```

### Hooks de Mutação

```tsx
// Atribuir role
const assignRole = useAssignRole()
assignRole.mutate({
  userId: 'user123',
  roleId: 'role456'
})
```

## Permissões e Recursos

### Recursos Disponíveis

| Recurso | Descrição |
|---------|-----------|
| `users` | Gestão de usuários |
| `agents` | Agentes de IA |
| `documents` | Documentos e uploads |
| `chat` | Sistema de chat |
| `whatsapp` | Integração WhatsApp |
| `email_marketing` | Campanhas de email |
| `integrations` | Integrações externas |
| `analytics` | Dados e relatórios |
| `system` | Configurações do sistema |

### Ações Disponíveis

| Ação | Descrição |
|------|-----------|
| `create` | Criar novos recursos |
| `read` | Visualizar recursos |
| `update` | Editar recursos existentes |
| `delete` | Remover recursos |
| `manage_all` | Gestão completa |

## Exemplos Práticos

### Página com Múltiplas Proteções

```tsx
import { PermissionGuard, AdminGuard } from '../components/PermissionGuard'

function UserManagementPage() {
  return (
    <div>
      <h1>Gestão de Usuários</h1>
      
      <PermissionGuard resource="users" action="read">
        <UserList />
      </PermissionGuard>
      
      <AdminGuard>
        <AdminPanel />
      </AdminGuard>
    </div>
  )
}
```

## Interface Administrativa

### Acesso ao Gerenciamento de Papéis

A página de gerenciamento está disponível em `/roles` e é protegida para **Super Admins apenas**.

### Funcionalidades Disponíveis

1. **Dashboard de Estatísticas**
2. **Gestão de Papéis**
3. **Atribuição de Usuários**
4. **Editor de Permissões**

## Aplicar o Sistema

### 1. Migrations do Banco

```bash
# Aplicar migration RBAC
npx supabase db reset
```

### 2. Atualizar App.tsx

O sistema já está integrado com proteções nas rotas principais.

### 3. Usar nos Componentes

Importe e use os componentes de proteção conforme necessário.

## Solução de Problemas

### Permissões não atualizando
```tsx
const { refreshUserPermissions } = useRefreshPermissions()
refreshUserPermissions(userId)
```

### Debug
```tsx
// Verificação manual
const canAccess = await permissionsService.checkPermission('user123', 'users', 'read')
```

## Considerações de Segurança

⚠️ **Importante**: As verificações no frontend são para UX. A segurança real está no backend com RLS.

---

**Sistema implementado e pronto para uso!**  
**Acesso ao gerenciamento**: `/roles` (Super Admins apenas) 