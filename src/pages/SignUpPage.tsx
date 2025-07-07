import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../store/authStore'
import { validatePassword, validateEmail } from '../services/auth'
import { PasswordValidator } from '../components/ui/PasswordValidator'
import { useEmailValidation } from '../hooks/useEmailValidation'

interface SignUpFormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  acceptedTerms: boolean
}

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<SignUpFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false
  })
  
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPasswordValidator, setShowPasswordValidator] = useState(false)

  // Validação de email em tempo real
  const emailValidation = useEmailValidation(formData.email)

  // Obter IP do usuário (simulado)
  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name as keyof SignUpFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SignUpFormData, string>> = {}
    const passwordValidation = validatePassword(formData.password)

    // Validar nome completo
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Nome deve ter pelo menos 2 caracteres'
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido'
    } else if (emailValidation.hasError) {
      newErrors.email = emailValidation.error || 'Email inválido'
    }

    // Validar senha
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (!passwordValidation.isValid) {
      newErrors.password = 'Senha não atende aos critérios mínimos'
    }

    // Validar confirmação de senha
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem'
    }

    // Validar termos de uso
    if (!formData.acceptedTerms) {
      newErrors.acceptedTerms = 'Você deve aceitar os termos de uso'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const ipAddress = await getUserIP()
      
      await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        acceptedTerms: formData.acceptedTerms,
        termsVersion: '1.0',
        ipAddress
      })

      // Redirecionar para página de confirmação de email
      navigate('/confirm-email', { 
        state: { 
          email: formData.email,
          message: 'Cadastro realizado com sucesso! Verifique seu email para ativar a conta.'
        }
      })

    } catch (error: any) {
      console.error('Erro no cadastro:', error)
      
      // Tratar erros específicos
      if (error.message?.includes('User already registered')) {
        setErrors({ email: 'Este email já está cadastrado' })
      } else if (error.message?.includes('Email')) {
        setErrors({ email: error.message })
      } else if (error.message?.includes('Password')) {
        setErrors({ password: error.message })
      } else {
        setErrors({ email: 'Erro interno. Tente novamente.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInputClasses = (fieldName: keyof SignUpFormData) => {
    const baseClasses = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
    
    if (errors[fieldName]) {
      return `${baseClasses} border-red-500 focus:ring-red-500 focus:border-red-500`
    }
    
    return `${baseClasses} border-gray-300 focus:ring-blue-500 focus:border-blue-500`
  }

  // Validação do formulário
  const passwordValidation = validatePassword(formData.password)
  const isFormValid = passwordValidation.isValid && 
    emailValidation.isAvailable && 
    formData.fullName.trim().length >= 2 &&
    formData.password === formData.confirmPassword &&
    formData.acceptedTerms

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Criar nova conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Faça login
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Nome Completo */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nome Completo
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={getInputClasses('fullName')}
                  placeholder="Seu nome completo"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>
            </div>

            {/* Email */}
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
                  value={formData.email}
                  onChange={handleInputChange}
                  className={getInputClasses('email')}
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
                {emailValidation.statusMessage && (
                  <p className={`mt-1 text-sm ${emailValidation.statusColor}`}>
                    {emailValidation.statusMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => setShowPasswordValidator(true)}
                  className={getInputClasses('password')}
                  placeholder="Sua senha"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
              
              {/* Validador de senha */}
              {showPasswordValidator && formData.password && (
                <div className="mt-2">
                  <PasswordValidator password={formData.password} />
                </div>
              )}
            </div>

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Senha
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={getInputClasses('confirmPassword')}
                  placeholder="Confirme sua senha"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
                
                {/* Indicador de senhas coincidentes */}
                {formData.confirmPassword && formData.password && (
                  <p className={`mt-1 text-sm ${
                    formData.password === formData.confirmPassword 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formData.password === formData.confirmPassword 
                      ? 'Senhas coincidem' 
                      : 'Senhas não coincidem'
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Termos de Uso */}
            <div>
              <div className="flex items-center">
                <input
                  id="acceptedTerms"
                  name="acceptedTerms"
                  type="checkbox"
                  required
                  checked={formData.acceptedTerms}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="acceptedTerms" className="ml-2 block text-sm text-gray-900">
                  Eu aceito os{' '}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                    termos de uso
                  </Link>
                  {' '}e{' '}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                    política de privacidade
                  </Link>
                </label>
              </div>
              {errors.acceptedTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.acceptedTerms}</p>
              )}
            </div>

            {/* Botão de Cadastro */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 