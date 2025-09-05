// Script para testar a geração do código PIX localmente
// Execute com: node test-pix.js

// Função para validar chave PIX
function validatePixKey(pixKey) {
  // UUID (chave aleatória)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pixKey)) {
    return { isValid: true, type: 'UUID' }
  }
  
  // CPF (11 dígitos)
  if (/^\d{11}$/.test(pixKey)) {
    return { isValid: true, type: 'CPF' }
  }
  
  // CNPJ (14 dígitos)
  if (/^\d{14}$/.test(pixKey)) {
    return { isValid: true, type: 'CNPJ' }
  }
  
  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) {
    return { isValid: true, type: 'EMAIL' }
  }
  
  // Telefone (+5511999999999)
  if (/^\+55\d{10,11}$/.test(pixKey)) {
    return { isValid: true, type: 'PHONE' }
  }
  
  return { isValid: false, type: 'UNKNOWN', error: 'Formato de chave PIX inválido' }
}

// Função para gerar código PIX
function generatePixCode(pixKey, merchantName, merchantCity, amount, description) {
  // Validar chave PIX
  const keyValidation = validatePixKey(pixKey)
  if (!keyValidation.isValid) {
    throw new Error(`Chave PIX inválida: ${keyValidation.error}`)
  }
  
  console.log(`✅ Chave PIX válida (${keyValidation.type}):`, pixKey)

  // Função CRC16
  function crc16(data) {
    const polynomial = 0x1021
    let crc = 0xFFFF
    
    const bytes = new TextEncoder().encode(data)
    
    for (let i = 0; i < bytes.length; i++) {
      crc ^= (bytes[i] << 8)
      
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ polynomial) & 0xFFFF
        } else {
          crc = (crc << 1) & 0xFFFF
        }
      }
    }
    
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
  }

  // Função para formatar campo
  function formatField(id, value) {
    const length = value.length.toString().padStart(2, '0')
    return id + length + value
  }

  // Limpar dados
  const cleanMerchantName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 25)
    .toUpperCase()
    .trim()
    
  const cleanMerchantCity = merchantCity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 15)
    .toUpperCase()
    .trim()
    
  const cleanDescription = description 
    ? description
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .substring(0, 25)
        .toUpperCase()
        .trim()
    : ''

  console.log('\n📋 Dados processados:')
  console.log('- Nome:', `"${cleanMerchantName}" (${cleanMerchantName.length} chars)`)
  console.log('- Cidade:', `"${cleanMerchantCity}" (${cleanMerchantCity.length} chars)`)
  console.log('- Descrição:', `"${cleanDescription}" (${cleanDescription.length} chars)`)
  console.log('- Valor:', amount.toFixed(2))

  // Construir payload
  let payload = ''
  
  payload += formatField('00', '01') // Format indicator
  payload += formatField('01', '12') // Point of initiation
  
  // Merchant account
  let merchantAccount = ''
  merchantAccount += formatField('00', 'BR.GOV.BCB.PIX')
  merchantAccount += formatField('01', pixKey)
  if (cleanDescription) {
    merchantAccount += formatField('02', cleanDescription)
  }
  payload += formatField('26', merchantAccount)
  
  payload += formatField('52', '0000') // Category code
  payload += formatField('53', '986')  // Currency
  payload += formatField('54', amount.toFixed(2)) // Amount
  payload += formatField('58', 'BR')   // Country
  payload += formatField('59', cleanMerchantName) // Name
  payload += formatField('60', cleanMerchantCity) // City
  
  // CRC
  payload += '6304'
  const crc = crc16(payload)
  payload += crc
  
  console.log('\n🔍 Validações:')
  console.log('- Tamanho:', payload.length, '(deve estar entre 100-512)')
  console.log('- Inicia corretamente:', payload.startsWith('000201') ? '✅' : '❌')
  console.log('- Contém BR.GOV.BCB.PIX:', payload.includes('BR.GOV.BCB.PIX') ? '✅' : '❌')
  console.log('- Termina com CRC:', payload.includes('6304') ? '✅' : '❌')
  console.log('- CRC calculado:', crc)
  
  return payload
}

// Teste com os dados do Tapago
console.log('🧪 TESTE DE GERAÇÃO PIX - TAPAGO\n')

const config = {
  pixKey: 'cce3e219-d60a-4c42-9e17-809f85bca641',
  merchantName: 'GUSTAVO NOVAES GOMES',
  merchantCity: 'DIVINOPOLIS',
  amount: 0.01,
  description: 'TAPAGO MENSALIDADE'
}

try {
  const pixCode = generatePixCode(
    config.pixKey,
    config.merchantName,
    config.merchantCity,
    config.amount,
    config.description
  )
  
  console.log('\n✅ PIX CODE GERADO COM SUCESSO!')
  console.log('Código:', pixCode)
  console.log('\n📱 Teste este código no seu app bancário!')
  
} catch (error) {
  console.error('❌ Erro:', error.message)
}