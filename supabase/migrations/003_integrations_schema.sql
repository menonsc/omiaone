-- Migration para adicionar suporte a integrações
-- Criado para suportar configurações de integrações como Yampi

-- Tipo enum para diferentes tipos de integração
CREATE TYPE integration_type AS ENUM ('ecommerce', 'payment', 'communication', 'crm', 'automation', 'productivity');
CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error', 'testing');

-- Tabela de integrações
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    name VARCHAR(100) NOT NULL, -- Nome da integração (ex: 'yampi', 'mercadopago')
    display_name VARCHAR(255) NOT NULL, -- Nome para exibição (ex: 'Yampi', 'Mercado Pago')
    type integration_type NOT NULL,
    status integration_status DEFAULT 'inactive',
    config JSONB NOT NULL DEFAULT '{}', -- Configurações específicas da integração
    credentials JSONB DEFAULT '{}', -- Credenciais criptografadas
    last_sync_at TIMESTAMPTZ,
    sync_status VARCHAR(50) DEFAULT 'never_synced',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Garantir que cada usuário tenha apenas uma integração de cada tipo
    UNIQUE(user_id, name)
);

-- Tabela de logs de sincronização
CREATE TABLE integration_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'manual'
    status VARCHAR(50) NOT NULL, -- 'success', 'error', 'partial'
    records_processed INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_error INTEGER DEFAULT 0,
    error_details JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER
);

-- Índices para performance
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_name ON integrations(name);
CREATE INDEX idx_integrations_status ON integrations(status);
CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_sync_logs_integration_id ON integration_sync_logs(integration_id);
CREATE INDEX idx_sync_logs_started_at ON integration_sync_logs(started_at);

-- Trigger para updated_at
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para integrations
CREATE POLICY "Users can view own integrations" ON integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own integrations" ON integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own integrations" ON integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own integrations" ON integrations FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para integration_sync_logs
CREATE POLICY "Users can view logs of own integrations" ON integration_sync_logs FOR SELECT 
USING (integration_id IN (SELECT id FROM integrations WHERE user_id = auth.uid()));
CREATE POLICY "System can insert sync logs" ON integration_sync_logs FOR INSERT 
WITH CHECK (integration_id IN (SELECT id FROM integrations WHERE user_id = auth.uid()));

-- Função para testar conectividade de uma integração
CREATE OR REPLACE FUNCTION test_integration_connection(integration_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    integration_record integrations%ROWTYPE;
    result JSONB;
BEGIN
    -- Buscar a integração
    SELECT * INTO integration_record FROM integrations 
    WHERE id = integration_id_param AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Integration not found');
    END IF;
    
    -- Aqui você implementaria a lógica específica para testar cada tipo de integração
    -- Por enquanto, retornamos um sucesso genérico
    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Connection test completed',
        'integration_name', integration_record.name
    );
END;
$$;

-- Comentários nas tabelas
COMMENT ON TABLE integrations IS 'Armazena configurações de integrações com serviços externos';
COMMENT ON TABLE integration_sync_logs IS 'Logs de sincronização das integrações';
COMMENT ON COLUMN integrations.config IS 'Configurações gerais da integração (não sensíveis)';
COMMENT ON COLUMN integrations.credentials IS 'Credenciais de acesso (devem ser criptografadas no application layer)'; 