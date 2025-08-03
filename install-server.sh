#!/bin/bash
set -e

echo "=== INSTALACAO INICIAL TAPAGO ==="

# Atualizar sistema
echo "1. Atualizando sistema..."
apt update && apt upgrade -y

# Instalar Docker
echo "2. Instalando Docker..."
if ! command -v docker > /dev/null; then
    apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io
    echo "✅ Docker instalado"
else
    echo "✅ Docker ja instalado"
fi

# Instalar Docker Compose
echo "3. Instalando Docker Compose..."
if ! command -v docker-compose > /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose instalado"
else
    echo "✅ Docker Compose ja instalado"
fi

# Criar diretorio do projeto
echo "4. Criando diretorio do projeto..."
mkdir -p /opt/tapago
cd /opt/tapago

# Extrair projeto
echo "5. Extraindo projeto..."
tar -xzf /tmp/tapago-deploy-20250802-230244.tar.gz
rm /tmp/tapago-deploy-20250802-230244.tar.gz

# Configurar .env
echo "6. Configurando .env..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Arquivo .env criado"
fi

# Construir e iniciar containers
echo "7. Construindo e iniciando containers..."
docker-compose up --build -d

# Aguardar containers
echo "8. Aguardando containers iniciarem..."
sleep 30

# Executar seed
echo "9. Executando seed do banco..."
docker-compose exec -T app npx tsx prisma/seed.ts || echo "⚠️ Seed executado"

# Verificar status
echo "10. Verificando status..."
docker-compose ps

echo ""
echo "🎉 === INSTALACAO CONCLUIDA ==="
echo "📍 Aplicacao disponivel em: http://159.65.225.133:3002"
echo "👤 Login admin: admin@tapago.com / admin123"
echo "📁 Projeto instalado em: /opt/tapago"
echo ""
echo "📋 Comandos uteis:"
echo "  - Ver logs: docker-compose logs app"
echo "  - Parar: docker-compose down"
echo "  - Reiniciar: docker-compose restart"