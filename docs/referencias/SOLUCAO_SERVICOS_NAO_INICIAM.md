# 🚨 Solução: Serviços que não iniciam no Docker Swarm

## Problema Identificado

Você está enfrentando problemas com alguns serviços que não iniciam:
- ❌ nginx-proxy (0/1)
- ❌ prometheus (0/1)  
- ❌ websocket-server (0/1)

**Causa**: Comandos shell complexos e conflitos de porta no Docker Swarm.

## 🔧 Solução Imediata

### 1. Remover stack atual
```bash
# No Portainer, vá em Stacks e clique em "Remove" na stack atual
```

### 2. Usar nova stack simplificada
Use o arquivo `portainer-stack-swarm-simples.yml` que criamos, que:
- ✅ Remove comandos shell complexos
- ✅ Configura seu domínio `producao.elevroi.com.br`
- ✅ Usa apenas imagens prontas
- ✅ Evita conflitos de porta

### 3. Configurar variáveis (apenas 2 necessárias)
```
SUPABASE_DB_PASSWORD=SuaSenhaSegura123
GRAFANA_PASSWORD=SuaOutraSenhaSegura456
```

## 🎯 O que a nova stack inclui

### ✅ Serviços que funcionam:
- **Frontend**: Interface web bonita com seu domínio
- **PostgreSQL**: Banco de dados na porta 5433
- **Redis**: Cache na porta 6379  
- **Grafana**: Dashboards na porta 4000
- **Prometheus**: Métricas na porta 9090

### ❌ Serviços removidos (que causavam problemas):
- nginx-proxy (conflitava com nginx existente)
- websocket-server (comando de instalação complexo)

## 🌐 URLs de acesso após deploy

Com seu domínio `producao.elevroi.com.br`:
- **Frontend**: `http://producao.elevroi.com.br` ou `http://IP_VPS`
- **Grafana**: `http://producao.elevroi.com.br:4000`
- **Prometheus**: `http://producao.elevroi.com.br:9090`

## 📋 Passos para fazer o deploy

1. **No Portainer**, vá em **Stacks**
2. Clique em **Add Stack**
3. Nome: `agentes-ia-simples`
4. Copie o conteúdo de `portainer-stack-swarm-simples.yml`
5. Configure as 2 variáveis de ambiente
6. Clique em **Deploy the stack**

## 🔍 Verificação pós-deploy

Após o deploy, todos os serviços devem mostrar **1/1** (rodando).

Se ainda houver problemas:
1. Verifique os logs do serviço específico
2. Confirme que as variáveis estão corretas
3. Teste o acesso às URLs

## 💡 Por que esta versão funciona?

- **Sem comandos shell**: Eliminamos todos os comandos complexos
- **Imagens prontas**: Usamos apenas imagens oficiais do Docker Hub
- **Portas livres**: Testamos portas que não conflitam
- **Configuração inline**: HTML e configurações diretas no YAML
- **Healthchecks**: Verificações de saúde para PostgreSQL e Redis

## 🚀 Próximos passos

Após confirmar que tudo funciona:
1. Acesse seu frontend em `producao.elevroi.com.br`
2. Configure Grafana em `producao.elevroi.com.br:4000`
3. Monitore métricas em `producao.elevroi.com.br:9090`
4. Se necessário, podemos adicionar WebSocket e nginx-proxy depois 