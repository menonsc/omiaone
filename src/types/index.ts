import { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  department: string | null
  role: 'user' | 'team_lead' | 'admin' | 'super_admin'
  preferences: Record<string, any>
  created_at: string
}

export interface Agent {
  id: string
  name: string
  description: string | null
  type: string
  system_prompt: string | null
  temperature: number
  max_tokens: number
  is_public: boolean
  created_by: string
  config: Record<string, any>
  created_at: string
}

export interface Document {
  id: string
  title: string
  content_hash: string
  file_path: string | null
  file_size: number
  mime_type: string
  metadata: Record<string, any>
  uploaded_by: string
  created_at: string
}

export interface DocumentChunk {
  id: string
  document_id: string
  content: string
  embedding: number[]
  chunk_index: number
  metadata: Record<string, any>
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  agent_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  tokens_used: number | null
  feedback_score: number | null
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  action: string
  resource_type: string | null
  resource_id: string | null
  details: Record<string, any>
  ip_address: string | null
  created_at: string
}

export interface DashboardMetrics {
  totalInteractions: number
  timeSaved: number
  documentsProcessed: number
  favoriteAgents: Agent[]
  recentActivity: ActivityLog[]
  usageData: {
    date: string
    interactions: number
  }[]
}

export interface SearchResult {
  id: string
  title: string
  content: string
  similarity: number
  document_id: string
  metadata: Record<string, any>
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isStreaming?: boolean
  feedback?: number
  tokensUsed?: number
}

export interface AuthState {
  user: User | null | undefined
  profile: Profile | null
  loading: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setUser: (user: User | null) => void
  updateProfile: (updates: Partial<Profile>) => Promise<Profile>
}

export interface ChatState {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  messages: ChatMessage[]
  agents: Agent[]
  isLoading: boolean

  // Actions
  init: () => void
  createSession: (agentId: string, title?: string) => Promise<ChatSession>
  sendMessage: (content: string) => Promise<void>
  setCurrentSession: (session: ChatSession | null) => void
  fetchSessions: () => Promise<void>
  fetchMessages: (sessionId: string) => Promise<void>
  fetchAgents: () => Promise<void>
  updateMessageFeedback: (messageId: string, score: number) => Promise<void>
  createAgent: (agentData: Omit<Agent, 'id' | 'created_by' | 'created_at'>) => Promise<Agent>
  updateAgent: (agentId: string, updates: Partial<Agent>) => Promise<void>
  deleteAgent: (agentId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  clearAllSessions: () => Promise<void>
  testPersistence: () => void
}

export interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  notifications: Notification[]
  toggleTheme: () => void
  toggleSidebar: () => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  duration?: number
}

// Email Marketing Types
export interface EmailCampaign {
  id: string
  name: string
  subject: string
  from_email: string
  from_name: string
  template_id: string | null
  content: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  type: 'sales_recovery' | 'newsletter' | 'promotional' | 'follow_up'
  target_audience: 'all' | 'segment' | 'custom'
  segment_criteria: Record<string, any>
  scheduled_at: string | null
  sent_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  stats: EmailCampaignStats
}

export interface EmailCampaignStats {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
  unsubscribed: number
  open_rate: number
  click_rate: number
  bounce_rate: number
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: 'sales_recovery' | 'welcome' | 'follow_up' | 'promotional'
  variables: string[]
  created_by: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailContact {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  tags: string[]
  custom_fields: Record<string, any>
  status: 'subscribed' | 'unsubscribed' | 'bounced' | 'complained'
  source: 'manual' | 'import' | 'whatsapp' | 'chat' | 'api'
  last_activity: string | null
  created_at: string
  updated_at: string
}

export interface EmailSegment {
  id: string
  name: string
  description: string | null
  criteria: Record<string, any>
  contact_count: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface SalesRecoveryFlow {
  id: string
  name: string
  description: string | null
  trigger_type: 'abandoned_cart' | 'inactive_customer' | 'failed_payment' | 'custom'
  trigger_criteria: Record<string, any>
  steps: SalesRecoveryStep[]
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  stats: SalesRecoveryStats
}

export interface SalesRecoveryStep {
  id: string
  flow_id: string
  step_order: number
  type: 'email' | 'sms' | 'whatsapp' | 'wait'
  delay_hours: number
  template_id: string | null
  content: string | null
  conditions: Record<string, any>
  is_active: boolean
}

export interface SalesRecoveryStats {
  triggered: number
  completed: number
  converted: number
  revenue_recovered: number
  conversion_rate: number
}

export interface EmailEvent {
  id: string
  campaign_id: string | null
  contact_id: string
  event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed'
  event_data: Record<string, any>
  created_at: string
}

export interface EmailMarketingState {
  campaigns: EmailCampaign[]
  templates: EmailTemplate[]
  contacts: EmailContact[]
  segments: EmailSegment[]
  salesFlows: SalesRecoveryFlow[]
  currentCampaign: EmailCampaign | null
  isLoading: boolean
  stats: {
    totalContacts: number
    activeCampaigns: number
    totalSent: number
    averageOpenRate: number
    revenueRecovered: number
  }

  // Actions
  fetchCampaigns: () => Promise<void>
  fetchTemplates: () => Promise<void>
  fetchContacts: () => Promise<void>
  fetchSegments: () => Promise<void>
  fetchSalesFlows: () => Promise<void>
  createCampaign: (data: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at' | 'stats'>) => Promise<EmailCampaign>
  updateCampaign: (id: string, data: Partial<EmailCampaign>) => Promise<void>
  deleteCampaign: (id: string) => Promise<void>
  sendCampaign: (id: string) => Promise<any[]>
  createTemplate: (data: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<EmailTemplate>
  updateTemplate: (id: string, data: Partial<EmailTemplate>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  createContact: (data: Omit<EmailContact, 'id' | 'created_at' | 'updated_at'>) => Promise<EmailContact>
  updateContact: (id: string, data: Partial<EmailContact>) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  importContacts: (contacts: Partial<EmailContact>[]) => Promise<{ imported: number; total: number }>
  createSegment: (data: Omit<EmailSegment, 'id' | 'created_at' | 'updated_at' | 'contact_count'>) => Promise<EmailSegment>
  updateSegment: (id: string, data: Partial<EmailSegment>) => Promise<void>
  deleteSegment: (id: string) => Promise<void>
  createSalesFlow: (data: Omit<SalesRecoveryFlow, 'id' | 'created_at' | 'updated_at' | 'stats'>) => Promise<SalesRecoveryFlow>
  updateSalesFlow: (id: string, data: Partial<SalesRecoveryFlow>) => Promise<void>
  deleteSalesFlow: (id: string) => Promise<void>
  getCampaignStats: (id: string) => Promise<EmailCampaignStats>
  getOverallStats: () => Promise<void>
}

// Integration Types
export interface Integration {
  id: string
  user_id: string
  name: string
  display_name: string
  type: 'ecommerce' | 'payment' | 'communication' | 'crm' | 'automation' | 'productivity'
  status: 'active' | 'inactive' | 'error' | 'testing'
  config: Record<string, any>
  credentials: Record<string, any>
  last_sync_at?: string
  sync_status: string
  error_message?: string
  created_at: string
  updated_at: string
}

export interface IntegrationSyncLog {
  id: string
  integration_id: string
  sync_type: 'full' | 'incremental' | 'manual'
  status: 'success' | 'error' | 'partial'
  records_processed: number
  records_success: number
  records_error: number
  error_details: Record<string, any>
  started_at: string
  completed_at?: string
  duration_ms?: number
} 