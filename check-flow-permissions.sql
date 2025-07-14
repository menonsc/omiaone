-- Script para verificar permissões do Flow Builder
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a função check_flow_builder_permission existe
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'check_flow_builder_permission';

-- 2. Verificar se a função check_user_permission existe
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'check_user_permission';

-- 3. Verificar as permissões do role super_admin
SELECT 
  name,
  display_name,
  permissions->'flow_builder' as flow_builder_permissions
FROM roles 
WHERE name = 'super_admin';

-- 4. Verificar se o usuário atual tem role super_admin
SELECT 
  u.id as user_id,
  p.full_name,
  r.name as role_name,
  r.permissions->'flow_builder' as flow_builder_permissions
FROM auth.users u
JOIN profiles p ON u.id = p.id
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.id = auth.uid()
AND ur.is_active = true
AND r.is_active = true;

-- 5. Testar a função check_flow_builder_permission
SELECT 
  check_flow_builder_permission(auth.uid(), 'create') as can_create,
  check_flow_builder_permission(auth.uid(), 'read') as can_read,
  check_flow_builder_permission(auth.uid(), 'update') as can_update,
  check_flow_builder_permission(auth.uid(), 'delete') as can_delete,
  check_flow_builder_permission(auth.uid(), 'execute') as can_execute;

-- 6. Verificar se a tabela flows existe e tem RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'flows';

-- 7. Verificar as políticas RLS da tabela flows
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'flows';

-- 8. Testar inserção na tabela flows (deve falhar se RLS estiver bloqueando)
-- Descomente a linha abaixo para testar
-- INSERT INTO flows (name, description, user_id, flow_data) VALUES ('Test Flow', 'Test', auth.uid(), '{}');

-- 9. Verificar se há flows existentes
SELECT 
  id,
  name,
  user_id,
  is_active,
  created_at
FROM flows 
LIMIT 5; 