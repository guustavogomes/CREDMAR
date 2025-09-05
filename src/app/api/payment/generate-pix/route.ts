import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import QRCode from 'qrcode'
import { PAYMENT_CONFIG, validatePaymentConfig } from '@/lib/payment-config'

// Função para validar chave PIX
function validatePixKey(pixKey: string): { isValid: boolean; type: string; error?: string } {
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

// Função para gerar código PIX estático
function generatePixCode(
  pixKey: string,
  merchantName: string,
  merchantCity: string,
  amount: number,
  description?: string
): string {
  // Validar chave PIX primeiro
  const keyValidation = validatePixKey(pixKey)
  if (!keyValidation.isValid) {
    throw new Error(`Chave PIX inválida: ${keyValidation.error}`)
  }
  
  console.log(`Chave PIX válida (${keyValidation.type}):`, pixKey)

  // Função auxiliar para calcular CRC16 (implementação mais robusta)
  function crc16(data: string): string {
    const polynomial = 0x1021
    let crc = 0xFFFF
    
    // Converter string para bytes
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
    
    // Garantir que o resultado seja sempre 4 dígitos hexadecimais
    const result = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
    console.log(`CRC16 calculado para "${data}": ${result}`)
    return result
  }

  // Função para formatar campo PIX
  function formatField(id: string, value: string): string {
    const length = value.length.toString().padStart(2, '0')
    return id + length + value
  }

  // Limitar tamanhos conforme especificação e normalizar
  const cleanMerchantName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .substring(0, 25)
    .toUpperCase()
    .trim()
    
  const cleanMerchantCity = merchantCity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .substring(0, 15)
    .toUpperCase()
    .trim()
    
  const cleanDescription = description 
    ? description
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .substring(0, 25)
        .toUpperCase()
        .trim()
    : ''

  console.log('Dados limpos:')
  console.log('- Merchant Name:', `"${cleanMerchantName}" (${cleanMerchantName.length} chars)`)
  console.log('- Merchant City:', `"${cleanMerchantCity}" (${cleanMerchantCity.length} chars)`)
  console.log('- Description:', `"${cleanDescription}" (${cleanDescription.length} chars)`)
  console.log('- Amount:', amount.toFixed(2))

  // Construir payload PIX
  let payload = ''
  
  // Payload Format Indicator (obrigatório)
  const field00 = formatField('00', '01')
  payload += field00
  console.log('Field 00 (Format):', field00)
  
  // Point of Initiation Method (12 = estático, 11 = dinâmico)
  const field01 = formatField('01', '12')
  payload += field01
  console.log('Field 01 (Method):', field01)
  
  // Merchant Account Information (26-51 reservados para isso)
  let merchantAccount = ''
  merchantAccount += formatField('00', 'BR.GOV.BCB.PIX')
  merchantAccount += formatField('01', pixKey)
  if (cleanDescription) {
    merchantAccount += formatField('02', cleanDescription)
  }
  const field26 = formatField('26', merchantAccount)
  payload += field26
  console.log('Field 26 (Merchant Account):', field26)
  
  // Merchant Category Code (obrigatório)
  const field52 = formatField('52', '0000')
  payload += field52
  console.log('Field 52 (Category):', field52)
  
  // Transaction Currency (obrigatório - 986 = BRL)
  const field53 = formatField('53', '986')
  payload += field53
  console.log('Field 53 (Currency):', field53)
  
  // Transaction Amount (obrigatório para PIX estático com valor)
  const field54 = formatField('54', amount.toFixed(2))
  payload += field54
  console.log('Field 54 (Amount):', field54)
  
  // Country Code (obrigatório)
  const field58 = formatField('58', 'BR')
  payload += field58
  console.log('Field 58 (Country):', field58)
  
  // Merchant Name (obrigatório)
  const field59 = formatField('59', cleanMerchantName)
  payload += field59
  console.log('Field 59 (Name):', field59)
  
  // Merchant City (obrigatório)
  const field60 = formatField('60', cleanMerchantCity)
  payload += field60
  console.log('Field 60 (City):', field60)
  
  console.log('Payload antes do CRC:', payload)
  
  // CRC16 (obrigatório - sempre por último)
  payload += '6304'
  const crc = crc16(payload)
  payload += crc
  
  console.log('CRC calculado:', crc)
  console.log('Payload final:', payload)
  console.log('Payload final length:', payload.length)
  
  return payload
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== INICIANDO GERAÇÃO PIX ===')
    
    const session = await getServerSession(authOptions)
    console.log('Session user ID:', session?.user?.id)
    
    if (!session?.user?.id) {
      console.log('❌ Usuário não autorizado')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Validar configurações
    console.log('Validando configurações...')
    const configValidation = validatePaymentConfig()
    console.log('Resultado da validação:', configValidation)
    
    if (!configValidation.isValid) {
      console.error('❌ Configuração inválida:', configValidation.errors)
      return NextResponse.json(
        { error: 'Configuração do pagamento inválida', details: configValidation.errors },
        { status: 500 }
      )
    }
    
    console.log('✅ Configurações válidas')

    // Usar configurações centralizadas
    const PIX_CONFIG = {
      pixKey: PAYMENT_CONFIG.PIX.key,
      merchantName: PAYMENT_CONFIG.PIX.merchantName,
      merchantCity: PAYMENT_CONFIG.PIX.merchantCity,
      amount: PAYMENT_CONFIG.MONTHLY_AMOUNT,
      description: PAYMENT_CONFIG.PIX.description
    }

    // Gerar código PIX
    console.log('Gerando código PIX com configurações:', PIX_CONFIG)
    let pixCode
    try {
      pixCode = generatePixCode(
        PIX_CONFIG.pixKey,
        PIX_CONFIG.merchantName,
        PIX_CONFIG.merchantCity,
        PIX_CONFIG.amount,
        PIX_CONFIG.description
      )
      console.log('✅ PIX Code gerado com sucesso')
    } catch (pixError) {
      console.error('❌ Erro na geração do PIX:', pixError)
      return NextResponse.json(
        { 
          error: 'Erro ao gerar código PIX', 
          details: pixError instanceof Error ? pixError.message : 'Erro desconhecido na geração do PIX'
        },
        { status: 500 }
      )
    }

    // Logs detalhados para debug
    console.log('=== DEBUG PIX GENERATION ===')
    console.log('PIX Config:', PIX_CONFIG)
    console.log('PIX Key format:', typeof PIX_CONFIG.pixKey, PIX_CONFIG.pixKey.length)
    console.log('Merchant Name:', PIX_CONFIG.merchantName, '(length:', PIX_CONFIG.merchantName.length, ')')
    console.log('Merchant City:', PIX_CONFIG.merchantCity, '(length:', PIX_CONFIG.merchantCity.length, ')')
    console.log('Amount:', PIX_CONFIG.amount)
    console.log('Description:', PIX_CONFIG.description, '(length:', PIX_CONFIG.description.length, ')')
    console.log('PIX Code gerado:', pixCode)
    console.log('PIX Code length:', pixCode.length)
    
    // Validar chave PIX
    const isValidPixKey = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(PIX_CONFIG.pixKey)
    console.log('PIX Key válida (UUID):', isValidPixKey)
    
    // Validar estrutura do código PIX
    const pixValidation = {
      startsWithCorrectFormat: pixCode.startsWith('000201'),
      hasCorrectLength: pixCode.length >= 100 && pixCode.length <= 512,
      endsWithCRC: pixCode.includes('6304'),
      containsBRGovBcbPix: pixCode.includes('BR.GOV.BCB.PIX')
    }
    console.log('PIX Validation:', pixValidation)
    console.log('=== END DEBUG ===')
    
    // Verificar se há problemas na validação
    const hasValidationIssues = !Object.values(pixValidation).every(Boolean)
    if (hasValidationIssues) {
      console.warn('⚠️ PIX Code pode ter problemas de validação!')
    }

    // Gerar QR Code
    const qrCodeUrl = await QRCode.toDataURL(pixCode, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // Salvar registro de pagamento pendente no banco
    const { db } = await import('@/lib/db')
    
    await db.payment.create({
      data: {
        userId: session.user.id,
        amount: PIX_CONFIG.amount,
        method: 'PIX',
        status: 'PENDING',
        description: PIX_CONFIG.description,
        pixCode: pixCode,
        month: new Date().toISOString().slice(0, 7) // YYYY-MM
      }
    })

    return NextResponse.json({
      qrCodeUrl,
      pixCode,
      amount: PIX_CONFIG.amount,
      description: PIX_CONFIG.description
    })

  } catch (error) {
    console.error('❌ ERRO GERAL ao gerar PIX:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}