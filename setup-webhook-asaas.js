#!/usr/bin/env node

/**
 * Script para configurar webhook no Asaas
 * Execute: node setup-webhook-asaas.js
 */

const fs = require('fs')
const path = require('path')

// Carregar variáveis de ambiente
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env não encontrado. Execute primeiro: node configure-asaas.js')
    process.exit(1)
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

async function setupWebhook() {
  console.log('🔗 Configurando webhook no Asaas...\n')
  
  const env = loadEnv()
  
  // Verificar variáveis necessárias
  const required = ['ASAAS_API_KEY', 'ASAAS_WEBHOOK_TOKEN', 'NEXTAUTH_URL']
  const missing = required.filter(key => !env[key])
  
  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente faltando:', missing.join(', '))
    console.log('Execute primeiro: node configure-asaas.js')
    process.exit(1)
  }

  const baseUrl = env.ASAAS_ENVIRONMENT === 'production' 
    ? 'https://api.asaas.com' 
    : 'https://api-sandbox.asaas.com'
  
  const webhookUrl = `${env.NEXTAUTH_URL}/api/payment/asaas/webhook`
  
  console.log('📋 Configuração do webhook:')
  console.log(`URL: ${webhookUrl}`)
  console.log(`Token: ${env.ASAAS_WEBHOOK_TOKEN}`)
  console.log(`Ambiente: ${env.ASAAS_ENVIRONMENT}`)
  
  // Eventos que queremos receber
  const events = [
    'PAYMENT_CREATED',
    'PAYMENT_AWAITING_PAYMENT', 
    'PAYMENT_RECEIVED',
    'PAYMENT_OVERDUE',
    'PAYMENT_DELETED',
    'PAYMENT_RESTORED',
    'PAYMENT_REFUNDED',
    'PAYMENT_RECEIVED_IN_CASH_UNDONE',
    'PAYMENT_CHARGEBACK_REQUESTED',
    'PAYMENT_CHARGEBACK_DISPUTE',
    'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
    'PAYMENT_DUNNING_RECEIVED',
    'PAYMENT_DUNNING_REQUESTED',
    'PAYMENT_BANK_SLIP_VIEWED',
    'PAYMENT_CHECKOUT_VIEWED'
  ]
  
  const webhookData = {
    url: webhookUrl,
    email: env.ASAAS_WEBHOOK_TOKEN, // Usando o token como email para validação
    enabled: true,
    events: events
  }
  
  console.log('\n🚀 Criando webhook via API...')
  
  try {
    const response = await fetch(`${baseUrl}/v3/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': env.ASAAS_API_KEY
      },
      body: JSON.stringify(webhookData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Webhook criado com sucesso!')
      console.log(`ID: ${result.id}`)
      console.log(`URL: ${result.url}`)
      console.log(`Status: ${result.enabled ? 'Ativo' : 'Inativo'}`)
    } else {
      console.error('❌ Erro ao criar webhook:', result)
      
      if (result.errors) {
        result.errors.forEach(error => {
          console.error(`- ${error.description}`)
        })
      }
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message)
  }
  
  console.log('\n📋 Configuração manual (se a API falhar):')
  console.log('1. Acesse: https://www.asaas.com')
  console.log('2. Vá em: Integrações > Webhooks')
  console.log('3. Clique em: Novo Webhook')
  console.log(`4. URL: ${webhookUrl}`)
  console.log(`5. Email: ${env.ASAAS_WEBHOOK_TOKEN}`)
  console.log('6. Eventos: Selecione os eventos de pagamento')
  console.log('7. Salve o webhook')
  
  console.log('\n🧪 Para testar:')
  console.log('node test-asaas-integration.js')
}

// Verificar se fetch está disponível
if (typeof fetch === 'undefined') {
  console.log('❌ Este script requer Node.js 18+ ou instale node-fetch')
  console.log('Execute: npm install node-fetch')
  process.exit(1)
}

setupWebhook().catch(console.error)
