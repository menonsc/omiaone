-- Migration 010: Sistema de Webhooks
-- Data: 2024-12-19
-- Descrição: Implementa sistema completo de webhooks para integrações externas

-- =====================================================
-- TIPOS ENUM
-- =====================================================

CREATE TYPE webhook_status AS ENUM ('active', 'inactive', 'error', 'testing');
CREATE TYPE webhook_event_type AS ENUM (
  'whatsapp_message',
  'whatsapp_connection',
  'user_login',
  'user_logout',
  'document_upload',
  'email_sent',
  'campaign_sent',
  'integration_sync',
  'system_alert',
  'audit_log',
  'custom'
);

-- =====================================================
-- TABELA PRINCIPAL DE WEBHOOKS
-- =====================================================

CREATE TABLE webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(500) NOT NULL,
    events webhook_event_type[] NOT NULL DEFAULT '{}',
    status webhook_status DEFAULT 'inactive',
    
    -- Configurações de segurança
    secret_key VARCHAR(255), -- Para assinatura HMAC
    headers JSONB DEFAULT '{}', -- Headers customizados
    
    -- Configurações de retry
    retry_enabled BOOLEAN DEFAULT true,
    max_retries INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 60,
    
    -- Configurações de filtros
    filters JSONB DEFAULT '{}', -- Filtros para eventos específicos
    
    -- Métricas
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    failed_deliveries INTEGER DEFAULT 0,
    last_delivery_at TIMESTAMPTZ,
    last_error_at TIMESTAMPTZ,
    last_error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_webhook_url CHECK (url ~* '^https?://'),
    CONSTRAINT valid_retry_delay CHECK (retry_delay_seconds >= 10)
);

-- =====================================================
-- TABELA DE LOGS DE ENTREGA
-- =====================================================

CREATE TABLE webhook_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE NOT NULL,
    event_type webhook_event_type NOT NULL,
    event_data JSONB NOT NULL,
    
    -- Status da entrega
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
    http_status_code INTEGER,
    response_body TEXT,
    response_headers JSONB DEFAULT '{}',
    
    -- Tentativas
    attempt_number INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 3,
    
    -- Timing
    queued_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    
    -- Erro
    error_message TEXT,
    error_details JSONB DEFAULT '{}'
);

-- =====================================================
-- TABELA DE CONFIGURAÇÕES GLOBAIS
-- =====================================================

CREATE TABLE webhook_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_status ON webhooks(status);
CREATE INDEX idx_webhooks_events ON webhooks USING GIN(events);
CREATE INDEX idx_webhooks_created_at ON webhooks(created_at);

CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_event_type ON webhook_deliveries(event_type);
CREATE INDEX idx_webhook_deliveries_queued_at ON webhook_deliveries(queued_at);
CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at) WHERE status = 'retrying';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para updated_at
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_settings_updated_at BEFORE UPDATE ON webhook_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para webhooks
CREATE POLICY "Users can view own webhooks" ON webhooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own webhooks" ON webhooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own webhooks" ON webhooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own webhooks" ON webhooks FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para webhook_deliveries
CREATE POLICY "Users can view deliveries of own webhooks" ON webhook_deliveries FOR SELECT 
USING (webhook_id IN (SELECT id FROM webhooks WHERE user_id = auth.uid()));
CREATE POLICY "System can insert deliveries" ON webhook_deliveries FOR INSERT 
WITH CHECK (webhook_id IN (SELECT id FROM webhooks WHERE user_id = auth.uid()));
CREATE POLICY "System can update deliveries" ON webhook_deliveries FOR UPDATE 
USING (webhook_id IN (SELECT id FROM webhooks WHERE user_id = auth.uid()));

-- Políticas RLS para webhook_settings (apenas admins)
CREATE POLICY "Admins can manage webhook settings" ON webhook_settings FOR ALL 
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
));

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para criar webhook
CREATE OR REPLACE FUNCTION create_webhook(
    p_user_id UUID,
    p_name VARCHAR(255),
    p_description TEXT,
    p_url VARCHAR(500),
    p_events webhook_event_type[],
    p_secret_key VARCHAR(255) DEFAULT NULL,
    p_headers JSONB DEFAULT '{}',
    p_filters JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    webhook_id UUID;
BEGIN
    INSERT INTO webhooks (
        user_id, name, description, url, events, 
        secret_key, headers, filters
    ) VALUES (
        p_user_id, p_name, p_description, p_url, p_events,
        p_secret_key, p_headers, p_filters
    ) RETURNING id INTO webhook_id;
    
    RETURN webhook_id;
END;
$$;

-- Função para testar webhook
CREATE OR REPLACE FUNCTION test_webhook(webhook_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    webhook_record webhooks%ROWTYPE;
    result JSONB;
BEGIN
    -- Buscar webhook
    SELECT * INTO webhook_record FROM webhooks WHERE id = webhook_id_param;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Webhook não encontrado'
        );
    END IF;
    
    -- Verificar se usuário tem permissão
    IF webhook_record.user_id != auth.uid() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Acesso negado'
        );
    END IF;
    
    -- Retornar dados do webhook para teste
    RETURN jsonb_build_object(
        'success', true,
        'webhook', jsonb_build_object(
            'id', webhook_record.id,
            'name', webhook_record.name,
            'url', webhook_record.url,
            'events', webhook_record.events,
            'status', webhook_record.status
        )
    );
END;
$$;

-- Função para buscar webhooks por evento
CREATE OR REPLACE FUNCTION get_webhooks_for_event(event_type_param webhook_event_type)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name VARCHAR(255),
    url VARCHAR(500),
    secret_key VARCHAR(255),
    headers JSONB,
    filters JSONB,
    retry_enabled BOOLEAN,
    max_retries INTEGER,
    retry_delay_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.user_id,
        w.name,
        w.url,
        w.secret_key,
        w.headers,
        w.filters,
        w.retry_enabled,
        w.max_retries,
        w.retry_delay_seconds
    FROM webhooks w
    WHERE w.status = 'active'
    AND event_type_param = ANY(w.events);
END;
$$;

-- Função para registrar entrega de webhook
CREATE OR REPLACE FUNCTION register_webhook_delivery(
    p_webhook_id UUID,
    p_event_type webhook_event_type,
    p_event_data JSONB,
    p_status VARCHAR(20),
    p_http_status_code INTEGER DEFAULT NULL,
    p_response_body TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    delivery_id UUID;
BEGIN
    INSERT INTO webhook_deliveries (
        webhook_id, event_type, event_data, status,
        http_status_code, response_body, error_message
    ) VALUES (
        p_webhook_id, p_event_type, p_event_data, p_status,
        p_http_status_code, p_response_body, p_error_message
    ) RETURNING id INTO delivery_id;
    
    -- Atualizar métricas do webhook
    UPDATE webhooks 
    SET 
        total_deliveries = total_deliveries + 1,
        successful_deliveries = CASE WHEN p_status = 'delivered' THEN successful_deliveries + 1 ELSE successful_deliveries END,
        failed_deliveries = CASE WHEN p_status = 'failed' THEN failed_deliveries + 1 ELSE failed_deliveries END,
        last_delivery_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE last_delivery_at END,
        last_error_at = CASE WHEN p_status = 'failed' THEN NOW() ELSE last_error_at END,
        last_error_message = CASE WHEN p_status = 'failed' THEN p_error_message ELSE last_error_message END
    WHERE id = p_webhook_id;
    
    RETURN delivery_id;
END;
$$;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Configurações padrão
INSERT INTO webhook_settings (setting_key, setting_value, description) VALUES
('default_retry_config', '{"enabled": true, "max_retries": 3, "delay_seconds": 60}', 'Configuração padrão de retry para webhooks'),
('rate_limiting', '{"enabled": true, "max_requests_per_minute": 60}', 'Configuração de rate limiting'),
('security', '{"require_https": true, "validate_url": true}', 'Configurações de segurança');

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE webhooks IS 'Tabela principal de webhooks configurados pelos usuários';
COMMENT ON TABLE webhook_deliveries IS 'Log de todas as tentativas de entrega de webhooks';
COMMENT ON TABLE webhook_settings IS 'Configurações globais do sistema de webhooks';

COMMENT ON COLUMN webhooks.secret_key IS 'Chave secreta para assinatura HMAC dos payloads';
COMMENT ON COLUMN webhooks.headers IS 'Headers customizados para enviar com cada requisição';
COMMENT ON COLUMN webhooks.filters IS 'Filtros para determinar quando enviar o webhook';
COMMENT ON COLUMN webhook_deliveries.event_data IS 'Dados do evento que disparou o webhook';
COMMENT ON COLUMN webhook_deliveries.response_headers IS 'Headers da resposta do webhook'; 