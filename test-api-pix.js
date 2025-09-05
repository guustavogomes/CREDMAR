// Script para testar a API de geração do PIX
// Execute com: node test-api-pix.js

const API_URL = 'https://tapago-f7cbkk1yf-gustavo-gomes-projects-0b92cb30.vercel.app/api/payment/generate-pix'

async function testPixAPI() {
  try {
    console.log('🧪 Testando API de geração do PIX...')
    console.log('URL:', API_URL)

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Nota: Em produção, você precisaria de um token de autenticação válido
      }
    })

    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))

    const result = await response.text()
    console.log('Response body:', result)

    if (response.ok) {
      const data = JSON.parse(result)
      console.log('✅ API funcionando!')
      console.log('QR Code URL length:', data.qrCodeUrl?.length)
      console.log('PIX Code length:', data.pixCode?.length)
      console.log('Amount:', data.amount)
    } else {
      console.log('❌ Erro na API')
      try {
        const errorData = JSON.parse(result)
        console.log('Detalhes do erro:', errorData)
      } catch (e) {
        console.log('Erro não é JSON válido')
      }
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message)
  }
}

// Executar teste
console.log('=== TESTE DA API PIX ===\n')
testPixAPI()

console.log('\n💡 Nota: Este teste pode falhar por falta de autenticação.')
console.log('Para testar completamente, use a interface web ou faça login primeiro.')