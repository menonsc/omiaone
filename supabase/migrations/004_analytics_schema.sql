-- Migration: Analytics Interno
-- Descrição: Sistema completo de analytics para admins
-- Data: Dezembro 2024

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum para tipos de eventos
CREATE TYPE analytics_event_type AS ENUM (
  'user_login',
  'user_logout',
  'page_view',
  'feature_usage',
  'api_call',
  'error_occurred',
  'integration_sync',
  'message_sent',
  'document_upload',
  'campaign_sent',
  'agent_interaction',
  'system_alert'
);

-- Enum para níveis de severidade
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Tabela principal de eventos de analytics
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type analytics_event_type NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  event_category VARCHAR(100),
  event_label VARCHAR(255),
  event_value NUMERIC,
  
  -- Dados do evento
  event_data JSONB DEFAULT '{}',
  
  -- Contexto da sessão
  session_id VARCHAR(255),
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  
  -- Localização e dispositivo
  country VARCHAR(2),
  region VARCHAR(100),
  city VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(50),
  os VARCHAR(50),
  
  -- Métricas de performance
  page_load_time INTEGER, -- em ms
  api_response_time INTEGER, -- em ms
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de métricas agregadas diárias
CREATE TABLE analytics_daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  
  -- Métricas de usuários
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  
  -- Métricas de sessões
  total_sessions INTEGER DEFAULT 0,
  avg_session_duration NUMERIC DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  
  -- Métricas de páginas
  total_page_views INTEGER DEFAULT 0,
  unique_page_views INTEGER DEFAULT 0,
  avg_page_load_time NUMERIC DEFAULT 0,
  
  -- Métricas de funcionalidades
  whatsapp_messages INTEGER DEFAULT 0,
  ai_interactions INTEGER DEFAULT 0,
  documents_uploaded INTEGER DEFAULT 0,
  campaigns_sent INTEGER DEFAULT 0,
  integrations_synced INTEGER DEFAULT 0,
  
  -- Métricas de API
  total_api_calls INTEGER DEFAULT 0,
  api_errors INTEGER DEFAULT 0,
  avg_api_response_time NUMERIC DEFAULT 0,
  
  -- Métricas de sistema
  system_errors INTEGER DEFAULT 0,
  critical_alerts INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(date)
);

-- Tabela de logs de sistema detalhados
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  log_level VARCHAR(20) NOT NULL, -- debug, info, warn, error, fatal
  severity severity_level DEFAULT 'low',
  component VARCHAR(100) NOT NULL, -- whatsapp, yampi, auth, etc.
  action VARCHAR(100) NOT NULL,
  
  -- Contexto
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  request_id VARCHAR(255),
  
  -- Conteúdo do log
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  
  -- Stack trace para erros
  stack_trace TEXT,
  
  -- Contexto técnico
  environment VARCHAR(50) DEFAULT 'production',
  version VARCHAR(20),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para busca
  search_vector tsvector
);

-- Tabela de métricas de performance
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  metric_name VARCHAR(100) NOT NULL,
  metric_type VARCHAR(50) NOT NULL, -- counter, gauge, histogram, timer
  
  -- Valores
  value NUMERIC NOT NULL,
  unit VARCHAR(20), -- ms, bytes, count, percent, etc.
  
  -- Contexto
  component VARCHAR(100),
  environment VARCHAR(50) DEFAULT 'production',
  tags JSONB DEFAULT '{}',
  
  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de alertas do sistema
CREATE TABLE system_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  alert_type VARCHAR(100) NOT NULL,
  severity severity_level NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, acknowledged, resolved
  
  -- Conteúdo
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Contexto
  component VARCHAR(100),
  affected_users INTEGER DEFAULT 0,
  
  -- Dados do alerta
  alert_data JSONB DEFAULT '{}',
  
  -- Resolução
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações de dashboard
CREATE TABLE dashboard_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_name VARCHAR(100) NOT NULL,
  
  -- Configuração
  config JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, dashboard_name)
);

-- Índices para performance
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);

CREATE INDEX idx_analytics_daily_metrics_date ON analytics_daily_metrics(date);

CREATE INDEX idx_system_logs_level ON system_logs(log_level);
CREATE INDEX idx_system_logs_severity ON system_logs(severity);
CREATE INDEX idx_system_logs_component ON system_logs(component);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_search ON system_logs USING gin(search_vector);

CREATE INDEX idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX idx_performance_metrics_component ON performance_metrics(component);

CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX idx_system_alerts_status ON system_alerts(status);
CREATE INDEX idx_system_alerts_created_at ON system_alerts(created_at);
CREATE INDEX idx_system_alerts_component ON system_alerts(component);

CREATE INDEX idx_dashboard_configs_user_id ON dashboard_configs(user_id);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_analytics_daily_metrics_updated_at 
  BEFORE UPDATE ON analytics_daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_alerts_updated_at 
  BEFORE UPDATE ON system_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_configs_updated_at 
  BEFORE UPDATE ON dashboard_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar search_vector nos logs
CREATE OR REPLACE FUNCTION update_system_logs_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('portuguese', 
    COALESCE(NEW.message, '') || ' ' ||
    COALESCE(NEW.component, '') || ' ' ||
    COALESCE(NEW.action, '') || ' ' ||
    COALESCE(NEW.details::text, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_logs_search_vector_trigger
  BEFORE INSERT OR UPDATE ON system_logs
  FOR EACH ROW EXECUTE FUNCTION update_system_logs_search_vector();

-- Função para agregar métricas diárias
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
DECLARE
  target_date_start TIMESTAMP WITH TIME ZONE;
  target_date_end TIMESTAMP WITH TIME ZONE;
BEGIN
  target_date_start := target_date::timestamp;
  target_date_end := target_date_start + INTERVAL '1 day';
  
  -- Inserir ou atualizar métricas diárias
  INSERT INTO analytics_daily_metrics (
    date,
    total_users,
    active_users,
    new_users,
    total_sessions,
    total_page_views,
    whatsapp_messages,
    ai_interactions,
    documents_uploaded,
    campaigns_sent,
    total_api_calls,
    api_errors,
    system_errors,
    avg_page_load_time,
    avg_api_response_time
  )
  SELECT 
    target_date,
    COUNT(DISTINCT CASE WHEN event_type = 'user_login' THEN user_id END) as total_users,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(DISTINCT CASE WHEN event_name = 'first_login' THEN user_id END) as new_users,
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as total_page_views,
    COUNT(CASE WHEN event_type = 'message_sent' THEN 1 END) as whatsapp_messages,
    COUNT(CASE WHEN event_type = 'agent_interaction' THEN 1 END) as ai_interactions,
    COUNT(CASE WHEN event_type = 'document_upload' THEN 1 END) as documents_uploaded,
    COUNT(CASE WHEN event_type = 'campaign_sent' THEN 1 END) as campaigns_sent,
    COUNT(CASE WHEN event_type = 'api_call' THEN 1 END) as total_api_calls,
    COUNT(CASE WHEN event_type = 'error_occurred' THEN 1 END) as api_errors,
    COUNT(CASE WHEN event_type = 'system_alert' THEN 1 END) as system_errors,
    AVG(CASE WHEN page_load_time IS NOT NULL THEN page_load_time END) as avg_page_load_time,
    AVG(CASE WHEN api_response_time IS NOT NULL THEN api_response_time END) as avg_api_response_time
  FROM analytics_events 
  WHERE created_at >= target_date_start 
    AND created_at < target_date_end
  ON CONFLICT (date) 
  DO UPDATE SET
    total_users = EXCLUDED.total_users,
    active_users = EXCLUDED.active_users,
    new_users = EXCLUDED.new_users,
    total_sessions = EXCLUDED.total_sessions,
    total_page_views = EXCLUDED.total_page_views,
    whatsapp_messages = EXCLUDED.whatsapp_messages,
    ai_interactions = EXCLUDED.ai_interactions,
    documents_uploaded = EXCLUDED.documents_uploaded,
    campaigns_sent = EXCLUDED.campaigns_sent,
    total_api_calls = EXCLUDED.total_api_calls,
    api_errors = EXCLUDED.api_errors,
    system_errors = EXCLUDED.system_errors,
    avg_page_load_time = EXCLUDED.avg_page_load_time,
    avg_api_response_time = EXCLUDED.avg_api_response_time,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para buscar logs
CREATE OR REPLACE FUNCTION search_system_logs(
  search_query TEXT DEFAULT '',
  log_level_filter TEXT DEFAULT '',
  component_filter TEXT DEFAULT '',
  date_from TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days',
  date_to TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  log_level VARCHAR(20),
  severity severity_level,
  component VARCHAR(100),
  action VARCHAR(100),
  message TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.log_level,
    l.severity,
    l.component,
    l.action,
    l.message,
    l.details,
    l.created_at,
    CASE 
      WHEN search_query = '' THEN 1.0
      ELSE ts_rank(l.search_vector, plainto_tsquery('portuguese', search_query))
    END::real as rank
  FROM system_logs l
  WHERE 
    (search_query = '' OR l.search_vector @@ plainto_tsquery('portuguese', search_query))
    AND (log_level_filter = '' OR l.log_level = log_level_filter)
    AND (component_filter = '' OR l.component = component_filter)
    AND l.created_at >= date_from
    AND l.created_at <= date_to
  ORDER BY 
    CASE WHEN search_query = '' THEN l.created_at ELSE rank END DESC,
    l.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;

-- Policies para admins
CREATE POLICY "Admins can view all analytics" ON analytics_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view all daily metrics" ON analytics_daily_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view all system logs" ON system_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view all performance metrics" ON performance_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage system alerts" ON system_alerts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can manage their own dashboard configs" ON dashboard_configs
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Inserir dados iniciais
INSERT INTO analytics_daily_metrics (date, total_users, active_users) 
VALUES (CURRENT_DATE - INTERVAL '1 day', 0, 0)
ON CONFLICT (date) DO NOTHING; 