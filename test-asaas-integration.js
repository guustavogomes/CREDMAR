#!/usr/bin/env node

/**
 * Script de teste para integração com Asaas
 * Execute: node test-asaas-integration.js
 */

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// Simular dados de teste
const testData = {
  amount: 100.00,
  method: 'PIX',
  description: 'Teste TaPago - Integração Asaas'
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    const data = await response.json()
    
    console.log(`\n📡 ${options.method || 'GET'} ${url}`)
    console.log(`Status: ${response.status}`)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    return { response, data }
  } catch (error) {
    console.error(`❌ Erro na requisição:`, error.message)
    return { error }
  }
}

async function testAsaasIntegration() {
  console.log('🚀 Iniciando testes de integração com Asaas...\n')
  
  // 1. Testar configuração do webhook
  console.log('1️⃣ Testando configuração do webhook...')
  const webhookSetup = await makeRequest(`${BASE_URL}/api/payment/asaas/webhook?action=setup`)
  
  if (webhookSetup.error) {
    console.log('⚠️  Webhook setup falhou (normal se já configurado)')
  }
  
  // 2. Listar webhooks existentes
  console.log('\n2️⃣ Listando webhooks existentes...')
  const webhookList = await makeRequest(`${BASE_URL}/api/payment/asaas/webhook?action=list`)
  
  // 3. Testar criação de pagamento (sem autenticação - deve falhar)
  console.log('\n3️⃣ Testando criação de pagamento (sem autenticação)...')
  const paymentCreateUnauth = await makeRequest(`${BASE_URL}/api/payment/asaas/create`, {
    method: 'POST',
    body: JSON.stringify(testData)
  })
  
  if (paymentCreateUnauth.response?.status === 401) {
    console.log('✅ Autenticação funcionando corretamente')
  } else {
    console.log('❌ Autenticação não está funcionando')
  }
  
  // 4. Testar verificação de status (sem autenticação - deve falhar)
  console.log('\n4️⃣ Testando verificação de status (sem autenticação)...')
  const statusCheckUnauth = await makeRequest(`${BASE_URL}/api/payment/asaas/status`, {
    method: 'POST',
    body: JSON.stringify({ paymentId: 'test-id' })
  })
  
  if (statusCheckUnauth.response?.status === 401) {
    console.log('✅ Autenticação funcionando corretamente')
  } else {
    console.log('❌ Autenticação não está funcionando')
  }
  
  // 5. Testar webhook (simulação)
  console.log('\n5️⃣ Testando webhook (simulação)...')
  const webhookTest = await makeRequest(`${BASE_URL}/api/payment/asaas/webhook`, {
    method: 'POST',
    headers: {
      'asaas-access-token': 'test-token'
    },
    body: JSON.stringify({
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_test_123',
        customer: 'cus_test_123',
        value: 100.00,
        netValue: 97.00,
        originalValue: 100.00,
        interestValue: 0.00,
        description: 'Teste',
        billingType: 'PIX',
        status: 'RECEIVED',
        pixTransaction: {
          id: 'pix_test_123',
          qrCode: 'data:image/png;base64,test',
          payload: '00020126580014br.gov.bcb.pix...'
        }
      }
    })
  })
  
  if (webhookTest.response?.status === 401) {
    console.log('✅ Webhook token validation funcionando')
  } else {
    console.log('⚠️  Webhook token validation pode não estar funcionando')
  }
  
  console.log('\n🎉 Testes concluídos!')
  console.log('\n📋 Próximos passos:')
  console.log('1. Configure as variáveis de ambiente do Asaas')
  console.log('2. Execute o servidor: npm run dev')
  console.log('3. Acesse a interface de pagamentos')
  console.log('4. Teste a criação de pagamentos com usuário autenticado')
  console.log('5. Configure o webhook no painel do Asaas')
}

// Verificar se fetch está disponível
if (typeof fetch === 'undefined') {
  console.log('❌ Este script requer Node.js 18+ ou instale node-fetch')
  console.log('Execute: npm install node-fetch')
  process.exit(1)
}

// Executar testes
testAsaasIntegration().catch(console.error)
