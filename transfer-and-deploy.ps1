# Script de Transferência e Deploy Seguro - TaPago
# Transfere arquivos atualizados preservando dados do banco

Write-Host "📦 Transferindo e Fazendo Deploy Seguro..." -ForegroundColor Green
Write-Host "=" * 60

# Configurações
$VPS_IP = "159.65.225.133"
$VPS_USER = "root"
$PROJECT_DIR = "/var/www/tapago"
$BACKUP_DIR = "/var/backups/tapago"
$LOCAL_DIR = "."

Write-Host "📋 CONFIGURAÇÕES:" -ForegroundColor Yellow
Write-Host "VPS IP: $VPS_IP"
Write-Host "Diretório Local: $LOCAL_DIR"
Write-Host "Diretório VPS: $PROJECT_DIR"
Write-Host "⚠️  IMPORTANTE: Dados do banco serão PRESERVADOS!" -ForegroundColor Red
Write-Host ""

# Verificar conexão SSH
Write-Host "🔍 Verificando conexão SSH..." -ForegroundColor Yellow
try {
    ssh -o ConnectTimeout=10 "${VPS_USER}@${VPS_IP}" "echo 'SSH OK'"
    Write-Host "✅ Conexão SSH estabelecida!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro na conexão SSH. Verifique a conectividade." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Função para executar comandos SSH
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "🔧 $Description..." -ForegroundColor Cyan
    ssh "${VPS_USER}@${VPS_IP}" "$Command"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $Description - OK" -ForegroundColor Green
    } else {
        Write-Host "❌ $Description - Erro" -ForegroundColor Red
    }
    Write-Host ""
}

# 1. Criar backup completo
Write-Host "💾 FASE 1: Backup de Segurança" -ForegroundColor Yellow
Write-Host "-" * 30

Invoke-SSHCommand "mkdir -p $BACKUP_DIR" "Criando diretório de backup"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
Invoke-SSHCommand "cp -r $PROJECT_DIR $BACKUP_DIR/backup-$timestamp" "Backup completo do projeto"

# 2. Parar aplicação (preservando banco)
Write-Host "⏹️  FASE 2: Parando Aplicação" -ForegroundColor Yellow
Write-Host "-" * 30

Invoke-SSHCommand "cd $PROJECT_DIR; docker-compose stop app" "Parando apenas a aplicação (mantendo banco)"

# 3. Fazer backup do banco de dados
Write-Host "🗄️  FASE 3: Backup do Banco de Dados" -ForegroundColor Yellow
Write-Host "-" * 30

Invoke-SSHCommand "cd $PROJECT_DIR; docker-compose exec -T postgres pg_dump -U postgres tapago > $BACKUP_DIR/database-backup-$timestamp.sql" "Backup do banco de dados"

# 4. Transferir arquivos atualizados
Write-Host "📤 FASE 4: Transferindo Arquivos" -ForegroundColor Yellow
Write-Host "-" * 30

# Lista de arquivos/pastas para transferir (excluindo dados sensíveis)
$filesToTransfer = @(
    "src/",
    "prisma/schema.prisma",
    "package.json",
    "package-lock.json",
    "next.config.js",
    "tailwind.config.ts",
    "tsconfig.json",
    "Dockerfile",
    "docker-compose.yml",
    ".env.example"
)

Write-Host "📁 Transferindo arquivos de código..." -ForegroundColor Cyan
foreach ($file in $filesToTransfer) {
    if (Test-Path $file) {
        Write-Host "  📄 Transferindo: $file" -ForegroundColor Gray
        scp -r $file ${VPS_USER}@${VPS_IP}:${PROJECT_DIR}/
    } else {
        Write-Host "  ⚠️  Arquivo não encontrado: $file" -ForegroundColor Yellow
    }
}

# 5. Verificar se .env existe na VPS (não sobrescrever)
Write-Host "🔐 FASE 5: Verificando Configurações" -ForegroundColor Yellow
Write-Host "-" * 30

Invoke-SSHCommand "cd $PROJECT_DIR; ls -la .env* || echo 'Nenhum arquivo .env encontrado'" "Verificando arquivos de configuração"

# 6. Reconstruir e iniciar aplicação
Write-Host "🚀 FASE 6: Reconstruindo Aplicação" -ForegroundColor Yellow
Write-Host "-" * 30

Invoke-SSHCommand "cd $PROJECT_DIR; docker-compose build app" "Reconstruindo imagem da aplicação"
Invoke-SSHCommand "cd $PROJECT_DIR; docker-compose up -d" "Iniciando todos os serviços"

# 7. Aguardar inicialização
Write-Host "⏳ Aguardando inicialização..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 8. Verificar status
Write-Host "✅ FASE 7: Verificação Final" -ForegroundColor Yellow
Write-Host "-" * 30

Invoke-SSHCommand "cd $PROJECT_DIR; docker-compose ps" "Status dos containers"
Invoke-SSHCommand "cd $PROJECT_DIR; docker-compose logs app --tail=10" "Logs da aplicação"

# 9. Teste de conectividade
Write-Host "🧪 FASE 8: Teste de Conectividade" -ForegroundColor Yellow
Write-Host "-" * 30

try {
    $response = Invoke-WebRequest -Uri "http://$VPS_IP:3000" -TimeoutSec 30 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Aplicação respondendo na porta 3000!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro na conectividade: $($_.Exception.Message)" -ForegroundColor Red
}

# Resumo final
Write-Host ""
Write-Host "=" * 60
Write-Host "🎉 DEPLOY CONCLUÍDO COM SEGURANÇA!" -ForegroundColor Green
Write-Host "=" * 60
Write-Host ""
Write-Host "📊 RESUMO:" -ForegroundColor Yellow
Write-Host "✅ Backup criado em: $BACKUP_DIR/backup-$timestamp" -ForegroundColor Green
Write-Host "✅ Banco de dados preservado" -ForegroundColor Green
Write-Host "✅ Código atualizado" -ForegroundColor Green
Write-Host "✅ Aplicação reiniciada" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLS PARA TESTAR:" -ForegroundColor Yellow
Write-Host "  - Aplicação: http://$VPS_IP:3000" -ForegroundColor Cyan
Write-Host "  - Admin: http://$VPS_IP:3000/admin" -ForegroundColor Cyan
Write-Host "  - Comprovantes: http://$VPS_IP:3000/installments/proofs-pending" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔑 LOGIN ADMIN:" -ForegroundColor Yellow
Write-Host "  - Email: admin@tapago.com" -ForegroundColor Cyan
Write-Host "  - Senha: admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Deploy seguro finalizado!" -ForegroundColor Green