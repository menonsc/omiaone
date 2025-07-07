import React from 'react'
import { useState, useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Bot, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import useSessionManager from '../hooks/useSessionManager'

export default function LoginPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [inactivityMessage, setInactivityMessage] = useState<string | null>(null)

  const { signIn } = useAuthStore()
  const { addNotification } = useUIStore()
  const { setRememberMe: setSessionRememberMe } = useSessionManager()

  // Verificar se há mensagem de sucesso vinda do estado da navegação
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      // Limpar a mensagem após 5 segundos
      setTimeout(() => setSuccessMessage(null), 5000)
    }

    // Verificar se foi logout por inatividade
    const reason = searchParams.get('reason')
    if (reason === 'inactivity') {
      setInactivityMessage('Sua sessão expirou devido à inatividade. Por favor, faça login novamente.')
      setTimeout(() => setInactivityMessage(null), 8000)
    }
  }, [location.state, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Por favor, preencha todos os campos'
      })
      return
    }

    setIsLoading(true)
    
    try {
      // Configurar "lembre-se de mim" antes do login
      setSessionRememberMe(rememberMe)
      
      await signIn(email, password)
      addNotification({
        type: 'success',
        title: 'Sucesso',
        message: 'Login realizado com sucesso!'
      })
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erro no Login',
        message: error.message || 'Credenciais inválidas'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-100 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <Bot className="w-12 h-12 text-primary-600" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-neutral-900 dark:text-white">
            Cursor
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-gray-400">
            Plataforma de Produtividade com IA
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Inactivity Message */}
        {inactivityMessage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <p className="text-sm text-yellow-700">{inactivityMessage}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 dark:bg-gray-700 dark:text-white"
                placeholder="seu.email@empresa.com"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-gray-300">
                  Senha
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 pr-10 border border-neutral-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-neutral-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-neutral-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-600 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-700 dark:text-gray-300">
                Lembre-se de mim
              </label>
            </div>
            
            <div className="text-xs text-neutral-500 dark:text-gray-400">
              {rememberMe ? 'Sessão será mantida por 30 dias' : 'Sessão expira ao fechar o navegador'}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Entrando...
              </div>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-neutral-600 dark:text-gray-400">
            Não tem uma conta?{' '}
            <Link
              to="/signup"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Criar conta
            </Link>
          </p>
          <p className="text-xs text-neutral-500 dark:text-gray-400">
            Problemas para acessar? Entre em contato com o suporte
          </p>
        </div>
      </div>
    </div>
  )
} 