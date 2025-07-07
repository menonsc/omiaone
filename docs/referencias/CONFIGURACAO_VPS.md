# 🌐 Configuração EvolutionAPI na VPS

## 📋 Informações Necessárias

Para integrar seu sistema com o EvolutionAPI na VPS, você precisa:

1. **URL da VPS** (IP ou domínio)
2. **Porta** (geralmente 8080)
3. **Chave API** do EvolutionAPI
4. **Protocolo** (HTTP ou HTTPS)

---

## 🔍 Passo 1: Encontrar as Informações na VPS

### Conectar na VPS
```bash
ssh usuario@sua-vps.com
```

### Verificar se EvolutionAPI está rodando
```bash
# Ver containers Docker
docker ps | grep evolution

# Ver logs do EvolutionAPI
docker logs evolution-api
```

### Encontrar a Chave API
```bash
# Localizar arquivo de configuração
find / -name ".env" -path "*/evolution*" 2>/dev/null

# Ver o conteúdo (substitua pelo caminho encontrado)
cat /path/to/evolution-api/.env | grep API_KEY
```

### Verificar Porta e URL
```bash
# Ver portas abertas
netstat -tulpn | grep :8080

# Testar acesso local na VPS
curl http://localhost:8080/instance/fetchInstances
```

---

## 🔧 Passo 2: Configurar no seu Sistema

### Criar arquivo .env.local
```bash
# Na pasta do seu projeto
touch .env.local
```

### Adicionar configurações
```env
# Google Gemini AI (já configurado)
VITE_GOOGLE_GEMINI_API_KEY=AIzaSyDejmTjn7-zAWlYSMKwtI6N__3ejpj15Rs

# Evolution API - SUBSTITUA PELOS SEUS DADOS
VITE_EVOLUTION_API_URL=http://SUA_VPS_IP:8080
VITE_EVOLUTION_API_KEY=SUA_CHAVE_API_AQUI
VITE_EVOLUTION_INSTANCE_NAME=default-instance
```

### Exemplos de URL:
```env
# Com domínio e SSL
VITE_EVOLUTION_API_URL=https://evolution.meudominio.com

# Com domínio sem SSL  
VITE_EVOLUTION_API_URL=http://evolution.meudominio.com:8080

# Com IP direto
VITE_EVOLUTION_API_URL=http://192.168.1.100:8080

# VPS na nuvem
VITE_EVOLUTION_API_URL=http://20.30.40.50:8080
```

---

## 🧪 Passo 3: Testar Conexão

### Usar o script de teste
```bash
node check-evolution-connection.js
```

### Ou testar manualmente com curl
```bash
curl -H "apikey: SUA_CHAVE_API" \
     -H "Content-Type: application/json" \
     http://SUA_VPS:8080/instance/fetchInstances
```

---

## 🔒 Passo 4: Configurar Firewall/Segurança

### Na VPS - Abrir porta 8080
```bash
# Ubuntu/Debian
sudo ufw allow 8080

# CentOS/RHEL  
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

### Configurar CORS (se necessário)
No arquivo `.env` do EvolutionAPI, adicione:
```env
CORS_ORIGIN=*
# Ou específico para seu domínio:
# CORS_ORIGIN=https://seu-sistema.com
```

---

## 🚀 Passo 5: Iniciar o Sistema

```bash
# Reiniciar o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000/whatsapp` e teste!

---

## ⚠️ Problemas Comuns

### ❌ Erro 401 - Unauthorized
- Verifique se a chave API está correta
- Confirme se não há espaços extras na chave

### ❌ Erro CORS
- Configure `CORS_ORIGIN` no EvolutionAPI
- Ou use um proxy reverso (nginx)

### ❌ Erro de Conexão
- Verifique se a porta 8080 está aberta
- Teste acesso direto na VPS
- Confirme se o EvolutionAPI está rodando

### ❌ SSL/HTTPS
- Se usar HTTPS, precisa de certificado válido
- Ou use HTTP durante desenvolvimento

---

## 📝 Checklist Final

- [ ] EvolutionAPI rodando na VPS
- [ ] Porta 8080 acessível externamente  
- [ ] Chave API válida obtida
- [ ] Arquivo .env.local configurado
- [ ] Teste de conexão passou
- [ ] Sistema iniciado com `npm run dev`
- [ ] Página /whatsapp carregando

---

## 🆘 Ainda com Problemas?

Execute este comando na VPS para diagnóstico:
```bash
echo "=== Diagnóstico EvolutionAPI ==="
echo "Docker containers:"
docker ps | grep evolution
echo -e "\nPortas abertas:"
netstat -tulpn | grep :8080
echo -e "\nTeste local:"
curl -s http://localhost:8080/instance/fetchInstances | head -c 100
``` 