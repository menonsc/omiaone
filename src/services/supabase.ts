import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper functions for database operations
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export const updateProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getAgents = async () => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const getChatSessions = async (userId: string) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select(`
      *,
      agents (name, type)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const getMessages = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data
}

export const createChatSession = async (userId: string, agentId: string, title?: string) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      agent_id: agentId,
      title: title || 'Nova Conversa'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const saveMessage = async (sessionId: string, role: string, content: string, tokensUsed?: number) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      tokens_used: tokensUsed
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const logActivity = async (userId: string, action: string, resourceType?: string, resourceId?: string, details?: any) => {
  const { error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details || {}
    })
  
  if (error) throw error
}

export const searchDocuments = async (query: string, limit = 10) => {
  // This would use pgvector for semantic search
  // For now, implementing a basic text search
  const { data, error } = await supabase.rpc('search_documents', {
    search_query: query,
    match_limit: limit
  })
  
  if (error) throw error
  return data
}

export const uploadDocument = async (file: File, userId: string) => {
  // Upload file to storage
  const filePath = `documents/${userId}/${Date.now()}_${file.name}`
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)
  
  if (uploadError) throw uploadError
  
  // Save document metadata
  const { data, error } = await supabase
    .from('documents')
    .insert({
      title: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: userId,
      metadata: {
        originalName: file.name
      }
    })
    .select()
    .single()
  
  if (error) throw error
  return data
} 