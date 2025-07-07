#!/usr/bin/env node

import { createServer } from 'http'
import { Server } from 'socket.io'
import { readFileSync } from 'fs'
import { join } from 'path'

const app = createServer((req, res) => {
  // Servir arquivos estáticos para teste
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('healthy\n')
    return
  }
  
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>WebSocket Test</title>
        </head>
        <body>
          <h1>WebSocket Test Server</h1>
          <p>Status: <span id="status">Connecting...</span></p>
          <script src="/socket.io/socket.io.js"></script>
          <script>
            const socket = io('/elevroi', {
              auth: { apikey: 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB' }
            })
            
            socket.on('connect', () => {
              document.getElementById('status').textContent = 'Connected: ' + socket.id
            })
            
            socket.on('disconnect', () => {
              document.getElementById('status').textContent = 'Disconnected'
            })
            
            socket.on('connect_error', (error) => {
              document.getElementById('status').textContent = 'Error: ' + error.message
            })
          </script>
        </body>
      </html>
    `)
    return
  }
  
  res.writeHead(404)
  res.end('Not found')
})

const io = new Server(app, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// Namespace para Evolution API
const evolutionNamespace = io.of('/elevroi')

evolutionNamespace.use((socket, next) => {
  const apiKey = socket.handshake.auth.apikey
  
  if (apiKey === 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB') {
    console.log('✅ Cliente autenticado:', socket.id)
    next()
  } else {
    console.log('❌ Cliente não autenticado:', socket.id)
    next(new Error('Authentication failed'))
  }
})

evolutionNamespace.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id)
  
  // Enviar status de conexão
  socket.emit('connection_status', { 
    status: 'connected', 
    instance: 'elevroi',
    timestamp: new Date().toISOString()
  })
  
  // Escutar mensagens
  socket.on('test', (data) => {
    console.log('📨 Mensagem de teste recebida:', data)
    socket.emit('test_response', { 
      message: 'Teste recebido com sucesso',
      timestamp: new Date().toISOString()
    })
  })
  
  // Escutar mensagens do WhatsApp
  socket.on('whatsapp_message', (data) => {
    console.log('📱 Mensagem do WhatsApp:', data)
    // Processar mensagem e enviar resposta
    socket.emit('whatsapp_response', {
      message: 'Mensagem processada',
      originalMessage: data,
      timestamp: new Date().toISOString()
    })
  })
  
  // Handler para o evento 'join' (entrar em sala)
  socket.on('join', ({ instance }) => {
    if (instance) {
      socket.join(instance)
      console.log('✅ Socket entrou na sala:', instance, 'ID:', socket.id)
    } else {
      console.log('⚠️ Evento join recebido sem instance')
    }
  })
  
  socket.on('disconnect', (reason) => {
    console.log('🔌 Cliente desconectado:', socket.id, 'Razão:', reason)
  })
  
  socket.on('error', (error) => {
    console.error('❌ Erro no socket:', error)
  })
})

const PORT = process.env.PORT || 3001

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor WebSocket rodando na porta ${PORT}`)
  console.log(`🔗 URL: http://localhost:${PORT}`)
  console.log(`📱 WebSocket: ws://localhost:${PORT}/elevroi`)
  console.log(`🏥 Health check: http://localhost:${PORT}/health`)
}) 