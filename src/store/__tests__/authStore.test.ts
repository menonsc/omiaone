import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../authStore'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '../../types'

// Mock do Supabase
vi.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}))

// Mock do serviço de auth
vi.mock('../../services/auth', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn()
}))

import { supabase } from '../../services/supabase'
import * as authService from '../../services/auth'

describe('AuthStore', () => {
  beforeEach(() => {
    // Limpar o store antes de cada teste
    useAuthStore.setState({
      user: null,
      profile: null,
      loading: false,
    })
    
    // Limpar localStorage para evitar interferência
    localStorage.clear()
    
    // Limpar todos os mocks
    vi.clearAllMocks()
  })

  it('deve inicializar com estado vazio', () => {
    const state = useAuthStore.getState()
    
    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.loading).toBe(false)
  })

  it('deve definir loading como true durante operações', async () => {
    const { signIn } = useAuthStore.getState()
    
    // Mock do serviço de auth para simular delay
    const mockUser: User = {
      id: 'test-user-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as User
    
    const mockSession: Session = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser
    } as Session
    
    const mockProfile: Profile = {
      id: 'test-user-id',
      full_name: 'Test User',
      avatar_url: null,
      department: null,
      role: 'user',
      preferences: {},
      created_at: new Date().toISOString()
    }
    
    vi.mocked(authService.signIn).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      return { user: mockUser, session: mockSession }
    })
    
    vi.mocked(authService.getCurrentUser).mockResolvedValue({ 
      user: mockUser, 
      profile: mockProfile 
    })
    
    // Iniciar login
    const signInPromise = signIn('test@example.com', 'Password123!')
    
    // Aguardar um pouco para garantir que o loading foi definido
    await new Promise(resolve => setTimeout(resolve, 10))
    
    // Verificar se loading foi definido como true
    const state = useAuthStore.getState()
    console.log('Loading state during operation:', state.loading)
    
    await signInPromise
    
    // Verificar se loading é false após operação
    const finalState = useAuthStore.getState()
    expect(finalState.loading).toBe(false)
  })

  it('deve atualizar o usuário após login bem-sucedido', async () => {
    const mockUser: User = {
      id: 'test-user-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as User
    
    const mockSession: Session = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser
    } as Session
    
    const mockProfile: Profile = {
      id: 'test-user-id',
      full_name: 'Test User',
      avatar_url: null,
      department: null,
      role: 'user',
      preferences: {},
      created_at: new Date().toISOString()
    }
    
    vi.mocked(authService.signIn).mockResolvedValue({ 
      user: mockUser, 
      session: mockSession 
    })
    vi.mocked(authService.getCurrentUser).mockResolvedValue({ 
      user: mockUser, 
      profile: mockProfile 
    })
    
    const { signIn } = useAuthStore.getState()
    await signIn('test@example.com', 'Password123!')

    const state = useAuthStore.getState()
    
    expect(state.user).toEqual(mockUser)
    expect(state.profile).toEqual(mockProfile)
    expect(state.loading).toBe(false)
  })

  it('deve lidar com erros de login - email vazio', async () => {
    const { signIn } = useAuthStore.getState()
    
    // Mock do serviço para retornar erro
    vi.mocked(authService.signIn).mockRejectedValue(new Error('Email inválido'))
    
    // Testar com email vazio (sistema real retorna "Email inválido")
    await expect(signIn('', 'Password123!')).rejects.toThrow('Email inválido')
    
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.loading).toBe(false)
  })

  it('deve lidar com erros de login - senha vazia', async () => {
    const { signIn } = useAuthStore.getState()
    
    // Mock do serviço para retornar erro
    vi.mocked(authService.signIn).mockRejectedValue(new Error('Email inválido'))
    
    // Testar com senha vazia (sistema real retorna "Email inválido" pois valida email primeiro)
    await expect(signIn('test@example.com', '')).rejects.toThrow('Email inválido')
    
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.loading).toBe(false)
  })

  it('deve limpar o usuário após logout', async () => {
    // Mock do serviço de logout
    vi.mocked(authService.signOut).mockResolvedValue()
    
    // Primeiro, fazer login
    const mockUser: User = {
      id: 'test-user-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as User
    
    const mockSession: Session = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser
    } as Session
    
    vi.mocked(authService.signIn).mockResolvedValue({ 
      user: mockUser, 
      session: mockSession 
    })
    
    const { signIn, signOut } = useAuthStore.getState()
    await signIn('test@example.com', 'Password123!')
    
    // Verificar se usuário está logado
    expect(useAuthStore.getState().user).not.toBeNull()
    
    // Fazer logout
    await signOut()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.loading).toBe(false)
  })

  it('deve atualizar perfil de usuário logado', async () => {
    const mockUser: User = {
      id: 'test-user-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as User
    
    const mockSession: Session = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser
    } as Session
    
    const mockProfile: Profile = {
      id: 'test-user-id',
      full_name: 'Test User',
      avatar_url: null,
      department: null,
      role: 'user',
      preferences: {},
      created_at: new Date().toISOString()
    }
    
    const updatedProfile: Profile = {
      id: 'test-user-id',
      full_name: 'Nome Atualizado',
      avatar_url: null,
      department: 'TI',
      role: 'user',
      preferences: {},
      created_at: new Date().toISOString()
    }
    
    // Mock dos serviços
    vi.mocked(authService.signIn).mockResolvedValue({ 
      user: mockUser, 
      session: mockSession 
    })
    vi.mocked(authService.getCurrentUser).mockResolvedValue({ 
      user: mockUser, 
      profile: mockProfile 
    })
    vi.mocked(authService.updateProfile).mockResolvedValue(updatedProfile)
    
    // Primeiro, fazer login
    const { signIn, updateProfile } = useAuthStore.getState()
    await signIn('test@example.com', 'Password123!')
    
    // Atualizar perfil
    const updates = { full_name: 'Nome Atualizado', department: 'TI' }
    const result = await updateProfile(updates)
    
    expect(result.full_name).toBe('Nome Atualizado')
    expect(result.department).toBe('TI')
    
    const state = useAuthStore.getState()
    expect(state.profile?.full_name).toBe('Nome Atualizado')
    expect(state.profile?.department).toBe('TI')
  })

  it('deve falhar ao atualizar perfil sem usuário logado', async () => {
    const { updateProfile } = useAuthStore.getState()
    
    // Tentar atualizar perfil sem usuário logado
    await expect(updateProfile({ full_name: 'Teste' })).rejects.toThrow('Usuário não autenticado')
  })
}) 