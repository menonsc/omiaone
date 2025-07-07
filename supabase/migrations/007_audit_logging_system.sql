-- Migration 007: Sistema de Auditoria e Logs
-- Data: 2024-12-19
-- Descrição: Implementa sistema completo de auditoria com logs automáticos

-- =====================================================
-- TABELA PRINCIPAL DE AUDITORIA
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    resource_type VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    severity severity_level DEFAULT 'low',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days')
);

-- =====================================================
-- TABELA DE CONFIGURAÇÃO DE AUDITORIA
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_name VARCHAR(100) UNIQUE NOT NULL,
    is_audited BOOLEAN DEFAULT true,
    retention_days INTEGER DEFAULT 90,
    log_level VARCHAR(20) DEFAULT 'info',
    track_changes BOOLEAN DEFAULT true,
    track_access BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA DE ALERTAS DE AUDITORIA
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity severity_level DEFAULT 'medium',
    trigger_conditions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA DE EXPORTAÇÕES DE AUDITORIA
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    export_type VARCHAR(20) DEFAULT 'csv' CHECK (export_type IN ('csv', 'pdf', 'json')),
    filters JSONB DEFAULT '{}',
    file_path VARCHAR(500),
    file_size BIGINT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_expires_at ON audit_logs(expires_at);

CREATE INDEX IF NOT EXISTS idx_audit_config_resource ON audit_config(resource_name);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_type ON audit_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_active ON audit_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audit_exports_user_id ON audit_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_exports_status ON audit_exports(status);
CREATE INDEX IF NOT EXISTS idx_audit_exports_created_at ON audit_exports(created_at);

-- =====================================================
-- FUNÇÕES DE AUDITORIA
-- =====================================================

-- Função para criar log de auditoria
CREATE OR REPLACE FUNCTION create_audit_log(
    p_action VARCHAR(100),
    p_resource VARCHAR(100),
    p_user_id UUID DEFAULT auth.uid(),
    p_resource_id VARCHAR(255) DEFAULT NULL,
    p_resource_type VARCHAR(100) DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_severity severity_level DEFAULT 'low',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_ip_address INET;
    v_user_agent TEXT;
    v_session_id TEXT;
BEGIN
    -- Obter informações do cliente (simplificado para Supabase)
    v_ip_address := '0.0.0.0'::inet;
    v_user_agent := 'supabase';
    v_session_id := NULL;
    
    -- Verificar se o recurso deve ser auditado
    IF NOT EXISTS (
        SELECT 1 FROM audit_config 
        WHERE resource_name = p_resource 
        AND is_audited = true
    ) THEN
        RETURN NULL;
    END IF;
    
    -- Inserir log
    INSERT INTO audit_logs (
        user_id, action, resource, resource_id, resource_type,
        old_values, new_values, ip_address, user_agent, session_id,
        severity, metadata
    ) VALUES (
        p_user_id, p_action, p_resource, p_resource_id, p_resource_type,
        p_old_values, p_new_values, v_ip_address, v_user_agent, v_session_id,
        p_severity, p_metadata
    ) RETURNING id INTO v_log_id;
    
    -- Verificar alertas
    PERFORM check_audit_alerts(v_log_id);
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar alertas de auditoria
CREATE OR REPLACE FUNCTION check_audit_alerts(p_log_id UUID)
RETURNS void AS $$
DECLARE
    v_log_record RECORD;
    v_alert_record RECORD;
    v_condition_met BOOLEAN;
BEGIN
    -- Obter dados do log
    SELECT * INTO v_log_record FROM audit_logs WHERE id = p_log_id;
    
    -- Verificar alertas ativos
    FOR v_alert_record IN 
        SELECT * FROM audit_alerts WHERE is_active = true
    LOOP
        -- Verificar condições do alerta
        v_condition_met := false;
        
        -- Exemplo: Alerta para múltiplas tentativas de login
        IF v_alert_record.alert_type = 'multiple_login_attempts' THEN
            SELECT COUNT(*) > 5 INTO v_condition_met
            FROM audit_logs 
            WHERE user_id = v_log_record.user_id 
            AND action = 'login_failed'
            AND created_at > NOW() - INTERVAL '1 hour';
        END IF;
        
        -- Exemplo: Alerta para ações críticas
        IF v_alert_record.alert_type = 'critical_action' THEN
            v_condition_met := v_log_record.severity = 'critical';
        END IF;
        
        -- Exemplo: Alerta para acesso de IP suspeito
        IF v_alert_record.alert_type = 'suspicious_ip' THEN
            SELECT COUNT(*) > 10 INTO v_condition_met
            FROM audit_logs 
            WHERE ip_address = v_log_record.ip_address
            AND created_at > NOW() - INTERVAL '1 hour';
        END IF;
        
        -- Se condição foi atendida, criar alerta
        IF v_condition_met THEN
            INSERT INTO system_alerts (
                alert_type, severity, title, description, component,
                alert_data
            ) VALUES (
                v_alert_record.alert_type,
                v_alert_record.severity,
                v_alert_record.title,
                v_alert_record.description,
                'audit_system',
                jsonb_build_object(
                    'log_id', p_log_id,
                    'user_id', v_log_record.user_id,
                    'action', v_log_record.action,
                    'resource', v_log_record.resource,
                    'ip_address', v_log_record.ip_address
                )
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para limpeza automática de logs expirados
CREATE OR REPLACE FUNCTION cleanup_expired_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para exportar logs de auditoria
CREATE OR REPLACE FUNCTION export_audit_logs(
    p_user_id UUID,
    p_filters JSONB DEFAULT '{}',
    p_format VARCHAR(20) DEFAULT 'csv'
)
RETURNS UUID AS $$
DECLARE
    v_export_id UUID;
BEGIN
    INSERT INTO audit_exports (
        user_id, export_type, filters, status
    ) VALUES (
        p_user_id, p_format, p_filters, 'pending'
    ) RETURNING id INTO v_export_id;
    
    RETURN v_export_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- =====================================================

-- Trigger para auditoria de perfis
CREATE OR REPLACE FUNCTION audit_profiles_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM create_audit_log(
            'profile_created',
            'profiles',
            NEW.id,
            NEW.id::text,
            'profile',
            NULL,
            to_jsonb(NEW),
            'low'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM create_audit_log(
            'profile_updated',
            'profiles',
            NEW.id,
            NEW.id::text,
            'profile',
            to_jsonb(OLD),
            to_jsonb(NEW),
            'low'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM create_audit_log(
            'profile_deleted',
            'profiles',
            OLD.id,
            OLD.id::text,
            'profile',
            to_jsonb(OLD),
            NULL,
            'medium'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_profiles
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_profiles_trigger();

-- Trigger para auditoria de agentes
CREATE OR REPLACE FUNCTION audit_agents_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM create_audit_log(
            'agent_created',
            'agents',
            NEW.created_by,
            NEW.id::text,
            'agent',
            NULL,
            to_jsonb(NEW),
            'low'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM create_audit_log(
            'agent_updated',
            'agents',
            NEW.created_by,
            NEW.id::text,
            'agent',
            to_jsonb(OLD),
            to_jsonb(NEW),
            'low'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM create_audit_log(
            'agent_deleted',
            'agents',
            OLD.created_by,
            OLD.id::text,
            'agent',
            to_jsonb(OLD),
            NULL,
            'medium'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_agents
    AFTER INSERT OR UPDATE OR DELETE ON agents
    FOR EACH ROW EXECUTE FUNCTION audit_agents_trigger();

-- Trigger para auditoria de documentos
CREATE OR REPLACE FUNCTION audit_documents_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM create_audit_log(
            'document_uploaded',
            'documents',
            NEW.uploaded_by,
            NEW.id::text,
            'document',
            NULL,
            to_jsonb(NEW),
            'low'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM create_audit_log(
            'document_updated',
            'documents',
            NEW.uploaded_by,
            NEW.id::text,
            'document',
            to_jsonb(OLD),
            to_jsonb(NEW),
            'low'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM create_audit_log(
            'document_deleted',
            'documents',
            OLD.uploaded_by,
            OLD.id::text,
            'document',
            to_jsonb(OLD),
            NULL,
            'medium'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_documents
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION audit_documents_trigger();

-- Trigger para auditoria de roles
CREATE OR REPLACE FUNCTION audit_roles_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM create_audit_log(
            'role_created',
            'roles',
            auth.uid(),
            NEW.id::text,
            'role',
            NULL,
            to_jsonb(NEW),
            'low'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM create_audit_log(
            'role_updated',
            'roles',
            auth.uid(),
            NEW.id::text,
            'role',
            to_jsonb(OLD),
            to_jsonb(NEW),
            'low'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM create_audit_log(
            'role_deleted',
            'roles',
            auth.uid(),
            OLD.id::text,
            'role',
            to_jsonb(OLD),
            NULL,
            'medium'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_roles
    AFTER INSERT OR UPDATE OR DELETE ON roles
    FOR EACH ROW EXECUTE FUNCTION audit_roles_trigger();

-- =====================================================
-- VIEWS PARA CONSULTA
-- =====================================================

-- View para logs de auditoria com informações do usuário
CREATE OR REPLACE VIEW audit_logs_view AS
SELECT 
    al.id,
    al.user_id,
    p.full_name as user_name,
    u.email as user_email,
    al.action,
    al.resource,
    al.resource_id,
    al.resource_type,
    al.old_values,
    al.new_values,
    al.ip_address,
    al.user_agent,
    al.session_id,
    al.severity,
    al.metadata,
    al.created_at,
    al.expires_at
FROM audit_logs al
LEFT JOIN profiles p ON al.user_id = p.id
JOIN auth.users u ON al.user_id = u.id;

-- View para estatísticas de auditoria
CREATE OR REPLACE VIEW audit_stats_view AS
SELECT 
    DATE(created_at) as date,
    action,
    resource,
    severity,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT ip_address) as unique_ips
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), action, resource, severity;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Configurações padrão de auditoria
INSERT INTO audit_config (resource_name, is_audited, retention_days, log_level, track_changes, track_access) VALUES
('profiles', true, 90, 'info', true, true),
('agents', true, 90, 'info', true, true),
('documents', true, 90, 'info', true, true),
('roles', true, 90, 'info', true, true),
('user_roles', true, 90, 'info', true, true),
('email_campaigns', true, 90, 'info', true, true),
('integrations', true, 90, 'info', true, true),
('system_alerts', true, 90, 'info', true, true)
ON CONFLICT (resource_name) DO NOTHING;

-- Alertas padrão de auditoria
INSERT INTO audit_alerts (alert_type, title, description, severity, trigger_conditions, is_active) VALUES
('multiple_login_attempts', 'Múltiplas Tentativas de Login', 'Detectadas múltiplas tentativas de login falhadas', 'high', '{"max_attempts": 5, "time_window": "1 hour"}', true),
('critical_action', 'Ação Crítica Detectada', 'Uma ação crítica foi executada no sistema', 'critical', '{"severity": "critical"}', true),
('suspicious_ip', 'IP Suspeito Detectado', 'Muitas ações de um mesmo IP em curto período', 'medium', '{"max_actions": 10, "time_window": "1 hour"}', true),
('role_assignment', 'Atribuição de Role', 'Um usuário recebeu uma nova role', 'low', '{"action": "role_assigned"}', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Políticas para audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para audit_config
ALTER TABLE audit_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audit config" ON audit_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para audit_alerts
ALTER TABLE audit_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audit alerts" ON audit_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para audit_exports
ALTER TABLE audit_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exports" ON audit_exports
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own exports" ON audit_exports
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- JOB PARA LIMPEZA AUTOMÁTICA
-- =====================================================

-- Função para agendar limpeza automática (executar diariamente)
CREATE OR REPLACE FUNCTION schedule_audit_cleanup()
RETURNS void AS $$
BEGIN
    -- Limpar logs expirados
    PERFORM cleanup_expired_audit_logs();
    
    -- Limpar exportações expiradas
    DELETE FROM audit_exports 
    WHERE expires_at < NOW();
    
    -- Log da limpeza
    PERFORM create_audit_log(
        'audit_cleanup_completed',
        'audit_system',
        NULL,
        NULL,
        'system',
        NULL,
        jsonb_build_object('timestamp', NOW()),
        'low'
    );
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE audit_logs IS 'Logs de auditoria do sistema';
COMMENT ON TABLE audit_config IS 'Configurações de auditoria por recurso';
COMMENT ON TABLE audit_alerts IS 'Alertas de auditoria configuráveis';
COMMENT ON TABLE audit_exports IS 'Exportações de logs de auditoria';

COMMENT ON FUNCTION create_audit_log IS 'Cria um novo log de auditoria';
COMMENT ON FUNCTION check_audit_alerts IS 'Verifica e dispara alertas baseados em logs';
COMMENT ON FUNCTION cleanup_expired_audit_logs IS 'Remove logs expirados';
COMMENT ON FUNCTION export_audit_logs IS 'Inicia exportação de logs'; 