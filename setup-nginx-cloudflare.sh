#!/bin/bash
set -e

echo "=== CONFIGURACAO NGINX + CLOUDFLARE ==="

DOMAIN="organizaemprestimos.com.br"
APP_PORT="3002"

echo "Dominio: $DOMAIN"
echo "Porta da aplicacao: $APP_PORT"
echo "Proxy: Cloudflare (SSL automatico)"

# 1. Instalar Nginx
echo "1. Instalando Nginx..."
apt update
apt install -y nginx

# 2. Configurar firewall
echo "2. Configurando firewall..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

# 3. Criar configuracao do Nginx para Cloudflare
echo "3. Criando configuracao do Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << 'EOF'
server {
    listen 80;
    server_name organizaemprestimos.com.br www.organizaemprestimos.com.br;

    # IPs do Cloudflare para proxy reverso
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2c0f:f248::/32;
    set_real_ip_from 2a06:98c0::/29;
    real_ip_header CF-Connecting-IP;

    # Configuracoes de seguranca
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Configuracao do proxy reverso
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Headers especificos para Cloudflare
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
        proxy_set_header CF-Ray $http_cf_ray;
        proxy_set_header CF-Visitor $http_cf_visitor;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # Logs
    access_log /var/log/nginx/organizaemprestimos.com.br.access.log;
    error_log /var/log/nginx/organizaemprestimos.com.br.error.log;
}
EOF

# 4. Ativar o site
echo "4. Ativando configuracao do site..."
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# 5. Remover configuracao padrao se existir
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    echo "Configuracao padrao removida"
fi

# 6. Testar configuracao do Nginx
echo "6. Testando configuracao do Nginx..."
nginx -t

# 7. Reiniciar Nginx
echo "7. Reiniciando Nginx..."
systemctl restart nginx
systemctl enable nginx

# 8. Atualizar .env do projeto para usar o dominio
echo "8. Atualizando configuracao da aplicacao..."
cd /opt/tapago
if [ -f .env ]; then
    # Backup do .env atual
    cp .env .env.backup
    
    # Atualizar NEXTAUTH_URL
    if grep -q "NEXTAUTH_URL" .env; then
        sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL="https://organizaemprestimos.com.br"|' .env
    else
        echo 'NEXTAUTH_URL="https://organizaemprestimos.com.br"' >> .env
    fi
    
    echo "Arquivo .env atualizado"
fi

# 9. Reiniciar aplicacao para aplicar mudancas
echo "9. Reiniciando aplicacao..."
docker-compose restart app

echo ""
echo "🎉 === CONFIGURACAO CONCLUIDA ==="
echo "✅ Nginx instalado e configurado"
echo "✅ Configuracao otimizada para Cloudflare"
echo "✅ Proxy reverso funcionando"
echo "✅ Aplicacao configurada para o dominio"
echo ""
echo "📋 PROXIMOS PASSOS:"
echo "1. No Cloudflare, configure:"
echo "   - DNS: A record organizaemprestimos.com.br -> $(curl -s ifconfig.me)"
echo "   - DNS: A record www.organizaemprestimos.com.br -> $(curl -s ifconfig.me)"
echo "   - SSL/TLS: Full (strict) ou Flexible"
echo "   - Proxy: Ativado (nuvem laranja)"
echo ""
echo "🌐 Apos configurar DNS:"
echo "   https://organizaemprestimos.com.br"
echo "   https://www.organizaemprestimos.com.br"
echo ""
echo "📊 Status dos servicos:"
systemctl status nginx --no-pager -l
echo ""
echo "📋 Comandos uteis:"
echo "   - Status Nginx: systemctl status nginx"
echo "   - Logs acesso: tail -f /var/log/nginx/$DOMAIN.access.log"
echo "   - Logs erro: tail -f /var/log/nginx/$DOMAIN.error.log"
echo "   - Testar config: nginx -t"
echo "   - Recarregar: systemctl reload nginx"