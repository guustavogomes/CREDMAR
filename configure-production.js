#!/usr/bin/env node

/**
 * Script para configurar produção com o domínio organizaemprestimos.com.br
 * Execute: node configure-production.js
 */

const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env não encontrado')
    return null
  }

  const envContent = fs.readFileSync(envPath, 'utf8')
  const env = {}
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').replace(/^["']|["']$/g, '')
    }
  })
  
  return env
}

function updateEnv(key, value) {
  const envPath = path.join(process.cwd(), '.env')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  }
  
  const regex = new RegExp(`^${key}=.*$`, 'm')
  const newLine = `${key}="${value}"`
  
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, newLine)
  } else {
    envContent += `\n${newLine}`
  }
  
  fs.writeFileSync(envPath, envContent)
}

async function configureProduction() {
  console.log('🚀 Configurando TaPago para PRODUÇÃO')
  console.log('🌐 Domínio: https://www.organizaemprestimos.com.br/\n')
  
  const env = loadEnv()
  if (!env) {
    console.log('📝 Criando arquivo .env...')
    fs.copyFileSync('env.example', '.env')
    console.log('✅ Arquivo .env criado')
  }

  // Configurações de produção
  const productionConfig = {
    'NEXTAUTH_URL': 'https://www.organizaemprestimos.com.br',
    'ASAAS_ENVIRONMENT': 'production',
    'ASAAS_API_KEY': 'CONFIGURE_SUA_CHAVE_DE_PRODUCAO',
    'ASAAS_CUSTOMER_ID': 'CONFIGURE_SEU_CUSTOMER_ID',
    'ASAAS_WEBHOOK_TOKEN': 'webhook_organiza_emprestimos_2024_secure_token',
    'MONTHLY_AMOUNT': '100.00'
  }

  console.log('⚙️  Aplicando configurações de produção...')
  
  Object.entries(productionConfig).forEach(([key, value]) => {
    updateEnv(key, value)
    console.log(`✅ ${key}: ${value}`)
  })

  console.log('\n🔗 URL do Webhook para o Asaas:')
  console.log('https://www.organizaemprestimos.com.br/api/payment/asaas/webhook')
  
  console.log('\n📋 Configuração no painel do Asaas:')
  console.log('1. Acesse: https://www.asaas.com')
  console.log('2. Vá em: Integrações > Webhooks')
  console.log('3. Clique em: Novo Webhook')
  console.log('4. URL: https://www.organizaemprestimos.com.br/api/payment/asaas/webhook')
  console.log('5. Email: webhook_organiza_emprestimos_2024_secure_token')
  console.log('6. Eventos: Selecione os eventos de pagamento')
  
  console.log('\n🔑 Próximos passos:')
  console.log('1. Configure sua chave de API de PRODUÇÃO no .env')
  console.log('2. Configure seu Customer ID de PRODUÇÃO no .env')
  console.log('3. Configure o webhook no painel do Asaas')
  console.log('4. Execute: npm run db:push')
  console.log('5. Faça o deploy da aplicação')
  
  console.log('\n🧪 Para testar:')
  console.log('node test-asaas-connection.js')
  console.log('node setup-webhook-asaas.js')
  
  console.log('\n⚠️  IMPORTANTE:')
  console.log('• Use chaves de PRODUÇÃO do Asaas')
  console.log('• Configure o webhook com a URL de produção')
  console.log('• Teste em ambiente de produção')
  console.log('• Monitore os logs após o deploy')
}

configureProduction().catch(console.error)
