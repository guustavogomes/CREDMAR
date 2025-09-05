#!/usr/bin/env node

/**
 * Script de configuração da integração com Asaas
 * Execute: node setup-asaas.js
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 Configurando integração com Asaas...\n')

// Verificar se o arquivo .env existe
const envPath = path.join(process.cwd(), '.env')
const envExamplePath = path.join(process.cwd(), 'env.example')

if (!fs.existsSync(envPath)) {
  console.log('📝 Criando arquivo .env...')
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath)
    console.log('✅ Arquivo .env criado a partir do env.example')
  } else {
    console.log('❌ Arquivo env.example não encontrado')
    process.exit(1)
  }
} else {
  console.log('✅ Arquivo .env já existe')
}

// Verificar configurações necessárias
console.log('\n🔍 Verificando configurações necessárias...')

const requiredEnvVars = [
  'ASAAS_API_KEY',
  'ASAAS_ENVIRONMENT',
  'ASAAS_WEBHOOK_TOKEN',
  'ASAAS_CUSTOMER_ID',
  'MONTHLY_AMOUNT',
  'NEXTAUTH_URL'
]

const envContent = fs.readFileSync(envPath, 'utf8')
const missingVars = []

requiredEnvVars.forEach(varName => {
  if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}="your-`)) {
    missingVars.push(varName)
  }
})

if (missingVars.length > 0) {
  console.log('⚠️  Variáveis de ambiente que precisam ser configuradas:')
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`)
  })
} else {
  console.log('✅ Todas as variáveis de ambiente estão configuradas')
}

// Instruções de configuração
console.log('\n📋 Próximos passos:')
console.log('1. Configure as variáveis de ambiente no arquivo .env')
console.log('2. Execute: npm run db:push (para atualizar o banco)')
console.log('3. Execute: npm run dev (para iniciar o servidor)')
console.log('4. Acesse: http://localhost:3000/dashboard/payment/pix')
console.log('5. Configure o webhook no painel do Asaas')

console.log('\n🔗 Links úteis:')
console.log('- Documentação Asaas: https://docs.asaas.com')
console.log('- Painel Asaas: https://www.asaas.com')
console.log('- Guia de integração: ./ASAAS_INTEGRATION_GUIDE.md')

console.log('\n🧪 Para testar a integração:')
console.log('node test-asaas-integration.js')

console.log('\n✨ Configuração concluída!')
