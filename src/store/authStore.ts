import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, Profile } from '../types'
import * as authService from '../services/auth'
import type { SignUpData, SignInData } from '../services/auth'
import sessionManager from '../services/sessionManager'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: undefined,
      profile: null,
      loading: false,

      initialize: async () => {
        try {
          set({ loading: true })
          
          // Obter usuário atual do Supabase
          const { user, profile } = await authService.getCurrentUser()
          set({ user, profile })
          
          // Configurar listener para mudanças de autenticação apenas uma vez
          if (!get().user) {
            authService.onAuthStateChange((event, session) => {
              if (event === 'SIGNED_IN' && session?.user) {
                set({ user: session.user })
                // Buscar perfil atualizado
                authService.getCurrentUser().then(({ profile }) => {
                  set({ profile })
                })
              } else if (event === 'SIGNED_OUT') {
                set({ user: null, profile: null })
              }
            })
          }
          
        } catch (error) {
          console.error('Erro ao inicializar auth:', error)
          set({ user: null, profile: null })
        } finally {
          set({ loading: false })
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ loading: true })
          
          const data = await authService.signIn({ email, password })
          
          if (data.user && data.session) {
            set({ user: data.user })
            
            // Buscar perfil do usuário
            const { profile } = await authService.getCurrentUser()
            set({ profile })
            
            // Criar sessão no sessionManager
            try {
              await sessionManager.createSession(data.session)
            } catch (sessionError) {
              console.warn('Erro ao criar sessão no sessionManager:', sessionError)
              // Não bloquear o login se houver erro na gestão de sessão
            }
          }
        } catch (error) {
          console.error('Erro no login:', error)
          throw error
        } finally {
          set({ loading: false })
        }
      },

      signOut: async () => {
        try {
          set({ loading: true })
          await authService.signOut()
          set({ user: null, profile: null })
        } catch (error) {
          console.error('Erro no logout:', error)
          throw error
        } finally {
          set({ loading: false })
        }
      },

      setUser: (user) => {
        set({ user })
        if (!user) {
          set({ profile: null })
        }
      },

      updateProfile: async (updates: Partial<Profile>) => {
        try {
          const { user } = get()
          if (!user) throw new Error('Usuário não autenticado')

          const updatedProfile = await authService.updateProfile(user.id, updates)
          set({ profile: updatedProfile })
          
          return updatedProfile
        } catch (error) {
          console.error('Erro ao atualizar perfil:', error)
          throw error
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        profile: state.profile 
      })
    }
  )
)

// Funções auxiliares para signup e recuperação de senha
export const signUp = async (signUpData: SignUpData) => {
  return await authService.signUp(signUpData)
}

export const resetPassword = async (email: string) => {
  return await authService.resetPassword({ email })
}

export const resendConfirmation = async (email: string) => {
  return await authService.resendConfirmation(email)
}