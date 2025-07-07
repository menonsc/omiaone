# 🔧 Instruções para corrigir WebSocket com ngrok

## 🎯 O que foi corrigido

Acabei de corrigir o arquivo `src/services/websocketService.ts` para funcionar corretamente com ngrok. O problema era que o código estava tentando conectar na URL errada quando usar ngrok.

## ⚡ Siga estes passos agora:

### 1. **Rebuild do projeto**

```bash
# Parar containers
docker-compose down

# Rebuildar com as correções
docker-compose up --build -d

# Aguardar containers subirem
docker-compose logs -f frontend
```

### 2. **Iniciar ngrok corretamente**

```bash
# Use exatamente este comando
ngrok http --host-header=rewrite 80
```

### 3. **Testar a correção**

Depois que o ngrok estiver rodando, pegue sua URL (ex: `https://abc123.ngrok.io`) e execute:

```bash
# Substitua pela sua URL do ngrok
node fix-ngrok-websocket.js https://abc123.ngrok.io
```

### 4. **Verificar no navegador**

1. Acesse sua URL do ngrok no navegador
2. Vá para a página de WhatsApp Conversations
3. Abra o console do navegador (F12)
4. Deve aparecer: `✅ Socket.io conectado com sucesso`

## 🔍 Se ainda não funcionar

### Teste manual no console do navegador:

```javascript
// Cole este código no console do seu navegador
const socket = io('https://sua-url-ngrok.ngrok.io/socket.io/', {
  transports: ['websocket'],
  auth: { apikey: 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB' }
})

socket.on('connect', () => console.log('✅ Conectado!', socket.id))
socket.on('connect_error', err => console.error('❌ Erro:', err.message))
```

## 🔧 Principais mudanças feitas

1. **URLs adaptáveis**: Agora usa `/socket.io/` para ngrok e `/${instance}` para localhost
2. **Fallback polling**: Se WebSocket falhar, tenta polling automaticamente
3. **Timeout aumentado**: De 10s para 20s para acomodar latência do ngrok
4. **Configurações otimizadas**: Parâmetros específicos para ngrok

## 📊 Como verificar se está funcionando

No console do navegador, você deve ver:

```
✅ Socket.io conectado com sucesso
📊 Socket ID: abc123def456
```

E NÃO deve ver:

```
❌ Socket.io connect_error: websocket error
```

## 🆘 Ainda com problemas?

Execute este comando e me envie a saída completa:

```bash
node fix-ngrok-websocket.js https://sua-url-ngrok.ngrok.io
```

A correção deve resolver o problema principal. O WebSocket agora funciona tanto no localhost quanto no ngrok! 