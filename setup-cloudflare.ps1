# Script para Configurar Nginx com Cloudflare

param(
    [string]$VpsIp = "159.65.225.133",
    [string]$VpsUser = "root",
    [string]$Domain = "organizaemprestimos.com.br"
)

Write-Host "Configurando Nginx + Cloudflare" -ForegroundColor Blue
Write-Host "VPS: $VpsUser@$VpsIp" -ForegroundColor Cyan
Write-Host "Dominio: $Domain" -ForegroundColor Cyan

try {
    # 1. Enviar script de configuracao
    Write-Host ""
    Write-Host "1. Enviando script de configuracao..." -ForegroundColor Yellow
    & scp setup-nginx-cloudflare.sh "${VpsUser}@${VpsIp}:/tmp/"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao enviar script"
    }
    
    Write-Host "Script enviado com sucesso!" -ForegroundColor Green

    # 2. Executar configuracao
    Write-Host ""
    Write-Host "2. Executando configuracao do Nginx..." -ForegroundColor Yellow
    Write-Host "Isso pode demorar alguns minutos..." -ForegroundColor Gray
    
    & ssh "${VpsUser}@${VpsIp}" "chmod +x /tmp/setup-nginx-cloudflare.sh && /tmp/setup-nginx-cloudflare.sh"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Falha na configuracao"
    }

    Write-Host ""
    Write-Host "CONFIGURACAO NGINX CONCLUIDA!" -ForegroundColor Green
    Write-Host ""
    Write-Host "PROXIMOS PASSOS NO CLOUDFLARE:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Acesse o painel do Cloudflare" -ForegroundColor White
    Write-Host "2. Va para DNS do dominio $Domain" -ForegroundColor White
    Write-Host "3. Adicione/edite os registros:" -ForegroundColor White
    Write-Host "   - Tipo: A | Nome: @ | Conteudo: $VpsIp | Proxy: Ativado" -ForegroundColor Gray
    Write-Host "   - Tipo: A | Nome: www | Conteudo: $VpsIp | Proxy: Ativado" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Configure SSL/TLS:" -ForegroundColor White
    Write-Host "   - Va para SSL/TLS > Overview" -ForegroundColor Gray
    Write-Host "   - Selecione: Full (strict) ou Flexible" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Configuracoes opcionais:" -ForegroundColor White
    Write-Host "   - Speed > Auto Minify: CSS, JS, HTML" -ForegroundColor Gray
    Write-Host "   - Caching > Browser Cache TTL: 4 hours" -ForegroundColor Gray
    Write-Host "   - Security > Security Level: Medium" -ForegroundColor Gray
    Write-Host ""
    Write-Host "APOS CONFIGURAR DNS:" -ForegroundColor Green
    Write-Host "Site disponivel em: https://$Domain" -ForegroundColor Cyan
    Write-Host "Site disponivel em: https://www.$Domain" -ForegroundColor Cyan

} catch {
    Write-Host "Erro durante a configuracao: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}