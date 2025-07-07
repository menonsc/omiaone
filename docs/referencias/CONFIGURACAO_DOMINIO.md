# 🌐 Configuração do Domínio - Agentes de IA

## 📋 Status Atual

✅ **Sistema funcionando localmente:**
- Frontend: http://localhost
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090
- Supabase: localhost:5432
- Redis: localhost:6379

## 🚀 Para Produção com Domínio

### 1. Configuração do DNS

Para que o domínio `producao.elevroi.com` funcione, você precisa:

#### **Opção A: VPS com IP Público**
1. Configure o DNS do domínio para apontar para o IP da sua VPS
2. Certifique-se de que as portas 80 e 443 estão abertas no firewall
3. Use os certificados SSL reais (não autoassinados)

#### **Opção B: Cloudflare (Recomendado)**
1. Configure o proxy da Cloudflare como **Flexible** (não Full)
2. Isso permite que o Cloudflare faça HTTPS até ele, mas conecte via HTTP ao seu servidor
3. Nesse caso, você pode remover o bloco HTTPS do nginx

### 2. Certificados SSL Reais

Para produção, substitua os certificados autoassinados:

```bash
# Remover certificados de teste
rm -rf ssl/

# Criar diretório para certificados reais
mkdir -p ssl

# Copiar seus certificados reais
cp seu-certificado-real.pem ssl/cert.pem
cp sua-chave-privada-real.pem ssl/key.pem
```

### 3. Configuração Cloudflare Flexible

Se usar Cloudflare com SSL Flexible, modifique o `nginx-proxy.conf`:

```nginx
# Comentar ou remover o bloco HTTPS
# server {
#     listen 443 ssl;
#     http2 on;
#     server_name producao.elevroi.com;
#     ...
# }

# Manter apenas o bloco HTTP
server {
    listen 80;
    server_name producao.elevroi.com;
    
    # Frontend React App
    location / {
        proxy_pass http://frontend;
        # ... resto da configuração
    }
}
```

### 4. Configuração Cloudflare Full

Se usar Cloudflare com SSL Full, mantenha o HTTPS no nginx e use certificados reais.

## 🔧 Comandos Úteis

### Verificar Status
```bash
# Status dos containers
docker-compose ps

# Logs do nginx
docker-compose logs nginx-proxy

# Testar acesso local
curl -I http://localhost
curl -k -I https://localhost
```

### Reiniciar Serviços
```bash
# Reiniciar tudo
docker-compose restart

# Reiniciar apenas nginx
docker-compose restart nginx-proxy
```

### Backup e Restore
```bash
# Backup dos dados
./deploy.sh backup

# Restore dos dados
./deploy.sh restore backup_YYYYMMDD_HHMMSS
```

## 🌍 URLs de Acesso

### Desenvolvimento Local
- **Aplicação**: http://localhost
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

### Produção (quando configurado)
- **Aplicação**: https://producao.elevroi.com
- **Grafana**: https://producao.elevroi.com/grafana/ (admin/admin)
- **Prometheus**: https://producao.elevroi.com/prometheus/

## 🔒 Segurança

### Headers de Segurança Configurados
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer-when-downgrade
- Content-Security-Policy: default-src 'self' http: https: data: blob: 'unsafe-inline'

### Rate Limiting
- API: 10 requests/segundo
- Login: 5 requests/minuto

### Autenticação
- Prometheus e Grafana protegidos com autenticação básica
- Credenciais configuráveis via variáveis de ambiente

## 📊 Monitoramento

### Métricas Coletadas
- Frontend (health checks)
- Supabase (banco de dados)
- Redis (cache)
- Nginx (proxy)
- Sistema (via node-exporter)

### Alertas
- Configuráveis no Prometheus
- Dashboards no Grafana

## 🚨 Troubleshooting

### Problema: Domínio retorna 404
**Solução**: Verificar se o DNS está apontando para o servidor correto

### Problema: Certificado SSL inválido
**Solução**: Substituir certificados autoassinados por certificados reais

### Problema: Cloudflare não conecta
**Solução**: Verificar configuração SSL (Flexible vs Full) e firewall

### Problema: Container nginx não inicia
**Solução**: Verificar se os certificados SSL estão presentes em `ssl/`

## 📞 Suporte

Para problemas:
1. Verificar logs: `docker-compose logs`
2. Health check: `./deploy.sh health`
3. Status: `docker-compose ps` 