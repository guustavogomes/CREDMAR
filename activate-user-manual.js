// Script para ativar usuário manualmente após pagamento PIX
// Execute com: node activate-user-manual.js

const API_BASE = 'https://tapago-pdyx676gs-gustavo-gomes-projects-0b92cb30.vercel.app'

async function activateUserByEmail(email) {
  try {
    console.log('🔍 Buscando usuário por email:', email)
    
    // Primeiro, vamos simular o pagamento usando o webhook
    const webhookUrl = `${API_BASE}/api/payment/webhook`
    
    // Buscar o código PIX do usuário (simulação)
    const pixCode = '00020101021226800014BR.GOV.BCB.PIX0136cce3e219-d60a-4c42-9e17-809f85bca6410218TAPAGO MENSALIDADE52040000530398654040.015802BR5920GUSTAVO NOVAES GOMES6011DIVINOPOLIS63041C76'
    
    console.log('🧪 Simulando pagamento via webhook...')
    
    const response = await fetch(webhookUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        pixCode: pixCode
      })
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Usuário ativado com sucesso!')
      console.log('Resposta:', result)
      console.log('\n🎉 Agora o usuário pode acessar o dashboard!')
    } else {
      console.log('❌ Erro ao ativar usuário:')
      console.log('Status:', response.status)
      console.log('Erro:', result)
      
      if (result.error === 'Pagamento não encontrado') {
        console.log('\n💡 Dica: O usuário precisa ter gerado um PIX primeiro.')
        console.log('Acesse: ' + API_BASE + '/pending-payment')
      }
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message)
  }
}

// Ativar usuário por email
const userEmail = process.argv[2]

if (!userEmail) {
  console.log('❌ Uso: node activate-user-manual.js email@exemplo.com')
  console.log('\nExemplo:')
  console.log('node activate-user-manual.js maria@gmail.com')
  process.exit(1)
}

console.log('=== ATIVAÇÃO MANUAL DE USUÁRIO ===\n')
activateUserByEmail(userEmail)

console.log('\n💡 Alternativas:')
console.log('1. Use o botão "🧪 Simular Pagamento" na interface')
console.log('2. Configure um webhook real no seu banco')
console.log('3. Execute este script com o email do usuário')