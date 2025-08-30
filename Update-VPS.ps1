# 🚀 Script de Atualização do TaPago na VPS (PowerShell)
# Este script automatiza o processo de atualização da aplicação

param(
    [switch]$SkipBackup,
    [switch]$ForceRebuild,
    [switch]$SkipCleanup
)

# Configurar cores
$Host.UI.RawUI.ForegroundColor = "White"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Log-Info($message) {
    Write-ColorOutput Blue "ℹ️  $message"
}

function Log-Success($message) {
    Write-ColorOutput Green "✅ $message"
}

function Log-Warning($message) {
    Write-ColorOutput Yellow "⚠️  $message"
}

function Log-Error($message) {
    Write-ColorOutput Red "❌ $message"
}

Write-ColorOutput Cyan "🚀 Iniciando atualização do TaPago na VPS..."

# Verificar se estamos no diretório correto
if (-not (Test-Path "docker-compose.yml")) {
    Log-Error "docker-compose.yml não encontrado. Execute este script no diretório raiz do projeto."
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se Docker está rodando
try {
    docker version | Out-Null
} catch {
    Log-Error "Docker não está rodando ou não está instalado."
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Backup do banco de dados (opcional)
if (-not $SkipBackup) {
    $backup = Read-Host "Deseja fazer backup do banco de dados antes da atualização? (y/n)"
    if ($backup -eq "y" -or $backup -eq "Y") {
        Log-Info "Criando backup do banco de dados..."
        if (-not (Test-Path "backups")) {
            New-Item -ItemType Directory -Path "backups" | Out-Null
        }
        $backupFile = "backups/backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
        try {
            docker-compose exec -T postgres pg_dump -U postgres tapago | Out-File -FilePath $backupFile -Encoding UTF8
            Log-Success "Backup criado: $backupFile"
        } catch {
            Log-Warning "Erro ao criar backup: $_"
        }
    }
}

# Parar containers
Log-Info "Parando containers..."
docker-compose down

# Fazer backup dos arquivos de configuração
Log-Info "Fazendo backup das configurações..."
if (Test-Path ".env") {
    $backupEnv = ".env.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item ".env" $backupEnv
    Log-Success "Backup do .env criado: $backupEnv"
} else {
    Log-Warning "Arquivo .env não encontrado"
}

# Atualizar código do repositório
Log-Info "Atualizando código do repositório..."
try {
    git stash push -m "Auto-stash before update $(Get-Date)"
    git pull origin main
    Log-Success "Código atualizado com sucesso!"
} catch {
    Log-Error "Erro ao atualizar código: $_"
    Read-Host "Pressione Enter para continuar mesmo assim"
}

# Verificar se houve mudanças importantes
$packageChanged = $false
$prismaChanged = $false

try {
    $changedFiles = git diff HEAD~1 HEAD --name-only
    if ($changedFiles -match "package\.json|package-lock\.json") {
        $packageChanged = $true
        Log-Warning "Dependências foram alteradas. Será necessário rebuild completo."
    }
    if ($changedFiles -match "prisma/schema\.prisma") {
        $prismaChanged = $true
        Log-Warning "Schema do Prisma foi alterado. Será necessário executar migrações."
    }
} catch {
    Log-Warning "Não foi possível verificar mudanças. Fazendo rebuild por segurança."
    $packageChanged = $true
}

# Reconstruir e subir containers
Log-Info "Iniciando containers..."
if ($ForceRebuild -or $packageChanged) {
    Log-Info "Reconstruindo imagens Docker..."
    docker-compose up --build -d
} else {
    docker-compose up -d
}

# Aguardar containers ficarem prontos
Log-Info "Aguardando containers ficarem prontos..."
Start-Sleep -Seconds 10

# Executar migrações do Prisma se necessário
if ($prismaChanged) {
    Log-Info "Executando migrações do Prisma..."
    try {
        docker-compose exec app npx prisma db push
        docker-compose exec app npx prisma generate
        Log-Success "Migrações executadas com sucesso!"
    } catch {
        Log-Warning "Erro ao executar migrações: $_"
    }
}

# Verificar se containers estão rodando
Log-Info "Verificando status dos containers..."
$status = docker-compose ps
if ($status -match "Up") {
    Log-Success "Containers estão rodando!"
} else {
    Log-Error "Alguns containers não estão rodando. Verificando logs..."
    docker-compose logs --tail=20
}

# Mostrar logs recentes
Log-Info "Logs recentes da aplicação:"
docker-compose logs app --tail=10

# Verificar se aplicação está respondendo
Log-Info "Verificando se aplicação está respondendo..."
Start-Sleep -Seconds 5

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Log-Success "Aplicação está respondendo!"
    }
} catch {
    Log-Warning "Aplicação pode não estar respondendo na porta 3000"
}

# Limpeza de imagens antigas (opcional)
if (-not $SkipCleanup) {
    $cleanup = Read-Host "Deseja limpar imagens Docker antigas para economizar espaço? (y/n)"
    if ($cleanup -eq "y" -or $cleanup -eq "Y") {
        Log-Info "Limpando imagens antigas..."
        docker image prune -f
        Log-Success "Limpeza concluída!"
    }
}

Log-Success "🎉 Atualização concluída com sucesso!"
Write-ColorOutput Cyan "Para monitorar logs em tempo real: docker-compose logs -f app"
Write-ColorOutput Cyan "Para verificar status: docker-compose ps"

Write-Host ""
Write-ColorOutput Magenta "📊 Status atual dos containers:"
docker-compose ps

Read-Host "Pressione Enter para sair"