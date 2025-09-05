#!/usr/bin/env node

/**
 * Script para debugar a conexão com o Asaas
 */

const fetch = require('node-fetch')

async function testAsaasConnection() {
  console.log('🔍 Testando conexão com o Asaas...\n')

  // Simular as variáveis de ambiente
  const apiKey = process.env.ASAAS_API_KEY || 'Sua chave de produção do Asaas aqui'
  const environment = process.env.ASAAS_ENVIRONMENT || 'production'
  const baseUrl = environment === 'production' 
    ? 'https://www.asaas.com/api/v3' 
    : 'https://sandbox.asaas.com/api/v3'

  console.log('📋 Configurações:')
  console.log(`- Environment: ${environment}`)
  console.log(`- Base URL: ${baseUrl}`)
  console.log(`- API Key: ${apiKey.substring(0, 10)}...`)
  console.log('')

  try {
    // Teste 1: Listar clientes
    console.log('🧪 Teste 1: Listando clientes...')
    const customersResponse = await fetch(`${baseUrl}/customers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
    })

    console.log(`Status: ${customersResponse.status}`)
    
    if (customersResponse.ok) {
      const customersData = await customersResponse.json()
      console.log(`✅ Sucesso! Encontrados ${customersData.data?.length || 0} clientes`)
      console.log('')
    } else {
      const errorData = await customersResponse.text()
      console.log(`❌ Erro: ${errorData}`)
      console.log('')
    }

    // Teste 2: Criar um cliente de teste
    console.log('🧪 Teste 2: Criando cliente de teste...')
    const customerData = {
      name: 'Cliente Teste TaPago',
      email: 'teste@tapago.com',
      cpfCnpj: '00000000000',
      phone: '11999999999'
    }

    const createCustomerResponse = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(customerData)
    })

    console.log(`Status: ${createCustomerResponse.status}`)
    
    if (createCustomerResponse.ok) {
      const customer = await createCustomerResponse.json()
      console.log(`✅ Cliente criado com sucesso! ID: ${customer.id}`)
      console.log('')
      
      // Teste 3: Criar um pagamento PIX
      console.log('🧪 Teste 3: Criando pagamento PIX...')
      const paymentData = {
        customer: customer.id,
        billingType: 'PIX',
        value: 10.00,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Teste TaPago - PIX',
        externalReference: `teste_${Date.now()}`
      }

      const createPaymentResponse = await fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey,
        },
        body: JSON.stringify(paymentData)
      })

      console.log(`Status: ${createPaymentResponse.status}`)
      
      if (createPaymentResponse.ok) {
        const payment = await createPaymentResponse.json()
        console.log(`✅ Pagamento PIX criado com sucesso! ID: ${payment.id}`)
        console.log(`QR Code: ${payment.pixTransaction?.qrCode ? 'Presente' : 'Ausente'}`)
        console.log('')
      } else {
        const errorData = await createPaymentResponse.text()
        console.log(`❌ Erro ao criar pagamento: ${errorData}`)
        console.log('')
      }
    } else {
      const errorData = await createCustomerResponse.text()
      console.log(`❌ Erro ao criar cliente: ${errorData}`)
      console.log('')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar o teste
testAsaasConnection()
