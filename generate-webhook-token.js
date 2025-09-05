#!/usr/bin/env node

/**
 * Script para gerar token de webhook seguro
 * Execute: node generate-webhook-token.js
 */

const crypto = require('crypto')

function generateWebhookToken() {
  // Gerar token aleatório seguro
  const randomBytes = crypto.randomBytes(32)
  const token = randomBytes.toString('hex')
  
  return `webhook_organiza_${token}`
}

function generateSimpleToken() {
  // Gerar token mais simples e legível
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  
  return `webhook_organiza_emprestimos_${timestamp}_${random}`
}

console.log('🔐 Gerando tokens de webhook seguros...\n')

console.log('🎯 Token recomendado (simples):')
const simpleToken = generateSimpleToken()
console.log(simpleToken)

console.log('\n🔒 Token ultra-seguro (hex):')
const secureToken = generateWebhookToken()
console.log(secureToken)

console.log('\n📋 Como usar:')
console.log('1. Copie um dos tokens acima')
console.log('2. Cole no arquivo .env:')
console.log(`   ASAAS_WEBHOOK_TOKEN="${simpleToken}"`)
console.log('3. Use o MESMO token no painel do Asaas (campo Email)')

console.log('\n⚠️  IMPORTANTE:')
console.log('• Use o MESMO token no .env e no painel do Asaas')
console.log('• Mantenha o token seguro e não compartilhe')
console.log('• O token é usado para validar que o webhook vem do Asaas')
