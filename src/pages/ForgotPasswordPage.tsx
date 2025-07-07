import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import { resetPassword } from '../store/authStore'
import { validateEmail } from '../services/auth'

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validar email
    if (!email.trim()) {
      setError('Email é obrigatório')
      return
    }

    if (!validateEmail(email)) {
      setError('Email inválido')
      return
    }

    setIsSubmitting(true)

    try {
      await resetPassword(email)
      setIsSuccess(true)
    } catch (error: any) {
      console.error('Erro ao enviar reset:', error)
      setError('Erro ao enviar email de recuperação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <Mail className="h-12 w-12 text-green-600" />
            </div>
          </div>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email enviado!
          </h2>
          
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center space-y-4">
                <div className="text-gray-600">
                  <p className="text-sm mb-4">
                    Enviamos um link de recuperação de senha para:
                  </p>
                  <p className="font-medium text-gray-900 text-sm">
                    {email}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">
                      Próximos passos:
                    </h3>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Verifique sua caixa de entrada</li>
                      <li>Clique no link "Redefinir senha"</li>
                      <li>Crie uma nova senha segura</li>
                      <li>Se não encontrar, verifique o spam</li>
                    </ol>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar para login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Mail className="h-12 w-12 text-blue-600" />
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Esqueceu sua senha?
        </h2>
        
        <p className="mt-2 text-center text-sm text-gray-600">
          Digite seu email e enviaremos um link para redefinir sua senha
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                    error 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="seu@email.com"
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  'Enviar link de recuperação'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col space-y-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center text-sm text-blue-600 hover:text-blue-500"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar para login
              </Link>
              
              <p className="text-center text-sm text-gray-600">
                Não tem uma conta?{' '}
                <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                  Criar conta
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 