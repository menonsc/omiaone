#!/usr/bin/env node

const { io } = require('socket.io-client');

// Configurações do ambiente
const config = {
  baseURL: 'https://evolution.elevroi.com.br',
  apiKey: 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB',
  instanceName: 'rec_emanoel'
};

console.log('🔌 Testando WebSocket com Evolution API...');
console.log('📋 Configurações:');
console.log(`   Base URL: ${config.baseURL}`);
console.log(`   API Key: ***${config.apiKey.slice(-4)}`);
console.log(`   Instance: ${config.instanceName}`);

const socket = io(config.baseURL, {
  transports: ['websocket', 'polling'],
  auth: { 
    apikey: config.apiKey,
    instance: config.instanceName
  },
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000,
  timeout: 10000,
  path: '/socket.io/',
  autoConnect: true
});

socket.on('connect', () => {
  console.log('✅ WebSocket conectado com sucesso!');
  console.log('🔌 Socket ID:', socket.id);
  
  // Envia dados da instância
  socket.emit('join', { instance: config.instanceName });
  console.log('📡 Enviado comando join para instância:', config.instanceName);
  
  // Escuta por eventos de mensagem
  socket.on('MESSAGE_UPSERT', (data) => {
    console.log('📨 Mensagem recebida (MESSAGE_UPSERT):', data);
  });
  
  socket.on('messages.upsert', (data) => {
    console.log('📨 Mensagem recebida (messages.upsert):', data);
  });
  
  socket.on('CONNECTION_UPDATE', (data) => {
    console.log('🔌 Atualização de conexão:', data);
  });
  
  console.log('🎧 Aguardando eventos... (pressione Ctrl+C para sair)');
});

socket.on('connect_error', (error) => {
  console.error('❌ Erro na conexão WebSocket:', error.message);
  console.error('❌ Detalhes do erro:', {
    message: error.message,
    type: error.type,
    description: error.description
  });
});

socket.on('disconnect', (reason) => {
  console.log('🔌 WebSocket desconectado:', reason);
});

socket.on('error', (error) => {
  console.error('❌ Erro no WebSocket:', error);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('🔄 Reconectado após', attemptNumber, 'tentativas');
});

socket.on('reconnect_error', (error) => {
  console.error('❌ Erro na reconexão:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando conexão WebSocket...');
  socket.disconnect();
  process.exit(0);
}); 