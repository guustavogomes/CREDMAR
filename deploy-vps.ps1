# Script de Deploy para VPS - TaPago
# Executa o deploy das atualizações na VPS

Write-Host "🚀 Iniciando Deploy na VPS..." -ForegroundColor Green
Write-Host "=" * 50

# Configurações
$VPS_IP = "24.144.88.69"
$VPS_USER = "root"
$PROJECT_DIR = "/var/www/tapago"
$BACKUP_DIR = "/var/backups/tapago"

Write-Host "📋 INFORMAÇÕES DO DEPLOY:" -ForegroundColor Yellow
Write-Host "VPS IP: $VPS_IP"
Write-Host "Usuário: $VPS_USER"
Write-Host "Diretório: $PROJECT_DIR"
Write-Host ""

# Função para executar comandos SSH
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "🔧 $Description..." -ForegroundColor Cyan
    Write-Host "Executando: $Command" -ForegroundColor Gray
    
    try {
        ssh ${VPS_USER}@${VPS_IP} $Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Description - Concluído" -ForegroundColor Green
        } else {
            Write-Host "❌ $Description - Erro (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $Description - Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Verificar conexão SSH
Write-Host "🔍 Verificando conexão SSH..." -ForegroundColor Yellow
try {
    ssh -o ConnectTimeout=10 ${VPS_USER}@${VPS_IP} "echo 'Conexão SSH OK'"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexão SSH estabelecida com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Falha na conexão SSH. Verifique:" -ForegroundColor Red
        Write-Host "  - IP da VPS: $VPS_IP" -ForegroundColor Red
        Write-Host "  - Chave SSH configurada" -ForegroundColor Red
        Write-Host "  - Firewall da VPS" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro na conexão SSH: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Comandos de deploy
Write-Host "🚀 Iniciando processo de deploy..." -ForegroundColor Green

# 1. Criar backup
Invoke-SSHCommand "mkdir -p $BACKUP_DIR" "Criando diretório de backup"
Invoke-SSHCommand "cp -r $PROJECT_DIR $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)" "Criando backup do projeto atual"

# 2. Navegar para o diretório do projeto
Invoke-SSHCommand "cd $PROJECT_DIR && pwd" "Navegando para diretório do projeto"

# 3. Parar containers
Invoke-SSHCommand "cd $PROJECT_DIR && docker-compose down" "Parando containers Docker"

# 4. Fazer pull das atualizações
Invoke-SSHCommand "cd $PROJECT_DIR && git pull origin main" "Atualizando código do repositório"

# 5. Reconstruir e subir containers
Invoke-SSHCommand "cd $PROJECT_DIR && docker-compose up --build -d" "Reconstruindo e iniciando containers"

# 6. Verificar status dos containers
Invoke-SSHCommand "cd $PROJECT_DIR && docker-compose ps" "Verificando status dos containers"

# 7. Verificar logs
Invoke-SSHCommand "cd $PROJECT_DIR && docker-compose logs app --tail=10" "Verificando logs da aplicação"

# 8. Teste de conectividade
Write-Host "🧪 Testando conectividade..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$VPS_IP:3000" -TimeoutSec 30 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Aplicação respondendo na porta 3000!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Aplicação respondeu com status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro ao testar conectividade: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=" * 50
Write-Host "🎉 DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "🌐 URLs para testar:" -ForegroundColor Yellow
Write-Host "  - Aplicação: http://$VPS_IP:3000" -ForegroundColor Cyan
Write-Host "  - Admin: http://$VPS_IP:3000/admin" -ForegroundColor Cyan
Write-Host "  - Login: admin@tapago.com / admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Teste a aplicação nas URLs acima" -ForegroundColor White
Write-Host "  2. Verifique se as novas funcionalidades estão funcionando" -ForegroundColor White
Write-Host "  3. Teste o sistema de toast e comprovantes" -ForegroundColor White
Write-Host "  4. Configure SSL se necessário" -ForegroundColor White
Write-Host ""
Write-Host "✅ Deploy finalizado com sucesso!" -ForegroundColor Green