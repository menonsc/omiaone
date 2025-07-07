import { useState, useEffect, useCallback } from 'react'
import { validateEmail, checkEmailExists, isTemporaryEmail } from '../services/auth'

interface EmailValidationState {
  isValid: boolean
  isChecking: boolean
  exists: boolean
  error: string | null
  isAvailable: boolean
  hasError: boolean
}

export const useEmailValidation = (email: string, debounceMs: number = 500) => {
  const [state, setState] = useState<EmailValidationState>({
    isValid: false,
    isChecking: false,
    exists: false,
    error: null,
    isAvailable: false,
    hasError: false
  })

  const validateEmailAsync = useCallback(async (emailToValidate: string) => {
    if (!emailToValidate.trim()) {
      setState({
        isValid: false,
        isChecking: false,
        exists: false,
        error: null,
        isAvailable: false,
        hasError: false
      })
      return
    }

    setState(prev => ({ ...prev, isChecking: true, error: null }))

    try {
      // Validação básica de formato
      const isValidFormat = validateEmail(emailToValidate)
      
      if (!isValidFormat) {
        setState({
          isValid: false,
          isChecking: false,
          exists: false,
          error: 'Formato de email inválido',
          isAvailable: false,
          hasError: true
        })
        return
      }

      // Verificar se é email temporário
      if (isTemporaryEmail(emailToValidate)) {
        setState({
          isValid: false,
          isChecking: false,
          exists: false,
          error: 'Emails temporários não são permitidos',
          isAvailable: false,
          hasError: true
        })
        return
      }

      // Verificar se o email já existe
      const emailExists = await checkEmailExists(emailToValidate)

      setState({
        isValid: true,
        isChecking: false,
        exists: emailExists,
        error: emailExists ? 'Este email já está cadastrado' : null,
        isAvailable: !emailExists,
        hasError: emailExists
      })

    } catch (error) {
      setState({
        isValid: false,
        isChecking: false,
        exists: false,
        error: 'Erro ao verificar email',
        isAvailable: false,
        hasError: true
      })
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateEmailAsync(email)
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [email, debounceMs, validateEmailAsync])

  const getEmailStatus = () => {
    if (!email.trim()) return 'empty'
    if (state.isChecking) return 'checking'
    if (state.hasError) return 'error'
    if (state.isAvailable) return 'available'
    if (state.exists) return 'exists'
    return 'unknown'
  }

  const getStatusMessage = () => {
    if (state.error) return state.error
    if (state.isChecking) return 'Verificando...'
    if (state.isAvailable) return 'Email disponível'
    if (state.exists) return 'Este email já está cadastrado'
    return null
  }

  const getStatusColor = () => {
    const status = getEmailStatus()
    switch (status) {
      case 'checking': return 'text-gray-500'
      case 'error': return 'text-red-600'
      case 'available': return 'text-green-600'
      case 'exists': return 'text-red-600'
      default: return 'text-gray-500'
    }
  }

  return {
    ...state,
    status: getEmailStatus(),
    statusMessage: getStatusMessage(),
    statusColor: getStatusColor(),
    revalidate: () => validateEmailAsync(email)
  }
}

export default useEmailValidation 