#!/usr/bin/env node

/**
 * Script para configurar variáveis de ambiente na Vercel via CLI
 * Execute: node deploy-vercel-env.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

function loadEnv() {
  const envPath = path.join(process.cwd(), 'env.example')
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo env.example não encontrado')
    return null
  }

  const envContent = fs.readFileSync(envPath, 'utf8')
  const env = {}
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0 && !key.startsWith('#')) {
      env[key.trim()] = valueParts.join('=').replace(/^["']|["']$/g, '')
    }
  })
  
  return env
}

function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'pipe' })
    return true
  } catch (error) {
    return false
  }
}

function installVercelCLI() {
  console.log('📦 Instalando Vercel CLI...')
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' })
    console.log('✅ Vercel CLI instalado com sucesso!')
    return true
  } catch (error) {
    console.error('❌ Erro ao instalar Vercel CLI:', error.message)
    return false
  }
}

function deployEnvVars(envVars) {
  console.log('🚀 Configurando variáveis de ambiente na Vercel...\n')
  
  const productionVars = {
    'NEXTAUTH_URL': 'https://www.organizaemprestimos.com.br',
    'ASAAS_ENVIRONMENT': 'production',
    'ASAAS_WEBHOOK_TOKEN': 'webhook_organiza_emprestimos_mf4ow1hg_cjwofz5i54r',
    'MONTHLY_AMOUNT': '100.00',
    'PIX_MERCHANT_NAME': 'Organiza Empréstimos',
    'PIX_MERCHANT_CITY': 'São Paulo',
    'PIX_DESCRIPTION': 'Organiza Empréstimos - Mensalidade'
  }

  // Combinar variáveis do env.example com as de produção
  const allVars = { ...envVars, ...productionVars }

  console.log('📋 Variáveis que serão configuradas:')
  Object.entries(allVars).forEach(([key, value]) => {
    if (value && !value.includes('your-') && !value.includes('localhost')) {
      console.log(`✅ ${key}: ${value}`)
    } else {
      console.log(`⚠️  ${key}: Precisa ser configurado manualmente`)
    }
  })

  console.log('\n🔧 Comandos para executar na Vercel CLI:')
  console.log('(Execute um por vez ou copie e cole todos de uma vez)\n')

  Object.entries(allVars).forEach(([key, value]) => {
    if (value && !value.includes('your-') && !value.includes('localhost')) {
      console.log(`vercel env add ${key} production`)
      console.log(`# Valor: ${value}`)
      console.log('')
    }
  })

  console.log('📝 Variáveis que precisam ser configuradas manualmente:')
  const manualVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET', 
    'ASAAS_API_KEY',
    'ASAAS_CUSTOMER_ID',
    'PIX_KEY',
    'WEBHOOK_SECRET',
    'EMAIL_SERVER_USER',
    'EMAIL_SERVER_PASSWORD'
  ]

  manualVars.forEach(key => {
    if (allVars[key] && (allVars[key].includes('your-') || allVars[key].includes('localhost'))) {
      console.log(`- ${key}: Configure com seu valor real`)
    }
  })
}

async function main() {
  console.log('🚀 Configuração de Variáveis de Ambiente - Vercel\n')
  
  // Verificar se Vercel CLI está instalado
  if (!checkVercelCLI()) {
    console.log('❌ Vercel CLI não encontrado')
    const install = await new Promise((resolve) => {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      })
      readline.question('Deseja instalar o Vercel CLI? (y/n): ', (answer) => {
        readline.close()
        resolve(answer.toLowerCase() === 'y')
      })
    })
    
    if (install) {
      if (!installVercelCLI()) {
        console.log('❌ Não foi possível instalar o Vercel CLI')
        console.log('📋 Instale manualmente: npm install -g vercel')
        return
      }
    } else {
      console.log('📋 Instale manualmente: npm install -g vercel')
      return
    }
  }

  // Carregar variáveis do env.example
  const envVars = loadEnv()
  if (!envVars) {
    return
  }

  // Configurar variáveis na Vercel
  deployEnvVars(envVars)

  console.log('\n🎯 Próximos passos:')
  console.log('1. Execute os comandos vercel env add acima')
  console.log('2. Configure as variáveis manuais com seus valores reais')
  console.log('3. Execute: vercel --prod (para fazer deploy)')
  console.log('4. Teste a aplicação em produção')

  console.log('\n🔗 Links úteis:')
  console.log('- Painel Vercel: https://vercel.com/dashboard')
  console.log('- Documentação: https://vercel.com/docs')
  console.log('- Seu app: https://www.organizaemprestimos.com.br')
}

main().catch(console.error)
