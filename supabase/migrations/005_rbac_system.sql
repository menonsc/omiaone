-- Migration: Sistema RBAC (Role-Based Access Control)
-- Arquivo: 005_rbac_system.sql

-- 1. Tabela de Roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  hierarchy_level INTEGER NOT NULL,
  is_system_role BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de relacionamento User-Roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(user_id, role_id)
);

-- 3. Tabela de Logs de Permissões (para auditoria)
CREATE TABLE permission_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100),
  permission_checked VARCHAR(100) NOT NULL,
  granted BOOLEAN NOT NULL,
  role_used VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Índices para performance
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_hierarchy ON roles(hierarchy_level);
CREATE INDEX idx_roles_active ON roles(is_active) WHERE is_active = true;

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(is_active) WHERE is_active = true;
CREATE INDEX idx_user_roles_expires ON user_roles(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_permission_logs_user_id ON permission_logs(user_id);
CREATE INDEX idx_permission_logs_action ON permission_logs(action);
CREATE INDEX idx_permission_logs_created_at ON permission_logs(created_at);

-- 5. Triggers para updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Inserir roles padrão do sistema
INSERT INTO roles (name, display_name, description, hierarchy_level, permissions, is_system_role) VALUES
(
  'super_admin',
  'Super Administrador',
  'Acesso total ao sistema, incluindo gerenciamento de roles e usuários',
  1,
  '{
    "users": ["create", "read", "update", "delete", "manage_roles"],
    "roles": ["create", "read", "update", "delete"],
    "agents": ["create", "read", "update", "delete", "manage_public"],
    "documents": ["create", "read", "update", "delete", "manage_all"],
    "chat": ["create", "read", "update", "delete", "moderate"],
    "whatsapp": ["create", "read", "update", "delete", "manage_instances"],
    "email_marketing": ["create", "read", "update", "delete", "send_campaigns"],
    "integrations": ["create", "read", "update", "delete", "configure"],
    "analytics": ["read", "export", "configure"],
    "system": ["configure", "maintain", "backup", "logs"]
  }'::jsonb,
  true
),
(
  'admin',
  'Administrador',
  'Acesso administrativo com algumas restrições',
  2,
  '{
    "users": ["create", "read", "update"],
    "roles": ["read"],
    "agents": ["create", "read", "update", "delete"],
    "documents": ["create", "read", "update", "delete"],
    "chat": ["create", "read", "update", "delete"],
    "whatsapp": ["create", "read", "update", "manage_instances"],
    "email_marketing": ["create", "read", "update", "send_campaigns"],
    "integrations": ["create", "read", "update", "configure"],
    "analytics": ["read", "export"],
    "system": ["logs"]
  }'::jsonb,
  true
),
(
  'moderator',
  'Moderador',
  'Moderação de conteúdo e suporte aos usuários',
  3,
  '{
    "users": ["read", "update"],
    "agents": ["read", "update"],
    "documents": ["create", "read", "update"],
    "chat": ["create", "read", "update", "moderate"],
    "whatsapp": ["read", "update"],
    "email_marketing": ["read", "update"],
    "integrations": ["read"],
    "analytics": ["read"]
  }'::jsonb,
  true
),
(
  'user',
  'Usuário',
  'Usuário padrão com acesso básico',
  4,
  '{
    "agents": ["read"],
    "documents": ["create", "read", "update"],
    "chat": ["create", "read", "update"],
    "whatsapp": ["read"],
    "email_marketing": ["read"],
    "integrations": ["read"],
    "analytics": ["read"]
  }'::jsonb,
  true
);

-- 7. Função para verificar permissões
CREATE OR REPLACE FUNCTION check_user_permission(
  user_id_param UUID,
  resource_param VARCHAR,
  action_param VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  user_permissions JSONB := '{}';
  role_permissions JSONB;
  resource_actions TEXT[];
  role_record RECORD;
BEGIN
  -- Buscar todas as permissões dos roles do usuário
  FOR role_record IN 
    SELECT r.permissions, r.name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id_param 
    AND ur.is_active = true 
    AND r.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY r.hierarchy_level ASC
  LOOP
    -- Mesclar permissões (níveis mais altos sobrescrevem)
    user_permissions := user_permissions || role_record.permissions;
  END LOOP;
  
  -- Verificar se o usuário tem a permissão específica
  resource_actions := ARRAY(
    SELECT jsonb_array_elements_text(user_permissions->resource_param)
  );
  
  RETURN action_param = ANY(resource_actions);
END;
$$ LANGUAGE plpgsql;

-- 8. Função para obter permissões do usuário
CREATE OR REPLACE FUNCTION get_user_permissions(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  user_permissions JSONB := '{}';
  role_record RECORD;
  user_roles_array TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Buscar todas as permissões dos roles do usuário
  FOR role_record IN 
    SELECT r.permissions, r.name, r.display_name, r.hierarchy_level
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id_param 
    AND ur.is_active = true 
    AND r.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY r.hierarchy_level ASC
  LOOP
    -- Mesclar permissões
    user_permissions := user_permissions || role_record.permissions;
    user_roles_array := array_append(user_roles_array, role_record.name);
  END LOOP;
  
  -- Retornar permissões com metadata
  RETURN jsonb_build_object(
    'permissions', user_permissions,
    'roles', user_roles_array,
    'checked_at', NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- 9. Função para log de verificação de permissões
CREATE OR REPLACE FUNCTION log_permission_check(
  user_id_param UUID,
  action_param VARCHAR,
  resource_param VARCHAR,
  resource_id_param VARCHAR DEFAULT NULL,
  permission_param VARCHAR DEFAULT NULL,
  granted_param BOOLEAN DEFAULT NULL,
  role_used_param VARCHAR DEFAULT NULL,
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO permission_logs (
    user_id, action, resource, resource_id, permission_checked,
    granted, role_used, ip_address, user_agent
  ) VALUES (
    user_id_param, action_param, resource_param, resource_id_param,
    COALESCE(permission_param, action_param), granted_param,
    role_used_param, ip_address_param, user_agent_param
  );
END;
$$ LANGUAGE plpgsql;

-- 10. Migração dos roles existentes no profiles
-- Atualizar user_roles baseado no campo role atual dos profiles
DO $$
BEGIN
  -- Verificar se a tabela profiles existe e tem o campo role
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'profiles'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    INSERT INTO user_roles (user_id, role_id, assigned_at)
    SELECT 
      p.id as user_id,
      r.id as role_id,
      p.created_at as assigned_at
    FROM profiles p
    JOIN roles r ON r.name = p.role::VARCHAR(50)
    WHERE NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = p.id AND ur.role_id = r.id
    );
  END IF;
END $$;

-- 11. RLS (Row Level Security) policies
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_logs ENABLE ROW LEVEL SECURITY;

-- Policies para roles (apenas admins podem gerenciar)
CREATE POLICY "Super admins can manage all roles" ON roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
      AND ur.is_active = true
    )
  );

CREATE POLICY "Users can read their own roles" ON roles
  FOR SELECT USING (
    id IN (
      SELECT ur.role_id FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.is_active = true
    )
  );

-- Policies para user_roles
CREATE POLICY "Admins can manage user roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
    )
  );

CREATE POLICY "Users can read their own roles" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Policies para permission_logs (apenas para auditoria por admins)
CREATE POLICY "Admins can read permission logs" ON permission_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
    )
  );

-- 12. Views auxiliares
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
  ur.user_id,
  p.full_name,
  u.email,
  r.name as role_name,
  r.display_name as role_display_name,
  r.hierarchy_level,
  r.permissions,
  ur.assigned_at,
  ur.expires_at,
  ur.is_active
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN profiles p ON ur.user_id = p.id
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.is_active = true 
AND r.is_active = true
AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

-- 13. Comentários para documentação
COMMENT ON TABLE roles IS 'Tabela de papéis/roles do sistema RBAC';
COMMENT ON TABLE user_roles IS 'Relacionamento entre usuários e papéis';
COMMENT ON TABLE permission_logs IS 'Logs de verificação de permissões para auditoria';
COMMENT ON FUNCTION check_user_permission IS 'Verifica se usuário tem permissão específica';
COMMENT ON FUNCTION get_user_permissions IS 'Retorna todas as permissões do usuário';
COMMENT ON FUNCTION log_permission_check IS 'Registra verificação de permissão para auditoria'; 