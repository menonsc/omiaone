import React from 'react'
import { validatePassword } from '../../services/auth'
import type { PasswordValidation } from '../../services/auth'

interface PasswordValidatorProps {
  password: string
  className?: string
}

export const PasswordValidator: React.FC<PasswordValidatorProps> = ({ 
  password, 
  className = '' 
}) => {
  const validation: PasswordValidation = validatePassword(password)

  const getStrengthColor = (strength: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'strong': return 'bg-green-500'
    }
  }

  const getStrengthText = (strength: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak': return 'Fraca'
      case 'medium': return 'Média'
      case 'strong': return 'Forte'
    }
  }

  const getProgressWidth = (score: number) => {
    return Math.min((score / 7) * 100, 100)
  }

  if (!password.trim()) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Barra de progresso da força da senha */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Força da senha:</span>
          <span className={`font-medium ${
            validation.strength === 'weak' ? 'text-red-600' :
            validation.strength === 'medium' ? 'text-yellow-600' : 
            'text-green-600'
          }`}>
            {getStrengthText(validation.strength)}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(validation.strength)}`}
            style={{ width: `${getProgressWidth(validation.score)}%` }}
          />
        </div>
      </div>

      {/* Lista de critérios */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-gray-700">Critérios:</h4>
        <ul className="space-y-1 text-sm">
          {[
            { 
              key: 'length', 
              text: 'Pelo menos 8 caracteres',
              valid: password.length >= 8
            },
            { 
              key: 'lowercase', 
              text: 'Uma letra minúscula',
              valid: /[a-z]/.test(password)
            },
            { 
              key: 'uppercase', 
              text: 'Uma letra maiúscula',
              valid: /[A-Z]/.test(password)
            },
            { 
              key: 'number', 
              text: 'Um número',
              valid: /\d/.test(password)
            },
            { 
              key: 'special', 
              text: 'Um caractere especial',
              valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)
            }
          ].map(criterion => (
            <li key={criterion.key} className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                criterion.valid ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {criterion.valid && (
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                )}
              </div>
              <span className={criterion.valid ? 'text-green-600' : 'text-gray-500'}>
                {criterion.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Critérios extras para senha forte */}
      {password.length >= 8 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-700">Para senha mais forte:</h4>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                password.length >= 12 ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {password.length >= 12 && (
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                )}
              </div>
              <span className={password.length >= 12 ? 'text-green-600' : 'text-gray-500'}>
                12+ caracteres
              </span>
            </li>
          </ul>
        </div>
      )}

      {/* Mostrar erros se houver */}
      {validation.errors.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-red-600">Pendências:</h4>
          <ul className="space-y-1 text-sm text-red-600">
            {validation.errors.map((error, index) => (
              <li key={index} className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default PasswordValidator 