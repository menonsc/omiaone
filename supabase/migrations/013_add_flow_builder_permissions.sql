-- Migration: Adicionar permissões do Flow Builder ao sistema RBAC
-- Arquivo: 013_add_flow_builder_permissions.sql
-- Descrição: Atualiza as permissões dos roles para incluir o Flow Builder

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
-- 2. ADICIONAR POLÍTICAS RLS PARA FLOW BUILDER
-- ====================

-- Políticas para flows (com verificação de existência)
DO $$
BEGIN
  -- Política para SUPER ADMIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flows' AND policyname = 'flows_super_admin_policy') THEN
    CREATE POLICY "flows_super_admin_policy" ON flows FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
        AND ur.is_active = true
      )
    );
  END IF;

  -- Política para ADMIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flows' AND policyname = 'flows_admin_policy') THEN
    CREATE POLICY "flows_admin_policy" ON flows FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('super_admin', 'admin')
        AND ur.is_active = true
      )
    );
  END IF;

  -- Política para usuários (SELECT)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flows' AND policyname = 'flows_user_select_policy') THEN
    CREATE POLICY "flows_user_select_policy" ON flows FOR SELECT USING (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('super_admin', 'admin', 'moderator')
        AND ur.is_active = true
      )
    );
  END IF;

  -- Política para usuários (INSERT)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flows' AND policyname = 'flows_user_insert_policy') THEN
    CREATE POLICY "flows_user_insert_policy" ON flows FOR INSERT WITH CHECK (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('super_admin', 'admin')
        AND ur.is_active = true
      )
    );
  END IF;

  -- Política para usuários (UPDATE)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flows' AND policyname = 'flows_user_update_policy') THEN
    CREATE POLICY "flows_user_update_policy" ON flows FOR UPDATE USING (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('super_admin', 'admin', 'moderator')
        AND ur.is_active = true
      )
    );
  END IF;

  -- Política para usuários (DELETE)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flows' AND policyname = 'flows_user_delete_policy') THEN
    CREATE POLICY "flows_user_delete_policy" ON flows FOR DELETE USING (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('super_admin', 'admin')
        AND ur.is_active = true
      )
    );
  END IF;
END $$;

-- Políticas para flow_nodes (com verificação de existência)
DO $$
BEGIN
  -- Política para SUPER ADMIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flow_nodes' AND policyname = 'flow_nodes_super_admin_policy') THEN
    CREATE POLICY "flow_nodes_super_admin_policy" ON flow_nodes FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
        AND ur.is_active = true
      )
    );
  END IF;

  -- Política para ADMIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flow_nodes' AND policyname = 'flow_nodes_admin_policy') THEN
    CREATE POLICY "flow_nodes_admin_policy" ON flow_nodes FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('super_admin', 'admin')
        AND ur.is_active = true
      )
    );
  END IF;

  -- Política para usuários
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flow_nodes' AND policyname = 'flow_nodes_user_policy') THEN
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
  END IF;
END $$;

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
  scope = 'global'
  OR (scope = 'user' AND scope_id = auth.uid())
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
);

-- ====================
-- 3. FUNÇÕES AUXILIARES PARA FLOW BUILDER
-- ====================

-- Função para verificar permissão específica do Flow Builder
CREATE OR REPLACE FUNCTION check_flow_builder_permission(
  user_id_param UUID,
  action_param VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_user_permission(user_id_param, 'flow_builder', action_param);
END;
$$ LANGUAGE plpgsql;

-- Função para obter flows que o usuário pode acessar
CREATE OR REPLACE FUNCTION get_user_accessible_flows(user_id_param UUID DEFAULT auth.uid())
RETURNS TABLE (
  flow_id UUID,
  flow_name VARCHAR,
  can_edit BOOLEAN,
  can_execute BOOLEAN,
  can_delete BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as flow_id,
    f.name as flow_name,
    CASE 
      WHEN f.user_id = user_id_param THEN true
      WHEN check_user_permission(user_id_param, 'flow_builder', 'update') THEN true
      ELSE false
    END as can_edit,
    CASE 
      WHEN check_user_permission(user_id_param, 'flow_builder', 'execute') THEN true
      ELSE false
    END as can_execute,
    CASE 
      WHEN f.user_id = user_id_param THEN true
      WHEN check_user_permission(user_id_param, 'flow_builder', 'delete') THEN true
      ELSE false
    END as can_delete
  FROM flows f
  WHERE f.user_id = user_id_param
  OR check_user_permission(user_id_param, 'flow_builder', 'read');
END;
$$ LANGUAGE plpgsql;

-- ====================
-- 4. VIEWS PARA MONITORAMENTO
-- ====================

-- View para estatísticas do Flow Builder por usuário
CREATE OR REPLACE VIEW flow_builder_stats AS
SELECT 
  u.id as user_id,
  p.full_name,
  u.email,
  COUNT(DISTINCT f.id) as total_flows,
  COUNT(DISTINCT fe.id) as total_executions,
  COUNT(DISTINCT ft.id) as total_templates,
  MAX(f.updated_at) as last_flow_update,
  MAX(fe.started_at) as last_execution
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN flows f ON u.id = f.user_id
LEFT JOIN flow_executions fe ON f.id = fe.flow_id
LEFT JOIN flow_templates ft ON ft.created_by = u.id
GROUP BY u.id, p.full_name, u.email;

-- View para monitoramento de execuções
CREATE OR REPLACE VIEW flow_execution_monitoring AS
SELECT 
  fe.id as execution_id,
  f.name as flow_name,
  f.user_id,
  p.full_name as user_name,
  fe.status,
  fe.started_at,
  fe.completed_at,
  fe.duration_ms,
  fe.error_message,
  COUNT(fes.id) as total_steps,
  COUNT(CASE WHEN fes.status = 'completed' THEN 1 END) as completed_steps,
  COUNT(CASE WHEN fes.status = 'failed' THEN 1 END) as failed_steps
FROM flow_executions fe
JOIN flows f ON fe.flow_id = f.id
JOIN profiles p ON f.user_id = p.id
LEFT JOIN flow_execution_steps fes ON fe.id = fes.execution_id
GROUP BY fe.id, f.name, f.user_id, p.full_name, fe.status, fe.started_at, fe.completed_at, fe.duration_ms, fe.error_message;

-- ====================
-- 5. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ====================

COMMENT ON FUNCTION check_flow_builder_permission IS 'Verifica se usuário tem permissão específica no Flow Builder';
COMMENT ON FUNCTION get_user_accessible_flows IS 'Retorna flows que o usuário pode acessar com permissões';
COMMENT ON VIEW flow_builder_stats IS 'Estatísticas do Flow Builder por usuário';
COMMENT ON VIEW flow_execution_monitoring IS 'Monitoramento de execuções de flows';

-- ====================
-- 6. LOG DE ATUALIZAÇÃO
-- ====================

-- Inserir log da atualização
INSERT INTO system_logs (level, message, metadata, created_at) VALUES (
  'info',
  'Flow Builder permissions added to RBAC system',
  '{"migration": "013_add_flow_builder_permissions.sql", "roles_updated": ["super_admin", "admin", "moderator", "user"], "policies_added": 15}',
  NOW()
); 