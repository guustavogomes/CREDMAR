#!/bin/bash

# 🚀 Script de Atualização do TaPago na VPS
# Este script automatiza o processo de atualização da aplicação

set -e  # Parar em caso de erro

echo "🚀 Iniciando atualização do TaPago na VPS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    log_error "docker-compose.yml não encontrado. Execute este script no diretório raiz do projeto."
    exit 1
fi

# Backup do banco de dados (opcional)
read -p "Deseja fazer backup do banco de dados antes da atualização? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Criando backup do banco de dados..."
    mkdir -p backups
    BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose exec -T postgres pg_dump -U postgres tapago > "$BACKUP_FILE"
    log_success "Backup criado: $BACKUP_FILE"
fi

# Parar containers
log_info "Parando containers..."
docker-compose down

# Fazer backup dos arquivos de configuração
log_info "Fazendo backup das configurações..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || log_warning "Arquivo .env não encontrado"

# Atualizar código do repositório
log_info "Atualizando código do repositório..."
git stash push -m "Auto-stash before update $(date)"
git pull origin main

# Verificar se houve mudanças no package.json
if git diff HEAD~1 HEAD --name-only | grep -q "package.json\|package-lock.json"; then
    log_warning "Dependências foram alteradas. Será necessário rebuild completo."
    REBUILD_FLAG="--build"
else
    REBUILD_FLAG=""
fi

# Verificar se houve mudanças no schema do Prisma
if git diff HEAD~1 HEAD --name-only | grep -q "prisma/schema.prisma"; then
    log_warning "Schema do Prisma foi alterado. Será necessário executar migrações."
    PRISMA_MIGRATION=true
else
    PRISMA_MIGRATION=false
fi

# Reconstruir e subir containers
log_info "Iniciando containers..."
if [ -n "$REBUILD_FLAG" ]; then
    log_info "Reconstruindo imagens Docker..."
    docker-compose up $REBUILD_FLAG -d
else
    docker-compose up -d
fi

# Aguardar containers ficarem prontos
log_info "Aguardando containers ficarem prontos..."
sleep 10

# Executar migrações do Prisma se necessário
if [ "$PRISMA_MIGRATION" = true ]; then
    log_info "Executando migrações do Prisma..."
    docker-compose exec app npx prisma db push
    docker-compose exec app npx prisma generate
fi

# Verificar se containers estão rodando
log_info "Verificando status dos containers..."
if docker-compose ps | grep -q "Up"; then
    log_success "Containers estão rodando!"
else
    log_error "Alguns containers não estão rodando. Verificando logs..."
    docker-compose logs --tail=20
    exit 1
fi

# Mostrar logs recentes
log_info "Logs recentes da aplicação:"
docker-compose logs app --tail=10

# Verificar se aplicação está respondendo
log_info "Verificando se aplicação está respondendo..."
sleep 5

# Tentar fazer uma requisição para verificar se está funcionando
if command -v curl &> /dev/null; then
    if curl -f -s http://localhost:3000 > /dev/null; then
        log_success "Aplicação está respondendo!"
    else
        log_warning "Aplicação pode não estar respondendo na porta 3000"
    fi
fi

# Limpeza de imagens antigas (opcional)
read -p "Deseja limpar imagens Docker antigas para economizar espaço? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Limpando imagens antigas..."
    docker image prune -f
    log_success "Limpeza concluída!"
fi

log_success "🎉 Atualização concluída com sucesso!"
log_info "Para monitorar logs em tempo real: docker-compose logs -f app"
log_info "Para verificar status: docker-compose ps"

echo
echo "📊 Status atual dos containers:"
docker-compose ps