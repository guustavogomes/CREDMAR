# Deploy Limpo para VPS - TaPago
$VPS_IP = "159.65.225.133"
$VPS_USER = "root"
$PROJECT_DIR = "/var/www/tapago"

Write-Host "Iniciando deploy para VPS: $VPS_IP" -ForegroundColor Green

# 1. Criar diretório do projeto
Write-Host "1. Criando diretório do projeto..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "mkdir -p $PROJECT_DIR"

# 2. Transferir arquivos principais
Write-Host "2. Transferindo arquivos..." -ForegroundColor Yellow

# Transferir código fonte
Write-Host "  - Transferindo src/" -ForegroundColor Gray
scp -r src "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"

# Transferir arquivos de configuração
Write-Host "  - Transferindo arquivos de configuração..." -ForegroundColor Gray
scp package.json "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"
scp package-lock.json "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"
scp next.config.js "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"
scp tsconfig.json "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"
scp tailwind.config.ts "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"
scp Dockerfile "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"
scp docker-compose.yml "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"
scp .env.example "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"

# Transferir schema do Prisma
Write-Host "  - Transferindo Prisma..." -ForegroundColor Gray
scp -r prisma "${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/"

# 3. Verificar se .env existe, se não, criar um básico
Write-Host "3. Configurando ambiente..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR; if [ ! -f .env ]; then cp .env.example .env; fi"

# 4. Construir e iniciar aplicação
Write-Host "4. Construindo aplicação..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR; docker-compose build"

Write-Host "5. Iniciando serviços..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR; docker-compose up -d"

# 6. Aguardar inicialização
Write-Host "6. Aguardando inicialização..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 7. Verificar status
Write-Host "7. Verificando status..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR; docker-compose ps"

# 8. Teste de conectividade
Write-Host "8. Testando aplicação..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$VPS_IP:3000" -TimeoutSec 30 -UseBasicParsing
    Write-Host "Aplicação funcionando! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Erro na conectividade: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Deploy concluído!" -ForegroundColor Green
Write-Host "URL da aplicação: http://$VPS_IP:3000" -ForegroundColor Cyan
Write-Host "Admin: http://$VPS_IP:3000/admin" -ForegroundColor Cyan