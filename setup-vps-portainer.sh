#!/bin/bash

# ===================================================================
# SCRIPT DE PREPARAÇÃO DA VPS PARA DEPLOY NO PORTAINER
# Agentes de IA
# ===================================================================

set -e  # Sair em caso de erro

echo "🚀 Iniciando preparação da VPS para deploy do Agentes de IA..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verificar se é root ou tem sudo
if [[ $EUID -ne 0 ]]; then
    if ! command -v sudo &> /dev/null; then
        error "Este script precisa ser executado com privilégios de root ou com sudo"
    fi
    SUDO="sudo"
else
    SUDO=""
fi

# Função para verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado. Instale o Docker primeiro."
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker não está rodando ou não há permissão. Execute: sudo systemctl start docker"
    fi
    
    log "✅ Docker está instalado e funcionando"
}

# Função para verificar se Portainer está rodando
check_portainer() {
    if ! docker ps | grep -q portainer; then
        warn "Portainer não está rodando. Certifique-se de que está instalado e ativo."
    else
        log "✅ Portainer está rodando"
    fi
}

# Criar estrutura de diretórios
create_directories() {
    log "📁 Criando estrutura de diretórios..."
    
    $SUDO mkdir -p /opt/agentes-ia/data/{supabase,redis,prometheus,grafana}
    $SUDO mkdir -p /opt/agentes-ia/config/{nginx,ssl}
    $SUDO mkdir -p /opt/agentes-ia/backups
    $SUDO mkdir -p /opt/agentes-ia/logs
    
    # Definir permissões
    $SUDO chown -R 1000:1000 /opt/agentes-ia/data
    $SUDO chmod -R 755 /opt/agentes-ia/data
    $SUDO chmod -R 755 /opt/agentes-ia/config
    
    log "✅ Diretórios criados com sucesso"
}

# Verificar e instalar dependências
install_dependencies() {
    log "📦 Verificando dependências..."
    
    # Atualizar pacotes
    if command -v apt-get &> /dev/null; then
        $SUDO apt-get update -qq
        
        # Instalar curl, wget, htop se não existirem
        packages=("curl" "wget" "htop" "nano" "git")
        for package in "${packages[@]}"; do
            if ! command -v $package &> /dev/null; then
                log "Instalando $package..."
                $SUDO apt-get install -y $package
            fi
        done
    fi
    
    log "✅ Dependências verificadas"
}

# Configurar firewall (básico)
configure_firewall() {
    log "🔒 Configurando firewall básico..."
    
    if command -v ufw &> /dev/null; then
        # Permitir SSH
        $SUDO ufw allow 22/tcp
        
        # Permitir HTTP/HTTPS
        $SUDO ufw allow 80/tcp
        $SUDO ufw allow 443/tcp
        
        # Permitir Portainer
        $SUDO ufw allow 9000/tcp
        
        # Permitir portas da aplicação
        $SUDO ufw allow 3001/tcp  # WebSocket
        $SUDO ufw allow 4000/tcp  # Grafana
        $SUDO ufw allow 9090/tcp  # Prometheus
        
        log "✅ Regras de firewall configuradas"
    else
        warn "UFW não está instalado. Configure o firewall manualmente."
    fi
}

# Criar arquivo de configuração nginx
create_nginx_config() {
    log "⚙️ Criando configuração do Nginx..."
    
    cat > /tmp/nginx-proxy-production.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Upstream servers
    upstream frontend {
        server frontend:80;
    }
    
    upstream websocket {
        server websocket-server:3001;
    }

    server {
        listen 80;
        server_name _;
        
        # Redirect to HTTPS if SSL is enabled
        # return 301 https://$server_name$request_uri;
        
        # WebSocket proxy
        location /socket.io/ {
            proxy_pass http://websocket;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Frontend proxy
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }

    # SSL Configuration (uncomment if using HTTPS)
    # server {
    #     listen 443 ssl http2;
    #     server_name your-domain.com;
    #     
    #     ssl_certificate /etc/nginx/ssl/cert.pem;
    #     ssl_certificate_key /etc/nginx/ssl/key.pem;
    #     
    #     # ... rest of configuration
    # }
}
EOF

    $SUDO mv /tmp/nginx-proxy-production.conf /opt/agentes-ia/config/nginx/
    log "✅ Configuração do Nginx criada"
}

# Criar configuração do Prometheus
create_prometheus_config() {
    log "📊 Criando configuração do Prometheus..."
    
    cat > /tmp/prometheus-production.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'frontend'
    static_configs:
      - targets: ['frontend:80']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'websocket'
    static_configs:
      - targets: ['websocket-server:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['supabase:5432']
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s
EOF

    $SUDO mv /tmp/prometheus-production.yml /opt/agentes-ia/config/
    log "✅ Configuração do Prometheus criada"
}

# Criar script de backup
create_backup_script() {
    log "💾 Criando script de backup..."
    
    cat > /tmp/backup-agentes-ia.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/agentes-ia/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup do banco PostgreSQL
docker exec agentes-ia-supabase pg_dump -U postgres postgres > "$BACKUP_DIR/postgres_$DATE.sql"

# Backup dos dados do Grafana
tar -czf "$BACKUP_DIR/grafana_$DATE.tar.gz" -C /opt/agentes-ia/data grafana/

# Backup das configurações
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" -C /opt/agentes-ia config/

# Remover backups antigos (manter últimos 7 dias)
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup realizado: $DATE"
EOF

    $SUDO mv /tmp/backup-agentes-ia.sh /opt/agentes-ia/
    $SUDO chmod +x /opt/agentes-ia/backup-agentes-ia.sh
    
    log "✅ Script de backup criado em /opt/agentes-ia/backup-agentes-ia.sh"
}

# Verificar recursos do sistema
check_system_resources() {
    log "🖥️ Verificando recursos do sistema..."
    
    # RAM
    total_ram=$(free -m | awk 'NR==2{print $2}')
    if [ $total_ram -lt 2048 ]; then
        warn "RAM total: ${total_ram}MB. Recomendado: pelo menos 2GB"
    else
        log "✅ RAM: ${total_ram}MB"
    fi
    
    # Disco
    disk_space=$(df -h / | awk 'NR==2{print $4}')
    log "💽 Espaço livre em disco: $disk_space"
    
    # CPU
    cpu_cores=$(nproc)
    log "🔧 CPU cores: $cpu_cores"
}

# Função principal
main() {
    echo -e "${BLUE}"
    echo "====================================================================="
    echo "    PREPARAÇÃO DA VPS PARA AGENTES DE IA - PORTAINER DEPLOY"
    echo "====================================================================="
    echo -e "${NC}"
    
    check_docker
    check_portainer
    check_system_resources
    install_dependencies
    create_directories
    configure_firewall
    create_nginx_config
    create_prometheus_config
    create_backup_script
    
    echo -e "${GREEN}"
    echo "====================================================================="
    echo "✅ PREPARAÇÃO CONCLUÍDA COM SUCESSO!"
    echo "====================================================================="
    echo ""
    echo "Próximos passos:"
    echo "1. Faça upload dos arquivos do seu projeto para a VPS"
    echo "2. Configure as variáveis de ambiente no arquivo env.portainer"
    echo "3. Acesse o Portainer e crie a stack usando portainer-stack-production.yml"
    echo "4. Configure backup automático: crontab -e"
    echo "   Exemplo: 0 2 * * * /opt/agentes-ia/backup-agentes-ia.sh"
    echo ""
    echo "Arquivos criados:"
    echo "- /opt/agentes-ia/config/nginx/nginx-proxy-production.conf"
    echo "- /opt/agentes-ia/config/prometheus-production.yml"
    echo "- /opt/agentes-ia/backup-agentes-ia.sh"
    echo ""
    echo "Diretórios de dados:"
    echo "- /opt/agentes-ia/data/supabase"
    echo "- /opt/agentes-ia/data/redis"
    echo "- /opt/agentes-ia/data/prometheus"
    echo "- /opt/agentes-ia/data/grafana"
    echo -e "${NC}"
}

# Executar função principal
main "$@" 