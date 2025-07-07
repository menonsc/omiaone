/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_GEMINI_API_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_EVOLUTION_API_URL: string
  readonly VITE_EVOLUTION_API_KEY: string
  readonly VITE_EVOLUTION_INSTANCE_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 