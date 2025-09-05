// Script para testar o botão de ativação melhorado
// Execute com: node test-activation-button.js

const BASE_URL = 'https://tapago-9c14c0x19-gustavo-gomes-projects-0b92cb30.vercel.app'

async function testActivationEndpoints() {
  console.log('🧪 === TESTE DO BOTÃO DE ATIVAÇÃO ===\n')

  // Teste 1: Webhook endpoint
  console.log('1️⃣ Testando webhook endpoint...')
  try {
    const webhookResponse = await fetch(`${BASE_URL}/api/payment/webhook`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pixCode: 'test_pix_code_123' })
    })
    
    console.log('   Status:', webhookResponse.status)
    const webhookResult = await webhookResponse.text()
    console.log('   Response:', webhookResult.substring(0, 100) + '...')
  } catch (error) {
    console.log('   ❌ Erro:', error.message)
  }

  console.log('')

  // Teste 2: Approve user endpoint
  console.log('2️⃣ Testando approve user endpoint...')
  try {
    const approveResponse = await fetch(`${BASE_URL}/api/payment/approve-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('   Status:', approveResponse.status)
    const approveResult = await approveResponse.text()
    console.log('   Response:', approveResult.substring(0, 100) + '...')
  } catch (error) {
    console.log('   ❌ Erro:', error.message)
  }

  console.log('')

  // Teste 3: Verificar se a página de pagamento carrega
  console.log('3️⃣ Testando página de pagamento...')
  try {
    const pageResponse = await fetch(`${BASE_URL}/pending-payment`)
    console.log('   Status:', pageResponse.status)
    console.log('   Content-Type:', pageResponse.headers.get('content-type'))
  } catch (error) {
    console.log('   ❌ Erro:', error.message)
  }

  console.log('')
  console.log('✅ Testes concluídos!')
  console.log('')
  console.log('🎯 Para testar completamente:')
  console.log('1. Acesse:', `${BASE_URL}/pending-payment`)
  console.log('2. Faça login com sua conta')
  console.log('3. Clique em "⚡ Ativar Conta (Sem Webhook)"')
  console.log('4. Verifique se é redirecionado para o dashboard')
  console.log('')
  console.log('📋 Funcionalidades do botão:')
  console.log('• Tenta primeiro o webhook (se tiver PIX code)')
  console.log('• Se falhar, usa aprovação direta')
  console.log('• Ativa o usuário automaticamente')
  console.log('• Redireciona para o dashboard')
  console.log('• Logs detalhados para debug')
}

// Executar testes
testActivationEndpoints()