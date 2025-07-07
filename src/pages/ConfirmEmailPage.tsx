import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { resendConfirmation } from '../store/authStore'

export const ConfirmEmailPage: React.FC = () => {
  const location = useLocation()
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  const email = location.state?.email || ''
  const message = location.state?.message || 'Verifique seu email para ativar a conta.'

  const handleResendEmail = async () => {
    if (!email) {
      setResendError('Email não encontrado. Por favor, tente se cadastrar novamente.')
      return
    }

    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      await resendConfirmation(email)
      setResendSuccess(true)
    } catch (error: any) {
      console.error('Erro ao reenviar email:', error)
      setResendError('Erro ao reenviar email. Tente novamente.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Confirme seu email
        </h2>
        
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center space-y-4">
              {/* Mensagem principal */}
              <div className="text-gray-600">
                <p className="text-sm mb-4">{message}</p>
                
                {email && (
                  <p className="text-sm">
                    Enviamos um email de confirmação para:
                  </p>
                )}
                
                {email && (
                  <p className="font-medium text-gray-900 text-sm mt-2">
                    {email}
                  </p>
                )}
              </div>

              {/* Instruções */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="text-left">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    Próximos passos:
                  </h3>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Verifique sua caixa de entrada</li>
                    <li>Procure por email da ElevROI Sistema</li>
                    <li>Clique no link de confirmação</li>
                    <li>Se não encontrar, verifique o spam/lixo eletrônico</li>
                  </ol>
                </div>
              </div>

              {/* Reenviar email */}
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Não recebeu o email?
                </div>
                
                {resendSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm text-green-700">
                      Email reenviado com sucesso! Verifique sua caixa de entrada.
                    </p>
                  </div>
                )}
                
                {resendError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">{resendError}</p>
                  </div>
                )}
                
                <button
                  onClick={handleResendEmail}
                  disabled={isResending || !email}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Reenviando...
                    </>
                  ) : (
                    'Reenviar email de confirmação'
                  )}
                </button>
              </div>

              {/* Links */}
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                <Link 
                  to="/login" 
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Voltar para login
                </Link>
                
                <Link 
                  to="/signup" 
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Criar outra conta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 