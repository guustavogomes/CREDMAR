#!/usr/bin/env node

/**
 * Script para testar a API de criação de pagamento
 */

// Usar fetch nativo do Node.js (versão 18+)

async function testPaymentAPI() {
  console.log('🧪 Testando API de criação de pagamento...\n')

  const baseUrl = 'https://www.organizaemprestimos.com.br'
  
  // Dados de teste
  const paymentData = {
    amount: 100,
    method: 'PIX',
    description: 'Teste TaPago - PIX'
  }

  console.log('📋 Dados do teste:')
  console.log(`- URL: ${baseUrl}/api/payment/asaas/create`)
  console.log(`- Método: ${paymentData.method}`)
  console.log(`- Valor: R$ ${paymentData.amount}`)
  console.log('')

  try {
    console.log('🚀 Enviando requisição...')
    
    const response = await fetch(`${baseUrl}/api/payment/asaas/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    })

    console.log(`📊 Status da resposta: ${response.status}`)
    console.log(`📊 Status Text: ${response.statusText}`)

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Sucesso! Resposta da API:')
      console.log(JSON.stringify(data, null, 2))
      
      if (data.payment) {
        console.log('\n🎯 Detalhes do pagamento:')
        console.log(`- ID: ${data.payment.id}`)
        console.log(`- Método: ${data.payment.method}`)
        console.log(`- Status: ${data.payment.status}`)
        console.log(`- Valor: R$ ${data.payment.amount}`)
        console.log(`- QR Code: ${data.payment.pixQrCode ? 'Presente' : 'Ausente'}`)
        console.log(`- Payload: ${data.payment.pixPayload ? 'Presente' : 'Ausente'}`)
      }
    } else {
      const errorData = await response.text()
      console.log('❌ Erro na API:')
      console.log(errorData)
      
      if (response.status === 500) {
        console.log('\n🔍 Possíveis causas do erro 500:')
        console.log('- Credenciais do Asaas não configuradas')
        console.log('- Problema na conexão com o banco de dados')
        console.log('- Erro na API do Asaas')
      }
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message)
  }
}

// Executar o teste
testPaymentAPI()
