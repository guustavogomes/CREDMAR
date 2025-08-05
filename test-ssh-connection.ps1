# Teste de Conexao SSH - TaPago VPS
# Verifica se conseguimos conectar na VPS antes do deploy

Write-Host "Testando Conexao SSH com a VPS..." -ForegroundColor Green
Write-Host "=" * 50

$VPS_IP = "24.144.88.69"
$VPS_USER = "root"

Write-Host "CONFIGURACOES:" -ForegroundColor Yellow
Write-Host "IP da VPS: $VPS_IP"
Write-Host "Usuario: $VPS_USER"
Write-Host ""

# Teste basico de conectividade
Write-Host "Testando conectividade basica..." -ForegroundColor Cyan
try {
    $ping = Test-Connection -ComputerName $VPS_IP -Count 2 -Quiet
    if ($ping) {
        Write-Host "Ping OK - VPS esta acessivel" -ForegroundColor Green
    } else {
        Write-Host "Ping falhou - VPS pode estar offline" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Erro no teste de ping: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Teste de conexao SSH
Write-Host "Testando conexao SSH..." -ForegroundColor Cyan
try {
    Write-Host "Tentando conectar via SSH..." -ForegroundColor Gray
    $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes ${VPS_USER}@${VPS_IP} "echo 'SSH Connection OK'"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Conexao SSH estabelecida com sucesso!" -ForegroundColor Green
        Write-Host "Resposta: $sshTest" -ForegroundColor Gray
    } else {
        Write-Host "Falha na conexao SSH (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
        Write-Host "Possiveis causas:" -ForegroundColor Yellow
        Write-Host "  - Chave SSH nao configurada" -ForegroundColor Gray
        Write-Host "  - Firewall bloqueando porta 22" -ForegroundColor Gray
        Write-Host "  - Servico SSH nao rodando na VPS" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "Erro na conexao SSH: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Informacoes do sistema remoto
Write-Host "Coletando informacoes do sistema..." -ForegroundColor Cyan
try {
    Write-Host "Sistema operacional:" -ForegroundColor Gray
    ssh ${VPS_USER}@${VPS_IP} "uname -a"
    
    Write-Host "Espaco em disco:" -ForegroundColor Gray
    ssh ${VPS_USER}@${VPS_IP} "df -h /"
    
    Write-Host "Memoria disponivel:" -ForegroundColor Gray
    ssh ${VPS_USER}@${VPS_IP} "free -h"
    
    Write-Host "Docker instalado:" -ForegroundColor Gray
    ssh ${VPS_USER}@${VPS_IP} "docker --version || echo 'Docker nao encontrado'"
    
} catch {
    Write-Host "Erro ao coletar informacoes do sistema" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 50
Write-Host "Teste de conexao concluido!" -ForegroundColor Green
Write-Host "Agora voce pode executar o deploy com seguranca." -ForegroundColor Cyan
Write-Host "=" * 50