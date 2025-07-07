#!/usr/bin/env node

/**
 * Script para diagnosticar e corrigir problemas de WebSocket com ngrok
 * Uso: node fix-ngrok-websocket.js <ngrok-url>
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { io } from 'socket.io-client'

const execAsync = promisify(exec)

class NgrokWebSocketFixer {
  constructor(ngrokUrl) {
    this.ngrokUrl = ngrokUrl
    this.apiKey = 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB'
    this.instanceName = 'elevroi'
  }

  async checkNgrokStatus() {
    console.log('🔍 Verificando status do ngrok...')
    
    try {
      const response = await fetch(`${this.ngrokUrl}/health`)
      console.log('✅ ngrok está acessível:', response.status)
      return true
    } catch (error) {
      console.log('❌ ngrok não está acessível:', error.message)
      console.log('\n🔧 SOLUÇÃO: Inicie o ngrok com:')
      console.log('   ngrok http --host-header=rewrite 80')
      return false
    }
  }

  async testWebSocketConnection() {
    console.log('\n🔍 Testando conexão WebSocket com ngrok...')
    
    const socket = io(`${this.ngrokUrl}/${this.instanceName}`, {
      transports: ['websocket'],
      auth: { apikey: this.apiKey },
      timeout: 10000,
      forceNew: true
    })

    return new Promise((resolve) => {
      let connected = false
      let error = null

      socket.on('connect', () => {
        console.log('✅ WebSocket conectado via ngrok!')
        console.log('📊 Socket ID:', socket.id)
        connected = true
        
        socket.emit('test', { message: 'Teste de conexão via ngrok' })
        
        setTimeout(() => {
          socket.disconnect()
          resolve({ success: true, connected: true })
        }, 2000)
      })

      socket.on('connect_error', (err) => {
        console.log('❌ Erro na conexão WebSocket:', err.message)
        error = err.message
        
        console.log('🔄 Tentando com polling como fallback...')
        socket.io.opts.transports = ['polling']
        socket.connect()
      })

      socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket desconectado:', reason)
        if (!connected) {
          resolve({ success: false, error, connected: false })
        }
      })

      socket.on('test_response', (data) => {
        console.log('📨 Resposta do teste:', data)
      })

      setTimeout(() => {
        if (!connected) {
          console.log('⏰ Timeout na conexão WebSocket')
          socket.disconnect()
          resolve({ success: false, error: 'Timeout', connected: false })
        }
      }, 15000)
    })
  }

  async checkDockerServices() {
    console.log('\n🔍 Verificando serviços Docker...')
    
    try {
      const { stdout } = await execAsync('docker-compose ps --format json')
      const services = stdout.split('\n').filter(line => line.trim()).map(line => JSON.parse(line))
      
      console.log('📊 Status dos serviços:')
      services.forEach(service => {
        const status = service.State === 'running' ? '✅' : '❌'
        console.log(`   ${status} ${service.Service}: ${service.State}`)
      })
      
      const websocketService = services.find(s => s.Service === 'websocket-server')
      if (!websocketService || websocketService.State !== 'running') {
        console.log('\n🔧 SOLUÇÃO: Reiniciar serviço WebSocket:')
        console.log('   docker-compose restart websocket-server')
        return false
      }
      
      return true
    } catch (error) {
      console.log('❌ Erro ao verificar serviços Docker:', error.message)
      return false
    }
  }

  async fixNginxConfig() {
    console.log('\n🔧 Verificando configuração do Nginx...')
    
    try {
      // Verificar se o nginx proxy está rodando
      const { stdout } = await execAsync('docker-compose logs nginx-proxy --tail=10')
      
      if (stdout.includes('error') || stdout.includes('failed')) {
        console.log('❌ Nginx com problemas, reiniciando...')
        await execAsync('docker-compose restart nginx-proxy')
        console.log('✅ Nginx reiniciado')
      } else {
        console.log('✅ Nginx funcionando corretamente')
      }
      
      return true
    } catch (error) {
      console.log('❌ Erro ao verificar Nginx:', error.message)
      return false
    }
  }

  async checkCors() {
    console.log('\n🔍 Verificando configuração CORS...')
    
    try {
      const response = await fetch(`${this.ngrokUrl}/socket.io/`, {
        method: 'OPTIONS',
        headers: {
          'Origin': this.ngrokUrl,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'content-type'
        }
      })
      
      const corsOrigin = response.headers.get('access-control-allow-origin')
      const corsMethods = response.headers.get('access-control-allow-methods')
      
      if (corsOrigin === '*' || corsOrigin === this.ngrokUrl) {
        console.log('✅ CORS configurado corretamente')
        return true
      } else {
        console.log('❌ CORS mal configurado')
        console.log('   Origin:', corsOrigin)
        console.log('   Methods:', corsMethods)
        return false
      }
    } catch (error) {
      console.log('❌ Erro ao verificar CORS:', error.message)
      return false
    }
  }

  async suggestFixes(testResult) {
    console.log('\n🔧 SOLUÇÕES RECOMENDADAS:')
    console.log('=' .repeat(50))
    
    if (!testResult.success) {
      console.log('\n1. 🔄 Reiniciar todos os serviços:')
      console.log('   docker-compose down')
      console.log('   docker-compose up --build -d')
      
      console.log('\n2. 🌐 Verificar comando ngrok:')
      console.log('   ngrok http --host-header=rewrite 80')
      console.log('   # OU para HTTPS:')
      console.log('   ngrok http --host-header=rewrite 443')
      
      console.log('\n3. 🔧 Atualizar variáveis de ambiente:')
      console.log('   # No .env, configure:')
      console.log(`   VITE_EVOLUTION_API_URL=${this.ngrokUrl}`)
      console.log(`   WEBSOCKET_URL=${this.ngrokUrl}`)
      
      console.log('\n4. 🛠️ Configuração específica para WebSocket:')
      console.log('   # Adicione no nginx-proxy.conf:')
      console.log('   proxy_set_header Upgrade $http_upgrade;')
      console.log('   proxy_set_header Connection $connection_upgrade;')
      
      console.log('\n5. 🔍 Debug no navegador:')
      console.log('   # Abra o console e execute:')
      console.log(`   const socket = io('${this.ngrokUrl}/${this.instanceName}', {`)
      console.log('     transports: ["websocket"],')
      console.log(`     auth: { apikey: "${this.apiKey}" }`)
      console.log('   })');
      console.log('   socket.on("connect", () => console.log("Conectado!"))');
      console.log('   socket.on("connect_error", err => console.error("Erro:", err))');
    } else {
      console.log('✅ WebSocket funcionando corretamente com ngrok!')
    }
  }

  async run() {
    console.log('🚀 Iniciando diagnóstico WebSocket + ngrok...')
    console.log('=' .repeat(50))
    console.log(`🔗 ngrok URL: ${this.ngrokUrl}`)
    console.log(`📱 Instance: ${this.instanceName}`)
    
    // 1. Verificar ngrok
    const ngrokOk = await this.checkNgrokStatus()
    if (!ngrokOk) return
    
    // 2. Verificar Docker
    const dockerOk = await this.checkDockerServices()
    if (!dockerOk) return
    
    // 3. Corrigir Nginx se necessário
    await this.fixNginxConfig()
    
    // 4. Verificar CORS
    await this.checkCors()
    
    // 5. Testar WebSocket
    const testResult = await this.testWebSocketConnection()
    
    // 6. Sugerir correções
    await this.suggestFixes(testResult)
    
    console.log('\n📊 DIAGNÓSTICO COMPLETO!')
    console.log('=' .repeat(50))
    
    if (testResult.success) {
      console.log('🎉 WebSocket funcionando perfeitamente com ngrok!')
    } else {
      console.log('⚠️ WebSocket com problemas. Siga as soluções acima.')
    }
  }
}

// Função principal
async function main() {
  const ngrokUrl = process.argv[2]
  
  if (!ngrokUrl) {
    console.log('❌ Uso: node fix-ngrok-websocket.js <ngrok-url>')
    console.log('📝 Exemplo: node fix-ngrok-websocket.js https://abc123.ngrok.io')
    process.exit(1)
  }
  
  const fixer = new NgrokWebSocketFixer(ngrokUrl)
  await fixer.run()
}

main().catch(console.error) 