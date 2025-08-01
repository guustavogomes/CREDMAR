# 🚀 Deploy na VPS - TaPago

Instruções completas para fazer deploy do TaPago em uma VPS.

## 📋 Pré-requisitos na VPS

- Ubuntu/Debian (recomendado)
- Docker e Docker Compose instalados
- Git instalado
- Acesso SSH à VPS

## 🛠️ Instalação do Docker (se não estiver instalado)

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Adicionar chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório do Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Reiniciar sessão ou executar:
newgrp docker
```

## 🚀 Deploy da Aplicação

### 1. Clone o repositório
```bash
cd /home/$USER
git clone https://github.com/guustavogomes/Tapago.git
cd Tapago
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
nano .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres123@postgres:5432/tapago"

# NextAuth
NEXTAUTH_SECRET="seu-secret-super-seguro-aqui"
NEXTAUTH_URL="http://seu-dominio.com"

# Email (opcional)
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=""
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM=""
```

### 3. Ajustar porta (opcional)
Se quiser usar uma porta diferente, edite o `docker-compose.yml`:
```yaml
services:
  app:
    ports:
      - "80:3000"  # Para usar porta 80
      # ou
      - "3001:3000"  # Para manter porta 3001
```

### 4. Executar a aplicação
```bash
# Subir os containers
docker-compose up --build -d

# Verificar se estão rodando
docker-compose ps
```

### 5. Executar o seed do banco
```bash
# Executar seed para criar usuário admin
docker-compose exec app npx tsx prisma/seed.ts
```

### 6. Verificar logs
```bash
# Ver logs da aplicação
docker-compose logs app

# Ver logs em tempo real
docker-compose logs -f app
```

## 🔧 Configuração de Proxy Reverso (Nginx)

Para usar um domínio personalizado, configure o Nginx:

### 1. Instalar Nginx
```bash
sudo apt install -y nginx
```

### 2. Criar configuração do site
```bash
sudo nano /etc/nginx/sites-available/tapago
```

Adicione a configuração:
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Ativar o site
```bash
sudo ln -s /etc/nginx/sites-available/tapago /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Configurar SSL com Certbot (opcional)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

## 🔒 Configurações de Segurança

### 1. Configurar Firewall
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Alterar senhas padrão
- Acesse a aplicação e altere a senha do admin
- Considere alterar a senha do PostgreSQL no docker-compose.yml

## 📊 Monitoramento

### Comandos úteis para monitoramento:
```bash
# Status dos containers
docker-compose ps

# Logs da aplicação
docker-compose logs app --tail=50

# Logs do banco
docker-compose logs postgres --tail=50

# Uso de recursos
docker stats

# Espaço em disco
df -h
```

## 🔄 Atualizações

Para atualizar a aplicação:
```bash
cd /home/$USER/Tapago

# Parar containers
docker-compose down

# Atualizar código
git pull origin main

# Reconstruir e subir
docker-compose up --build -d

# Verificar logs
docker-compose logs -f app
```

## 🆘 Troubleshooting

### Container não inicia:
```bash
# Ver logs detalhados
docker-compose logs app

# Reconstruir do zero
docker-compose down
docker-compose up --build
```

### Problemas de permissão:
```bash
# Verificar se usuário está no grupo docker
groups $USER

# Se não estiver, adicionar:
sudo usermod -aG docker $USER
newgrp docker
```

### Banco de dados não conecta:
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps

# Ver logs do banco
docker-compose logs postgres

# Testar conexão
docker-compose exec postgres psql -U postgres -d tapago
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: `docker-compose logs app`
2. Verifique se todos os containers estão rodando: `docker-compose ps`
3. Verifique as variáveis de ambiente no arquivo `.env`
4. Abra uma issue no GitHub com os logs de erro

## 🎉 Acesso Final

Após o deploy bem-sucedido:
- **URL**: http://seu-dominio.com ou http://ip-da-vps:3001
- **Login Admin**: 
  - Email: `admin@tapago.com`
  - Senha: `admin123`

**⚠️ IMPORTANTE**: Altere a senha do admin após o primeiro login!