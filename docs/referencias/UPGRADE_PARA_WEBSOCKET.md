# 🔌 Upgrade: Adicionando WebSocket à Stack

## ✅ Estado Atual
Parabéns! Sua stack básica está funcionando perfeitamente:
- ✅ Frontend: 1/1
- ✅ Grafana: 1/1  
- ✅ Prometheus: 1/1
- ✅ Redis: 1/1
- ✅ PostgreSQL: 1/1

## 🚀 Próximo Passo: Adicionar WebSocket

### 📁 Nova Stack: `portainer-stack-swarm-com-websocket.yml`

**O que adiciona:**
- 🔌 **WebSocket Server**: Comunicação em tempo real
- 🌐 **Página de teste**: Interface para testar WebSocket
- 📊 **Dashboard atualizado**: Mostra o WebSocket no frontend

**Porta usada:**
- WebSocket: `3002` (evita conflito com Uptime Kuma na 3001)

## 🔄 Como fazer o upgrade:

### Opção 1: Update da Stack Atual (Recomendado)
1. **No Portainer**, vá para sua stack atual
2. Clique em **Editor**
3. **Substitua todo o conteúdo** pelo arquivo `portainer-stack-swarm-com-websocket.yml`
4. **Update the stack**

### Opção 2: Nova Stack
1. **Remove** a stack atual
2. **Add Stack** com o novo arquivo
3. Mesmo nome: `agentes-ia-simples`

## 🌐 Novas URLs de acesso:

- **Frontend**: `http://producao.elevroi.com.br`
- **WebSocket Test**: `http://producao.elevroi.com.br:3002` 
- **Grafana**: `http://producao.elevroi.com.br:4000`
- **Prometheus**: `http://producao.elevroi.com.br:9090`

## 🔧 Variáveis (mesmas de antes):
```
SUPABASE_DB_PASSWORD=SuaSenhaSegura123
GRAFANA_PASSWORD=SuaOutraSenhaSegura456
```

## 🧪 Como testar o WebSocket:

1. Acesse: `http://producao.elevroi.com.br:3002`
2. Clique em **"Conectar"**
3. Se aparecer "✅ Conectado ao WebSocket!" = **Funcionando!**
4. Teste enviar mensagens com **"Enviar Teste"**

## 🎯 O que o WebSocket faz:

- **Conexões em tempo real** para chat
- **Notificações instantâneas**
- **Sincronização de dados** entre usuários
- **Base para** WhatsApp, chat IA, etc.

## 🔍 Verificação pós-upgrade:

Após o update, você deve ver **6 serviços** todos **1/1**:
- ✅ frontend
- ✅ supabase  
- ✅ redis
- ✅ websocket-server (NOVO!)
- ✅ grafana
- ✅ prometheus

## 🆘 Se o WebSocket não iniciar:

1. **Aguarde 2-3 minutos** (npm install demora)
2. **Verifique logs** do websocket-server
3. **Teste a porta**: `telnet producao.elevroi.com.br 3002`

## 💡 Vantagens desta abordagem:

- ✅ **Sem comandos complexos** (causavam problemas antes)
- ✅ **Auto-contido** (cria package.json e server.js automaticamente)
- ✅ **Página de teste integrada**
- ✅ **Usa Node.js Alpine** (imagem oficial e leve)
- ✅ **WebSocket + HTTP** no mesmo servidor

---

**🎉 Com isso você terá o sistema completo com comunicação em tempo real!** 