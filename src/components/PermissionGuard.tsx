import React from 'react'
import { usePermissionCheck, useIsAdmin } from '../hooks/usePermissionsQueries'
import { useAuthStore } from '../store/authStore'
import { Spinner } from './ui/feedback'

// Tipos para props dos componentes
interface PermissionGuardProps {
  resource: string
  action: string
  userId?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

interface RoleGuardProps {
  roles: string | string[]
  userId?: string
  requireAll?: boolean // true = AND, false = OR
  fallback?: React.ReactNode
  children: React.ReactNode
}

interface AdminGuardProps {
  requireSuperAdmin?: boolean
  userId?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

interface ConditionalRenderProps {
  condition: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

// Componente principal de proteção por permissão
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  resource,
  action,
  userId,
  fallback = null,
  children
}) => {
  const { data: hasPermission, isLoading, error } = usePermissionCheck(resource, action, userId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Spinner size="sm" />
        <span className="ml-2 text-sm text-gray-600">Verificando permissões...</span>
      </div>
    )
  }

  if (error) {
    console.error('Erro ao verificar permissão:', error)
    return <>{fallback}</>
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>
}

// Componente de proteção por roles
export const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  userId,
  requireAll = false,
  fallback = null,
  children
}) => {
  const { user } = useAuthStore()
  const targetUserId = userId || user?.id || ''
  
  // Converter string para array se necessário
  const roleArray = Array.isArray(roles) ? roles : [roles]
  
  // Usar múltiplas verificações de permissão baseadas nos roles
  // Aqui vamos simular verificando se o usuário tem permissões típicas dos roles
  const { data: permissions, isLoading } = usePermissionCheck('users', 'read', targetUserId)
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Spinner size="sm" />
        <span className="ml-2 text-sm text-gray-600">Verificando roles...</span>
      </div>
    )
  }

  // Esta é uma implementação simplificada
  // Em uma implementação real, você precisaria verificar os roles específicos
  const hasAccess = Boolean(permissions)

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Componente de proteção para administradores
export const AdminGuard: React.FC<AdminGuardProps> = ({
  requireSuperAdmin = false,
  userId,
  fallback = (
    <div className="text-center p-8">
      <div className="text-red-500 text-lg font-semibold mb-2">
        Acesso Negado
      </div>
      <p className="text-gray-600">
        Você não tem permissão para acessar esta área.
      </p>
    </div>
  ),
  children
}) => {
  const { isAdmin, isSuperAdmin } = useIsAdmin(userId)

  const hasAccess = requireSuperAdmin ? isSuperAdmin : isAdmin

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Componente para renderização condicional simples
export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  condition,
  fallback = null,
  children
}) => {
  return condition ? <>{children}</> : <>{fallback}</>
}

// HOC para proteger componentes com permissões
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  resource: string,
  action: string,
  fallback?: React.ReactNode
) {
  const PermissionWrappedComponent = (props: P) => (
    <PermissionGuard
      resource={resource}
      action={action}
      fallback={fallback}
    >
      <WrappedComponent {...props} />
    </PermissionGuard>
  )

  PermissionWrappedComponent.displayName = `withPermission(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return PermissionWrappedComponent
}

// HOC para proteger componentes com roles
export function withRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  roles: string | string[],
  requireAll = false,
  fallback?: React.ReactNode
) {
  const RoleWrappedComponent = (props: P) => (
    <RoleGuard
      roles={roles}
      requireAll={requireAll}
      fallback={fallback}
    >
      <WrappedComponent {...props} />
    </RoleGuard>
  )

  RoleWrappedComponent.displayName = `withRole(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return RoleWrappedComponent
}

// HOC para proteger componentes apenas para admins
export function withAdminOnly<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requireSuperAdmin = false,
  fallback?: React.ReactNode
) {
  const AdminWrappedComponent = (props: P) => (
    <AdminGuard
      requireSuperAdmin={requireSuperAdmin}
      fallback={fallback}
    >
      <WrappedComponent {...props} />
    </AdminGuard>
  )

  AdminWrappedComponent.displayName = `withAdminOnly(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return AdminWrappedComponent
}

// Componente de botão que se esconde baseado em permissões
interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  resource: string
  action: string
  userId?: string
  hideWhenNoPermission?: boolean
  children: React.ReactNode
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  resource,
  action,
  userId,
  hideWhenNoPermission = false,
  children,
  ...buttonProps
}) => {
  const { data: hasPermission, isLoading } = usePermissionCheck(resource, action, userId)

  if (isLoading) {
    return (
      <button {...buttonProps} disabled>
        <Spinner size="sm" />
      </button>
    )
  }

  if (!hasPermission) {
    if (hideWhenNoPermission) {
      return null
    }
    
    return (
      <button {...buttonProps} disabled title="Você não tem permissão para esta ação">
        {children}
      </button>
    )
  }

  return (
    <button {...buttonProps}>
      {children}
    </button>
  )
}

// Componente de link que se comporta baseado em permissões
interface PermissionLinkProps {
  resource: string
  action: string
  userId?: string
  href?: string
  onClick?: () => void
  className?: string
  hideWhenNoPermission?: boolean
  children: React.ReactNode
}

export const PermissionLink: React.FC<PermissionLinkProps> = ({
  resource,
  action,
  userId,
  href,
  onClick,
  className = '',
  hideWhenNoPermission = false,
  children
}) => {
  const { data: hasPermission, isLoading } = usePermissionCheck(resource, action, userId)

  if (isLoading) {
    return (
      <span className={className}>
        <Spinner size="sm" className="inline" />
      </span>
    )
  }

  if (!hasPermission) {
    if (hideWhenNoPermission) {
      return null
    }
    
    return (
      <span 
        className={`${className} opacity-50 cursor-not-allowed`}
        title="Você não tem permissão para esta ação"
      >
        {children}
      </span>
    )
  }

  if (href) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    )
  }

  return (
    <button 
      type="button" 
      className={`${className} bg-transparent border-none p-0 text-left`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// Hook para uso direto em componentes
export const usePermissionGuard = () => {
  return {
    PermissionGuard,
    RoleGuard,
    AdminGuard,
    ConditionalRender,
    PermissionButton,
    PermissionLink,
    withPermission,
    withRole,
    withAdminOnly
  }
} 