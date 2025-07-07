-- Migration: Sistema de Autorização RLS Avançado
-- Arquivo: 006_rls_authorization_system.sql
-- Descrição: Row Level Security avançado com políticas baseadas em roles

-- ====================
-- 1. FUNÇÕES DE CONTEXTO E AUTORIZAÇÃO
-- ====================

-- Função para obter role do usuário atual
CREATE OR REPLACE FUNCTION get_user_role(user_id_param UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Verificar se o usuário existe e obter seu role
  SELECT COALESCE(p.role::text, 'user')
  INTO user_role
  FROM profiles p 
  WHERE p.id = user_id_param;
  
  -- Se não encontrou perfil, retornar 'user'
  IF user_role IS NULL THEN
    user_role := 'user';
  END IF;
  
  RETURN user_role;
END;
$$;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin(user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN get_user_role(user_id_param) IN ('admin', 'super_admin');
END;
$$;

-- Função para verificar se usuário é super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN get_user_role(user_id_param) = 'super_admin';
END;
$$;

-- Função para verificar hierarquia de roles
CREATE OR REPLACE FUNCTION role_hierarchy_level(user_id_param UUID DEFAULT auth.uid())
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  hierarchy_level INTEGER;
BEGIN
  -- Níveis de hierarquia: super_admin=1, admin=2, team_lead=3, user=4
  SELECT 
    CASE get_user_role(user_id_param)
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'team_lead' THEN 3
      WHEN 'user' THEN 4
      ELSE 4
    END
  INTO hierarchy_level;
  
  RETURN hierarchy_level;
END;
$$;

-- Função para verificar permissão específica via RBAC
CREATE OR REPLACE FUNCTION has_rbac_permission(
  user_id_param UUID,
  resource_param TEXT,
  action_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Usar a função existente check_user_permission
  RETURN check_user_permission(user_id_param, resource_param, action_param);
END;
$$;

-- ====================
-- 2. RATE LIMITING SYSTEM
-- ====================

-- Tabela para rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address INET,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_action ON rate_limits(action);

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_id_param UUID DEFAULT auth.uid(),
  ip_address_param INET DEFAULT '0.0.0.0'::inet,
  action_param VARCHAR DEFAULT 'general',
  resource_param VARCHAR DEFAULT NULL,
  max_requests INTEGER DEFAULT 100,
  window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  window_start TIMESTAMP WITH TIME ZONE;
  current_count INTEGER;
  is_admin_user BOOLEAN;
BEGIN
  -- Admins têm limite mais alto
  is_admin_user := is_admin(user_id_param);
  IF is_admin_user THEN
    max_requests := max_requests * 5; -- Admins têm 5x mais limite
  END IF;
  
  window_start := NOW() - (window_minutes || ' minutes')::INTERVAL;
  
  -- Contar requests no período
  SELECT COALESCE(SUM(request_count), 0)
  INTO current_count
  FROM rate_limits
  WHERE 
    (user_id = user_id_param OR ip_address = ip_address_param)
    AND action = action_param
    AND (resource_param IS NULL OR resource = resource_param)
    AND window_start >= window_start;
  
  -- Se excedeu o limite
  IF current_count >= max_requests THEN
    -- Log da tentativa de acesso negado
    INSERT INTO system_logs (
      log_level, severity, component, action, message, details, user_id
    ) VALUES (
      'warn', 'medium', 'rate_limiter', action_param,
      'Rate limit exceeded',
      jsonb_build_object(
        'user_id', user_id_param,
        'ip_address', ip_address_param,
        'current_count', current_count,
        'max_requests', max_requests,
        'resource', resource_param
      ),
      user_id_param
    );
    
    RETURN FALSE;
  END IF;
  
  -- Incrementar contador
  INSERT INTO rate_limits (user_id, ip_address, action, resource, request_count, window_start)
  VALUES (user_id_param, ip_address_param, action_param, resource_param, 1, NOW())
  ON CONFLICT (user_id, ip_address, action, COALESCE(resource, ''))
  DO UPDATE SET 
    request_count = rate_limits.request_count + 1,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$;

-- ====================
-- 3. SISTEMA DE AUDITORIA AVANÇADO
-- ====================

-- Tabela para logs de acesso negado
CREATE TABLE IF NOT EXISTS access_denied_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  attempted_action VARCHAR(100) NOT NULL,
  attempted_resource VARCHAR(100),
  resource_id VARCHAR(100),
  reason VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  request_headers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_access_denied_user_id ON access_denied_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_denied_action ON access_denied_logs(attempted_action);
CREATE INDEX IF NOT EXISTS idx_access_denied_created_at ON access_denied_logs(created_at);

-- Função para log de acesso negado
CREATE OR REPLACE FUNCTION log_access_denied(
  user_id_param UUID DEFAULT auth.uid(),
  action_param VARCHAR DEFAULT 'unknown',
  resource_param VARCHAR DEFAULT NULL,
  resource_id_param VARCHAR DEFAULT NULL,
  reason_param VARCHAR DEFAULT 'Insufficient permissions',
  ip_address_param INET DEFAULT '0.0.0.0'::inet,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO access_denied_logs (
    user_id, attempted_action, attempted_resource, resource_id,
    reason, ip_address, user_agent
  ) VALUES (
    user_id_param, action_param, resource_param, resource_id_param,
    reason_param, ip_address_param, user_agent_param
  );
  
  -- Log também no sistema geral
  INSERT INTO system_logs (
    log_level, severity, component, action, message, details, user_id
  ) VALUES (
    'warn', 'high', 'authorization', 'access_denied',
    'Access denied: ' || reason_param,
    jsonb_build_object(
      'attempted_action', action_param,
      'attempted_resource', resource_param,
      'resource_id', resource_id_param,
      'ip_address', ip_address_param,
      'user_agent', user_agent_param
    ),
    user_id_param
  );
END;
$$;

-- ====================
-- 4. POLÍTICAS RLS PARA TODAS AS TABELAS
-- ====================

-- Remover políticas existentes se houver conflito
DO $$ 
BEGIN
  -- Profiles
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
  
  -- Agents
  DROP POLICY IF EXISTS "Public agents are viewable by everyone" ON agents;
  DROP POLICY IF EXISTS "Users can view their own agents" ON agents;
  DROP POLICY IF EXISTS "Users can create agents" ON agents;
  DROP POLICY IF EXISTS "Users can update their own agents" ON agents;
  
  -- E assim por diante para outras tabelas...
END $$;

-- =====================
-- POLÍTICAS PARA PROFILES
-- =====================

-- Users podem ver próprio perfil + Admins veem todos
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT 
USING (
  auth.uid() = id 
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'users', 'read')
);

-- Users podem atualizar próprio perfil + Admins podem atualizar qualquer um
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE 
USING (
  auth.uid() = id 
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'users', 'update')
);

-- Apenas Super Admins podem inserir perfis
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT 
WITH CHECK (
  is_super_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'users', 'create')
);

-- Apenas Super Admins podem deletar perfis
CREATE POLICY "profiles_delete_policy" ON profiles FOR DELETE 
USING (
  is_super_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'users', 'delete')
);

-- =====================
-- POLÍTICAS PARA AGENTS
-- =====================

-- Leitura: Agentes públicos + próprios agentes + admins veem todos
CREATE POLICY "agents_select_policy" ON agents FOR SELECT 
USING (
  is_public = true
  OR auth.uid() = created_by
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'agents', 'read')
);

-- Inserção: Users podem criar agentes
CREATE POLICY "agents_insert_policy" ON agents FOR INSERT 
WITH CHECK (
  auth.uid() = created_by
  AND (
    has_rbac_permission(auth.uid(), 'agents', 'create')
    OR role_hierarchy_level(auth.uid()) <= 3 -- team_lead ou superior
  )
);

-- Atualização: Próprios agentes + admins
CREATE POLICY "agents_update_policy" ON agents FOR UPDATE 
USING (
  auth.uid() = created_by
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'agents', 'update')
);

-- Deleção: Próprios agentes + admins
CREATE POLICY "agents_delete_policy" ON agents FOR DELETE 
USING (
  auth.uid() = created_by
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'agents', 'delete')
);

-- =====================
-- POLÍTICAS PARA DOCUMENTS
-- =====================

CREATE POLICY "documents_select_policy" ON documents FOR SELECT 
USING (
  auth.uid() = uploaded_by
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'documents', 'read')
);

CREATE POLICY "documents_insert_policy" ON documents FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by
  AND has_rbac_permission(auth.uid(), 'documents', 'create')
);

CREATE POLICY "documents_update_policy" ON documents FOR UPDATE 
USING (
  auth.uid() = uploaded_by
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'documents', 'update')
);

CREATE POLICY "documents_delete_policy" ON documents FOR DELETE 
USING (
  auth.uid() = uploaded_by
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'documents', 'delete')
);

-- =====================
-- POLÍTICAS PARA DOCUMENT_CHUNKS
-- =====================

CREATE POLICY "document_chunks_select_policy" ON document_chunks FOR SELECT 
USING (
  document_id IN (
    SELECT id FROM documents 
    WHERE uploaded_by = auth.uid() 
    OR is_admin(auth.uid())
    OR has_rbac_permission(auth.uid(), 'documents', 'read')
  )
);

CREATE POLICY "document_chunks_insert_policy" ON document_chunks FOR INSERT 
WITH CHECK (
  document_id IN (
    SELECT id FROM documents 
    WHERE uploaded_by = auth.uid()
    AND has_rbac_permission(auth.uid(), 'documents', 'create')
  )
);

CREATE POLICY "document_chunks_delete_policy" ON document_chunks FOR DELETE 
USING (
  document_id IN (
    SELECT id FROM documents 
    WHERE uploaded_by = auth.uid()
    OR is_admin(auth.uid())
    OR has_rbac_permission(auth.uid(), 'documents', 'delete')
  )
);

-- =====================
-- POLÍTICAS PARA CHAT_SESSIONS
-- =====================

CREATE POLICY "chat_sessions_select_policy" ON chat_sessions FOR SELECT 
USING (
  auth.uid() = user_id
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'chat', 'read')
);

CREATE POLICY "chat_sessions_insert_policy" ON chat_sessions FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
  AND has_rbac_permission(auth.uid(), 'chat', 'create')
);

CREATE POLICY "chat_sessions_update_policy" ON chat_sessions FOR UPDATE 
USING (
  auth.uid() = user_id
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'chat', 'update')
);

CREATE POLICY "chat_sessions_delete_policy" ON chat_sessions FOR DELETE 
USING (
  auth.uid() = user_id
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'chat', 'delete')
);

-- =====================
-- POLÍTICAS PARA MESSAGES
-- =====================

CREATE POLICY "messages_select_policy" ON messages FOR SELECT 
USING (
  session_id IN (
    SELECT id FROM chat_sessions 
    WHERE user_id = auth.uid()
    OR is_admin(auth.uid())
    OR has_rbac_permission(auth.uid(), 'chat', 'read')
  )
);

CREATE POLICY "messages_insert_policy" ON messages FOR INSERT 
WITH CHECK (
  session_id IN (
    SELECT id FROM chat_sessions 
    WHERE user_id = auth.uid()
    AND has_rbac_permission(auth.uid(), 'chat', 'create')
  )
);

CREATE POLICY "messages_update_policy" ON messages FOR UPDATE 
USING (
  session_id IN (
    SELECT id FROM chat_sessions 
    WHERE user_id = auth.uid()
    OR is_admin(auth.uid())
    OR has_rbac_permission(auth.uid(), 'chat', 'update')
  )
);

-- =====================
-- POLÍTICAS PARA ACTIVITY_LOGS
-- =====================

CREATE POLICY "activity_logs_select_policy" ON activity_logs FOR SELECT 
USING (
  auth.uid() = user_id
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'system', 'logs')
);

CREATE POLICY "activity_logs_insert_policy" ON activity_logs FOR INSERT 
WITH CHECK (true); -- Qualquer um pode inserir logs

-- =====================
-- POLÍTICAS PARA EMAIL MARKETING
-- =====================

-- Email Campaigns
CREATE POLICY "email_campaigns_select_policy" ON email_campaigns FOR SELECT 
USING (
  auth.uid() = created_by
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'email_marketing', 'read')
);

CREATE POLICY "email_campaigns_insert_policy" ON email_campaigns FOR INSERT 
WITH CHECK (
  auth.uid() = created_by
  AND has_rbac_permission(auth.uid(), 'email_marketing', 'create')
);

CREATE POLICY "email_campaigns_update_policy" ON email_campaigns FOR UPDATE 
USING (
  auth.uid() = created_by
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'email_marketing', 'update')
);

CREATE POLICY "email_campaigns_delete_policy" ON email_campaigns FOR DELETE 
USING (
  auth.uid() = created_by
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'email_marketing', 'delete')
);

-- Email Templates
CREATE POLICY "email_templates_select_policy" ON email_templates FOR SELECT 
USING (
  auth.uid() = created_by
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'email_marketing', 'read')
);

CREATE POLICY "email_templates_insert_policy" ON email_templates FOR INSERT 
WITH CHECK (
  auth.uid() = created_by
  AND has_rbac_permission(auth.uid(), 'email_marketing', 'create')
);

CREATE POLICY "email_templates_update_policy" ON email_templates FOR UPDATE 
USING (
  auth.uid() = created_by
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'email_marketing', 'update')
);

-- Email Contacts (compartilhados por todos os usuários do sistema)
CREATE POLICY "email_contacts_select_policy" ON email_contacts FOR SELECT 
USING (
  has_rbac_permission(auth.uid(), 'email_marketing', 'read')
  OR role_hierarchy_level(auth.uid()) <= 3 -- team_lead ou superior
);

CREATE POLICY "email_contacts_insert_policy" ON email_contacts FOR INSERT 
WITH CHECK (
  has_rbac_permission(auth.uid(), 'email_marketing', 'create')
  OR role_hierarchy_level(auth.uid()) <= 3
);

CREATE POLICY "email_contacts_update_policy" ON email_contacts FOR UPDATE 
USING (
  has_rbac_permission(auth.uid(), 'email_marketing', 'update')
  OR role_hierarchy_level(auth.uid()) <= 3
);

-- =====================
-- POLÍTICAS PARA INTEGRATIONS
-- =====================

CREATE POLICY "integrations_select_policy" ON integrations FOR SELECT 
USING (
  auth.uid() = user_id
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'integrations', 'read')
);

CREATE POLICY "integrations_insert_policy" ON integrations FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
  AND has_rbac_permission(auth.uid(), 'integrations', 'create')
);

CREATE POLICY "integrations_update_policy" ON integrations FOR UPDATE 
USING (
  auth.uid() = user_id
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'integrations', 'update')
);

CREATE POLICY "integrations_delete_policy" ON integrations FOR DELETE 
USING (
  auth.uid() = user_id
  OR is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'integrations', 'delete')
);

-- =====================
-- POLÍTICAS PARA ANALYTICS (APENAS ADMINS)
-- =====================

-- Analytics Events - apenas admins
CREATE POLICY "analytics_events_select_policy" ON analytics_events FOR SELECT 
USING (
  is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'analytics', 'read')
);

CREATE POLICY "analytics_events_insert_policy" ON analytics_events FOR INSERT 
WITH CHECK (true); -- Qualquer um pode inserir eventos (para tracking)

-- System Logs - apenas admins
CREATE POLICY "system_logs_select_policy" ON system_logs FOR SELECT 
USING (
  is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'system', 'logs')
);

CREATE POLICY "system_logs_insert_policy" ON system_logs FOR INSERT 
WITH CHECK (true); -- Sistema pode inserir logs

-- System Alerts - apenas admins
CREATE POLICY "system_alerts_select_policy" ON system_alerts FOR SELECT 
USING (
  is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'analytics', 'read')
);

CREATE POLICY "system_alerts_update_policy" ON system_alerts FOR UPDATE 
USING (
  is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'analytics', 'update')
);

-- =====================
-- POLÍTICAS PARA RBAC SYSTEM
-- =====================

-- Roles - apenas super admins podem gerenciar
CREATE POLICY "roles_select_policy" ON roles FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'system', 'manage_all')
);

CREATE POLICY "roles_insert_policy" ON roles FOR INSERT 
WITH CHECK (
  is_super_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'system', 'manage_all')
);

CREATE POLICY "roles_update_policy" ON roles FOR UPDATE 
USING (
  is_super_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'system', 'manage_all')
);

CREATE POLICY "roles_delete_policy" ON roles FOR DELETE 
USING (
  is_super_admin(auth.uid())
  AND NOT is_system_role -- Não pode deletar roles do sistema
);

-- User Roles - apenas super admins
CREATE POLICY "user_roles_select_policy" ON user_roles FOR SELECT 
USING (
  is_super_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'users', 'read')
);

CREATE POLICY "user_roles_insert_policy" ON user_roles FOR INSERT 
WITH CHECK (
  is_super_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'users', 'update')
);

CREATE POLICY "user_roles_update_policy" ON user_roles FOR UPDATE 
USING (
  is_super_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'users', 'update')
);

CREATE POLICY "user_roles_delete_policy" ON user_roles FOR DELETE 
USING (
  is_super_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'users', 'update')
);

-- Permission Logs - apenas admins podem ver
CREATE POLICY "permission_logs_select_policy" ON permission_logs FOR SELECT 
USING (
  is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'system', 'logs')
);

CREATE POLICY "permission_logs_insert_policy" ON permission_logs FOR INSERT 
WITH CHECK (true); -- Sistema pode inserir logs

-- =====================
-- POLÍTICAS PARA RATE LIMITS E AUDITORIA
-- =====================

-- Rate Limits - apenas admins podem ver
CREATE POLICY "rate_limits_select_policy" ON rate_limits FOR SELECT 
USING (
  is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'system', 'logs')
);

-- Access Denied Logs - apenas admins podem ver
CREATE POLICY "access_denied_logs_select_policy" ON access_denied_logs FOR SELECT 
USING (
  is_admin(auth.uid())
  OR has_rbac_permission(auth.uid(), 'system', 'logs')
);

-- =====================
-- 5. TRIGGERS DE AUDITORIA
-- =====================

-- Trigger para logar tentativas de acesso negado automaticamente
CREATE OR REPLACE FUNCTION audit_rls_violation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log de violação de RLS
  PERFORM log_access_denied(
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(OLD.id::text, NEW.id::text),
    'RLS policy violation',
    '0.0.0.0'::inet,
    'database_trigger'
  );
  
  RETURN NULL;
END;
$$;

-- ====================
-- 6. FUNÇÕES DE MIDDLEWARE
-- ====================

-- Função para verificar autorização completa antes de operação
CREATE OR REPLACE FUNCTION authorize_operation(
  resource_param TEXT,
  action_param TEXT,
  user_id_param UUID DEFAULT auth.uid(),
  rate_limit_check BOOLEAN DEFAULT true,
  max_requests INTEGER DEFAULT 100,
  window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  has_permission BOOLEAN;
  rate_limit_ok BOOLEAN;
BEGIN
  -- 1. Verificar autenticação
  IF user_id_param IS NULL THEN
    PERFORM log_access_denied(
      user_id_param, action_param, resource_param, NULL,
      'User not authenticated', '0.0.0.0'::inet, 'middleware'
    );
    RETURN FALSE;
  END IF;
  
  -- 2. Verificar permissão RBAC
  has_permission := has_rbac_permission(user_id_param, resource_param, action_param);
  
  IF NOT has_permission THEN
    PERFORM log_access_denied(
      user_id_param, action_param, resource_param, NULL,
      'Insufficient RBAC permissions', '0.0.0.0'::inet, 'middleware'
    );
    RETURN FALSE;
  END IF;
  
  -- 3. Verificar rate limit (se habilitado)
  IF rate_limit_check THEN
    rate_limit_ok := check_rate_limit(
      user_id_param, '0.0.0.0'::inet, action_param, resource_param,
      max_requests, window_minutes
    );
    
    IF NOT rate_limit_ok THEN
      PERFORM log_access_denied(
        user_id_param, action_param, resource_param, NULL,
        'Rate limit exceeded', '0.0.0.0'::inet, 'middleware'
      );
      RETURN FALSE;
    END IF;
  END IF;
  
  -- 4. Log operação autorizada
  PERFORM log_permission_check(
    user_id_param, action_param, resource_param, NULL,
    resource_param || '.' || action_param, TRUE,
    get_user_role(user_id_param), '0.0.0.0'::inet, 'middleware'
  );
  
  RETURN TRUE;
END;
$$;

-- ====================
-- 7. VIEWS DE AUDITORIA
-- ====================

-- View para monitoramento de acessos negados
CREATE OR REPLACE VIEW security_monitoring AS
SELECT 
  adl.created_at,
  adl.user_id,
  p.full_name,
  p.role::text,
  adl.attempted_action,
  adl.attempted_resource,
  adl.reason,
  adl.ip_address,
  adl.user_agent
FROM access_denied_logs adl
LEFT JOIN profiles p ON p.id = adl.user_id
ORDER BY adl.created_at DESC;

-- View para estatísticas de rate limiting
CREATE OR REPLACE VIEW rate_limit_stats AS
SELECT 
  action,
  resource,
  DATE_TRUNC('hour', window_start) as hour,
  COUNT(*) as total_requests,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips,
  AVG(request_count) as avg_requests_per_entry
FROM rate_limits
WHERE window_start >= NOW() - INTERVAL '24 hours'
GROUP BY action, resource, DATE_TRUNC('hour', window_start)
ORDER BY hour DESC;

-- ====================
-- 8. DADOS INICIAIS
-- ====================

-- Limpar dados antigos de rate limiting (manter apenas últimas 24 horas)
DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '24 hours';

-- Inserir configuração inicial se não existir
INSERT INTO roles (name, display_name, description, permissions, hierarchy_level, is_system_role)
VALUES 
  ('super_admin', 'Super Administrador', 'Acesso total ao sistema', '{"*": ["*"]}', 1, true),
  ('admin', 'Administrador', 'Acesso administrativo', '{"users": ["read", "update"], "system": ["logs", "maintain"], "analytics": ["read"], "agents": ["manage_all"], "documents": ["manage_all"], "chat": ["manage_all"], "whatsapp": ["manage_all"], "email_marketing": ["manage_all"], "integrations": ["manage_all"]}', 2, true),
  ('moderator', 'Moderador', 'Moderação de conteúdo', '{"agents": ["read", "update"], "documents": ["read", "update"], "chat": ["read", "moderate"], "whatsapp": ["read"], "email_marketing": ["read"]}', 3, true),
  ('user', 'Usuário', 'Usuário padrão', '{"agents": ["create", "read", "update", "delete"], "documents": ["create", "read", "update", "delete"], "chat": ["create", "read", "update"], "whatsapp": ["read"], "email_marketing": ["read"], "integrations": ["create", "read", "update"]}', 4, true)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE rate_limits IS 'Sistema de rate limiting por usuário e IP';
COMMENT ON TABLE access_denied_logs IS 'Logs de tentativas de acesso negado para auditoria';
COMMENT ON FUNCTION authorize_operation IS 'Middleware completo de autorização com RBAC e rate limiting';
COMMENT ON VIEW security_monitoring IS 'Monitoramento de segurança em tempo real'; 