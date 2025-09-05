#!/usr/bin/env node

/**
 * Script para testar conexão com o Asaas
 * Execute: node test-asaas-connection.js
 */

const fs = require('fs')
const path = require('path')

// Carregar variáveis de ambiente
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env não encontrado')
    return null
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

async function testConnection() {
  console.log('🧪 Testando conexão com o Asaas...\n')
  
  const env = loadEnv()
  if (!env) {
    console.log('📝 Crie o arquivo .env primeiro:')
    console.log('   cp env.example .env')
    console.log('   # Edite o .env com suas configurações')
    return
  }

  // Verificar configurações
  console.log('🔍 Verificando configurações:')
  const required = ['ASAAS_API_KEY', 'ASAAS_ENVIRONMENT', 'ASAAS_CUSTOMER_ID']
  
  required.forEach(key => {
    if (env[key] && !env[key].includes('your-') && !env[key].includes('here')) {
      console.log(`✅ ${key}: Configurado`)
    } else {
      console.log(`❌ ${key}: Não configurado`)
    }
  })

  if (!env.ASAAS_API_KEY || env.ASAAS_API_KEY.includes('your-')) {
    console.log('\n❌ Configure primeiro a chave da API no arquivo .env')
    return
  }

  const baseUrl = env.ASAAS_ENVIRONMENT === 'production' 
    ? 'https://api.asaas.com' 
    : 'https://api-sandbox.asaas.com'

  console.log(`\n🌐 Testando conexão com: ${baseUrl}`)

  try {
    // Testar conexão básica
    console.log('📡 Testando autenticação...')
    const response = await fetch(`${baseUrl}/v3/customers`, {
      method: 'GET',
      headers: {
        'access_token': env.ASAAS_API_KEY
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Conexão com Asaas funcionando!')
      console.log(`📊 Total de clientes: ${data.totalCount || 0}`)
      
      // Testar criação de cliente
      if (env.ASAAS_CUSTOMER_ID && !env.ASAAS_CUSTOMER_ID.includes('your-')) {
        console.log('\n🔍 Testando busca de cliente...')
        const customerResponse = await fetch(`${baseUrl}/v3/customers/${env.ASAAS_CUSTOMER_ID}`, {
          headers: {
            'access_token': env.ASAAS_API_KEY
          }
        })
        
        if (customerResponse.ok) {
          const customer = await customerResponse.json()
          console.log('✅ Cliente encontrado!')
          console.log(`👤 Nome: ${customer.name}`)
          console.log(`📧 Email: ${customer.email}`)
        } else {
          console.log('⚠️  Cliente não encontrado ou ID inválido')
        }
      }
      
    } else {
      const error = await response.json()
      console.log('❌ Erro na conexão:', error.message || 'Erro desconhecido')
      
      if (response.status === 401) {
        console.log('💡 Verifique se a chave da API está correta')
      }
    }

  } catch (error) {
    console.log('❌ Erro na requisição:', error.message)
  }

  console.log('\n📋 Próximos passos:')
  console.log('1. Configure o webhook: node setup-webhook-asaas.js')
  console.log('2. Atualize o banco: npm run db:push')
  console.log('3. Inicie o servidor: npm run dev')
  console.log('4. Teste pagamentos: http://localhost:3000/dashboard/payment/pix')
}

// Verificar se fetch está disponível
if (typeof fetch === 'undefined') {
  console.log('❌ Este script requer Node.js 18+ ou instale node-fetch')
  console.log('Execute: npm install node-fetch')
  process.exit(1)
}

testConnection().catch(console.error)
