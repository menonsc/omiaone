// Theme colors (Azul Inteligente)
export const COLORS = {
  primary: {
    100: '#E6F2FF',
    400: '#4C9AFF',
    500: '#0065FF',
    600: '#0052CC',
  },
  neutral: {
    100: '#F4F5F7',
    200: '#DFE1E6',
    700: '#42526E',
    900: '#172B4D',
  },
  success: {
    500: '#00875A',
  },
  danger: {
    500: '#DE350B',
  },
} as const

// API endpoints
export const API_ENDPOINTS = {
  PROFILES: '/api/profiles',
  AGENTS: '/api/agents',
  DOCUMENTS: '/api/documents',
  CHAT: '/api/chat',
  SEARCH: '/api/search',
  ACTIVITY: '/api/activity',
} as const

// File upload constraints
export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.txt', '.md'],
} as const

// Chat constraints
export const CHAT_CONSTRAINTS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_MESSAGES_PER_SESSION: 1000,
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 2048,
} as const

// UI constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 256,
  SIDEBAR_COLLAPSED_WIDTH: 64,
  HEADER_HEIGHT: 64,
  NOTIFICATION_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
} as const

// Agent types
export const AGENT_TYPES = {
  KNOWLEDGE: 'knowledge',
  ONBOARDING: 'onboarding',
  ANALYTICS: 'analytics',
  CUSTOM: 'custom',
} as const

// User roles
export const USER_ROLES = {
  USER: 'user',
  TEAM_LEAD: 'team_lead',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const

// Activity types
export const ACTIVITY_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  CHAT_SESSION_CREATED: 'chat_session_created',
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_DELETED: 'document_deleted',
  PROFILE_UPDATED: 'profile_updated',
  AGENT_CREATED: 'agent_created',
  AGENT_UPDATED: 'agent_updated',
  SEARCH_PERFORMED: 'search_performed',
  MESSAGE_FEEDBACK: 'message_feedback',
} as const

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
} as const

// Default values
export const DEFAULTS = {
  PROFILE: {
    AVATAR_URL: null,
    DEPARTMENT: null,
    ROLE: USER_ROLES.USER,
    PREFERENCES: {},
  },
  AGENT: {
    TEMPERATURE: 0.7,
    MAX_TOKENS: 2048,
    IS_PUBLIC: true,
    CONFIG: {},
  },
  CHAT_SESSION: {
    TITLE: 'Nova Conversa',
  },
} as const

// Regular expressions
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  PHONE: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
} as const

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo é obrigatório',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PASSWORD: 'Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número',
  FILE_TOO_LARGE: 'Arquivo muito grande. Máximo permitido: 10MB',
  INVALID_FILE_TYPE: 'Tipo de arquivo não permitido',
  NETWORK_ERROR: 'Erro de conexão. Tente novamente.',
  UNAUTHORIZED: 'Você não tem permissão para realizar esta ação',
  SESSION_EXPIRED: 'Sua sessão expirou. Faça login novamente.',
  GENERIC_ERROR: 'Ocorreu um erro inesperado. Tente novamente.',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login realizado com sucesso!',
  LOGOUT: 'Logout realizado com sucesso!',
  PROFILE_UPDATED: 'Perfil atualizado com sucesso!',
  DOCUMENT_UPLOADED: 'Documento enviado com sucesso!',
  DOCUMENT_DELETED: 'Documento removido com sucesso!',
  MESSAGE_SENT: 'Mensagem enviada com sucesso!',
  FEEDBACK_SUBMITTED: 'Feedback enviado com sucesso!',
  AGENT_CREATED: 'Agente criado com sucesso!',
  AGENT_UPDATED: 'Agente atualizado com sucesso!',
} as const

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'cursor_auth_token',
  USER_PREFERENCES: 'cursor_user_preferences',
  THEME: 'cursor_theme',
  SIDEBAR_STATE: 'cursor_sidebar_state',
  DRAFT_MESSAGES: 'cursor_draft_messages',
} as const

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy HH:mm',
  SHORT: 'dd/MM/yyyy',
  TIME: 'HH:mm',
  ISO: 'yyyy-MM-dd HH:mm:ss',
} as const

// RBAC Constants
export const RESOURCES = {
  USERS: 'users',
  AGENTS: 'agents',
  DOCUMENTS: 'documents',
  CHAT: 'chat',
  WHATSAPP: 'whatsapp',
  EMAIL_MARKETING: 'email_marketing',
  INTEGRATIONS: 'integrations',
  ANALYTICS: 'analytics',
  AUDIT: 'audit',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  SESSIONS: 'sessions',
  SETTINGS: 'settings',
  SYSTEM: 'system',
} as const

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  MANAGE_ALL: 'manage_all',
  MODERATE: 'moderate',
  CONFIGURE: 'configure',
  EXPORT: 'export',
  IMPORT: 'import',
  APPROVE: 'approve',
  REJECT: 'reject',
  ASSIGN: 'assign',
  REVOKE: 'revoke',
  MAINTAIN: 'maintain',
  BACKUP: 'backup',
  LOGS: 'logs',
} as const

export const ROLE_HIERARCHY = {
  super_admin: 1,
  admin: 2,
  moderator: 3,
  user: 4,
} as const

export const RATE_LIMITS = {
  GENERAL: { maxRequests: 100, windowMinutes: 1 },
  AUTH: { maxRequests: 5, windowMinutes: 1 },
  API: { maxRequests: 1000, windowMinutes: 1 },
  UPLOAD: { maxRequests: 10, windowMinutes: 1 },
  EXPORT: { maxRequests: 5, windowMinutes: 1 },
} as const 