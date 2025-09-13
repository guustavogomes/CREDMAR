// Configurações centralizadas do sistema de pagamento

// Debug das variáveis ANTES de criar a config
console.log('=== PAYMENT CONFIG DEBUG ===')
console.log('ASAAS_API_KEY exists:', !!process.env.ASAAS_API_KEY)
console.log('ASAAS_API_KEY value:', process.env.ASAAS_API_KEY ? process.env.ASAAS_API_KEY.substring(0, 30) + '...' : 'VAZIO')
console.log('ASAAS_ENVIRONMENT:', process.env.ASAAS_ENVIRONMENT)
console.log('============================')

export const PAYMENT_CONFIG = {
  // Valor da mensalidade (em reais)
  MONTHLY_AMOUNT: parseFloat(process.env.MONTHLY_AMOUNT || '5.00'),
  
  // Configurações do Asaas
  ASAAS: {
    apiKey: process.env.ASAAS_API_KEY || '',
    environment: process.env.ASAAS_ENVIRONMENT || 'sandbox', // 'sandbox' ou 'production'
    baseUrl: process.env.ASAAS_ENVIRONMENT === 'production' 
      ? 'https://api.asaas.com' 
      : 'https://api-sandbox.asaas.com',
    webhookToken: process.env.ASAAS_WEBHOOK_TOKEN || '',
    customerId: process.env.ASAAS_CUSTOMER_ID || '', // ID do cliente no Asaas
  },
  
  // Configurações do PIX (mantido para compatibilidade)
  PIX: {
    key: process.env.PIX_KEY || '',
    merchantName: process.env.PIX_MERCHANT_NAME || 'TaPago',
    merchantCity: process.env.PIX_MERCHANT_CITY || 'São Paulo',
    description: process.env.PIX_DESCRIPTION || 'TaPago - Mensalidade'
  },
  
  // Configurações de timeout
  PAYMENT_TIMEOUT_MINUTES: parseInt(process.env.PAYMENT_TIMEOUT_MINUTES || '30'),
  
  // Webhook para confirmação automática
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'your-webhook-secret-here'
}

// Função para validar configurações
export function validatePaymentConfig() {
  const errors: string[] = []
  
  // Validar configurações do Asaas
  if (!PAYMENT_CONFIG.ASAAS.apiKey) {
    errors.push('ASAAS_API_KEY não configurada')
  }
  
  if (!PAYMENT_CONFIG.ASAAS.customerId) {
    errors.push('ASAAS_CUSTOMER_ID não configurado')
  }
  
  if (!PAYMENT_CONFIG.ASAAS.webhookToken) {
    errors.push('ASAAS_WEBHOOK_TOKEN não configurado')
  }
  
  // Validar valor da mensalidade
  if (PAYMENT_CONFIG.MONTHLY_AMOUNT < 0.01) {
    errors.push('MONTHLY_AMOUNT deve ser pelo menos R$ 0,01')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Tipos para o Asaas
export interface AsaasCustomer {
  id?: string
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
  mobilePhone?: string
  postalCode?: string
  address?: string | {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
  zipCode?: string
  neighborhood?: string
}

export interface AsaasPayment {
  id?: string
  customer: string
  billingType: 'PIX' | 'UNDEFINED'
  value: number
  dueDate: string
  description?: string
  externalReference?: string
  status?: 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS'
  netValue?: number
  originalValue?: number
  interestValue?: number
  pixTransaction?: {
    id?: string
    qrCode?: string
    payload?: string
  }
}

export interface AsaasWebhookData {
  event: 'PAYMENT_CREATED' | 'PAYMENT_AWAITING_PAYMENT' | 'PAYMENT_RECEIVED' | 'PAYMENT_OVERDUE' | 'PAYMENT_DELETED' | 'PAYMENT_RESTORED' | 'PAYMENT_REFUNDED' | 'PAYMENT_RECEIVED_IN_CASH_UNDONE' | 'PAYMENT_CHARGEBACK_REQUESTED' | 'PAYMENT_CHARGEBACK_DISPUTE' | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL' | 'PAYMENT_DUNNING_RECEIVED' | 'PAYMENT_DUNNING_REQUESTED' | 'PAYMENT_BANK_SLIP_VIEWED' | 'PAYMENT_CHECKOUT_VIEWED'
  payment: {
    id: string
    customer: string
    value: number
    netValue: number
    originalValue: number
    interestValue: number
    description: string
    billingType: string
    status: 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS'
    pixTransaction?: {
      id: string
      qrCode: string
      payload: string
    }
  }
}