-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'team_lead', 'admin', 'super_admin');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    department VARCHAR(100),
    role user_role DEFAULT 'user',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    system_prompt TEXT,
    temperature DECIMAL(2,1) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 2048 CHECK (max_tokens > 0),
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content_hash VARCHAR(64) UNIQUE,
    file_path TEXT,
    file_size INTEGER CHECK (file_size > 0),
    mime_type VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks for vector search
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768),
    chunk_index INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    agent_id UUID REFERENCES agents(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    tokens_used INTEGER,
    feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_public ON agents(is_public) WHERE is_public = true;
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_agent_id ON chat_sessions(agent_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Agents: Public agents are readable by all, private agents only by creator
CREATE POLICY "Public agents are viewable by everyone" ON agents FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view their own agents" ON agents FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create agents" ON agents FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own agents" ON agents FOR UPDATE USING (auth.uid() = created_by);

-- Documents: Users can access documents they uploaded
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (auth.uid() = uploaded_by);
CREATE POLICY "Users can insert own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (auth.uid() = uploaded_by);
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (auth.uid() = uploaded_by);

-- Document chunks: Follow document permissions
CREATE POLICY "Users can view chunks of their documents" ON document_chunks FOR SELECT 
USING (document_id IN (SELECT id FROM documents WHERE uploaded_by = auth.uid()));

-- Chat sessions: Users can access their own sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chat sessions" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat sessions" ON chat_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Messages: Users can access messages from their sessions
CREATE POLICY "Users can view messages from own sessions" ON messages FOR SELECT 
USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert messages to own sessions" ON messages FOR INSERT 
WITH CHECK (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));
CREATE POLICY "Users can update messages from own sessions" ON messages FOR UPDATE 
USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

-- Activity logs: Users can view their own logs, admins can view all
CREATE POLICY "Users can view own activity logs" ON activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all activity logs" ON activity_logs FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Functions for document search
CREATE OR REPLACE FUNCTION search_documents(
  search_query text,
  match_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  title text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_embedding vector(768);
BEGIN
  -- In a real implementation, you would get the embedding from your AI service
  -- For now, we'll do a simple text search
  RETURN QUERY
  SELECT 
    dc.id,
    dc.document_id,
    d.title,
    dc.content,
    0.5::float as similarity
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE dc.content ILIKE '%' || search_query || '%'
    AND d.uploaded_by = auth.uid()
  ORDER BY similarity DESC
  LIMIT match_limit;
END;
$$;

-- Insert default agents
INSERT INTO agents (id, name, description, type, system_prompt, temperature, max_tokens, is_public, config) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Knowledge Assistant', 'Especialista em buscar e sintetizar informações dos documentos da empresa', 'knowledge', 
'Você é um assistente especializado em base de conhecimento empresarial. 
Sua função é ajudar os colaboradores a encontrar informações precisas nos documentos da empresa.

Diretrizes:
- Sempre cite as fontes quando usar informações dos documentos
- Seja preciso e objetivo nas respostas
- Se não souber a resposta, diga claramente
- Mantenha um tom profissional mas amigável
- Priorize informações mais recentes quando houver conflitos', 
0.3, 2048, true, '{}'),

('550e8400-e29b-41d4-a716-446655440002', 'Buddy', 'Assistente amigável para ajudar novos funcionários no processo de onboarding', 'onboarding',
'Você é o Buddy, um assistente virtual amigável e proativo que ajuda novos funcionários durante o onboarding.

Personalidade:
- Seja caloroso, acolhedor e encorajador
- Use um tom conversacional e descontraído
- Mostre entusiasmo em ajudar
- Seja paciente com perguntas básicas

Suas responsabilidades:
- Orientar sobre processos e políticas da empresa
- Explicar benefícios e recursos disponíveis
- Ajudar com dúvidas sobre sistemas internos
- Fornecer dicas para adaptação à cultura da empresa',
0.7, 2048, true, '{}'),

('550e8400-e29b-41d4-a716-446655440003', 'Data Analyst AI', 'Especialista em análise de dados e geração de insights', 'analytics',
'Você é um analista de dados especializado em gerar insights e relatórios.

Competências:
- Análise estatística de dados
- Identificação de padrões e tendências
- Criação de visualizações e gráficos
- Recomendações baseadas em dados

Diretrizes:
- Sempre fundamente suas análises em dados
- Explique metodologias utilizadas
- Destaque limitações dos dados quando relevante
- Sugira próximos passos para investigação
- Use linguagem técnica mas acessível',
0.4, 2048, true, '{}'); 