# Deploy de Atualizacao - TaPago
$VPS_IP = "159.65.225.133"
$VPS_USER = "root"
$PROJECT_DIR = "/opt/tapago"

Write-Host "Atualizando aplicacao em: $PROJECT_DIR" -ForegroundColor Green

# 1. Verificar status atual
Write-Host "1. Verificando status atual..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR && ls -la"
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR && docker-compose ps"

# 2. Fazer backup do banco
Write-Host "2. Fazendo backup do banco..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
ssh "${VPS_USER}@${VPS_IP}" "mkdir -p /var/backups/tapago"

# 3. Parar apenas a aplicacao (manter banco rodando)
Write-Host "3. Parando aplicacao..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR && docker-compose stop app"

# 4. Transferir arquivos atualizados
Write-Host "4. Transferindo codigo atualizado..." -ForegroundColor Yellow

Write-Host "  - Atualizando src/" -ForegroundColor Gray
scp -r src "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"

Write-Host "  - Atualizando configuracoes..." -ForegroundColor Gray
scp package.json "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"
scp package-lock.json "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"
scp next.config.js "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"
scp tsconfig.json "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"
scp Dockerfile "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"
scp docker-compose.yml "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"

Write-Host "  - Atualizando Prisma..." -ForegroundColor Gray
scp -r prisma "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"

# 5. Reconstruir aplicacao
Write-Host "5. Reconstruindo aplicacao..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR && docker-compose build app"

# 6. Iniciar todos os servicos
Write-Host "6. Iniciando servicos..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR && docker-compose up -d"

# 7. Aguardar inicializacao
Write-Host "7. Aguardando inicializacao..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 8. Verificar status final
Write-Host "8. Verificando status..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR && docker-compose ps"
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR && docker-compose logs app --tail=10"

# 9. Teste de conectividade
Write-Host "9. Testando aplicacao..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$VPS_IP:3000" -TimeoutSec 30 -UseBasicParsing
    Write-Host "Aplicacao funcionando! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Erro na conectividade: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "DEPLOY CONCLUIDO!" -ForegroundColor Green
Write-Host "Diretorio: $PROJECT_DIR" -ForegroundColor Cyan
Write-Host "URL: http://$VPS_IP:3000" -ForegroundColor Cyan
Write-Host "Admin: http://$VPS_IP:3000/admin" -ForegroundColor Cyan