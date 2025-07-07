import { supabase } from './supabase'
import type { User, AuthError } from '@supabase/supabase-js'
import type { Profile } from '../types'

export interface SignUpData {
  email: string
  password: string
  fullName: string
  acceptedTerms: boolean
  termsVersion?: string
  ipAddress?: string
}

export interface SignInData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface ResetPasswordData {
  email: string
}

export interface UpdatePasswordData {
  currentPassword: string
  newPassword: string
}

export interface PasswordValidation {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
  score: number
}

// Validação de força da senha
export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = []
  let score = 0

  // Critérios mínimos
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres')
  } else {
    score += 1
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula')
  } else {
    score += 1
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula')
  } else {
    score += 1
  }

  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número')
  } else {
    score += 1
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial')
  } else {
    score += 1
  }

  // Verificações adicionais
  if (password.length >= 12) {
    score += 1
  }

  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
    score += 1
  }

  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  if (score >= 6) strength = 'strong'
  else if (score >= 4) strength = 'medium'

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  }
}

// Validação de email mais rigorosa
export const validateEmail = (email: string): boolean => {
  // Verificar se o email não está vazio
  if (!email || email.trim() === '') {
    return false
  }

  // Regex mais rigorosa para validação de email
  const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/
  
  // Verificar se não contém espaços
  if (email.includes(' ')) {
    return false
  }
  
  // Verificar se não tem pontos consecutivos
  if (email.includes('..')) {
    return false
  }
  
  // Verificar se não começa ou termina com ponto
  if (email.startsWith('.') || email.endsWith('.')) {
    return false
  }
  
  // Verificar se o @ não está no início ou fim
  if (email.startsWith('@') || email.endsWith('@')) {
    return false
  }
  
  // Verificar se tem apenas um @
  if (email.split('@').length !== 2) {
    return false
  }
  
  // Aplicar o regex
  return emailRegex.test(email)
}

// Lista de domínios de email temporários bloqueados
const BLOCKED_EMAIL_DOMAINS = [
  '10minutemail.com',
  'tempmail.org',
  'guerrillamail.com',
  'mailinator.com',
  'yopmail.com'
]

export const isTemporaryEmail = (email: string): boolean => {
  const domain = email.split('@')[1];
  return BLOCKED_EMAIL_DOMAINS.includes(domain.toLowerCase())
}

// Verificar se email já existe (será implementado com function edge posteriormente)
export const checkEmailExists = async (email: string): Promise<boolean> => {
  // Por enquanto, deixamos o Supabase Auth lidar com emails duplicados
  // durante o processo de signup. Em produção, implementar com Edge Function
  return false
}

// Cadastro de usuário
export const signUp = async (signUpData: SignUpData) => {
  const { email, password, fullName, acceptedTerms, termsVersion, ipAddress } = signUpData

  // Validações
  if (!validateEmail(email)) {
    throw new Error('Email inválido')
  }

  if (isTemporaryEmail(email)) {
    throw new Error('Emails temporários não são permitidos')
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    throw new Error('Senha não atende aos critérios: ' + passwordValidation.errors.join(', '))
  }

  if (!acceptedTerms) {
    throw new Error('É necessário aceitar os termos de uso')
  }

  // Criar usuário no Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        accepted_terms: true,
        terms_version: termsVersion || '1.0',
        signup_ip: ipAddress,
        signup_timestamp: new Date().toISOString()
      }
    }
  })

  if (error) {
    throw error
  }

  return data
}

// Login de usuário
export const signIn = async (signInData: SignInData) => {
  const { email, password, rememberMe } = signInData

  if (!validateEmail(email)) {
    throw new Error('Email inválido')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    throw error
  }

  // Se "lembre-se de mim" for false, usar sessionStorage
  if (!rememberMe) {
    // Nota: O Supabase Auth gerencia isso automaticamente
    // mas podemos ajustar a configuração da sessão se necessário
  }

  return data
}

// Logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

// Recuperação de senha
export const resetPassword = async (resetData: ResetPasswordData) => {
  const { email } = resetData

  if (!validateEmail(email)) {
    throw new Error('Email inválido')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })

  if (error) {
    throw error
  }
}

// Atualizar senha
export const updatePassword = async (updateData: UpdatePasswordData) => {
  const { newPassword } = updateData

  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.isValid) {
    throw new Error('Nova senha não atende aos critérios: ' + passwordValidation.errors.join(', '))
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    throw error
  }
}

// Reenviar email de confirmação
export const resendConfirmation = async (email: string) => {
  if (!validateEmail(email)) {
    throw new Error('Email inválido')
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email
  })

  if (error) {
    throw error
  }
}

// Obter usuário atual
export const getCurrentUser = async (): Promise<{ user: User | null; profile: Profile | null }> => {
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (!error) {
        profile = profileData
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
    }
  }

  return { user, profile }
}

// Atualizar perfil
export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// Hook de mudança de estado de autenticação
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

export default {
  validatePassword,
  validateEmail,
  isTemporaryEmail,
  checkEmailExists,
  signUp,
  signIn,
  signOut,
  resetPassword,
  updatePassword,
  resendConfirmation,
  getCurrentUser,
  updateProfile,
  onAuthStateChange
} 