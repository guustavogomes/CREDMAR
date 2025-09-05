import { PAYMENT_CONFIG, AsaasCustomer, AsaasPayment, AsaasWebhookData } from './payment-config'

export class AsaasAPI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = PAYMENT_CONFIG.ASAAS.apiKey
    this.baseUrl = PAYMENT_CONFIG.ASAAS.baseUrl
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Asaas API Error: ${response.status} - ${errorData.message || response.statusText}`)
    }

    return response.json()
  }

  // Criar ou atualizar cliente
  async createOrUpdateCustomer(customerData: AsaasCustomer): Promise<AsaasCustomer> {
    try {
      // Primeiro, tentar buscar cliente existente por email
      const existingCustomer = await this.findCustomerByEmail(customerData.email)
      
      if (existingCustomer) {
        // Atualizar cliente existente
        return await this.makeRequest(`/v3/customers/${existingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(customerData),
        })
      } else {
        // Criar novo cliente (sem CPF se for inválido)
        const customerToCreate = { ...customerData }
        if (customerToCreate.cpfCnpj === '00000000000' || customerToCreate.cpfCnpj === '11144477735') {
          delete customerToCreate.cpfCnpj // Remover CPF inválido
        }
        
        return await this.makeRequest('/v3/customers', {
          method: 'POST',
          body: JSON.stringify(customerToCreate),
        })
      }
    } catch (error) {
      console.error('Erro ao criar/atualizar cliente no Asaas:', error)
      throw error
    }
  }

  // Buscar cliente por email
  async findCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
    try {
      const response = await this.makeRequest(`/v3/customers?email=${encodeURIComponent(email)}`)
      return response.data && response.data.length > 0 ? response.data[0] : null
    } catch (error) {
      console.error('Erro ao buscar cliente por email:', error)
      return null
    }
  }

  // Buscar cliente por CPF/CNPJ
  async findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
    try {
      const response = await this.makeRequest(`/v3/customers?cpfCnpj=${cpfCnpj}`)
      return response.data && response.data.length > 0 ? response.data[0] : null
    } catch (error) {
      console.error('Erro ao buscar cliente no Asaas:', error)
      return null
    }
  }

  // Criar cobrança
  async createPayment(paymentData: AsaasPayment): Promise<AsaasPayment> {
    try {
      return await this.makeRequest('/v3/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      })
    } catch (error) {
      console.error('Erro ao criar cobrança no Asaas:', error)
      throw error
    }
  }

  // Buscar cobrança por ID
  async getPayment(paymentId: string): Promise<AsaasPayment> {
    try {
      return await this.makeRequest(`/v3/payments/${paymentId}`)
    } catch (error) {
      console.error('Erro ao buscar cobrança no Asaas:', error)
      throw error
    }
  }

  // Buscar dados PIX (QR Code e Payload) por ID do pagamento
  async getPixData(paymentId: string): Promise<{
    encodedImage: string
    payload: string
    expirationDate: string
  }> {
    try {
      return await this.makeRequest(`/v3/payments/${paymentId}/pixQrCode`)
    } catch (error) {
      console.error('Erro ao buscar dados PIX no Asaas:', error)
      throw error
    }
  }

  // Buscar cobrança por referência externa
  async getPaymentByExternalReference(externalReference: string): Promise<AsaasPayment | null> {
    try {
      const response = await this.makeRequest(`/v3/payments?externalReference=${externalReference}`)
      return response.data && response.data.length > 0 ? response.data[0] : null
    } catch (error) {
      console.error('Erro ao buscar cobrança por referência externa:', error)
      return null
    }
  }

  // Cancelar cobrança
  async cancelPayment(paymentId: string): Promise<AsaasPayment> {
    try {
      return await this.makeRequest(`/v3/payments/${paymentId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Erro ao cancelar cobrança no Asaas:', error)
      throw error
    }
  }

  // Estornar cobrança
  async refundPayment(paymentId: string, value?: number, description?: string): Promise<AsaasPayment> {
    try {
      const refundData: any = {}
      if (value) refundData.value = value
      if (description) refundData.description = description

      return await this.makeRequest(`/v3/payments/${paymentId}/refund`, {
        method: 'POST',
        body: JSON.stringify(refundData),
      })
    } catch (error) {
      console.error('Erro ao estornar cobrança no Asaas:', error)
      throw error
    }
  }

  // Criar webhook
  async createWebhook(url: string, events: string[]): Promise<any> {
    try {
      return await this.makeRequest('/v3/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          url,
          email: PAYMENT_CONFIG.ASAAS.webhookToken,
          enabled: true,
          events,
        }),
      })
    } catch (error) {
      console.error('Erro ao criar webhook no Asaas:', error)
      throw error
    }
  }

  // Listar webhooks
  async listWebhooks(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/v3/webhooks')
      return response.data || []
    } catch (error) {
      console.error('Erro ao listar webhooks no Asaas:', error)
      return []
    }
  }

  // Deletar webhook
  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      await this.makeRequest(`/v3/webhooks/${webhookId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Erro ao deletar webhook no Asaas:', error)
      throw error
    }
  }

  // Validar webhook (verificar assinatura)
  validateWebhookSignature(payload: string, signature: string): boolean {
    // Implementar validação de assinatura se necessário
    // Por enquanto, retorna true para desenvolvimento
    return true
  }

  // Processar webhook
  async processWebhook(webhookData: AsaasWebhookData): Promise<void> {
    try {
      console.log('Processando webhook do Asaas:', webhookData)
      
      // Aqui você pode implementar a lógica específica para cada tipo de evento
      switch (webhookData.event) {
        case 'PAYMENT_RECEIVED':
          await this.handlePaymentReceived(webhookData)
          break
        case 'PAYMENT_OVERDUE':
          await this.handlePaymentOverdue(webhookData)
          break
        case 'PAYMENT_REFUNDED':
          await this.handlePaymentRefunded(webhookData)
          break
        default:
          console.log(`Evento não tratado: ${webhookData.event}`)
      }
    } catch (error) {
      console.error('Erro ao processar webhook do Asaas:', error)
      throw error
    }
  }

  private async handlePaymentReceived(webhookData: AsaasWebhookData): Promise<void> {
    // Implementar lógica para pagamento recebido
    console.log('Pagamento recebido:', webhookData.payment.id)
  }

  private async handlePaymentOverdue(webhookData: AsaasWebhookData): Promise<void> {
    // Implementar lógica para pagamento em atraso
    console.log('Pagamento em atraso:', webhookData.payment.id)
  }

  private async handlePaymentRefunded(webhookData: AsaasWebhookData): Promise<void> {
    // Implementar lógica para pagamento estornado
    console.log('Pagamento estornado:', webhookData.payment.id)
  }
}

// Instância singleton
export const asaasAPI = new AsaasAPI()
