-- Script para aplicar permissões do Flow Builder ao sistema RBAC
-- Execute este script no Supabase SQL Editor quando o Docker estiver disponível

-- ====================
-- 1. ATUALIZAR PERMISSÕES DOS ROLES
-- ====================

-- Atualizar SUPER ADMIN com permissões completas do Flow Builder
UPDATE roles 
SET permissions = permissions || '{
  "flow_builder": ["create", "read", "update", "delete", "execute", "manage_templates", "manage_triggers", "export", "import", "configure"]
}'::jsonb
WHERE name = 'super_admin';

-- Atualizar ADMIN com permissões de gestão do Flow Builder
UPDATE roles 
SET permissions = permissions || '{
  "flow_builder": ["create", "read", "update", "delete", "execute", "manage_templates", "export", "import"]
}'::jsonb
WHERE name = 'admin';

-- Atualizar MODERATOR com permissões limitadas do Flow Builder
UPDATE roles 
SET permissions = permissions || '{
  "flow_builder": ["read", "update", "execute"]
}'::jsonb
WHERE name = 'moderator';

-- Atualizar USER com permissões básicas do Flow Builder
UPDATE roles 
SET permissions = permissions || '{
  "flow_builder": ["read", "execute"]
}'::jsonb
WHERE name = 'user';

-- ====================
-- 2. VERIFICAR ATUALIZAÇÕES
-- ====================

-- Verificar se as permissões foram aplicadas corretamente
SELECT 
  name,
  display_name,
  permissions->'flow_builder' as flow_builder_permissions
FROM roles 
WHERE name IN ('super_admin', 'admin', 'moderator', 'user')
ORDER BY hierarchy_level;

-- ====================
-- 3. TESTAR PERMISSÕES
-- ====================

-- Testar permissão do SUPER ADMIN
SELECT 
  check_user_permission(
    (SELECT id FROM auth.users LIMIT 1), -- Substitua pelo ID do usuário SUPER ADMIN
    'flow_builder',
    'create'
  ) as super_admin_can_create;

-- ====================
-- 4. LOG DE ATUALIZAÇÃO
-- ====================

-- Inserir log da atualização (se a tabela system_logs existir)
INSERT INTO system_logs (level, message, metadata, created_at) VALUES (
  'info',
  'Flow Builder permissions added to RBAC system',
  '{"script": "apply-flow-builder-permissions.sql", "roles_updated": ["super_admin", "admin", "moderator", "user"]}',
  NOW()
); 