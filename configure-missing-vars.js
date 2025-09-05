#!/usr/bin/env node

/**
 * Script para configurar variáveis que ainda precisam ser definidas
 */

const { execSync } = require('child_process')

const missingVars = [
  {
    name: 'ASAAS_API_KEY',
    description: 'Chave da API do Asaas (de produção)',
    example: 'Sua chave começa com $aact_'
  },
  {
    name: 'ASAAS_CUSTOMER_ID', 
    description: 'ID do cliente no Asaas',
    example: 'ID começa com cus_'
  },
  {
    name: 'NEXTAUTH_SECRET',
    description: 'Secret key para autenticação',
    example: 'Gere uma chave segura'
  },
  {
    name: 'WEBHOOK_SECRET',
    description: 'Secret para validação de webhooks',
    example: 'webhook_secret_organiza_2024'
  }
]

console.log('🔧 Variáveis que ainda precisam ser configuradas:\n')

missingVars.forEach((variable, index) => {
  console.log(`${index + 1}. ${variable.name}`)
  console.log(`   Descrição: ${variable.description}`)
  console.log(`   Exemplo: ${variable.example}`)
  console.log(`   Comando: vercel env add ${variable.name} production`)
  console.log('')
})

console.log('📋 Para configurar, execute os comandos acima com seus valores reais.')
console.log('⚠️  IMPORTANTE: Use valores de PRODUÇÃO do Asaas!')
