#!/usr/bin/env node

/**
 * Script para descobrir a URL do webhook
 * Execute: node get-webhook-url.js
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) {
    return {}
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

function updateEnv(key, value) {
  const envPath = path.join(process.cwd(), '.env')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  }
  
  const regex = new RegExp(`^${key}=.*$`, 'm')
  const newLine = `${key}="${value}"`
  
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, newLine)
  } else {
    envContent += `\n${newLine}`
  }
  
  fs.writeFileSync(envPath, envContent)
}

async function getWebhookUrl() {
  console.log('🔗 Descobrindo URL do webhook para o Asaas...\n')
  
  const env = loadEnv()
  const localIP = getLocalIP()
  
  console.log('📋 URLs disponíveis:')
  console.log('1. Local (localhost): http://localhost:3000/api/payment/asaas/webhook')
  console.log(`2. Rede local: http://${localIP}:3000/api/payment/asaas/webhook`)
  
  if (env.NEXTAUTH_URL && !env.NEXTAUTH_URL.includes('your-')) {
    console.log(`3. Configurada no .env: ${env.NEXTAUTH_URL}/api/payment/asaas/webhook`)
  }
  
  console.log('\n🎯 Recomendações:')
  console.log('• Para DESENVOLVIMENTO: Use http://localhost:3000')
  console.log('• Para PRODUÇÃO: Use sua URL de deploy (Vercel, etc.)')
  console.log('• Para TESTE com ngrok: Use a URL do ngrok')
  
  console.log('\n📝 Configuração no painel do Asaas:')
  console.log('1. Acesse: https://www.asaas.com')
  console.log('2. Vá em: Integrações > Webhooks')
  console.log('3. Clique em: Novo Webhook')
  console.log('4. URL: http://localhost:3000/api/payment/asaas/webhook')
  console.log('5. Email: Seu token de webhook (do arquivo .env)')
  console.log('6. Eventos: Selecione os eventos de pagamento')
  
  console.log('\n🔧 Para configurar automaticamente:')
  console.log('node setup-webhook-asaas.js')
  
  // Atualizar NEXTAUTH_URL se não estiver configurada
  if (!env.NEXTAUTH_URL || env.NEXTAUTH_URL.includes('your-')) {
    console.log('\n⚙️  Configurando NEXTAUTH_URL no .env...')
    updateEnv('NEXTAUTH_URL', 'http://localhost:3000')
    console.log('✅ NEXTAUTH_URL configurada como: http://localhost:3000')
  }
  
  console.log('\n🧪 Para testar o webhook:')
  console.log('1. Inicie o servidor: npm run dev')
  console.log('2. Teste a URL: curl http://localhost:3000/api/payment/asaas/webhook')
  console.log('3. Configure no Asaas e teste um pagamento')
}

getWebhookUrl().catch(console.error)
