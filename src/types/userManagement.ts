export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'super_admin' | 'admin' | 'moderator' | 'user'
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  created_at: string
  updated_at: string
  last_access?: string
  last_login?: string
  login_count: number
  failed_login_attempts: number
  is_email_verified: boolean
  preferences: Record<string, any>
  metadata: Record<string, any>
}

export interface UserFilters {
  role?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  lastAccessFrom?: string
  lastAccessTo?: string
  department?: string
  isEmailVerified?: boolean
}

export interface UserListResponse {
  users: User[]
  total: number
  page: number
  limit: number
  nextPage?: number
  hasMore: boolean
}

export interface UserUpdateData {
  full_name?: string
  role?: string
  status?: string
  preferences?: Record<string, any>
  metadata?: Record<string, any>
}

export type UserAction = 'activate' | 'deactivate' | 'delete' | 'suspend' | 'unsuspend'

export interface BulkUpdateRequest {
  action: UserAction
  userIds: string[]
  reason?: string
}

export interface ResetPasswordRequest {
  userId: string
  sendEmail?: boolean
  temporaryPassword?: string
}

export interface ImpersonateRequest {
  userId: string
  reason?: string
  duration?: number // em minutos
}

export interface UserHistory {
  id: string
  user_id: string
  action: string
  resource: string
  resource_id?: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
  created_by?: string
}

export interface UserStats {
  total_users: number
  active_users: number
  inactive_users: number
  pending_users: number
  suspended_users: number
  new_users_today: number
  new_users_this_week: number
  new_users_this_month: number
  users_by_role: Record<string, number>
  users_by_status: Record<string, number>
}

export interface UserExportRequest {
  format: 'csv' | 'xlsx' | 'json'
  filters?: UserFilters
  search?: string
  include_history?: boolean
  include_stats?: boolean
}

export interface UserExportResponse {
  export_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  file_url?: string
  expires_at: string
}

export interface UserSession {
  id: string
  user_id: string
  session_id: string
  device_info: {
    type: 'desktop' | 'mobile' | 'tablet'
    os: string
    browser: string
    platform: string
  }
  ip_address: string
  user_agent: string
  is_current: boolean
  last_activity: string
  created_at: string
  expires_at: string
  location?: {
    country?: string
    city?: string
  }
}

export interface UserActivity {
  id: string
  user_id: string
  action: string
  description: string
  resource_type?: string
  resource_id?: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface UserPermissions {
  user_id: string
  permissions: Record<string, string[]>
  roles: string[]
  checked_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  role_name: string
  assigned_by?: string
  assigned_at: string
  expires_at?: string
  is_active: boolean
}

export interface UserNotification {
  id: string
  user_id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  is_read: boolean
  created_at: string
  read_at?: string
}

export interface UserPreferences {
  user_id: string
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  privacy: {
    profile_visibility: 'public' | 'private' | 'friends'
    activity_visibility: 'public' | 'private' | 'friends'
  }
  created_at: string
  updated_at: string
} 