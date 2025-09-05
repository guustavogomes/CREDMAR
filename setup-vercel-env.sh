#!/bin/bash

# Script para configurar variáveis de ambiente na Vercel
# Execute: bash setup-vercel-env.sh

echo "🚀 Configurando variáveis de ambiente na Vercel..."
echo ""

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado"
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI encontrado"
echo ""

# Configurar variáveis automáticas
echo "🔧 Configurando variáveis automáticas..."

vercel env add NEXTAUTH_URL production <<< "https://www.organizaemprestimos.com.br"
vercel env add ASAAS_ENVIRONMENT production <<< "production"
vercel env add ASAAS_WEBHOOK_TOKEN production <<< "webhook_organiza_emprestimos_mf4ow1hg_cjwofz5i54r"
vercel env add MONTHLY_AMOUNT production <<< "100.00"
vercel env add PAYMENT_TIMEOUT_MINUTES production <<< "30"
vercel env add PIX_MERCHANT_NAME production <<< "Organiza Empréstimos"
vercel env add PIX_MERCHANT_CITY production <<< "São Paulo"
vercel env add PIX_DESCRIPTION production <<< "Organiza Empréstimos - Mensalidade"
vercel env add EMAIL_FROM production <<< "noreply@organizaemprestimos.com.br"
vercel env add EMAIL_SERVER_HOST production <<< "smtp.gmail.com"
vercel env add EMAIL_SERVER_PORT production <<< "587"

echo ""
echo "✅ Variáveis automáticas configuradas!"
echo ""

echo "📝 Variáveis que precisam ser configuradas manualmente:"
echo "Execute os comandos abaixo com seus valores reais:"
echo ""
echo "vercel env add DATABASE_URL production"
echo "vercel env add NEXTAUTH_SECRET production"
echo "vercel env add ASAAS_API_KEY production"
echo "vercel env add ASAAS_CUSTOMER_ID production"
echo "vercel env add PIX_KEY production"
echo "vercel env add WEBHOOK_SECRET production"
echo "vercel env add EMAIL_SERVER_USER production"
echo "vercel env add EMAIL_SERVER_PASSWORD production"
echo ""

echo "🎯 Próximos passos:"
echo "1. Configure as variáveis manuais acima"
echo "2. Execute: vercel --prod"
echo "3. Teste a aplicação em produção"
echo ""

echo "🔗 Links úteis:"
echo "- Painel Vercel: https://vercel.com/dashboard"
echo "- Seu app: https://www.organizaemprestimos.com.br"
