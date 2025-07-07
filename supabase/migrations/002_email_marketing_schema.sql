-- Email Marketing Tables

-- Email Campaigns
CREATE TABLE email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255) NOT NULL,
    template_id UUID NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused')),
    type VARCHAR(20) DEFAULT 'promotional' CHECK (type IN ('sales_recovery', 'newsletter', 'promotional', 'follow_up')),
    target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'segment', 'custom')),
    segment_criteria JSONB DEFAULT '{}',
    scheduled_at TIMESTAMPTZ NULL,
    sent_at TIMESTAMPTZ NULL,
    created_by UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaign Statistics
CREATE TABLE email_campaign_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE NOT NULL,
    sent INTEGER DEFAULT 0,
    delivered INTEGER DEFAULT 0,
    opened INTEGER DEFAULT 0,
    clicked INTEGER DEFAULT 0,
    bounced INTEGER DEFAULT 0,
    complained INTEGER DEFAULT 0,
    unsubscribed INTEGER DEFAULT 0,
    open_rate DECIMAL(5,2) DEFAULT 0,
    click_rate DECIMAL(5,2) DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id)
);

-- Email Templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'promotional' CHECK (type IN ('sales_recovery', 'welcome', 'follow_up', 'promotional')),
    variables TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES profiles(id) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Contacts
CREATE TABLE email_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed', 'bounced', 'complained')),
    source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'import', 'whatsapp', 'chat', 'api')),
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Segments
CREATE TABLE email_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    criteria JSONB DEFAULT '{}',
    contact_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Recovery Flows
CREATE TABLE sales_recovery_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(30) DEFAULT 'abandoned_cart' CHECK (trigger_type IN ('abandoned_cart', 'inactive_customer', 'failed_payment', 'custom')),
    trigger_criteria JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Recovery Steps
CREATE TABLE sales_recovery_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID REFERENCES sales_recovery_flows(id) ON DELETE CASCADE NOT NULL,
    step_order INTEGER NOT NULL,
    type VARCHAR(20) DEFAULT 'email' CHECK (type IN ('email', 'sms', 'whatsapp', 'wait')),
    delay_hours INTEGER DEFAULT 24,
    template_id UUID REFERENCES email_templates(id),
    content TEXT,
    conditions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Recovery Statistics
CREATE TABLE sales_recovery_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID REFERENCES sales_recovery_flows(id) ON DELETE CASCADE NOT NULL,
    triggered INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    converted INTEGER DEFAULT 0,
    revenue_recovered DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(flow_id)
);

-- Email Events (for tracking)
CREATE TABLE email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES email_contacts(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_type ON email_campaigns(type);
CREATE INDEX idx_email_campaigns_created_by ON email_campaigns(created_by);
CREATE INDEX idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;

CREATE INDEX idx_email_templates_type ON email_templates(type);
CREATE INDEX idx_email_templates_is_active ON email_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_email_templates_created_by ON email_templates(created_by);

CREATE INDEX idx_email_contacts_email ON email_contacts(email);
CREATE INDEX idx_email_contacts_status ON email_contacts(status);
CREATE INDEX idx_email_contacts_source ON email_contacts(source);
CREATE INDEX idx_email_contacts_tags ON email_contacts USING GIN(tags);

CREATE INDEX idx_email_segments_created_by ON email_segments(created_by);

CREATE INDEX idx_sales_recovery_flows_trigger_type ON sales_recovery_flows(trigger_type);
CREATE INDEX idx_sales_recovery_flows_is_active ON sales_recovery_flows(is_active) WHERE is_active = true;
CREATE INDEX idx_sales_recovery_flows_created_by ON sales_recovery_flows(created_by);

CREATE INDEX idx_sales_recovery_steps_flow_id ON sales_recovery_steps(flow_id);
CREATE INDEX idx_sales_recovery_steps_order ON sales_recovery_steps(flow_id, step_order);

CREATE INDEX idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX idx_email_events_contact_id ON email_events(contact_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);
CREATE INDEX idx_email_events_created_at ON email_events(created_at);

-- Updated at triggers
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaign_stats_updated_at BEFORE UPDATE ON email_campaign_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_contacts_updated_at BEFORE UPDATE ON email_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_segments_updated_at BEFORE UPDATE ON email_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_recovery_flows_updated_at BEFORE UPDATE ON sales_recovery_flows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_recovery_stats_updated_at BEFORE UPDATE ON sales_recovery_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_recovery_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_recovery_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_recovery_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Email Campaigns
CREATE POLICY "Users can view own campaigns" ON email_campaigns FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create campaigns" ON email_campaigns FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own campaigns" ON email_campaigns FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own campaigns" ON email_campaigns FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for Campaign Stats
CREATE POLICY "Users can view stats of own campaigns" ON email_campaign_stats FOR SELECT 
USING (campaign_id IN (SELECT id FROM email_campaigns WHERE created_by = auth.uid()));
CREATE POLICY "Users can insert stats for own campaigns" ON email_campaign_stats FOR INSERT 
WITH CHECK (campaign_id IN (SELECT id FROM email_campaigns WHERE created_by = auth.uid()));
CREATE POLICY "Users can update stats of own campaigns" ON email_campaign_stats FOR UPDATE 
USING (campaign_id IN (SELECT id FROM email_campaigns WHERE created_by = auth.uid()));

-- RLS Policies for Email Templates
CREATE POLICY "Users can view own templates" ON email_templates FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create templates" ON email_templates FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own templates" ON email_templates FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own templates" ON email_templates FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for Email Contacts
CREATE POLICY "All users can view contacts" ON email_contacts FOR SELECT USING (true);
CREATE POLICY "All users can create contacts" ON email_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "All users can update contacts" ON email_contacts FOR UPDATE USING (true);
CREATE POLICY "All users can delete contacts" ON email_contacts FOR DELETE USING (true);

-- RLS Policies for Email Segments
CREATE POLICY "Users can view own segments" ON email_segments FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create segments" ON email_segments FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own segments" ON email_segments FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own segments" ON email_segments FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for Sales Recovery Flows
CREATE POLICY "Users can view own flows" ON sales_recovery_flows FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create flows" ON sales_recovery_flows FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own flows" ON sales_recovery_flows FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own flows" ON sales_recovery_flows FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for Sales Recovery Steps
CREATE POLICY "Users can view steps of own flows" ON sales_recovery_steps FOR SELECT 
USING (flow_id IN (SELECT id FROM sales_recovery_flows WHERE created_by = auth.uid()));
CREATE POLICY "Users can create steps for own flows" ON sales_recovery_steps FOR INSERT 
WITH CHECK (flow_id IN (SELECT id FROM sales_recovery_flows WHERE created_by = auth.uid()));
CREATE POLICY "Users can update steps of own flows" ON sales_recovery_steps FOR UPDATE 
USING (flow_id IN (SELECT id FROM sales_recovery_flows WHERE created_by = auth.uid()));
CREATE POLICY "Users can delete steps of own flows" ON sales_recovery_steps FOR DELETE 
USING (flow_id IN (SELECT id FROM sales_recovery_flows WHERE created_by = auth.uid()));

-- RLS Policies for Sales Recovery Stats
CREATE POLICY "Users can view stats of own flows" ON sales_recovery_stats FOR SELECT 
USING (flow_id IN (SELECT id FROM sales_recovery_flows WHERE created_by = auth.uid()));
CREATE POLICY "Users can insert stats for own flows" ON sales_recovery_stats FOR INSERT 
WITH CHECK (flow_id IN (SELECT id FROM sales_recovery_flows WHERE created_by = auth.uid()));
CREATE POLICY "Users can update stats of own flows" ON sales_recovery_stats FOR UPDATE 
USING (flow_id IN (SELECT id FROM sales_recovery_flows WHERE created_by = auth.uid()));

-- RLS Policies for Email Events
CREATE POLICY "All users can view email events" ON email_events FOR SELECT USING (true);
CREATE POLICY "All users can create email events" ON email_events FOR INSERT WITH CHECK (true);

-- Functions for email analytics
CREATE OR REPLACE FUNCTION calculate_campaign_stats(campaign_id_param UUID)
RETURNS TABLE (
    sent BIGINT,
    delivered BIGINT,
    opened BIGINT,
    clicked BIGINT,
    bounced BIGINT,
    complained BIGINT,
    unsubscribed BIGINT,
    open_rate DECIMAL,
    click_rate DECIMAL,
    bounce_rate DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE event_type = 'sent') as sent,
        COUNT(*) FILTER (WHERE event_type = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE event_type = 'opened') as opened,
        COUNT(*) FILTER (WHERE event_type = 'clicked') as clicked,
        COUNT(*) FILTER (WHERE event_type = 'bounced') as bounced,
        COUNT(*) FILTER (WHERE event_type = 'complained') as complained,
        COUNT(*) FILTER (WHERE event_type = 'unsubscribed') as unsubscribed,
        CASE 
            WHEN COUNT(*) FILTER (WHERE event_type = 'delivered') > 0 
            THEN (COUNT(*) FILTER (WHERE event_type = 'opened')::DECIMAL / COUNT(*) FILTER (WHERE event_type = 'delivered')::DECIMAL) * 100
            ELSE 0
        END as open_rate,
        CASE 
            WHEN COUNT(*) FILTER (WHERE event_type = 'delivered') > 0 
            THEN (COUNT(*) FILTER (WHERE event_type = 'clicked')::DECIMAL / COUNT(*) FILTER (WHERE event_type = 'delivered')::DECIMAL) * 100
            ELSE 0
        END as click_rate,
        CASE 
            WHEN COUNT(*) FILTER (WHERE event_type = 'sent') > 0 
            THEN (COUNT(*) FILTER (WHERE event_type = 'bounced')::DECIMAL / COUNT(*) FILTER (WHERE event_type = 'sent')::DECIMAL) * 100
            ELSE 0
        END as bounce_rate
    FROM email_events 
    WHERE campaign_id = campaign_id_param;
END;
$$;

-- Insert some default email templates
INSERT INTO email_templates (name, subject, content, type, variables, created_by, is_active) 
SELECT 
    'Template de Recuperação de Vendas',
    'Não perca essa oportunidade! {{discount}}% de desconto',
    '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Oferta Especial</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2c3e50;">Olá, {{customer_name}}!</h1>
            <p>Notamos que você demonstrou interesse em nossos produtos. Que tal aproveitar uma oferta especial?</p>
            <div style="background: #f39c12; color: white; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                <h2>{{discount}}% de desconto exclusivo!</h2>
            </div>
            <p>{{product_name}} está esperando por você. Não deixe essa oportunidade passar!</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{cta_url}}" style="background: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Aproveitar Oferta</a>
            </div>
            <p>Atenciosamente,<br>Equipe ElevROI</p>
        </div>
    </body>
    </html>',
    'sales_recovery',
    ARRAY['customer_name', 'discount', 'product_name', 'cta_url'],
    (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1),
    true
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'super_admin'); 