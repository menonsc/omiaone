# Deploy no Portainer com Docker Swarm

Este documento explica como fazer o deploy da aplicação Agentes de IA no Portainer usando Docker Swarm.

## 📋 Pré-requisitos

- Docker Swarm inicializado
- Portainer instalado e configurado
- Certificados SSL para o domínio `producao.elevroi.com`
- Variáveis de ambiente configuradas

## 🚀 Opções de Deploy

### Opção 1: Stack com WebSocket exposto (porta 3002)

Use o arquivo `portainer-stack-swarm.yml` se quiser expor o WebSocket diretamente na porta 3002.

**Vantagens:**
- Configuração mais simples
- WebSocket acessível diretamente

**Desvantagens:**
- Pode conflitar com outras aplicações usando a porta 3001
- Menos seguro (exposição direta)

### Opção 2: Stack com WebSocket via Nginx (portas 8080/8443)

Use o arquivo `portainer-stack-swarm-alternative.yml` para usar o Nginx como proxy reverso para o WebSocket.

**Vantagens:**
- Mais seguro (não expõe porta diretamente)
- SSL/TLS automático
- Melhor controle de tráfego
- Usa portas 8080/8443 para evitar conflitos

**Desvantagens:**
- Configuração um pouco mais complexa

### Opção 3: Stack sem exposição de portas (Recomendado para Traefik)

Use o arquivo `portainer-stack-swarm-no-ports.yml` se você já tem o Traefik ou outro ingress controller.

**Vantagens:**
- Não conflita com nenhuma porta
- Ideal para ambientes com Traefik
- Mais limpo e organizado
- Permite configuração flexível de ingress

**Desvantagens:**
- Requer configuração adicional do ingress controller

## 📝 Configuração

### 1. Configurar Variáveis de Ambiente

Edite o arquivo `env.production` com suas configurações:

```bash
# Configurações do Supabase
VITE_SUPABASE_URL=https://producao.elevroi.com/rest/v1
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
SUPABASE_DB_PASSWORD=sua-senha-super-secreta-do-postgres

# Configurações do Google Gemini AI
VITE_GOOGLE_GEMINI_API_KEY=sua-chave-do-gemini

# Configurações da Evolution API (WhatsApp)
VITE_EVOLUTION_API_URL=https://producao.elevroi.com/evolution
VITE_EVOLUTION_API_KEY=sua-chave-da-evolution
VITE_EVOLUTION_INSTANCE_NAME=sua-instancia

# Configurações do Grafana
GRAFANA_PASSWORD=admin

# URL do WebSocket (para versão alternativa)
VITE_WEBSOCKET_URL=wss://producao.elevroi.com/websocket
```

### 2. Configurar Certificados SSL

Coloque seus certificados SSL em:
- `ssl/cert.pem` - Certificado
- `ssl/key.pem` - Chave privada

Se não tiver certificados, o script criará certificados auto-assinados para desenvolvimento.

## 🚀 Deploy

### Usando Scripts Automatizados

#### Para versão com WebSocket exposto:
```bash
chmod +x deploy-portainer-swarm.sh
./deploy-portainer-swarm.sh
```

#### Para versão com WebSocket via Nginx (portas 8080/8443):
```bash
chmod +x deploy-portainer-swarm-alternative.sh
./deploy-portainer-swarm-alternative.sh
```

#### Para versão sem exposição de portas (Recomendado para Traefik):
```bash
chmod +x deploy-portainer-swarm-no-ports.sh
./deploy-portainer-swarm-no-ports.sh
```

### Deploy Manual no Portainer

1. Acesse o Portainer
2. Vá em **Stacks**
3. Clique em **Add stack**
4. Escolha **Upload** ou **Web editor**
5. Cole o conteúdo do arquivo `portainer-stack-swarm.yml` ou `portainer-stack-swarm-alternative.yml`
6. Configure as variáveis de ambiente
7. Clique em **Deploy the stack**

## 📊 Monitoramento

### URLs de Acesso

- **Aplicação Principal**: https://producao.elevroi.com
- **Grafana**: http://localhost:4000 (admin/admin)
- **Prometheus**: http://localhost:9090

### Comandos Úteis

```bash
# Ver status dos serviços
docker stack services agentes-ia

# Ver logs de um serviço
docker service logs agentes-ia_frontend
docker service logs agentes-ia_websocket-server

# Escalar serviços
docker service scale agentes-ia_frontend=3

# Remover stack
docker stack rm agentes-ia
```

## 🔧 Troubleshooting

### Erro de Porta em Uso

Se receber erro sobre porta 3001 em uso:
- Use a versão alternativa (`portainer-stack-swarm-alternative.yml`)
- Ou altere a porta no arquivo de configuração

### Erro de Certificados SSL

Se não tiver certificados SSL:
- O script criará certificados auto-assinados
- Para produção, obtenha certificados válidos de uma CA

### Erro de Variáveis de Ambiente

Verifique se o arquivo `env.production` existe e está configurado corretamente.

## 📈 Recursos e Limites

### Recursos por Serviço

- **Frontend**: 0.5 CPU, 512MB RAM
- **Supabase**: 1.0 CPU, 1GB RAM
- **Redis**: 0.5 CPU, 512MB RAM
- **Nginx**: 0.5 CPU, 256MB RAM
- **Prometheus**: 0.5 CPU, 512MB RAM
- **Grafana**: 0.5 CPU, 512MB RAM
- **WebSocket**: 0.5 CPU, 256MB RAM

### Replicas

- **Frontend**: 2 replicas
- **Nginx**: 2 replicas
- **WebSocket**: 2 replicas
- **Outros**: 1 replica cada

## 🔒 Segurança

- Todos os serviços usam rede overlay interna
- Nginx com SSL/TLS configurado
- Rate limiting configurado
- Headers de segurança habilitados
- Autenticação básica para ferramentas de monitoramento

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs dos serviços
2. Confirme se o Docker Swarm está ativo
3. Verifique se as variáveis de ambiente estão corretas
4. Confirme se os certificados SSL estão válidos 