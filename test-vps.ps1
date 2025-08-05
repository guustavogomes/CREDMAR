# Teste simples da VPS
$VPS_IP = "159.65.225.133"
$VPS_USER = "root"
$PROJECT_DIR = "/var/www/tapago"

Write-Host "Testando VPS: $VPS_IP" -ForegroundColor Green

# Teste de conexão
Write-Host "1. Testando conexão SSH..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "echo 'SSH OK'"

# Verificar se o diretório existe
Write-Host "2. Verificando diretório do projeto..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "ls -la $PROJECT_DIR"

# Status dos containers
Write-Host "3. Status dos containers..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "cd $PROJECT_DIR; docker-compose ps"

# Teste de conectividade web
Write-Host "4. Testando conectividade web..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$VPS_IP:3000" -TimeoutSec 10 -UseBasicParsing
    Write-Host "Aplicação respondendo: Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Aplicação não está respondendo: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Teste concluído!" -ForegroundColor Green