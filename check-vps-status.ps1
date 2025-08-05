# Script de Verificação do Status da VPS - TaPago
# Verifica se tudo está funcionando após o deploy

Write-Host "🔍 Verificando Status da VPS..." -ForegroundColor Green
Write-Host "=" * 50

$VPS_IP = "159.65.225.133"
$VPS_USER = "root"
$PROJECT_DIR = "/var/www/tapago"

# Função para executar comandos SSH
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "🔧 $Description..." -ForegroundColor Cyan
    ssh "${VPS_USER}@${VPS_IP}" "$Command"
    Write-Host ""
}

# Verificações
Write-Host "📋 VERIFICAÇÕES DO SISTEMA:" -ForegroundColor Yellow
Write-Host ""

# 1. Status dos containers
Invoke-SSHCommand "cd $PROJECT_DIR; docker-compose ps" "Status dos containers Docker"

# 2. Logs recentes
Invoke-SSHCommand "cd $PROJECT_DIR; docker-compose logs app --tail=15" "Logs recentes da aplicação"

# 3. Uso de recursos
Invoke-SSHCommand "free -h; df -h" "Uso de memória e disco"

# 4. Processos Docker
Invoke-SSHCommand "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" "Containers em execução"

# 5. Conectividade de rede
Write-Host "🌐 Testando conectividade..." -ForegroundColor Yellow

$urls = @(
    "http://$VPS_IP:3000",
    "http://$VPS_IP:3000/login",
    "http://$VPS_IP:3000/admin"
)

foreach ($url in $urls) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -UseBasicParsing
        Write-Host "✅ $url - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $url - Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=" * 50
Write-Host "📊 RESUMO DO STATUS" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "🌐 IP da VPS: $VPS_IP" -ForegroundColor Cyan
Write-Host "📁 Diretório: $PROJECT_DIR" -ForegroundColor Cyan
Write-Host "🐳 Docker: Verificado acima" -ForegroundColor Cyan
Write-Host "🔗 URLs: Testadas acima" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Verificação concluída!" -ForegroundColor Green