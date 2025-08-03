# Deploy Inicial Simples

param(
    [string]$VpsIp = "159.65.225.133",
    [string]$VpsUser = "root"
)

Write-Host "Deploy Inicial - VPS Nova" -ForegroundColor Blue

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$deployFile = "tapago-deploy-$timestamp.tar.gz"

try {
    # 1. Criar arquivo
    Write-Host "1. Criando arquivo..." -ForegroundColor Yellow
    & tar -czf $deployFile --exclude=.git --exclude=node_modules --exclude=.next --exclude=*.log .
    Write-Host "Arquivo criado: $deployFile" -ForegroundColor Green

    # 2. Upload arquivo
    Write-Host "2. Upload arquivo..." -ForegroundColor Yellow
    & scp $deployFile "${VpsUser}@${VpsIp}:/tmp/"
    Write-Host "Upload concluido" -ForegroundColor Green

    # 3. Upload script
    Write-Host "3. Upload script..." -ForegroundColor Yellow
    & scp install-server.sh "${VpsUser}@${VpsIp}:/tmp/"
    Write-Host "Script enviado" -ForegroundColor Green

    # 4. Executar instalação
    Write-Host "4. Executando instalação..." -ForegroundColor Yellow
    Write-Host "Isso pode demorar alguns minutos..." -ForegroundColor Gray
    & ssh "${VpsUser}@${VpsIp}" "chmod +x /tmp/install-server.sh && /tmp/install-server.sh"
    
    Write-Host ""
    Write-Host "DEPLOY CONCLUIDO!" -ForegroundColor Green
    Write-Host "Acesse: http://$VpsIp`:3002" -ForegroundColor Cyan
    Write-Host "Login: admin@tapago.com / admin123" -ForegroundColor Cyan

} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Limpar arquivo local
    if (Test-Path $deployFile) {
        Remove-Item $deployFile -Force
    }
}