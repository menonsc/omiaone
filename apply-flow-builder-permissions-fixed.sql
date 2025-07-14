-- Script para aplicar permissões do Flow Builder ao sistema RBAC (CORRIGIDO)
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
-- 2. ADICIONAR POLÍTICAS RLS PARA FLOW BUILDER (CORRIGIDAS)
-- ====================

-- Políticas para flows
CREATE POLICY "flows_super_admin_policy" ON flows FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'super_admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "flows_admin_policy" ON flows FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND ur.is_active = true
  )
);

CREATE POLICY "flows_user_policy" ON flows FOR ALL USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin', 'moderator')
    AND ur.is_active = true
  )
);

-- Políticas para flow_nodes
CREATE POLICY "flow_nodes_super_admin_policy" ON flow_nodes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'super_admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_nodes_admin_policy" ON flow_nodes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_nodes_user_policy" ON flow_nodes FOR ALL USING (
  flow_id IN (
    SELECT id FROM flows 
    WHERE user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'moderator')
      AND ur.is_active = true
    )
  )
);

-- Políticas para flow_connections
CREATE POLICY "flow_connections_super_admin_policy" ON flow_connections FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'super_admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_connections_admin_policy" ON flow_connections FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_connections_user_policy" ON flow_connections FOR ALL USING (
  flow_id IN (
    SELECT id FROM flows 
    WHERE user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'moderator')
      AND ur.is_active = true
    )
  )
);

-- Políticas para flow_executions
CREATE POLICY "flow_executions_super_admin_policy" ON flow_executions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'super_admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_executions_admin_policy" ON flow_executions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_executions_user_policy" ON flow_executions FOR ALL USING (
  user_id = auth.uid()
  OR flow_id IN (
    SELECT id FROM flows 
    WHERE user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'moderator')
      AND ur.is_active = true
    )
  )
);

-- Políticas para flow_execution_steps
CREATE POLICY "flow_execution_steps_super_admin_policy" ON flow_execution_steps FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'super_admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_execution_steps_admin_policy" ON flow_execution_steps FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_execution_steps_user_policy" ON flow_execution_steps FOR ALL USING (
  execution_id IN (
    SELECT id FROM flow_executions 
    WHERE user_id = auth.uid()
    OR flow_id IN (
      SELECT id FROM flows 
      WHERE user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('super_admin', 'admin', 'moderator')
        AND ur.is_active = true
      )
    )
  )
);

-- Políticas para flow_templates (CORRIGIDAS)
CREATE POLICY "flow_templates_super_admin_policy" ON flow_templates FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'super_admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_templates_admin_policy" ON flow_templates FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_templates_public_policy" ON flow_templates FOR SELECT USING (
  is_public = true
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_templates_insert_policy" ON flow_templates FOR INSERT WITH CHECK (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_templates_update_policy" ON flow_templates FOR UPDATE USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_templates_delete_policy" ON flow_templates FOR DELETE USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND ur.is_active = true
  )
);

-- Políticas para flow_triggers
CREATE POLICY "flow_triggers_super_admin_policy" ON flow_triggers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'super_admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_triggers_admin_policy" ON flow_triggers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_triggers_user_policy" ON flow_triggers FOR ALL USING (
  flow_id IN (
    SELECT id FROM flows 
    WHERE user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'moderator')
      AND ur.is_active = true
    )
  )
);

-- Políticas para flow_variables
CREATE POLICY "flow_variables_super_admin_policy" ON flow_variables FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'super_admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_variables_admin_policy" ON flow_variables FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND ur.is_active = true
  )
);

CREATE POLICY "flow_variables_user_policy" ON flow_variables FOR ALL USING (
  (scope = 'user' AND scope_id = auth.uid())
  OR (scope = 'flow' AND scope_id IN (
    SELECT id FROM flows 
    WHERE user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin', 'moderator')
      AND ur.is_active = true
    )
  ))
  OR (scope = 'global' AND EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND ur.is_active = true
  ))
);

-- ====================
-- 3. FUNÇÕES AUXILIARES
-- ====================

-- Função para verificar permissões do Flow Builder
CREATE OR REPLACE FUNCTION check_flow_builder_permission(
  user_id_param UUID,
  action_param TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_permissions JSONB;
BEGIN
  -- Buscar permissões do usuário
  SELECT r.permissions INTO user_permissions
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_id_param
  AND ur.is_active = true
  LIMIT 1;
  
  -- Verificar se tem a permissão específica
  RETURN user_permissions->'flow_builder' ? action_param;
END;
$$;

-- Função para obter estatísticas do Flow Builder
CREATE OR REPLACE FUNCTION get_flow_builder_stats()
RETURNS TABLE (
  total_flows BIGINT,
  active_flows BIGINT,
  total_executions BIGINT,
  success_rate NUMERIC,
  popular_categories TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_flows,
    COUNT(*) FILTER (WHERE is_active = true)::BIGINT as active_flows,
    COALESCE(SUM(execution_count), 0)::BIGINT as total_executions,
    CASE 
      WHEN SUM(execution_count) > 0 THEN 
        ROUND((SUM(success_count)::NUMERIC / SUM(execution_count)::NUMERIC) * 100, 2)
      ELSE 0
    END as success_rate,
    ARRAY_AGG(DISTINCT category) FILTER (WHERE category IS NOT NULL) as popular_categories
  FROM flows;
END;
$$;

-- ====================
-- 4. VIEWS PARA MONITORAMENTO
-- ====================

-- View para estatísticas do Flow Builder
CREATE OR REPLACE VIEW flow_builder_stats AS
SELECT 
  COUNT(*) as total_flows,
  COUNT(*) FILTER (WHERE is_active = true) as active_flows,
  COALESCE(SUM(execution_count), 0) as total_executions,
  COALESCE(SUM(success_count), 0) as successful_executions,
  COALESCE(SUM(error_count), 0) as failed_executions,
  CASE 
    WHEN SUM(execution_count) > 0 THEN 
      ROUND((SUM(success_count)::NUMERIC / SUM(execution_count)::NUMERIC) * 100, 2)
    ELSE 0
  END as success_rate
FROM flows;

-- View para templates populares
CREATE OR REPLACE VIEW popular_templates AS
SELECT 
  name,
  description,
  category,
  difficulty_level,
  usage_count,
  rating,
  is_featured
FROM flow_templates
WHERE is_public = true
ORDER BY usage_count DESC, rating DESC NULLS LAST;

-- ====================
-- 5. COMENTÁRIOS
-- ====================

COMMENT ON FUNCTION check_flow_builder_permission IS 'Verifica se um usuário tem permissão específica no Flow Builder';
COMMENT ON FUNCTION get_flow_builder_stats IS 'Retorna estatísticas gerais do Flow Builder';
COMMENT ON VIEW flow_builder_stats IS 'Estatísticas em tempo real do Flow Builder';
COMMENT ON VIEW popular_templates IS 'Templates mais populares do Flow Builder';

-- ====================
-- 6. MENSAGEM DE CONFIRMAÇÃO
-- ====================

DO $$
BEGIN
  RAISE NOTICE 'Permissões do Flow Builder aplicadas com sucesso!';
  RAISE NOTICE 'SUPER ADMIN agora tem acesso completo ao Flow Builder';
  RAISE NOTICE 'Execute: SELECT * FROM flow_builder_stats; para ver estatísticas';
END $$; 