#!/usr/bin/env node

// Script para configurar Evolution API
console.log('🔧 Configuração Evolution API para Conversas Reais\n')

const fs = require('fs')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setupEvolution() {
  try {
    console.log('📋 Vamos configurar sua Evolution API:\n')
    
    const apiUrl = await question('🌐 URL da Evolution API (ex: https://evolution.meudominio.com): ')
    const apiKey = await question('🔑 Chave API: ')
    const instanceName = await question('📱 Nome da instância (ex: minha-empresa): ')
    
    console.log('\n🔍 Testando conexão...')
    
    // Test connection
    const response = await fetch(`${apiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ CONEXÃO OK!')
      console.log(`📊 Instâncias encontradas: ${Array.isArray(data) ? data.length : 0}`)
      
      // Create .env.local content
      const envContent = `# Configuração Evolution API
VITE_EVOLUTION_API_URL=${apiUrl}
VITE_EVOLUTION_API_KEY=${apiKey}
VITE_EVOLUTION_INSTANCE_NAME=${instanceName}

# Outras configurações (mantenha as existentes)
VITE_GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_APP_NAME=Sistema de Agentes de IA
VITE_APP_VERSION=1.0.0`
      
      console.log('\n📄 Criando arquivo .env.local...')
      fs.writeFileSync('.env.local', envContent)
      console.log('✅ Arquivo .env.local criado!')
      
      console.log('\n🔄 Reinicie o servidor (npm run dev) para aplicar as mudanças.')
      console.log('📱 Agora as conversas reais aparecerão na interface!')
      
    } else {
      console.log('❌ ERRO na conexão:')
      console.log(`Status: ${response.status}`)
      console.log(`Resposta: ${await response.text()}`)
      
      if (response.status === 401) {
        console.log('\n💡 Chave API incorreta')
      } else if (response.status === 404) {
        console.log('\n💡 URL incorreta ou Evolution API não está rodando')
      }
    }
    
  } catch (error) {
    console.log('❌ ERRO:', error.message)
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Dicas:')
      console.log('- Evolution API não está rodando')
      console.log('- Verifique se a URL está correta')
      console.log('- Confirme se a porta está aberta')
    }
  }
  
  rl.close()
}

// Função para fazer fetch em Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch')
}

setupEvolution() 