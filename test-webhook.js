// Script para testar o webhook de pagamento
// Execute com: node test-webhook.js

const WEBHOOK_URL = 'http://localhost:3000/api/payment/webhook'
// Para produção: 'https://your-app.vercel.app/api/payment/webhook'

// Simular webhook de pagamento aprovado
async function testWebhook() {
  const webhookData = {
    pixCode: '00020101021226800014BR.GOV.BCB.PIX0136cce3e219-d60a-4c42-9e17-809f85bca6410218TAPAGO MENSALIDADE5204000053039865406100.005802BR5920GUSTAVO NOVAES GOMES6011DIVINOPOLIS63048584',
    amount: 100.00,
    status: 'PAID',
    transactionId: 'TXN_' + Date.now(),
    paidAt: new Date().toISOString()
  }

  try {
    console.log('🧪 Testando webhook de pagamento...')
    console.log('URL:', WEBHOOK_URL)
    console.log('Dados:', JSON.stringify(webhookData, null, 2))

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': 'your-webhook-secret-here'
      },
      body: JSON.stringify(webhookData)
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Webhook processado com sucesso!')
      console.log('Resposta:', result)
    } else {
      console.log('❌ Erro no webhook:')
      console.log('Status:', response.status)
      console.log('Erro:', result)
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message)
  }
}

// Testar simulação de pagamento
async function testSimulation(pixCode) {
  const SIMULATION_URL = WEBHOOK_URL

  try {
    console.log('\n🧪 Testando simulação de pagamento...')
    console.log('PIX Code:', pixCode)

    const response = await fetch(SIMULATION_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pixCode })
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Simulação executada com sucesso!')
      console.log('Resposta:', result)
    } else {
      console.log('❌ Erro na simulação:')
      console.log('Status:', response.status)
      console.log('Erro:', result)
    }

  } catch (error) {
    console.error('❌ Erro na simulação:', error.message)
  }
}

// Executar testes
console.log('=== TESTE DE WEBHOOK DE PAGAMENTO ===\n')

// Teste 1: Webhook real
testWebhook()

// Teste 2: Simulação (descomente para testar com um PIX code real)
// testSimulation('SEU_PIX_CODE_AQUI')

console.log('\n=== FIM DOS TESTES ===')
console.log('\n💡 Dicas:')
console.log('1. Para testar localmente, inicie o servidor: npm run dev')
console.log('2. Para testar em produção, atualize a WEBHOOK_URL')
console.log('3. Use o botão "Simular Pagamento" na interface para testes rápidos')