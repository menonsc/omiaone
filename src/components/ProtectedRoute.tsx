import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { usePermissionCheck, useIsAdmin, useCurrentUserPermissions } from '../hooks/usePermissionsQueries'
import { useAuthStore } from '../store/authStore'
import { Spinner } from './ui/feedback'

// Tipos para diferentes tipos de proteção de rota
interface BaseProtectedRouteProps {
  children: React.ReactNode
  fallbackPath?: string
  loadingComponent?: React.ReactNode
  unauthorizedComponent?: React.ReactNode
}

interface PermissionProtectedRouteProps extends BaseProtectedRouteProps {
  resource: string
  action: string
  userId?: string
}

interface RoleProtectedRouteProps extends BaseProtectedRouteProps {
  roles: string | string[]
  requireAll?: boolean
  userId?: string
}

interface AdminProtectedRouteProps extends BaseProtectedRouteProps {
  requireSuperAdmin?: boolean
  userId?: string
}

interface AuthProtectedRouteProps extends BaseProtectedRouteProps {
  requireAuth?: boolean
}

// Componente de loading padrão
const DefaultLoadingComponent = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-600">Verificando permissões...</p>
    </div>
  </div>
)

// Componente de acesso negado padrão
const DefaultUnauthorizedComponent = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md text-center">
      <div className="mb-4">
        <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.694-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
      <p className="text-gray-600 mb-6">
        Você não tem permissão para acessar esta página.
      </p>
      <button 
        onClick={() => window.history.back()}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Voltar
      </button>
    </div>
  </div>
)

// Rota protegida por autenticação
export const AuthProtectedRoute: React.FC<AuthProtectedRouteProps> = ({
  children,
  requireAuth = true,
  fallbackPath = '/login',
  loadingComponent = <DefaultLoadingComponent />,
  unauthorizedComponent
}) => {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) {
    return <>{loadingComponent}</>
  }

  if (requireAuth && !user) {
    // Salvar a rota atual para redirecionar após login
    const from = location.pathname + location.search
    return <Navigate to={fallbackPath} state={{ from }} replace />
  }

  if (!requireAuth && user) {
    // Se não requer auth mas o usuário está logado, pode redirecionar para dashboard
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Rota protegida por permissão específica
export const PermissionProtectedRoute: React.FC<PermissionProtectedRouteProps> = ({
  children,
  resource,
  action,
  userId,
  fallbackPath = '/unauthorized',
  loadingComponent = <DefaultLoadingComponent />,
  unauthorizedComponent = <DefaultUnauthorizedComponent />
}) => {
  const { user } = useAuthStore()
  const { data: hasPermission, isLoading, error } = usePermissionCheck(resource, action, userId)

  // Verificar se está autenticado primeiro
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) {
    return <>{loadingComponent}</>
  }

  if (error) {
    console.error('Erro ao verificar permissão na rota:', error)
    return unauthorizedComponent ? <>{unauthorizedComponent}</> : <Navigate to={fallbackPath} replace />
  }

  if (!hasPermission) {
    return unauthorizedComponent ? <>{unauthorizedComponent}</> : <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}

// Rota protegida por roles
export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  roles,
  requireAll = false,
  userId,
  fallbackPath = '/unauthorized',
  loadingComponent = <DefaultLoadingComponent />,
  unauthorizedComponent = <DefaultUnauthorizedComponent />
}) => {
  const { user } = useAuthStore()
  const { data: permissions, isLoading } = useCurrentUserPermissions()

  // Verificar se está autenticado primeiro
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) {
    return <>{loadingComponent}</>
  }

  if (!permissions) {
    return unauthorizedComponent ? <>{unauthorizedComponent}</> : <Navigate to={fallbackPath} replace />
  }

  // Converter roles para array se necessário
  const roleArray = Array.isArray(roles) ? roles : [roles]
  
  // Verificar se o usuário tem os roles necessários
  const hasRequiredRoles = requireAll
    ? roleArray.every(role => permissions.roles.includes(role))
    : roleArray.some(role => permissions.roles.includes(role))

  if (!hasRequiredRoles) {
    return unauthorizedComponent ? <>{unauthorizedComponent}</> : <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}

// Rota protegida para administradores
export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
  requireSuperAdmin = false,
  userId,
  fallbackPath = '/unauthorized',
  loadingComponent = <DefaultLoadingComponent />,
  unauthorizedComponent = <DefaultUnauthorizedComponent />
}) => {
  const { user } = useAuthStore()
  const { isAdmin, isSuperAdmin } = useIsAdmin(userId)

  // Verificar se está autenticado primeiro
  if (!user) {
    return <Navigate to="/login" replace />
  }

  const hasAccess = requireSuperAdmin ? isSuperAdmin : isAdmin

  if (!hasAccess) {
    return unauthorizedComponent ? <>{unauthorizedComponent}</> : <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}

// Componente composto que combina múltiplas proteções
interface MultiProtectedRouteProps extends BaseProtectedRouteProps {
  authRequired?: boolean
  permissions?: Array<{ resource: string; action: string }>
  roles?: string[]
  requireAllPermissions?: boolean
  requireAllRoles?: boolean
  adminRequired?: boolean
  superAdminRequired?: boolean
}

export const MultiProtectedRoute: React.FC<MultiProtectedRouteProps> = ({
  children,
  authRequired = true,
  permissions = [],
  roles = [],
  requireAllPermissions = true,
  requireAllRoles = false,
  adminRequired = false,
  superAdminRequired = false,
  fallbackPath = '/unauthorized',
  loadingComponent = <DefaultLoadingComponent />,
  unauthorizedComponent = <DefaultUnauthorizedComponent />
}) => {
  const { user } = useAuthStore()

  // Verificar autenticação primeiro
  if (authRequired && !user) {
    return <Navigate to="/login" replace />
  }

  // Se requer super admin
  if (superAdminRequired) {
    return (
      <AdminProtectedRoute
        requireSuperAdmin={true}
        fallbackPath={fallbackPath}
        loadingComponent={loadingComponent}
        unauthorizedComponent={unauthorizedComponent}
      >
        {children}
      </AdminProtectedRoute>
    )
  }

  // Se requer admin
  if (adminRequired) {
    return (
      <AdminProtectedRoute
        requireSuperAdmin={false}
        fallbackPath={fallbackPath}
        loadingComponent={loadingComponent}
        unauthorizedComponent={unauthorizedComponent}
      >
        {children}
      </AdminProtectedRoute>
    )
  }

  // Se tem roles específicos
  if (roles.length > 0) {
    return (
      <RoleProtectedRoute
        roles={roles}
        requireAll={requireAllRoles}
        fallbackPath={fallbackPath}
        loadingComponent={loadingComponent}
        unauthorizedComponent={unauthorizedComponent}
      >
        {children}
      </RoleProtectedRoute>
    )
  }

  // Se tem permissões específicas
  if (permissions.length > 0) {
    // Para múltiplas permissões, usamos a primeira como base
    // Em uma implementação real, você criaria um hook que verifica múltiplas permissões
    const firstPermission = permissions[0]
    return (
      <PermissionProtectedRoute
        resource={firstPermission.resource}
        action={firstPermission.action}
        fallbackPath={fallbackPath}
        loadingComponent={loadingComponent}
        unauthorizedComponent={unauthorizedComponent}
      >
        {children}
      </PermissionProtectedRoute>
    )
  }

  // Se chegou até aqui, só precisa de autenticação
  return authRequired ? (
    <AuthProtectedRoute
      fallbackPath="/login"
      loadingComponent={loadingComponent}
    >
      {children}
    </AuthProtectedRoute>
  ) : (
    <>{children}</>
  )
}

// Hook para facilitar o uso
export const useRouteProtection = () => {
  const { user } = useAuthStore()
  const { isAdmin, isSuperAdmin } = useIsAdmin()

  return {
    isAuthenticated: !!user,
    isAdmin,
    isSuperAdmin,
    canAccess: {
      admin: isAdmin,
      superAdmin: isSuperAdmin,
      user: !!user
    }
  }
}

// Utilitário para definir rotas protegidas
export const createProtectedRoute = (
  component: React.ComponentType,
  protection: {
    auth?: boolean
    resource?: string
    action?: string
    roles?: string[]
    adminOnly?: boolean
    superAdminOnly?: boolean
  }
) => {
  return (props: any) => {
    if (protection.superAdminOnly) {
      return (
        <AdminProtectedRoute requireSuperAdmin={true}>
          {React.createElement(component, props)}
        </AdminProtectedRoute>
      )
    }

    if (protection.adminOnly) {
      return (
        <AdminProtectedRoute>
          {React.createElement(component, props)}
        </AdminProtectedRoute>
      )
    }

    if (protection.roles && protection.roles.length > 0) {
      return (
        <RoleProtectedRoute roles={protection.roles}>
          {React.createElement(component, props)}
        </RoleProtectedRoute>
      )
    }

    if (protection.resource && protection.action) {
      return (
        <PermissionProtectedRoute 
          resource={protection.resource} 
          action={protection.action}
        >
          {React.createElement(component, props)}
        </PermissionProtectedRoute>
      )
    }

    if (protection.auth !== false) {
      return (
        <AuthProtectedRoute>
          {React.createElement(component, props)}
        </AuthProtectedRoute>
      )
    }

    return React.createElement(component, props)
  }
} 