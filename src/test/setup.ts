import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock das variáveis de ambiente
process.env.VITE_GOOGLE_GEMINI_API_KEY = 'test-gemini-key'
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'test-supabase-key'
process.env.VITE_EVOLUTION_API_URL = 'http://localhost:8080'
process.env.VITE_EVOLUTION_API_KEY = 'test-evolution-key'
process.env.VITE_EVOLUTION_INSTANCE_NAME = 'test-instance'
process.env.VITE_MAILGUN_API_KEY = 'test-mailgun-key'
process.env.VITE_MAILGUN_DOMAIN = 'test.mailgun.com'

// Função utilitária para criar mocks encadeáveis do Supabase
function createSupabaseQueryMock() {
  const mock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    then: vi.fn().mockReturnThis(),
  }
  return mock
}

// Mock global do Supabase com métodos encadeáveis
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    }),
    getSession: vi.fn().mockResolvedValue({ 
      data: { session: null }, 
      error: null 
    }),
    signUp: vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' }
        },
        session: null
      },
      error: null
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' }
        },
        session: {
          access_token: 'test-token',
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        }
      },
      error: null
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ 
      data: {}, 
      error: null 
    }),
    updateUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null
    }),
    resend: vi.fn().mockResolvedValue({
      data: {},
      error: null
    }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    }),
  },
  from: vi.fn(() => createSupabaseQueryMock()),
  rpc: vi.fn().mockReturnValue({
    data: null,
    error: null,
    then: vi.fn().mockResolvedValue({ data: null, error: null })
  })
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

// Mock do window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock básico do fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue({}),
  text: vi.fn().mockResolvedValue(''),
})

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock do sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
})

// Limpar mocks entre testes
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
  
  // Reset do mock do Supabase
  mockSupabaseClient.from.mockImplementation(() => createSupabaseQueryMock())
  mockSupabaseClient.rpc.mockReturnValue({
    data: null,
    error: null,
    then: vi.fn().mockResolvedValue({ data: null, error: null })
  })
}) 