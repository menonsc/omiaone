// Middleware de Autorização - Frontend
// Integração com sistema RLS do Supabase

import React from 'react'
import { supabase } from './supabase'
import { analytics } from './analytics'

export interface AuthorizationContext {
  userId: string
  userRole: string
  permissions: Record<string, string[]>
  ipAddress?: string
  userAgent?: string
}

export interface RateLimitConfig {
  maxRequests: number
  windowMinutes: number
  enabled: boolean
}

export interface AuthorizationOptions {
  resource: string
  action: string
  rateLimit?: RateLimitConfig
  bypassForAdmin?: boolean
  logAttempt?: boolean
}

class AuthorizationMiddleware {
  private contextCache: Map<string, AuthorizationContext> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

  constructor() {
    this.initializeUserContext()
  }

  // Inicializar contexto do usuário
  private async initializeUserContext(): Promise<void> {
    try {
      const response = await supabase.auth.getUser()
      const user = response?.data?.user
      if (user) {
        await this.getUserContext(user.id)
      }
    } catch (error) {
      console.error('Erro ao inicializar contexto do usuário:', error)
    }
  }

  // Obter contexto completo do usuário
  async getUserContext(userId: string): Promise<AuthorizationContext | null> {
    // Verificar cache
    if (this.isContextCacheValid(userId)) {
      return this.contextCache.get(userId) || null
    }

    try {
      // Buscar dados do usuário e permissões via RPC
      const { data: userRole, error: roleError } = await supabase
        .rpc('get_user_role', { user_id_param: userId })

      if (roleError) {
        console.error('Erro ao obter role do usuário:', roleError)
        return null
      }

      const { data: permissions, error: permError } = await supabase
        .rpc('get_user_permissions', { user_id_param: userId })

      if (permError) {
        console.error('Erro ao obter permissões:', permError)
        return null
      }

      const context: AuthorizationContext = {
        userId,
        userRole: userRole || 'user',
        permissions: permissions?.permissions || {},
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent
      }

      // Cache do contexto
      this.contextCache.set(userId, context)
      this.cacheExpiry.set(userId, Date.now() + this.CACHE_DURATION)

      return context
    } catch (error) {
      console.error('Erro ao obter contexto do usuário:', error)
      return null
    }
  }

  // Verificar se cache do contexto é válido
  private isContextCacheValid(userId: string): boolean {
    const expiry = this.cacheExpiry.get(userId)
    return expiry ? Date.now() < expiry : false
  }

  // Limpar cache do contexto
  clearUserContext(userId: string): void {
    this.contextCache.delete(userId)
    this.cacheExpiry.delete(userId)
  }

  // Obter IP do cliente
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip || '0.0.0.0'
    } catch {
      return '0.0.0.0'
    }
  }

  // Verificar autorização completa
  async authorize(options: AuthorizationOptions): Promise<{
    authorized: boolean
    reason?: string
    context?: AuthorizationContext
  }> {
    const { resource, action, rateLimit, bypassForAdmin = true, logAttempt = true } = options

    try {
      // 1. Verificar autenticação
      const response = await supabase.auth.getUser()
      const user = response?.data?.user
      if (!user) {
        if (logAttempt) {
          await this.logUnauthorizedAttempt('authentication_required', resource, action)
        }
        return { authorized: false, reason: 'Usuário não autenticado' }
      }

      // 2. Obter contexto do usuário
      const context = await this.getUserContext(user.id)
      if (!context) {
        if (logAttempt) {
          await this.logUnauthorizedAttempt('context_unavailable', resource, action, user.id)
        }
        return { authorized: false, reason: 'Contexto do usuário indisponível' }
      }

      // 3. Bypass para admins (se habilitado)
      if (bypassForAdmin && ['admin', 'super_admin'].includes(context.userRole)) {
        if (logAttempt) {
          await this.logAuthorizedAccess(resource, action, context, 'admin_bypass')
        }
        return { authorized: true, context }
      }

      // 4. Verificar rate limit (se habilitado)
      if (rateLimit?.enabled) {
        const rateLimitOk = await this.checkRateLimit(
          context,
          action,
          resource,
          rateLimit.maxRequests,
          rateLimit.windowMinutes
        )

        if (!rateLimitOk) {
          if (logAttempt) {
            await this.logUnauthorizedAttempt('rate_limit_exceeded', resource, action, user.id)
          }
          return { authorized: false, reason: 'Limite de requisições excedido' }
        }
      }

      // 5. Verificar permissão via RPC (que já inclui RLS)
      const { data: hasPermission, error } = await supabase
        .rpc('authorize_operation', {
          resource_param: resource,
          action_param: action,
          user_id_param: user.id,
          rate_limit_check: rateLimit?.enabled || false,
          max_requests: rateLimit?.maxRequests || 100,
          window_minutes: rateLimit?.windowMinutes || 60
        })

      if (error) {
        console.error('Erro na verificação de autorização:', error)
        if (logAttempt) {
          await this.logUnauthorizedAttempt('authorization_error', resource, action, user.id)
        }
        return { authorized: false, reason: 'Erro na verificação de autorização' }
      }

      if (!hasPermission) {
        if (logAttempt) {
          await this.logUnauthorizedAttempt('insufficient_permissions', resource, action, user.id)
        }
        return { authorized: false, reason: 'Permissões insuficientes' }
      }

      // 6. Autorização concedida
      if (logAttempt) {
        await this.logAuthorizedAccess(resource, action, context)
      }

      return { authorized: true, context }

    } catch (error) {
      console.error('Erro no middleware de autorização:', error)
      if (logAttempt) {
        await this.logUnauthorizedAttempt('system_error', resource, action)
      }
      return { authorized: false, reason: 'Erro do sistema' }
    }
  }

  // Verificar rate limit via RPC
  private async checkRateLimit(
    context: AuthorizationContext,
    action: string,
    resource: string,
    maxRequests: number,
    windowMinutes: number
  ): Promise<boolean> {
    try {
      const { data: rateLimitOk, error } = await supabase
        .rpc('check_rate_limit', {
          user_id_param: context.userId,
          ip_address_param: context.ipAddress || '0.0.0.0',
          action_param: action,
          resource_param: resource,
          max_requests: maxRequests,
          window_minutes: windowMinutes
        })

      if (error) {
        console.error('Erro na verificação de rate limit:', error)
        return false
      }

      return rateLimitOk || false
    } catch (error) {
      console.error('Erro no rate limit:', error)
      return false
    }
  }

  // Log de tentativa não autorizada
  private async logUnauthorizedAttempt(
    reason: string,
    resource: string,
    action: string,
    userId?: string
  ): Promise<void> {
    try {
      // Log via analytics
      analytics.trackEvent({
        eventType: 'error_occurred',
        eventName: 'unauthorized_access_attempt',
        eventCategory: 'security',
        eventLabel: reason,
        userId,
        eventData: {
          reason,
          resource,
          action,
          timestamp: new Date().toISOString()
        }
      })

      // Log via sistema
      analytics.logSystem({
        logLevel: 'warn',
        severity: 'high',
        component: 'authorization_middleware',
        action: 'access_denied',
        message: `Tentativa de acesso negada: ${reason}`,
        details: {
          reason,
          resource,
          action,
          userId
        },
        userId
      })
    } catch (error) {
      console.error('Erro ao logar tentativa não autorizada:', error)
    }
  }

  // Log de acesso autorizado
  private async logAuthorizedAccess(
    resource: string,
    action: string,
    context: AuthorizationContext,
    method?: string
  ): Promise<void> {
    try {
      analytics.trackEvent({
        eventType: 'feature_usage',
        eventName: 'authorized_access',
        eventCategory: 'security',
        eventLabel: `${resource}.${action}`,
        userId: context.userId,
        eventData: {
          resource,
          action,
          userRole: context.userRole,
          method: method || 'rbac_check',
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Erro ao logar acesso autorizado:', error)
    }
  }

  // HOC para proteger componentes
  static withAuthorization<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    authOptions: AuthorizationOptions,
    FallbackComponent?: React.ComponentType<{ reason?: string }>
  ) {
    return function AuthorizedComponent(props: P) {
      const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null)
      const [authReason, setAuthReason] = React.useState<string>()

      React.useEffect(() => {
        const checkAuthorization = async () => {
          const middleware = new AuthorizationMiddleware()
          const result = await middleware.authorize(authOptions)
          setIsAuthorized(result.authorized)
          setAuthReason(result.reason)
        }

        checkAuthorization()
      }, [])

      if (isAuthorized === null) {
        return React.createElement('div', null, 'Verificando permissões...')
      }

      if (!isAuthorized) {
        if (FallbackComponent) {
          return React.createElement(FallbackComponent, { reason: authReason })
        }
        return React.createElement(
          'div',
          { className: 'text-center p-8' },
          React.createElement(
            'div',
            { className: 'text-red-500 text-lg font-semibold mb-2' },
            'Acesso Negado'
          ),
          React.createElement(
            'p',
            { className: 'text-gray-600' },
            authReason || 'Você não tem permissão para acessar este recurso.'
          )
        )
      }

      return React.createElement(WrappedComponent, props)
    }
  }

  // Hook para usar o middleware
  static useAuthorization() {
    const [middleware] = React.useState(() => new AuthorizationMiddleware())

    const authorize = React.useCallback(
      (options: AuthorizationOptions) => middleware.authorize(options),
      [middleware]
    )

    const getUserContext = React.useCallback(
      (userId: string) => middleware.getUserContext(userId),
      [middleware]
    )

    const clearUserContext = React.useCallback(
      (userId: string) => middleware.clearUserContext(userId),
      [middleware]
    )

    return {
      authorize,
      getUserContext,
      clearUserContext
    }
  }
}

// Hook personalizado para verificação rápida de autorização
export const useQuickAuthorization = (
  resource: string,
  action: string,
  options?: Partial<AuthorizationOptions>
) => {
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [reason, setReason] = React.useState<string>()

  React.useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      const middleware = new AuthorizationMiddleware()
      const result = await middleware.authorize({
        resource,
        action,
        ...options
      })
      setIsAuthorized(result.authorized)
      setReason(result.reason)
      setIsLoading(false)
    }

    checkAuth()
  }, [resource, action])

  return { isAuthorized, isLoading, reason }
}

// Constantes para rate limiting por tipo de operação
export const RATE_LIMITS = {
  GENERAL: { maxRequests: 100, windowMinutes: 60, enabled: true },
  SENSITIVE: { maxRequests: 20, windowMinutes: 60, enabled: true },
  BULK_OPERATIONS: { maxRequests: 10, windowMinutes: 60, enabled: true },
  FILE_UPLOAD: { maxRequests: 50, windowMinutes: 60, enabled: true },
  API_CALLS: { maxRequests: 1000, windowMinutes: 60, enabled: true }
}

export default AuthorizationMiddleware 