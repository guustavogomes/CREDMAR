// Script de debug para investigar o problema de ativação
// Execute com: node debug-activation.js

const BASE_URL = 'https://tapago-kykwdwm7h-gustavo-gomes-projects-0b92cb30.vercel.app'

async function debugActivation() {
  console.log('🔍 === DEBUG DE ATIVAÇÃO ===\n')

  // Teste 1: Verificar se a página carrega
  console.log('1️⃣ Testando carregamento da página...')
  try {
    const pageResponse = await fetch(`${BASE_URL}/pending-payment`)
    console.log('   Status:', pageResponse.status)
    console.log('   Headers:', Object.fromEntries(pageResponse.headers.entries()))
    
    if (pageResponse.status === 200) {
      const html = await pageResponse.text()
      const hasButton = html.includes('Ativar Conta')
      console.log('   Botão presente:', hasButton ? '✅' : '❌')
    }
  } catch (error) {
    console.log('   ❌ Erro:', error.message)
  }

  console.log('')

  // Teste 2: Verificar API de aprovação (sem auth)
  console.log('2️⃣ Testando API de aprovação...')
  try {
    const approveResponse = await fetch(`${BASE_URL}/api/payment/approve-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('   Status:', approveResponse.status)
    const responseText = await approveResponse.text()
    
    if (approveResponse.status === 401) {
      console.log('   ✅ API protegida corretamente (401 sem auth)')
    } else {
      console.log('   Response:', responseText.substring(0, 200) + '...')
    }
  } catch (error) {
    console.log('   ❌ Erro:', error.message)
  }

  console.log('')

  // Teste 3: Verificar API de webhook (sem auth)
  console.log('3️⃣ Testando API de webhook...')
  try {
    const webhookResponse = await fetch(`${BASE_URL}/api/payment/webhook`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pixCode: 'test_code_123' })
    })
    
    console.log('   Status:', webhookResponse.status)
    const responseText = await webhookResponse.text()
    
    if (webhookResponse.status === 401) {
      console.log('   ✅ API protegida corretamente (401 sem auth)')
    } else {
      console.log('   Response:', responseText.substring(0, 200) + '...')
    }
  } catch (error) {
    console.log('   ❌ Erro:', error.message)
  }

  console.log('')
  console.log('📋 POSSÍVEIS CAUSAS DO PROBLEMA:')
  console.log('')
  console.log('1. 🔄 CACHE DO NAVEGADOR')
  console.log('   • Pressione Ctrl+Shift+R para hard refresh')
  console.log('   • Ou use o botão "Limpar Cache" na página')
  console.log('')
  console.log('2. 🔐 PROBLEMA DE SESSÃO')
  console.log('   • Faça logout e login novamente')
  console.log('   • Verifique se está logado corretamente')
  console.log('')
  console.log('3. 🐛 ERRO NA API')
  console.log('   • Abra o console do navegador (F12)')
  console.log('   • Clique no botão e veja os logs')
  console.log('   • Procure por erros em vermelho')
  console.log('')
  console.log('4. 🌐 PROBLEMA DE REDE')
  console.log('   • Verifique a conexão com a internet')
  console.log('   • Tente em uma aba anônima')
  console.log('')
  console.log('🎯 PASSOS PARA TESTAR:')
  console.log('1. Acesse:', BASE_URL + '/pending-payment')
  console.log('2. Abra o console (F12)')
  console.log('3. Faça login se necessário')
  console.log('4. Clique em "Ativar Conta"')
  console.log('5. Observe os logs no console')
  console.log('6. Me envie os logs se houver erro')
}

// Executar debug
debugActivation()