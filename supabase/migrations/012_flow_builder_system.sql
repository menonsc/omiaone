-- Migration: Flow Builder System
-- Criação das tabelas para sistema de automação com flow builder

-- ========================================
-- FLOWS - Fluxos de automação
-- ========================================
CREATE TABLE IF NOT EXISTS flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID, -- Para multi-tenancy futuro
    
    -- Configurações do fluxo
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    category VARCHAR(100), -- 'customer_service', 'marketing', 'sales', etc
    
    -- Dados do fluxo
    flow_data JSONB NOT NULL DEFAULT '{}', -- Estrutura completa do fluxo
    variables JSONB DEFAULT '{}', -- Variáveis globais do fluxo
    settings JSONB DEFAULT '{}', -- Configurações gerais
    
    -- Estatísticas
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- ========================================
-- FLOW_NODES - Nós individuais do fluxo
-- ========================================
CREATE TABLE IF NOT EXISTS flow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    
    -- Identificação do nó
    node_id VARCHAR(100) NOT NULL, -- ID único dentro do fluxo
    node_type VARCHAR(50) NOT NULL, -- 'trigger', 'action', 'condition', 'ai', etc
    node_subtype VARCHAR(50), -- 'webhook', 'schedule', 'whatsapp_send', etc
    
    -- Configuração do nó
    config JSONB NOT NULL DEFAULT '{}',
    position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(flow_id, node_id)
);

-- ========================================
-- FLOW_CONNECTIONS - Conexões entre nós
-- ========================================
CREATE TABLE IF NOT EXISTS flow_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    
    -- Conexão
    source_node_id VARCHAR(100) NOT NULL,
    source_handle VARCHAR(100) DEFAULT 'output',
    target_node_id VARCHAR(100) NOT NULL,
    target_handle VARCHAR(100) DEFAULT 'input',
    
    -- Condições para a conexão
    condition JSONB DEFAULT '{}',
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (flow_id, source_node_id) REFERENCES flow_nodes(flow_id, node_id),
    FOREIGN KEY (flow_id, target_node_id) REFERENCES flow_nodes(flow_id, node_id)
);

-- ========================================
-- FLOW_EXECUTIONS - Execuções dos fluxos
-- ========================================
CREATE TABLE IF NOT EXISTS flow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    
    -- Trigger da execução
    trigger_type VARCHAR(50) NOT NULL, -- 'webhook', 'schedule', 'manual', 'message'
    trigger_data JSONB DEFAULT '{}',
    
    -- Status da execução
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
    
    -- Dados da execução
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    context_variables JSONB DEFAULT '{}',
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Error handling
    error_message TEXT,
    error_details JSONB,
    
    -- Metadados
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(100),
    ip_address INET
);

-- ========================================
-- FLOW_EXECUTION_STEPS - Steps de cada execução
-- ========================================
CREATE TABLE IF NOT EXISTS flow_execution_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES flow_executions(id) ON DELETE CASCADE,
    flow_id UUID NOT NULL REFERENCES flows(id),
    
    -- Identificação do step
    node_id VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    
    -- Dados do step
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'skipped'
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Error handling
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    
    -- Logs
    logs JSONB DEFAULT '[]'
);

-- ========================================
-- FLOW_TRIGGERS - Configuração de triggers
-- ========================================
CREATE TABLE IF NOT EXISTS flow_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    
    -- Tipo de trigger
    trigger_type VARCHAR(50) NOT NULL, -- 'webhook', 'schedule', 'message_received', etc
    
    -- Configuração específica
    config JSONB NOT NULL DEFAULT '{}',
    
    -- Webhook específico
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(255),
    
    -- Schedule específico
    cron_expression VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    next_run_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Estatísticas
    trigger_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- FLOW_TEMPLATES - Templates pré-construídos
-- ========================================
CREATE TABLE IF NOT EXISTS flow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informações do template
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    
    -- Dados do template
    template_data JSONB NOT NULL,
    
    -- Configurações
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    difficulty_level VARCHAR(20) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
    
    -- Estatísticas
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2),
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- FLOW_VARIABLES - Variáveis globais
-- ========================================
CREATE TABLE IF NOT EXISTS flow_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Escopo da variável
    scope VARCHAR(20) NOT NULL, -- 'global', 'user', 'flow'
    scope_id UUID, -- user_id ou flow_id
    
    -- Dados da variável
    variable_name VARCHAR(100) NOT NULL,
    variable_value JSONB,
    variable_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'object', 'array'
    
    -- Configurações
    is_secret BOOLEAN DEFAULT false,
    is_readonly BOOLEAN DEFAULT false,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(scope, scope_id, variable_name)
);

-- ========================================
-- ÍNDICES
-- ========================================
CREATE INDEX idx_flows_user_id ON flows(user_id);
CREATE INDEX idx_flows_active ON flows(is_active);
CREATE INDEX idx_flows_category ON flows(category);
CREATE INDEX idx_flows_updated_at ON flows(updated_at);

CREATE INDEX idx_flow_nodes_flow_id ON flow_nodes(flow_id);
CREATE INDEX idx_flow_nodes_type ON flow_nodes(node_type);

CREATE INDEX idx_flow_connections_flow_id ON flow_connections(flow_id);
CREATE INDEX idx_flow_connections_source ON flow_connections(source_node_id);
CREATE INDEX idx_flow_connections_target ON flow_connections(target_node_id);

CREATE INDEX idx_flow_executions_flow_id ON flow_executions(flow_id);
CREATE INDEX idx_flow_executions_status ON flow_executions(status);
CREATE INDEX idx_flow_executions_started_at ON flow_executions(started_at);
CREATE INDEX idx_flow_executions_user_id ON flow_executions(user_id);

CREATE INDEX idx_flow_execution_steps_execution_id ON flow_execution_steps(execution_id);
CREATE INDEX idx_flow_execution_steps_order ON flow_execution_steps(step_order);
CREATE INDEX idx_flow_execution_steps_status ON flow_execution_steps(status);

CREATE INDEX idx_flow_triggers_flow_id ON flow_triggers(flow_id);
CREATE INDEX idx_flow_triggers_type ON flow_triggers(trigger_type);
CREATE INDEX idx_flow_triggers_active ON flow_triggers(is_active);
CREATE INDEX idx_flow_triggers_next_run ON flow_triggers(next_run_at) WHERE next_run_at IS NOT NULL;

CREATE INDEX idx_flow_templates_category ON flow_templates(category);
CREATE INDEX idx_flow_templates_public ON flow_templates(is_public);
CREATE INDEX idx_flow_templates_featured ON flow_templates(is_featured);

CREATE INDEX idx_flow_variables_scope ON flow_variables(scope, scope_id);
CREATE INDEX idx_flow_variables_name ON flow_variables(variable_name);

-- ========================================
-- RLS (Row Level Security)
-- ========================================

-- Flows
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY flows_user_policy ON flows FOR ALL USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND r.name IN ('admin', 'super_admin')
    )
);

-- Flow Nodes
ALTER TABLE flow_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY flow_nodes_policy ON flow_nodes FOR ALL USING (
    EXISTS (
        SELECT 1 FROM flows f
        WHERE f.id = flow_nodes.flow_id
        AND (f.user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() 
            AND r.name IN ('admin', 'super_admin')
        ))
    )
);

-- Flow Connections
ALTER TABLE flow_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY flow_connections_policy ON flow_connections FOR ALL USING (
    EXISTS (
        SELECT 1 FROM flows f
        WHERE f.id = flow_connections.flow_id
        AND (f.user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() 
            AND r.name IN ('admin', 'super_admin')
        ))
    )
);

-- Flow Executions
ALTER TABLE flow_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY flow_executions_policy ON flow_executions FOR ALL USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM flows f
        WHERE f.id = flow_executions.flow_id
        AND (f.user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() 
            AND r.name IN ('admin', 'super_admin')
        ))
    )
);

-- Flow Execution Steps
ALTER TABLE flow_execution_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY flow_execution_steps_policy ON flow_execution_steps FOR ALL USING (
    EXISTS (
        SELECT 1 FROM flow_executions fe
        JOIN flows f ON f.id = fe.flow_id
        WHERE fe.id = flow_execution_steps.execution_id
        AND (f.user_id = auth.uid() OR fe.user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() 
            AND r.name IN ('admin', 'super_admin')
        ))
    )
);

-- Flow Triggers
ALTER TABLE flow_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY flow_triggers_policy ON flow_triggers FOR ALL USING (
    EXISTS (
        SELECT 1 FROM flows f
        WHERE f.id = flow_triggers.flow_id
        AND (f.user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() 
            AND r.name IN ('admin', 'super_admin')
        ))
    )
);

-- Flow Templates - públicos podem ser lidos por todos
ALTER TABLE flow_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY flow_templates_read_policy ON flow_templates FOR SELECT USING (
    is_public = true OR 
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND r.name IN ('admin', 'super_admin')
    )
);
CREATE POLICY flow_templates_insert_policy ON flow_templates FOR INSERT WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND r.name IN ('admin', 'super_admin')
    )
);
CREATE POLICY flow_templates_update_policy ON flow_templates FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND r.name IN ('admin', 'super_admin')
    )
);
CREATE POLICY flow_templates_delete_policy ON flow_templates FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND r.name IN ('admin', 'super_admin')
    )
);

-- Flow Variables
ALTER TABLE flow_variables ENABLE ROW LEVEL SECURITY;
CREATE POLICY flow_variables_policy ON flow_variables FOR ALL USING (
    (scope = 'user' AND scope_id = auth.uid()) OR
    (scope = 'flow' AND EXISTS (
        SELECT 1 FROM flows f
        WHERE f.id = scope_id
        AND f.user_id = auth.uid()
    )) OR
    (scope = 'global' AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND r.name IN ('admin', 'super_admin')
    ))
);

-- ========================================
-- FUNÇÕES ÚTEIS
-- ========================================

-- Função para executar um fluxo
CREATE OR REPLACE FUNCTION execute_flow(
    flow_id_param UUID,
    trigger_type_param VARCHAR DEFAULT 'manual',
    input_data_param JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    execution_id UUID;
    flow_record flows%ROWTYPE;
BEGIN
    -- Verificar se o fluxo existe e está ativo
    SELECT * INTO flow_record
    FROM flows
    WHERE id = flow_id_param AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Flow not found or inactive';
    END IF;
    
    -- Criar execução
    INSERT INTO flow_executions (
        flow_id,
        trigger_type,
        trigger_data,
        input_data,
        user_id,
        status
    ) VALUES (
        flow_id_param,
        trigger_type_param,
        input_data_param,
        input_data_param,
        auth.uid(),
        'running'
    ) RETURNING id INTO execution_id;
    
    -- Incrementar contador de execuções
    UPDATE flows
    SET 
        execution_count = execution_count + 1,
        last_executed_at = NOW()
    WHERE id = flow_id_param;
    
    RETURN execution_id;
END;
$$;

-- Função para obter estatísticas de um fluxo
CREATE OR REPLACE FUNCTION get_flow_stats(flow_id_param UUID)
RETURNS TABLE (
    total_executions BIGINT,
    successful_executions BIGINT,
    failed_executions BIGINT,
    avg_duration_ms NUMERIC,
    last_execution TIMESTAMPTZ,
    success_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_executions,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as successful_executions,
        COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_executions,
        AVG(duration_ms) as avg_duration_ms,
        MAX(started_at) as last_execution,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as success_rate
    FROM flow_executions
    WHERE flow_id = flow_id_param;
END;
$$;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flows_updated_at_trigger
    BEFORE UPDATE ON flows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER flow_variables_updated_at_trigger
    BEFORE UPDATE ON flow_variables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger para calcular duração das execuções
CREATE OR REPLACE FUNCTION calculate_execution_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.duration_ms = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
    END IF;
    
    -- Atualizar estatísticas do fluxo
    IF NEW.status = 'completed' THEN
        UPDATE flows 
        SET success_count = success_count + 1
        WHERE id = NEW.flow_id;
    ELSIF NEW.status = 'failed' THEN
        UPDATE flows 
        SET error_count = error_count + 1
        WHERE id = NEW.flow_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flow_executions_duration_trigger
    BEFORE UPDATE ON flow_executions
    FOR EACH ROW
    WHEN (NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL)
    EXECUTE FUNCTION calculate_execution_duration();

-- Trigger para calcular duração dos steps
CREATE OR REPLACE FUNCTION calculate_step_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.duration_ms = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flow_execution_steps_duration_trigger
    BEFORE UPDATE ON flow_execution_steps
    FOR EACH ROW
    WHEN (NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL)
    EXECUTE FUNCTION calculate_step_duration();

-- ========================================
-- DADOS INICIAIS
-- ========================================

-- Templates básicos
INSERT INTO flow_templates (name, description, category, template_data, is_public, is_featured, difficulty_level) VALUES
(
    'Resposta Automática WhatsApp',
    'Template básico para resposta automática no WhatsApp',
    'customer_service',
    '{
        "nodes": [
            {
                "id": "trigger-1",
                "type": "trigger",
                "subtype": "message_received",
                "position": {"x": 100, "y": 100},
                "config": {
                    "channel": "whatsapp",
                    "conditions": {"message_type": "text"}
                }
            },
            {
                "id": "ai-1",
                "type": "ai",
                "subtype": "generate_response",
                "position": {"x": 300, "y": 100},
                "config": {
                    "prompt": "Responda de forma amigável e profissional",
                    "max_tokens": 150
                }
            },
            {
                "id": "action-1",
                "type": "action",
                "subtype": "send_message",
                "position": {"x": 500, "y": 100},
                "config": {
                    "channel": "whatsapp",
                    "message_type": "text"
                }
            }
        ],
        "connections": [
            {
                "source": "trigger-1",
                "target": "ai-1"
            },
            {
                "source": "ai-1",
                "target": "action-1"
            }
        ]
    }',
    true,
    true,
    'beginner'
),
(
    'Workflow de Vendas',
    'Fluxo completo para qualificação e nutrição de leads',
    'sales',
    '{
        "nodes": [
            {
                "id": "trigger-1",
                "type": "trigger",
                "subtype": "webhook",
                "position": {"x": 100, "y": 100},
                "config": {
                    "webhook_event": "lead_created"
                }
            },
            {
                "id": "condition-1",
                "type": "condition",
                "subtype": "field_check",
                "position": {"x": 300, "y": 100},
                "config": {
                    "field": "budget",
                    "operator": "gte",
                    "value": 1000
                }
            },
            {
                "id": "action-1",
                "type": "action",
                "subtype": "send_email",
                "position": {"x": 500, "y": 50},
                "config": {
                    "template": "high_value_lead",
                    "delay": 0
                }
            },
            {
                "id": "action-2",
                "type": "action",
                "subtype": "send_email",
                "position": {"x": 500, "y": 150},
                "config": {
                    "template": "nurture_sequence",
                    "delay": 3600
                }
            }
        ],
        "connections": [
            {
                "source": "trigger-1",
                "target": "condition-1"
            },
            {
                "source": "condition-1",
                "target": "action-1",
                "condition": {"result": true}
            },
            {
                "source": "condition-1",
                "target": "action-2",
                "condition": {"result": false}
            }
        ]
    }',
    true,
    true,
    'intermediate'
);

-- Variáveis globais padrão
INSERT INTO flow_variables (scope, variable_name, variable_value, variable_type, is_readonly) VALUES
('global', 'system_timezone', '"UTC"', 'string', true),
('global', 'default_language', '"pt-BR"', 'string', true),
('global', 'max_retry_attempts', '3', 'number', true),
('global', 'default_timeout_ms', '30000', 'number', true);

COMMENT ON TABLE flows IS 'Tabela principal dos fluxos de automação';
COMMENT ON TABLE flow_nodes IS 'Nós individuais que compõem um fluxo';
COMMENT ON TABLE flow_connections IS 'Conexões entre os nós de um fluxo';
COMMENT ON TABLE flow_executions IS 'Histórico de execuções dos fluxos';
COMMENT ON TABLE flow_execution_steps IS 'Steps individuais de cada execução';
COMMENT ON TABLE flow_triggers IS 'Configuração de triggers que iniciam fluxos';
COMMENT ON TABLE flow_templates IS 'Templates pré-construídos de fluxos';
COMMENT ON TABLE flow_variables IS 'Variáveis compartilhadas entre fluxos'; 