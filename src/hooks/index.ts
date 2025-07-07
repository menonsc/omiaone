// WhatsApp Hooks
export * from './useWhatsAppQueries'

// Yampi Hooks
export * from './useYampiQueries'

// Supabase Hooks
export * from './useSupabaseQueries'

// Analytics Hooks
export * from './useAnalyticsQueries'

// Re-export React Query utilities for convenience
export { useQueryClient, useInfiniteQuery } from '@tanstack/react-query'

// Real-time connection hook
export { useRealTimeConnection } from './useRealTimeConnection'

// Aliases para evitar conflitos
export { useMessages as useSupabaseMessages } from './useSupabaseQueries'
export { useWhatsAppMessages as useMessages } from './useWhatsAppQueries' 