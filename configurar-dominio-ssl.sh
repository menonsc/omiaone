#!/bin/bash

# Script para Configurar Domínio e SSL - Agentes de IA
# Execute como usuário com sudo: bash configurar-dominio-ssl.sh

echo "🌐 Configurando domínio e SSL para Agentes de IA..."

# Verificar se está executando como root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Não execute este script como root. Use um usuário com sudo."
    exit 1
fi

# Solicitar informações do domínio
read -p "Digite seu domínio (ex: meusite.com): " DOMAIN
read -p "Digite seu email para certificados SSL: " EMAIL

echo "📋 Configurações:"
echo "Domínio: $DOMAIN"
echo "Email: $EMAIL"
read -p "Confirma? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado pelo usuário"
    exit 1
fi

# 1. Instalar Certbot
echo "🔐 Instalando Certbot..."
sudo apt update
sudo apt install -y snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# 2. Parar Nginx temporariamente
echo "⏸️ Parando Nginx..."
sudo systemctl stop nginx

# 3. Obter certificado SSL
echo "📜 Obtendo certificado SSL..."
sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

if [ $? -ne 0 ]; then
    echo "❌ Erro ao obter certificado SSL"
    echo "Verifique se:"
    echo "1. O domínio está apontando para este servidor"
    echo "2. As portas 80 e 443 estão abertas"
    echo "3. Não há outros serviços usando essas portas"
    exit 1
fi

# 4. Criar configuração Nginx para produção
echo "⚙️ Configurando Nginx..."

sudo tee /etc/nginx/sites-available/agentes-ia << EOF
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# Configuração HTTPS principal
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Configurações SSL modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de segurança
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Configurações de proxy
    client_max_body_size 50M;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Proxy para aplicação principal
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

    # Proxy para WebSocket (se necessário)
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

    # Proxy para API Evolution (ajustar porta conforme necessário)
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

    # Logs
    access_log /var/log/nginx/agentes-ia.access.log;
    error_log /var/log/nginx/agentes-ia.error.log;
}

# Configuração para Portainer (subdomínio ou porta específica)
server {
    listen 443 ssl http2;
    server_name portainer.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:9000;
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

# 5. Ativar configuração
sudo ln -sf /etc/nginx/sites-available/agentes-ia /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 6. Testar configuração Nginx
echo "🧪 Testando configuração Nginx..."
sudo nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do Nginx"
    exit 1
fi

# 7. Reiniciar Nginx
echo "🔄 Reiniciando Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# 8. Configurar renovação automática SSL
echo "🔄 Configurando renovação automática SSL..."
sudo crontab -l > temp_cron 2>/dev/null || true
echo "0 12 * * * /usr/bin/certbot renew --quiet --reload-nginx" >> temp_cron
sudo crontab temp_cron
rm temp_cron

# 9. Atualizar firewall para HTTPS
echo "🛡️ Atualizando firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw delete allow 'Nginx HTTP'

echo "✅ Configuração de domínio e SSL concluída!"
echo ""
echo "🌐 Seu site estará disponível em:"
echo "- https://$DOMAIN"
echo "- https://www.$DOMAIN"
echo "- https://portainer.$DOMAIN (Portainer)"
echo ""
echo "📋 Próximos passos:"
echo "1. Teste o acesso ao domínio"
echo "2. Configure DNS para portainer.$DOMAIN se necessário"
echo "3. Faça deploy da aplicação via Portainer"
echo ""
echo "🔐 Certificado SSL configurado e renovação automática ativada!" 