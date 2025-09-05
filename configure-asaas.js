#!/usr/bin/env node

/**
 * Script interativo para configurar o Asaas
 * Execute: node configure-asaas.js
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function configureAsaas() {
  console.log('🚀 Configuração do Asaas - TaPago\n')
  
  console.log('📋 Você precisará das seguintes informações do Asaas:')
  console.log('1. Chave da API (access_token)')
  console.log('2. ID do Cliente (customer ID)')
  console.log('3. URL do seu aplicativo (para o webhook)')
  console.log('4. Token de segurança para webhook\n')

  // Ler arquivo .env atual
  const envPath = path.join(process.cwd(), '.env')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  }

  console.log('🔑 Configuração da API do Asaas:')
  console.log('Acesse: https://www.asaas.com > Integrações > API\n')

  const apiKey = await question('Digite sua chave da API do Asaas: ')
  const environment = await question('Ambiente (sandbox/production) [sandbox]: ') || 'sandbox'
  const customerId = await question('Digite o ID do cliente no Asaas: ')
  
  console.log('\n🌐 Configuração do Webhook:')
  const appUrl = await question('URL do seu aplicativo [http://localhost:3000]: ') || 'http://localhost:3000'
  const webhookToken = await question('Token de segurança para webhook (crie um token seguro): ')
  
  console.log('\n💰 Configuração de Pagamento:')
  const monthlyAmount = await question('Valor da mensalidade [100.00]: ') || '100.00'

  // Atualizar variáveis no .env
  const updates = {
    'ASAAS_API_KEY': apiKey,
    'ASAAS_ENVIRONMENT': environment,
    'ASAAS_CUSTOMER_ID': customerId,
    'ASAAS_WEBHOOK_TOKEN': webhookToken,
    'NEXTAUTH_URL': appUrl,
    'MONTHLY_AMOUNT': monthlyAmount
  }

  // Aplicar atualizações
  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm')
    const newLine = `${key}="${value}"`
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newLine)
    } else {
      envContent += `\n${newLine}`
    }
  })

  // Salvar arquivo .env
  fs.writeFileSync(envPath, envContent)
  
  console.log('\n✅ Configuração salva no arquivo .env!')
  
  // Mostrar próximos passos
  console.log('\n📋 Próximos passos:')
  console.log('1. Configure o webhook no painel do Asaas:')
  console.log(`   URL: ${appUrl}/api/payment/asaas/webhook`)
  console.log(`   Token: ${webhookToken}`)
  console.log('   Eventos: PAYMENT_RECEIVED, PAYMENT_OVERDUE, PAYMENT_REFUNDED')
  
  console.log('\n2. Execute os comandos:')
  console.log('   npm run db:push')
  console.log('   npm run dev')
  
  console.log('\n3. Teste a integração:')
  console.log('   node test-asaas-integration.js')
  
  console.log('\n🔗 Links úteis:')
  console.log('- Painel Asaas: https://www.asaas.com')
  console.log('- Documentação: https://docs.asaas.com')
  console.log('- Webhook URL: ' + appUrl + '/api/payment/asaas/webhook')
  
  rl.close()
}

configureAsaas().catch(console.error)
