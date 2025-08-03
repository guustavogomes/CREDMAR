# Script para Configurar Chave SSH na VPS

param(
    [string]$VpsIp = "159.65.225.133",
    [string]$VpsUser = "root"
)

Write-Host "Configurando Chave SSH na VPS" -ForegroundColor Blue
Write-Host "VPS: $VpsUser@$VpsIp" -ForegroundColor Cyan

# Ler chave publica
$publicKey = Get-Content ~/.ssh/id_ed25519.pub -ErrorAction SilentlyContinue

if (-not $publicKey) {
    Write-Host "Chave SSH nao encontrada em ~/.ssh/id_ed25519.pub" -ForegroundColor Red
    Write-Host "Gere uma chave com: ssh-keygen -t ed25519 -C 'seu-email@exemplo.com'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Chave SSH encontrada:" -ForegroundColor Green
Write-Host "$publicKey" -ForegroundColor Cyan

Write-Host ""
Write-Host "OPCOES PARA CONFIGURAR SSH:" -ForegroundColor Yellow

Write-Host ""
Write-Host "1. VIA CONSOLE DA VPS (Recomendado):" -ForegroundColor White
Write-Host "   Acesse o console da VPS pelo painel de controle e execute:" -ForegroundColor Gray
Write-Host "   mkdir -p ~/.ssh" -ForegroundColor Gray
Write-Host "   echo '$publicKey' >> ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host "   chmod 700 ~/.ssh" -ForegroundColor Gray

Write-Host ""
Write-Host "2. VIA PAINEL DE CONTROLE:" -ForegroundColor White
Write-Host "   - Acesse o painel da sua VPS (DigitalOcean, Vultr, etc.)" -ForegroundColor Gray
Write-Host "   - Va para secao 'SSH Keys' ou 'Security'" -ForegroundColor Gray
Write-Host "   - Adicione a chave publica acima" -ForegroundColor Gray

Write-Host ""
Write-Host "3. COMANDO UNICO (Para copiar e colar):" -ForegroundColor White
Write-Host "mkdir -p ~/.ssh && echo '$publicKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh" -ForegroundColor Cyan

Write-Host ""
Write-Host "APOS CONFIGURAR:" -ForegroundColor Green
Write-Host "1. Teste a conexao: ssh $VpsUser@$VpsIp" -ForegroundColor Gray
Write-Host "2. Execute o script automatico: powershell -ExecutionPolicy Bypass -File update-auto.ps1" -ForegroundColor Gray

Write-Host ""
Write-Host "TROUBLESHOOTING:" -ForegroundColor Yellow
Write-Host "Se ainda nao funcionar, verifique:" -ForegroundColor Gray
Write-Host "- Permissoes do arquivo: ls -la ~/.ssh/" -ForegroundColor Gray
Write-Host "- Conteudo do arquivo: cat ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host "- Configuracao SSH: cat /etc/ssh/sshd_config | grep -E 'PubkeyAuthentication|PasswordAuthentication'" -ForegroundColor Gray