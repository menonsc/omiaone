# 🚀 Guia Completo: Configurar Servidor do Zero para Agentes de IA

Este guia te levará do zero a um servidor de produção completo, seguro e otimizado para o projeto **Agentes de IA**.

## 📋 **Pré-requisitos**

### 1. **Domínio**
- Registre um domínio (ex: meusite.com)
- Configure os DNS para apontar para seu servidor:
  ```
  A     @        SEU_IP_VPS
  A     www      SEU_IP_VPS
  A     portainer SEU_IP_VPS
  ```

### 2. **VPS/Servidor**
- **Mínimo**: 4GB RAM, 2 CPU cores, 50GB SSD
- **Recomendado**: 8GB RAM, 4 CPU cores, 100GB SSD
- **OS**: Ubuntu 22.04 LTS

### 3. **Contas de Serviços**
- Conta no Supabase (banco de dados)
- Tokens da API Evolution (WhatsApp)
- Credenciais Yampi (e-commerce)
- Conta Mailgun (emails)

---

## 🛠️ **Passo 1: Configuração Inicial do Servidor**

### 1.1 Conectar ao Servidor
```bash
ssh root@SEU_IP_VPS
```

### 1.2 Executar Script de Configuração Inicial
```bash
# Baixar e executar script de configuração
wget https://raw.githubusercontent.com/seu-usuario/agentes-ia/main/setup-servidor-zero.sh
chmod +x setup-servidor-zero.sh
./setup-servidor-zero.sh
```

**O script irá:**
- ✅ Atualizar o sistema
- ✅ Criar usuário não-root
- ✅ Configurar SSH seguro
- ✅ Instalar Docker e Docker Compose
- ✅ Configurar firewall
- ✅ Instalar Portainer
- ✅ Configurar segurança básica

### 1.3 Trocar para Usuário Não-Root
```bash
# Sair do root e conectar com o novo usuário
exit
ssh seu_usuario@SEU_IP_VPS
```

---

## 🌐 **Passo 2: Configurar Domínio e SSL**

### 2.1 Executar Script de Configuração SSL
```bash
# Baixar e executar script de SSL
wget https://raw.githubusercontent.com/seu-usuario/agentes-ia/main/configurar-dominio-ssl.sh
chmod +x configurar-dominio-ssl.sh
./configurar-dominio-ssl.sh
```

**O script irá:**
- ✅ Instalar Certbot
- ✅ Obter certificados SSL
- ✅ Configurar Nginx com HTTPS
- ✅ Configurar renovação automática

### 2.2 Verificar SSL
```bash
# Testar certificado
sudo nginx -t
sudo systemctl status nginx

# Verificar se o certificado foi obtido
sudo ls -la /etc/letsencrypt/live/seu-dominio.com/
```

---

## 📦 **Passo 3: Deploy da Aplicação**

### 3.1 Clonar o Projeto
```bash
cd ~/agentes-ia
git clone https://github.com/seu-usuario/agentes-ia.git .
```

### 3.2 Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp env.producao.example .env.production

# Editar configurações
nano .env.production
```

**Configure TODAS as variáveis:**
```env
DOMAIN=seu-dominio.com
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_supabase
EVOLUTION_API_KEY=sua_chave_evolution
# ... etc
```

### 3.3 Deploy via Docker Compose
```bash
# Usar o arquivo de produção
docker-compose -f docker-compose.production.yml up -d

# Verificar status
docker-compose -f docker-compose.production.yml ps
```

### 3.4 Verificar Logs
```bash
# Ver logs de todos os serviços
docker-compose -f docker-compose.production.yml logs -f

# Ver logs específicos
docker logs agentes-ia-frontend
docker logs agentes-ia-websocket
docker logs agentes-ia-evolution
```

---

## 🔐 **Passo 4: Configurações de Segurança Avançadas**

### 4.1 Configurar Chaves SSH (Recomendado)
```bash
# No seu computador local, gerar chave
ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"

# Copiar chave pública para servidor
ssh-copy-id seu_usuario@SEU_IP_VPS

# No servidor, desabilitar login por senha
sudo nano /etc/ssh/sshd_config
# Alterar: PasswordAuthentication no
sudo systemctl restart sshd
```

### 4.2 Configurar Fail2Ban
```bash
# Verificar status
sudo systemctl status fail2ban

# Ver tentativas bloqueadas
sudo fail2ban-client status sshd
```

### 4.3 Configurar Backup Automático
```bash
# Criar script de backup
sudo nano /usr/local/bin/backup-agentes-ia.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/agentes-ia"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup dos volumes Docker
docker run --rm -v agentes-ia_postgres_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/postgres_$DATE.tar.gz -C /data .
docker run --rm -v agentes-ia_evolution_instances:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/evolution_$DATE.tar.gz -C /data .

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup concluído: $DATE"
```

```bash
# Tornar executável
sudo chmod +x /usr/local/bin/backup-agentes-ia.sh

# Adicionar ao cron
sudo crontab -e
# Adicionar linha: 0 2 * * * /usr/local/bin/backup-agentes-ia.sh
```

---

## 📊 **Passo 5: Monitoramento e Observabilidade**

### 5.1 Acessar Portainer
- URL: `https://portainer.seu-dominio.com`
- Criar conta admin na primeira vez

### 5.2 Acessar Grafana
- URL: `https://seu-dominio.com:3003`
- Login: configurado no .env.production

### 5.3 Configurar Alertas
```bash
# Instalar ferramentas de monitoramento
sudo apt install -y htop iotop nethogs
```

### 5.4 Scripts de Monitoramento
```bash
# Criar script de health check
nano ~/health-check.sh
```

```bash
#!/bin/bash
echo "=== Status dos Serviços ==="
docker-compose -f docker-compose.production.yml ps

echo -e "\n=== Uso de Recursos ==="
docker stats --no-stream

echo -e "\n=== Espaço em Disco ==="
df -h

echo -e "\n=== Memória ==="
free -h

echo -e "\n=== SSL Status ==="
sudo certbot certificates
```

---

## 🚦 **Passo 6: Testes e Validação**

### 6.1 Testar Aplicação
```bash
# Testar frontend
curl -I https://seu-dominio.com

# Testar WebSocket
curl -I https://seu-dominio.com/ws

# Testar Evolution API
curl -I https://seu-dominio.com/evolution
```

### 6.2 Testar SSL
```bash
# Verificar certificado
openssl s_client -connect seu-dominio.com:443 -servername seu-dominio.com

# Testar renovação SSL
sudo certbot renew --dry-run
```

### 6.3 Testar Backup
```bash
# Executar backup manual
sudo /usr/local/bin/backup-agentes-ia.sh

# Verificar arquivos
ls -la /backup/agentes-ia/
```

---

## 🔧 **Comandos Úteis de Manutenção**

### Docker
```bash
# Ver logs em tempo real
docker-compose -f docker-compose.production.yml logs -f

# Reiniciar serviço específico
docker-compose -f docker-compose.production.yml restart agentes-ia-frontend

# Atualizar imagens
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# Limpar sistema
docker system prune -f
```

### Sistema
```bash
# Ver status geral
htop

# Ver conexões de rede
sudo netstat -tulpn

# Ver logs do sistema
sudo journalctl -f

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Banco de Dados
```bash
# Conectar ao PostgreSQL
docker exec -it agentes-ia-postgres psql -U agentes_user -d agentes_ia

# Backup manual do banco
docker exec agentes-ia-postgres pg_dump -U agentes_user agentes_ia > backup_$(date +%Y%m%d).sql
```

---

## ⚠️ **Troubleshooting**

### Problema: Site não carrega
```bash
# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx

# Verificar containers
docker-compose -f docker-compose.production.yml ps

# Ver logs
docker logs agentes-ia-frontend
```

### Problema: SSL não funciona
```bash
# Verificar certificado
sudo certbot certificates

# Renovar manualmente
sudo certbot renew --force-renewal

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Problema: Alta utilização de recursos
```bash
# Ver uso de recursos
docker stats

# Reiniciar containers com problema
docker-compose -f docker-compose.production.yml restart

# Limpar logs antigos
sudo journalctl --vacuum-time=7d
```

---

## 📈 **Otimizações de Performance**

### 1. **CDN (Cloudflare)**
- Configure Cloudflare para cache de assets
- Ative compressão gzip/brotli
- Configure regras de cache

### 2. **Otimizações do Servidor**
```bash
# Otimizar kernel
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'net.core.rmem_max = 16777216' | sudo tee -a /etc/sysctl.conf
echo 'net.core.wmem_max = 16777216' | sudo tee -a /etc/sysctl.conf

# Aplicar otimizações
sudo sysctl -p
```

### 3. **Monitoramento Contínuo**
- Configure alertas no Grafana
- Use UptimeRobot para monitoramento externo
- Configure notificações Slack/Discord

---

## ✅ **Checklist Final**

- [ ] Servidor configurado e seguro
- [ ] Domínio configurado com SSL
- [ ] Aplicação rodando corretamente
- [ ] Backups configurados
- [ ] Monitoramento ativo
- [ ] Testes realizados
- [ ] Documentação atualizada

---

## 🆘 **Suporte**

Se encontrar problemas:

1. **Verifique os logs**: `docker-compose logs -f`
2. **Consulte a documentação**: Verifique arquivos específicos do projeto
3. **Community**: Consulte fóruns Docker/Nginx
4. **Backup**: Sempre tenha backups antes de mudanças importantes

---

**🎉 Parabéns! Seu servidor está configurado e pronto para produção!**

> **Dica**: Mantenha sempre uma instância de staging para testar atualizações antes de aplicar em produção. 