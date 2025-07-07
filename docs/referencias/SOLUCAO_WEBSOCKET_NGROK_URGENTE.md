# 🚨 SOLUÇÃO URGENTE: WebSocket com ngrok

## 🎯 Problema Identificado

O erro `websocket error` no ngrok acontece porque:
1. A configuração do WebSocket não está compatível com o ngrok
2. O `VITE_EVOLUTION_API_URL` aponta para a URL do ngrok mas o WebSocket está tentando conectar em URLs diferentes

## ⚡ SOLUÇÃO RÁPIDA (3 minutos)

### 1. **Atualizar a configuração do WebSocket**

Edite o arquivo `src/services/websocketService.ts` na linha 46:

```typescript
// ❌ PROBLEMA: URL incorreta
const wsUrl = this.config.baseURL.replace(/^http/, 'ws') + `/${instance}`

// ✅ SOLUÇÃO: URL correta para ngrok
const wsUrl = this.config.baseURL + `/socket.io/`
```

### 2. **Verificar variáveis de ambiente**

Certifique-se que seu arquivo `.env` tem:

```bash
VITE_EVOLUTION_API_URL=https://your-ngrok-url.ngrok.io
VITE_EVOLUTION_API_KEY=cvlGHKHMdf1bv6WYBGOr516WjEanxSxB
VITE_EVOLUTION_INSTANCE_NAME=elevroi
```

### 3. **Reiniciar apenas o frontend**

```bash
# Rebuildar apenas o frontend
docker-compose up --build -d frontend

# OU se não usar Docker
npm run build
npm run preview
```

### 4. **Configurar ngrok corretamente**

```bash
# ❌ ERRADO
ngrok http 3000

# ✅ CORRETO
ngrok http --host-header=rewrite 80
```

## 🔧 SOLUÇÃO COMPLETA (se a rápida não funcionar)

### **Passo 1: Parar tudo**

```bash
docker-compose down
```

### **Passo 2: Editar websocketService.ts**

Substitua todo o conteúdo da função `connect` em `src/services/websocketService.ts`:

```typescript
async connect(instanceName?: string): Promise<void> {
  if (this.isConnecting || this.socket?.connected) {
    return
  }

  this.isConnecting = true
  const instance = instanceName || this.config.instanceName

  try {
    // Para ngrok, use a URL completa com /socket.io/
    let wsUrl = this.config.baseURL
    
    // Se for localhost, use a instância específica
    if (wsUrl.includes('localhost')) {
      wsUrl = wsUrl + `/${instance}`
    } else {
      // Para ngrok, use /socket.io/ diretamente
      wsUrl = wsUrl + `/socket.io/`
    }
    
    console.log('🔌 Conectando via socket.io:', wsUrl)

    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'], // Adicionar polling como fallback
      auth: { apikey: this.config.apiKey },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 20000, // Aumentar timeout para ngrok
      forceNew: true,
      upgrade: true,
      rememberUpgrade: false
    })

    // Resto do código permanece igual...
  } catch (error) {
    console.error('❌ Erro ao conectar via socket.io:', error)
    this.isConnecting = false
    this.eventHandlers.onError?.(error)
    throw error
  }
}
```

### **Passo 3: Rebuild e restart**

```bash
docker-compose up --build -d
```

### **Passo 4: Testar**

```bash
# Use seu script de diagnóstico
node fix-ngrok-websocket.js https://your-ngrok-url.ngrok.io
```

## 🧪 TESTE MANUAL NO NAVEGADOR

Se ainda não funcionar, teste manualmente no console do navegador:

```javascript
// 1. Teste simples
const socket = io('https://your-ngrok-url.ngrok.io/socket.io/', {
  transports: ['websocket'],
  auth: { apikey: 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB' }
})

socket.on('connect', () => console.log('✅ Conectado!'))
socket.on('connect_error', err => console.error('❌ Erro:', err))

// 2. Se não funcionar, teste com polling
const socketPolling = io('https://your-ngrok-url.ngrok.io/socket.io/', {
  transports: ['polling'],
  auth: { apikey: 'cvlGHKHMdf1bv6WYBGOr516WjEanxSxB' }
})
```

## 🎯 CHECKLIST DE VERIFICAÇÃO

- [ ] ngrok rodando com `ngrok http --host-header=rewrite 80`
- [ ] URL do ngrok acessível no navegador
- [ ] Docker containers rodando (`docker-compose ps`)
- [ ] Nginx proxy funcionando
- [ ] WebSocket endpoint acessível: `https://your-url.ngrok.io/socket.io/`
- [ ] CORS configurado no nginx
- [ ] Frontend rebuild após mudanças

## 🆘 ÚLTIMO RECURSO

Se nada funcionar, use polling em vez de WebSocket temporariamente:

Em `src/hooks/useRealTimeConnection.ts`, altere:

```typescript
const options = {
  enableWebSocket: false, // Desabilitar WebSocket
  enableSSE: false,       // Desabilitar SSE
  fallbackToPolling: true // Usar apenas polling
}
```

## 📞 SUPORTE

Se o problema persistir:

1. Execute: `node fix-ngrok-websocket.js https://your-ngrok-url.ngrok.io`
2. Copie toda a saída do comando
3. Verifique os logs: `docker-compose logs websocket-server`
4. Teste no navegador com o código JavaScript acima

A solução mais comum é simplesmente corrigir a URL do WebSocket para usar `/socket.io/` em vez de `/${instance}` quando usar ngrok. 