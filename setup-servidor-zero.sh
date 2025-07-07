#!/bin/bash

# Script de Configuração Inicial do Servidor - Agentes de IA
# Execute como root: bash setup-servidor-zero.sh

echo "🚀 Iniciando configuração do servidor para Agentes de IA..."

# 1. Atualizar sistema
echo "📦 Atualizando sistema..."
apt update && apt upgrade -y

# 2. Configurar timezone
echo "🕐 Configurando timezone..."
timedatectl set-timezone America/Sao_Paulo

# 3. Criar usuário não-root
echo "👤 Criando usuário deploy..."
read -p "Digite o nome do usuário para deploy: " DEPLOY_USER
adduser $DEPLOY_USER
usermod -aG sudo $DEPLOY_USER

# 4. Configurar SSH (segurança)
echo "🔐 Configurando SSH..."
# Backup da configuração original
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Configurações de segurança SSH
cat << EOF >> /etc/ssh/sshd_config

# Configurações de segurança adicionadas
PermitRootLogin no
PasswordAuthentication yes
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

# 5. Configurar Firewall UFW
echo "🛡️ Configurando firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp  # Portainer
ufw allow 9000/tcp  # Portainer UI
ufw --force enable

# 6. Instalar Docker
echo "🐳 Instalando Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Adicionar usuário ao grupo docker
usermod -aG docker $DEPLOY_USER

# 7. Instalar Docker Compose
echo "🔧 Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 8. Instalar Portainer
echo "📊 Instalando Portainer..."
docker volume create portainer_data
docker run -d -p 8080:8000 -p 9000:9000 --name portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# 9. Instalar utilitários essenciais
echo "🛠️ Instalando utilitários..."
apt install -y curl wget git htop nano vim unzip fail2ban

# 10. Configurar Fail2Ban (proteção contra brute force)
echo "🔒 Configurando Fail2Ban..."
systemctl enable fail2ban
systemctl start fail2ban

# 11. Configurar logs e limpeza automática
echo "📝 Configurando limpeza de logs..."
cat << EOF > /etc/cron.daily/docker-cleanup
#!/bin/bash
# Limpar containers parados
docker container prune -f
# Limpar imagens não utilizadas
docker image prune -a -f
# Limpar volumes não utilizados
docker volume prune -f
# Limpar redes não utilizadas
docker network prune -f
EOF

chmod +x /etc/cron.daily/docker-cleanup

# 12. Configurar diretório do projeto
echo "📁 Configurando diretório do projeto..."
mkdir -p /home/$DEPLOY_USER/agentes-ia
chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/agentes-ia

# 13. Instalar Nginx (para proxy reverso)
echo "🌐 Instalando Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# 14. Configurar swap (se necessário)
echo "💾 Configurando swap..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "✅ Configuração inicial concluída!"
echo ""
echo "🔧 Próximos passos:"
echo "1. Acesse Portainer em: http://SEU_IP:9000"
echo "2. Configure seu domínio e SSL"
echo "3. Faça deploy da aplicação"
echo ""
echo "📋 Informações importantes:"
echo "- Usuário criado: $DEPLOY_USER"
echo "- Diretório do projeto: /home/$DEPLOY_USER/agentes-ia"
echo "- Portainer: http://SEU_IP:9000"
echo "- Firewall ativo com portas: 22, 80, 443, 8080, 9000"
echo ""
echo "⚠️  IMPORTANTE: Configure chaves SSH para maior segurança!" 