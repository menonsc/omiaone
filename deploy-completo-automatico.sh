#!/bin/bash

# Script de Deploy Completo Automático - Agentes de IA
# Este script configura um servidor do zero para produção
# Execute como root: bash deploy-completo-automatico.sh

set -e  # Parar em caso de erro

echo "🚀 DEPLOY AUTOMÁTICO - AGENTES DE IA"
echo "====================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    error "Execute este script como root: sudo bash deploy-completo-automatico.sh"
fi

# Função para solicitar dados do usuário
gather_user_data() {
    echo -e "${BLUE}📋 COLETA DE INFORMAÇÕES${NC}"
    echo "Por favor, forneça as seguintes informações:"
    echo ""

    read -p "Nome do usuário para deploy: " DEPLOY_USER
    read -p "Seu domínio (ex: meusite.com): " DOMAIN
    read -p "Seu email para SSL: " EMAIL
    read -p "URL do repositório Git: " GIT_REPO
    
    echo ""
    echo -e "${BLUE}📋 CONFIGURAÇÕES SUPABASE${NC}"
    read -p "URL do Supabase: " SUPABASE_URL
    read -p "Chave anônima do Supabase: " SUPABASE_ANON_KEY
    read -p "Chave de serviço do Supabase: " SUPABASE_SERVICE_KEY
    
    echo ""
    echo -e "${BLUE}📋 CONFIGURAÇÕES EVOLUTION API${NC}"
    read -p "Chave da Evolution API: " EVOLUTION_API_KEY
    
    echo ""
    echo -e "${BLUE}📋 CONFIGURAÇÕES YAMPI${NC}"
    read -p "Token da API Yampi: " YAMPI_TOKEN
    read -p "Alias Yampi: " YAMPI_ALIAS
    
    echo ""
    echo -e "${BLUE}📋 SENHAS DE SEGURANÇA${NC}"
    read -s -p "Senha para PostgreSQL: " POSTGRES_PASSWORD
    echo ""
    read -s -p "Senha para Grafana: " GRAFANA_PASSWORD
    echo ""
    
    echo ""
    echo -e "${YELLOW}⚠️  CONFIRMAÇÃO${NC}"
    echo "Domínio: $DOMAIN"
    echo "Email: $EMAIL"
    echo "Usuário: $DEPLOY_USER"
    echo ""
    read -p "Continuar com essas configurações? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Deploy cancelado pelo usuário"
    fi
}

# Função 1: Configuração inicial do servidor
configure_server() {
    log "🛠️ PASSO 1: Configuração inicial do servidor"
    
    # Atualizar sistema
    log "Atualizando sistema..."
    apt update && apt upgrade -y
    
    # Configurar timezone
    log "Configurando timezone..."
    timedatectl set-timezone America/Sao_Paulo
    
    # Criar usuário não-root
    log "Criando usuário $DEPLOY_USER..."
    adduser --disabled-password --gecos "" $DEPLOY_USER
    echo "$DEPLOY_USER:$(openssl rand -base64 32)" | chpasswd
    usermod -aG sudo $DEPLOY_USER
    
    # Configurar SSH
    log "Configurando SSH..."
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Configurar firewall
    log "Configurando firewall..."
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8080/tcp
    ufw allow 9000/tcp
    ufw --force enable
    
    # Instalar Docker
    log "Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    usermod -aG docker $DEPLOY_USER
    
    # Instalar Docker Compose
    log "Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Instalar utilitários
    log "Instalando utilitários essenciais..."
    apt install -y curl wget git htop nano vim unzip fail2ban snapd
    
    # Configurar Fail2Ban
    log "Configurando Fail2Ban..."
    systemctl enable fail2ban
    systemctl start fail2ban
    
    # Instalar Portainer
    log "Instalando Portainer..."
    docker volume create portainer_data
    docker run -d -p 8080:8000 -p 9000:9000 --name portainer --restart=always \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v portainer_data:/data \
        portainer/portainer-ce:latest
    
    # Configurar swap
    log "Configurando swap..."
    if [ ! -f /swapfile ]; then
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    
    # Instalar Nginx
    log "Instalando Nginx..."
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
}

# Função 2: Configurar SSL e domínio
configure_ssl() {
    log "🌐 PASSO 2: Configuração SSL e domínio"
    
    # Instalar Certbot
    log "Instalando Certbot..."
    snap install core
    snap refresh core
    snap install --classic certbot
    ln -sf /snap/bin/certbot /usr/bin/certbot
    
    # Parar Nginx
    log "Parando Nginx temporariamente..."
    systemctl stop nginx
    
    # Obter certificado SSL
    log "Obtendo certificado SSL para $DOMAIN..."
    certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive
    
    if [ $? -ne 0 ]; then
        error "Erro ao obter certificado SSL. Verifique se o domínio está apontando para este servidor."
    fi
    
    # Configurar Nginx
    log "Configurando Nginx..."
    
    cat > /etc/nginx/sites-available/agentes-ia << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /evolution {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Ativar configuração
    ln -sf /etc/nginx/sites-available/agentes-ia /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Testar e reiniciar Nginx
    nginx -t
    systemctl restart nginx
    
    # Configurar renovação automática
    log "Configurando renovação automática SSL..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --reload-nginx") | crontab -
}

# Função 3: Deploy da aplicação
deploy_application() {
    log "📦 PASSO 3: Deploy da aplicação"
    
    # Preparar diretório
    log "Preparando diretório do projeto..."
    mkdir -p /home/$DEPLOY_USER/agentes-ia
    cd /home/$DEPLOY_USER/agentes-ia
    
    # Clonar repositório
    log "Clonando repositório..."
    if [ ! -z "$GIT_REPO" ]; then
        git clone $GIT_REPO .
    else
        warn "Repositório Git não fornecido. Você precisará fazer upload manual dos arquivos."
    fi
    
    # Criar arquivo de ambiente
    log "Configurando variáveis de ambiente..."
    cat > .env.production << EOF
NODE_ENV=production
PORT=3000

DOMAIN=$DOMAIN
CORS_ORIGIN=https://$DOMAIN,https://www.$DOMAIN

VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY

VITE_API_URL=https://$DOMAIN/api
VITE_WEBSOCKET_URL=wss://$DOMAIN/ws
VITE_EVOLUTION_API_URL=https://$DOMAIN/evolution

EVOLUTION_API_KEY=$EVOLUTION_API_KEY
WEBHOOK_GLOBAL_URL=https://$DOMAIN/webhooks/evolution

VITE_YAMPI_API_URL=https://api.yampi.com.br
YAMPI_API_TOKEN=$YAMPI_TOKEN
YAMPI_ALIAS=$YAMPI_ALIAS

POSTGRES_DB=agentes_ia
POSTGRES_USER=agentes_user
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DATABASE_CONNECTION_URI=postgresql://agentes_user:$POSTGRES_PASSWORD@postgres:5432/agentes_ia

GRAFANA_USER=admin
GRAFANA_PASSWORD=$GRAFANA_PASSWORD

LOG_LEVEL=info
MAX_FILE_SIZE=50MB
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
EOF

    # Ajustar permissões
    chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/agentes-ia
    
    # Fazer deploy com Docker Compose
    log "Iniciando deploy com Docker Compose..."
    if [ -f "docker-compose.production.yml" ]; then
        sudo -u $DEPLOY_USER docker-compose -f docker-compose.production.yml up -d
    else
        warn "Arquivo docker-compose.production.yml não encontrado. Deploy manual necessário."
    fi
}

# Função 4: Configurar backup automático
configure_backup() {
    log "💾 PASSO 4: Configurando backup automático"
    
    mkdir -p /backup/agentes-ia
    
    cat > /usr/local/bin/backup-agentes-ia.sh << EOF
#!/bin/bash
BACKUP_DIR="/backup/agentes-ia"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Backup dos volumes Docker
docker run --rm -v agentes-ia_postgres_data:/data -v \$BACKUP_DIR:/backup alpine tar czf /backup/postgres_\$DATE.tar.gz -C /data .
docker run --rm -v agentes-ia_evolution_instances:/data -v \$BACKUP_DIR:/backup alpine tar czf /backup/evolution_\$DATE.tar.gz -C /data .

# Manter apenas últimos 7 backups
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup concluído: \$DATE"
EOF

    chmod +x /usr/local/bin/backup-agentes-ia.sh
    
    # Adicionar ao cron
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-agentes-ia.sh") | crontab -
}

# Função 5: Configurar monitoramento
configure_monitoring() {
    log "📊 PASSO 5: Configurando monitoramento"
    
    # Criar script de health check
    cat > /home/$DEPLOY_USER/health-check.sh << EOF
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
certbot certificates
EOF

    chmod +x /home/$DEPLOY_USER/health-check.sh
    chown $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/health-check.sh
}

# Função 6: Testes finais
run_tests() {
    log "🧪 PASSO 6: Executando testes finais"
    
    # Aguardar serviços iniciarem
    log "Aguardando serviços iniciarem..."
    sleep 30
    
    # Testar SSL
    log "Testando SSL..."
    if curl -s -I https://$DOMAIN | grep -q "200 OK"; then
        log "✅ SSL funcionando corretamente"
    else
        warn "⚠️ Problema com SSL detectado"
    fi
    
    # Testar aplicação
    log "Testando aplicação..."
    if curl -s -I https://$DOMAIN | grep -q "200\|301\|302"; then
        log "✅ Aplicação respondendo"
    else
        warn "⚠️ Aplicação pode não estar respondendo corretamente"
    fi
    
    # Verificar containers
    log "Verificando containers..."
    if [ -f "/home/$DEPLOY_USER/agentes-ia/docker-compose.production.yml" ]; then
        cd /home/$DEPLOY_USER/agentes-ia
        sudo -u $DEPLOY_USER docker-compose -f docker-compose.production.yml ps
    fi
}

# Função principal
main() {
    log "Iniciando deploy automático do Agentes de IA..."
    
    gather_user_data
    configure_server
    configure_ssl
    deploy_application
    configure_backup
    configure_monitoring
    run_tests
    
    echo ""
    echo -e "${GREEN}🎉 DEPLOY CONCLUÍDO COM SUCESSO! 🎉${NC}"
    echo ""
    echo "📋 Informações importantes:"
    echo "- Site principal: https://$DOMAIN"
    echo "- Portainer: http://$(curl -s ifconfig.me):9000"
    echo "- Usuário criado: $DEPLOY_USER"
    echo "- Diretório: /home/$DEPLOY_USER/agentes-ia"
    echo ""
    echo "🔧 Próximos passos:"
    echo "1. Acesse Portainer e configure a senha admin"
    echo "2. Verifique se todos os serviços estão funcionando"
    echo "3. Configure DNS para portainer.$DOMAIN se necessário"
    echo "4. Execute health check: ./health-check.sh"
    echo ""
    echo "⚠️ IMPORTANTE:"
    echo "- Configure chaves SSH para maior segurança"
    echo "- Faça backup das configurações"
    echo "- Monitore logs regularmente"
    echo ""
    log "Deploy automático finalizado!"
}

# Executar função principal
main "$@" 