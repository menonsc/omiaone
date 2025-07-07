# 🔧 Solução: WebSocket Desconectado com ngrok

## 🎯 Problema Identificado

O WebSocket funciona localmente mas fica desconectado quando você usa ngrok. Isso acontece porque:

1. **Nginx não estava configurado para WebSocket**
2. **ngrok tem limitações específicas para WebSocket**
3. **Headers de upgrade não estavam sendo passados**

## ✅ Solução Implementada

### 1. **Configuração do Nginx Atualizada**

O arquivo `nginx-proxy.conf` foi atualizado com suporte completo a WebSocket:

```nginx
# Map para detectar WebSocket
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# Headers de WebSocket em todas as rotas
location / {
    # ... outras configurações ...
    
    # WebSocket support
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_http_version 1.1;
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}

# Endpoint específico para WebSocket
location /socket.io/ {
    proxy_pass http://frontend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket specific headers
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_http_version 1.1;
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
    proxy_buffering off;
    proxy_cache off;
}
```

### 2. **Script de Teste Criado**

Criado `test-websocket-ngrok.js` para testar a configuração:

```bash
# Testar com ngrok
node test-websocket-ngrok.js https://your-ngrok-url.ngrok.io your-api-key your-instance

# Testar localmente primeiro
node test-websocket-ngrok.js http://localhost your-api-key your-instance
```

## 🚀 Passos para Resolver

### **Passo 1: Reiniciar Docker com nova configuração**

```bash
# Parar containers
docker-compose down

# Rebuild com nova configuração
docker-compose up --build -d

# Verificar logs
docker-compose logs nginx-proxy
```

### **Passo 2: Configurar ngrok corretamente**

```bash
# Comando correto para ngrok com WebSocket
ngrok http --host-header=rewrite 80

# OU para HTTPS
ngrok http --host-header=rewrite 443
```

### **Passo 3: Testar localmente primeiro**

```bash
# Testar se funciona localmente
curl http://localhost/health

# Testar WebSocket localmente
node test-websocket-ngrok.js http://localhost your-api-key your-instance
```

### **Passo 4: Testar com ngrok**

```bash
# Pegar URL do ngrok
# Exemplo: https://abc123.ngrok.io

# Testar WebSocket com ngrok
node test-websocket-ngrok.js https://abc123.ngrok.io your-api-key your-instance
```

## 🔍 Diagnóstico de Problemas

### **Se o teste local falhar:**

1. **Verificar se Docker está rodando:**
   ```bash
   docker-compose ps
   ```

2. **Verificar logs do nginx:**
   ```bash
   docker-compose logs nginx-proxy
   ```

3. **Verificar logs do frontend:**
   ```bash
   docker-compose logs frontend
   ```

### **Se o teste com ngrok falhar:**

1. **Verificar se ngrok está configurado corretamente:**
   ```bash
   # Deve mostrar algo como:
   # Forwarding https://abc123.ngrok.io -> http://localhost:80
   ```

2. **Verificar se a URL está acessível:**
   ```bash
   curl https://your-ngrok-url.ngrok.io/health
   ```

3. **Verificar se WebSocket endpoint está acessível:**
   ```bash
   curl https://your-ngrok-url.ngrok.io/socket.io/
   ```

## 🛠️ Configurações Adicionais

### **Para ngrok com autenticação:**

```bash
# Se você tem autenticação no ngrok
ngrok http --host-header=rewrite --auth username:password 80
```

### **Para ngrok com domínio personalizado:**

```bash
# Se você tem domínio personalizado no ngrok
ngrok http --host-header=rewrite --subdomain=yourdomain 80
```

### **Para verificar se WebSocket está funcionando no navegador:**

```javascript
// No console do navegador
const socket = io('https://your-ngrok-url.ngrok.io/your-instance', {
  transports: ['websocket'],
  auth: { apikey: 'your-api-key' }
})

socket.on('connect', () => {
  console.log('✅ WebSocket conectado!')
})

socket.on('connect_error', (error) => {
  console.error('❌ Erro:', error.message)
})
```

## 📊 Verificação de Status

### **Indicadores de Sucesso:**

- ✅ **Teste local funciona**
- ✅ **ngrok URL acessível**
- ✅ **WebSocket conecta via ngrok**
- ✅ **Mensagens aparecem em tempo real**

### **Indicadores de Problema:**

- ❌ **Timeout na conexão**
- ❌ **Erro de CORS**
- ❌ **Erro de upgrade**
- ❌ **Connection refused**

## 🔄 Fallback Automático

O sistema tem fallback automático:

1. **WebSocket** (principal)
2. **SSE** (fallback)
3. **Polling** (fallback final)

Mesmo se WebSocket falhar com ngrok, o sistema continuará funcionando via polling.

## 📞 Suporte

Se o problema persistir:

1. **Verificar logs completos:**
   ```bash
   docker-compose logs
   ```

2. **Testar com diferentes configurações de ngrok**

3. **Verificar se Evolution API está acessível via ngrok**

4. **Considerar usar um proxy reverso alternativo (como Traefik)**

---

**✅ Com essas configurações, o WebSocket deve funcionar corretamente com ngrok!** 