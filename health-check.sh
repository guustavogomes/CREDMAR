#!/bin/bash

# 🏥 Script de Verificação de Saúde do TaPago
# Verifica se todos os serviços estão funcionando corretamente

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

echo -e "${BLUE}🏥 Verificação de Saúde do TaPago${NC}"
echo "=================================="

# Verificar se Docker está rodando
log_info "Verificando Docker..."
if docker --version > /dev/null 2>&1; then
    log_success "Docker está instalado e rodando"
else
    log_error "Docker não está disponível"
    exit 1
fi

# Verificar se docker-compose.yml existe
if [ ! -f "docker-compose.yml" ]; then
    log_error "docker-compose.yml não encontrado"
    exit 1
fi

# Verificar status dos containers
log_info "Verificando status dos containers..."
CONTAINERS_STATUS=$(docker-compose ps --services --filter "status=running")

if echo "$CONTAINERS_STATUS" | grep -q "app"; then
    log_success "Container da aplicação está rodando"
else
    log_error "Container da aplicação não está rodando"
fi

if echo "$CONTAINERS_STATUS" | grep -q "postgres"; then
    log_success "Container do PostgreSQL está rodando"
else
    log_error "Container do PostgreSQL não está rodando"
fi

# Verificar conectividade com o banco
log_info "Testando conexão com banco de dados..."
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    log_success "Banco de dados está respondendo"
else
    log_error "Banco de dados não está respondendo"
fi

# Verificar se aplicação está respondendo
log_info "Testando aplicação web..."
if command -v curl &> /dev/null; then
    if curl -f -s -m 10 http://localhost:3000 > /dev/null; then
        log_success "Aplicação web está respondendo"
    else
        log_warning "Aplicação web não está respondendo na porta 3000"
    fi
else
    log_warning "curl não está instalado, não foi possível testar a aplicação web"
fi

# Verificar uso de recursos
log_info "Verificando uso de recursos..."
echo
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Verificar logs recentes para erros
log_info "Verificando logs recentes para erros..."
ERROR_COUNT=$(docker-compose logs app --tail=50 2>/dev/null | grep -i "error\|exception\|failed" | wc -l)
if [ "$ERROR_COUNT" -gt 0 ]; then
    log_warning "Encontrados $ERROR_COUNT erros nos logs recentes"
    echo "Últimos erros:"
    docker-compose logs app --tail=50 | grep -i "error\|exception\|failed" | tail -5
else
    log_success "Nenhum erro encontrado nos logs recentes"
fi

# Verificar espaço em disco
log_info "Verificando espaço em disco..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    log_error "Espaço em disco crítico: ${DISK_USAGE}% usado"
elif [ "$DISK_USAGE" -gt 80 ]; then
    log_warning "Espaço em disco alto: ${DISK_USAGE}% usado"
else
    log_success "Espaço em disco OK: ${DISK_USAGE}% usado"
fi

# Verificar uso do Docker
log_info "Verificando uso do Docker..."
docker system df

echo
echo "=================================="
log_info "Verificação de saúde concluída!"

# Resumo final
echo
echo "📊 Resumo:"
echo "- Containers rodando: $(docker-compose ps --services --filter 'status=running' | wc -l)/2"
echo "- Uso de disco: ${DISK_USAGE}%"
echo "- Erros recentes: $ERROR_COUNT"

if [ "$ERROR_COUNT" -eq 0 ] && [ "$DISK_USAGE" -lt 80 ]; then
    log_success "Sistema está saudável! 🎉"
else
    log_warning "Sistema precisa de atenção! ⚠️"
fi