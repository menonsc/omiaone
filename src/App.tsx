import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import { SignUpPage } from './pages/SignUpPage'
import { useEffect, Suspense, lazy } from 'react'
import { PageLoading, SuspenseFallback, LazyErrorBoundary } from './utils/lazyLoading'
import { ConfirmEmailPage } from './pages/ConfirmEmailPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { 
  AuthProtectedRoute, 
  PermissionProtectedRoute, 
  AdminProtectedRoute,
  RoleProtectedRoute 
} from './components/ProtectedRoute'
import SettingsProfile from './pages/settings/Profile'
import SettingsPreferences from './pages/settings/Preferences'
import SettingsSecurity from './pages/settings/Security'
import SettingsAI from './pages/settings/AI'
import SettingsWebhooks from './pages/settings/Webhooks'
import SettingsInstances from './pages/settings/Instances'
import SettingsIntegrations from './pages/settings/Integrations'

// Lazy Loading das páginas pesadas
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Chat = lazy(() => import('./pages/Chat'))
const Agents = lazy(() => import('./pages/Agents'))
const WhatsApp = lazy(() => import('./pages/WhatsApp'))
const WhatsAppConversations = lazy(() => import('./pages/WhatsAppConversations'))
const WhatsAppReactQuery = lazy(() => import('./pages/WhatsAppReactQuery'))
const Documents = lazy(() => import('./pages/Documents'))
const EmailMarketing = lazy(() => import('./pages/EmailMarketing'))
const YampiTestLocal = lazy(() => import('./pages/YampiTestLocal'))
const YampiDashboard = lazy(() => import('./pages/YampiDashboard'))
const Analytics = lazy(() => import('./pages/Analytics'))
const FeedbackDemo = lazy(() => import('./pages/FeedbackDemo'))
const SessionManagementPage = lazy(() => import('./pages/SessionManagementPage'))
const RoleManagement = lazy(() => import('./pages/RoleManagement'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const SystemStatus = lazy(() => import('./pages/SystemStatus'))

// Página de acesso negado
const UnauthorizedPage = () => (
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
      <div className="space-x-4">
        <button 
          onClick={() => window.history.back()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Voltar
        </button>
        <a 
          href="/"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Ir para Dashboard
        </a>
      </div>
    </div>
  </div>
)

function App() {
  const { user, initialize } = useAuthStore()

  useEffect(() => {
    // Initialize auth state
    initialize().catch(console.error)
  }, [initialize])

  if (user === undefined) {
    // Loading state
    return <PageLoading />
  }

  // Se não há usuário, mostrar páginas de autenticação
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Se há usuário autenticado, mostrar app principal com proteções RBAC
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Dashboard - Acesso geral (todos usuários autenticados) */}
            <Route index element={
              <AuthProtectedRoute>
                <Dashboard />
              </AuthProtectedRoute>
            } />
            
            {/* Chat - Permissão específica para chat */}
            <Route path="chat" element={
              <PermissionProtectedRoute 
                resource="chat" 
                action="read"
                unauthorizedComponent={<UnauthorizedPage />}
              >
                <Chat />
              </PermissionProtectedRoute>
            } />
            <Route path="chat/:agentId/:sessionId?" element={
              <PermissionProtectedRoute 
                resource="chat" 
                action="read"
                unauthorizedComponent={<UnauthorizedPage />}
              >
                <Chat />
              </PermissionProtectedRoute>
            } />
            
            {/* WhatsApp - Permissões específicas */}
            <Route path="whatsapp" element={
              <PermissionProtectedRoute 
                resource="whatsapp" 
                action="read"
                unauthorizedComponent={<UnauthorizedPage />}
              >
                <WhatsApp />
              </PermissionProtectedRoute>
            } />
            <Route path="whatsapp-conversations" element={
              <PermissionProtectedRoute 
                resource="whatsapp" 
                action="read"
                unauthorizedComponent={<UnauthorizedPage />}
              >
                <WhatsAppConversations />
              </PermissionProtectedRoute>
            } />
            <Route path="whatsapp-react-query" element={
              <PermissionProtectedRoute 
                resource="whatsapp" 
                action="read"
                unauthorizedComponent={<UnauthorizedPage />}
              >
                <WhatsAppReactQuery />
              </PermissionProtectedRoute>
            } />
            
            {/* Agents - Permissão para gerenciar agentes */}
            <Route path="agents" element={
              <PermissionProtectedRoute 
                resource="agents" 
                action="read"
                unauthorizedComponent={<UnauthorizedPage />}
              >
                <Agents />
              </PermissionProtectedRoute>
            } />
            
            {/* Documents - Permissão para documentos */}
            <Route path="documents" element={
              <PermissionProtectedRoute 
                resource="documents" 
                action="read"
                unauthorizedComponent={<UnauthorizedPage />}
              >
                <Documents />
              </PermissionProtectedRoute>
            } />
            
            {/* Analytics - Apenas para moderadores e acima */}
            <Route path="analytics" element={
              <RoleProtectedRoute 
                roles={['moderator', 'admin', 'super_admin']}
                requireAll={false}
                unauthorizedComponent={<UnauthorizedPage />}
              >
                <Analytics />
              </RoleProtectedRoute>
            } />
            
            {/* Email Marketing - Permissão específica */}
            <Route path="email-marketing" element={
              <PermissionProtectedRoute 
                resource="email_marketing" 
                action="read"
                unauthorizedComponent={<UnauthorizedPage />}
              >
                <EmailMarketing />
              </PermissionProtectedRoute>
            } />
            
            {/* Yampi - Permissões de integração */}
            <Route path="yampi" element={
              <PermissionProtectedRoute 
                resource="integrations" 
                action="read"
                unauthorizedComponent={<UnauthorizedPage />}
              >
                <YampiDashboard />
              </PermissionProtectedRoute>
            } />
            <Route path="yampi-test" element={
              <AdminProtectedRoute 
                requireSuperAdmin={false}
                unauthorizedComponent={<UnauthorizedPage />}
              >
                <YampiTestLocal />
              </AdminProtectedRoute>
            } />
            
            {/* Settings - Acesso geral com algumas restrições internas */}
            <Route path="settings">
              <Route path="profile" element={<SettingsProfile />} />
              <Route path="preferences" element={<SettingsPreferences />} />
              <Route path="security" element={<SettingsSecurity />} />
              <Route path="ai" element={<SettingsAI />} />
              <Route path="webhooks" element={<SettingsWebhooks />} />
              <Route path="instances" element={<SettingsInstances />} />
              <Route path="integrations" element={<SettingsIntegrations />} />
              {/* Fallback: redirecionar para profile se rota não encontrada */}
              <Route index element={<SettingsProfile />} />
            </Route>
            
            {/* Sessions - Apenas para o próprio usuário ou admins */}
            <Route path="sessions" element={
              <AuthProtectedRoute>
                <SessionManagementPage />
              </AuthProtectedRoute>
            } />
            
            {/* Role Management - Apenas Super Admins */}
            <Route path="roles" element={
              <AdminProtectedRoute 
                requireSuperAdmin={true}
                unauthorizedComponent={<UnauthorizedPage />}
              >
                <RoleManagement />
              </AdminProtectedRoute>
            } />
            
            {/* User Management - Apenas Admins */}
            <Route path="users" element={
              <AdminProtectedRoute 
                requireSuperAdmin={false}
                unauthorizedComponent={<UnauthorizedPage />}
              >
                <UserManagement />
              </AdminProtectedRoute>
            } />
            
            {/* System Status - Apenas Super Admins */}
            <Route path="status" element={
              <AdminProtectedRoute 
                requireSuperAdmin={true}
                unauthorizedComponent={<UnauthorizedPage />}
              >
                <SystemStatus />
              </AdminProtectedRoute>
            } />
            
            {/* Feedback Demo - Acesso geral para testes */}
            <Route path="feedback-demo" element={
              <AuthProtectedRoute>
                <FeedbackDemo />
              </AuthProtectedRoute>
            } />
          </Route>
          
          {/* Página de acesso negado */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Redirecionamentos para usuários logados */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="/confirm-email" element={<Navigate to="/" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/" replace />} />
          <Route path="/reset-password" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </LazyErrorBoundary>
  )
}

export default App 