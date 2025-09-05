import QRCode from 'qrcode'

interface PixData {
  chavePix: string
  valor: number
  nomeRecebedor: string
  cidade: string
  identificador?: string
  descricao?: string
}

// Função para calcular CRC16 (necessário para PIX)
function crc16(data: string): string {
  let crc = 0xFFFF
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc = crc << 1
      }
    }
  }
  
  crc = crc & 0xFFFF
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Função para formatar campo PIX
function formatPixField(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0')
  return `${id}${length}${value}`
}

// Gerar payload PIX conforme padrão do Banco Central
export function generatePixPayload(data: PixData): string {
  const {
    chavePix,
    valor,
    nomeRecebedor,
    cidade,
    identificador = '',
    descricao = ''
  } = data

  // Campos obrigatórios do PIX
  let payload = ''
  
  // Payload Format Indicator
  payload += formatPixField('00', '01')
  
  // Point of Initiation Method (12 = estático)
  payload += formatPixField('01', '12')
  
  // Merchant Account Information
  let merchantInfo = ''
  merchantInfo += formatPixField('00', 'BR.GOV.BCB.PIX') // GUI
  merchantInfo += formatPixField('01', chavePix) // Chave PIX
  
  if (descricao) {
    merchantInfo += formatPixField('02', descricao) // Descrição
  }
  
  payload += formatPixField('26', merchantInfo)
  
  // Merchant Category Code
  payload += formatPixField('52', '0000')
  
  // Transaction Currency (986 = BRL)
  payload += formatPixField('53', '986')
  
  // Transaction Amount
  if (valor > 0) {
    payload += formatPixField('54', valor.toFixed(2))
  }
  
  // Country Code
  payload += formatPixField('58', 'BR')
  
  // Merchant Name
  payload += formatPixField('59', nomeRecebedor.substring(0, 25))
  
  // Merchant City
  payload += formatPixField('60', cidade.substring(0, 15))
  
  // Additional Data Field Template
  if (identificador) {
    const additionalData = formatPixField('05', identificador.substring(0, 25))
    payload += formatPixField('62', additionalData)
  }
  
  // CRC16
  payload += '6304'
  const crc = crc16(payload)
  payload += crc
  
  return payload
}

// Gerar QR Code do PIX
export async function generatePixQRCode(data: PixData): Promise<string> {
  const payload = generatePixPayload(data)
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    })
    
    return qrCodeDataURL
  } catch (error) {
    console.error('Erro ao gerar QR Code PIX:', error)
    throw new Error('Erro ao gerar QR Code PIX')
  }
}

// Função para validar chave PIX
export function validatePixKey(key: string, type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'): boolean {
  switch (type) {
    case 'cpf':
      return /^\d{11}$/.test(key.replace(/\D/g, ''))
    case 'cnpj':
      return /^\d{14}$/.test(key.replace(/\D/g, ''))
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)
    case 'phone':
      return /^\+55\d{10,11}$/.test(key.replace(/\D/g, ''))
    case 'random':
      return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key)
    default:
      return false
  }
}