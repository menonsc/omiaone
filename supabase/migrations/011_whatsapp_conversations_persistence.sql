-- Migration 011: Persistência de Conversas WhatsApp
-- Data: 2024-12-19
-- Descrição: Adiciona tabela para persistir conversas dinâmicas do WhatsApp entre sessões/navegadores

-- =====================================================
-- TABELA DE CONVERSAS WHATSAPP
-- =====================================================

CREATE TABLE whatsapp_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Informações da conversa
    chat_id VARCHAR(255) NOT NULL, -- ID original do chat (ex: 5511999999999@s.whatsapp.net)
    instance_id VARCHAR(255) NOT NULL, -- ID da instância do Evolution API
    
    -- Dados do contato/conversa
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    profile_picture TEXT,
    is_group BOOLEAN DEFAULT false,
    
    -- Última mensagem
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    
    -- Status da conversa
    unread_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    
    -- Flags de origem
    is_websocket_created BOOLEAN DEFAULT false, -- Se foi criada dinamicamente pelo WebSocket
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_chat_instance UNIQUE(user_id, chat_id, instance_id),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR length(phone) >= 10),
    CONSTRAINT valid_unread_count CHECK (unread_count >= 0)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_whatsapp_conversations_user_id ON whatsapp_conversations(user_id);
CREATE INDEX idx_whatsapp_conversations_chat_id ON whatsapp_conversations(chat_id);
CREATE INDEX idx_whatsapp_conversations_instance_id ON whatsapp_conversations(instance_id);
CREATE INDEX idx_whatsapp_conversations_last_message_time ON whatsapp_conversations(last_message_time DESC);
CREATE INDEX idx_whatsapp_conversations_websocket_created ON whatsapp_conversations(is_websocket_created) WHERE is_websocket_created = true;
CREATE INDEX idx_whatsapp_conversations_user_instance ON whatsapp_conversations(user_id, instance_id);

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE TRIGGER update_whatsapp_conversations_updated_at 
    BEFORE UPDATE ON whatsapp_conversations
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Usuários podem apenas ver suas próprias conversas
CREATE POLICY "Users can view own conversations" ON whatsapp_conversations 
    FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias conversas
CREATE POLICY "Users can create own conversations" ON whatsapp_conversations 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias conversas
CREATE POLICY "Users can update own conversations" ON whatsapp_conversations 
    FOR UPDATE USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias conversas
CREATE POLICY "Users can delete own conversations" ON whatsapp_conversations 
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FUNÇÕES ÚTEIS
-- =====================================================

-- Função para limpar conversas antigas (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_conversations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Remove conversas não atualizadas há mais de 90 dias
    DELETE FROM whatsapp_conversations 
    WHERE updated_at < NOW() - INTERVAL '90 days'
    AND last_message_time < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas das conversas
CREATE OR REPLACE FUNCTION get_whatsapp_conversation_stats(user_id_param UUID)
RETURNS TABLE (
    total_conversations BIGINT,
    websocket_created_conversations BIGINT,
    unread_conversations BIGINT,
    total_unread_count BIGINT,
    groups_count BIGINT,
    active_conversations BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_conversations,
        COUNT(*) FILTER (WHERE is_websocket_created = true) as websocket_created_conversations,
        COUNT(*) FILTER (WHERE unread_count > 0) as unread_conversations,
        COALESCE(SUM(unread_count), 0) as total_unread_count,
        COUNT(*) FILTER (WHERE is_group = true) as groups_count,
        COUNT(*) FILTER (WHERE last_message_time > NOW() - INTERVAL '30 days') as active_conversations
    FROM whatsapp_conversations 
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE whatsapp_conversations IS 'Tabela para persistir conversas do WhatsApp entre sessões e navegadores';
COMMENT ON COLUMN whatsapp_conversations.chat_id IS 'ID original do chat no formato WhatsApp (ex: 5511999999999@s.whatsapp.net)';
COMMENT ON COLUMN whatsapp_conversations.instance_id IS 'ID da instância do Evolution API';
COMMENT ON COLUMN whatsapp_conversations.is_websocket_created IS 'Indica se a conversa foi criada dinamicamente via WebSocket (novo usuário)';
COMMENT ON COLUMN whatsapp_conversations.metadata IS 'Dados adicionais em formato JSON para futuras extensões'; 