// Integração com API PIX do Banco Central (BACEN)

interface PixTransaction {
  endToEndId: string
  txid: string
  valor: string
  horario: string
  infoPagador?: {
    nome?: string
    cpf?: string
    cnpj?: string
  }
}

interface PixConsultaResponse {
  parametros: {
    inicio: string
    fim: string
  }
  pix: PixTransaction[]
}

export class BacenPixAPI {
  private baseUrl: string
  private clientId: string
  private clientSecret: string
  private certificado: string // Certificado digital obrigatório

  constructor() {
    this.baseUrl = process.env.BACEN_PIX_API_URL || 'https://api.bcb.gov.br/pix/v2'
    this.clientId = process.env.BACEN_CLIENT_ID || ''
    this.clientSecret = process.env.BACEN_CLIENT_SECRET || ''
    this.certificado = process.env.BACEN_CERTIFICATE || ''
  }

  // Obter token de acesso OAuth2
  private async getAccessToken(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials&scope=pix.read'
      })

      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error('Erro ao obter token BACEN:', error)
      throw new Error('Falha na autenticação com BACEN')
    }
  }

  // Consultar PIX recebidos por período
  async consultarPixRecebidos(inicio: Date, fim: Date): Promise<PixTransaction[]> {
    try {
      const token = await this.getAccessToken()
      
      const inicioStr = inicio.toISOString()
      const fimStr = fim.toISOString()

      const response = await fetch(
        `${this.baseUrl}/pix?inicio=${inicioStr}&fim=${fimStr}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Erro na consulta BACEN: ${response.status}`)
      }

      const data: PixConsultaResponse = await response.json()
      return data.pix || []

    } catch (error) {
      console.error('Erro ao consultar PIX BACEN:', error)
      throw error
    }
  }

  // Consultar PIX específico por EndToEndId
  async consultarPixPorId(endToEndId: string): Promise<PixTransaction | null> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(
        `${this.baseUrl}/pix/${endToEndId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.status === 404) {
        return null // PIX não encontrado
      }

      if (!response.ok) {
        throw new Error(`Erro na consulta BACEN: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Erro ao consultar PIX por ID:', error)
      throw error
    }
  }

  // Verificar se um PIX foi pago (por valor e período)
  async verificarPagamentoPix(valor: number, chaveRecebedora: string, janelaTempo: number = 10): Promise<PixTransaction | null> {
    try {
      const agora = new Date()
      const inicio = new Date(agora.getTime() - (janelaTempo * 60 * 1000)) // X minutos atrás

      console.log(`[BACEN] Consultando PIX de R$ ${valor} entre ${inicio.toISOString()} e ${agora.toISOString()}`)

      const pixList = await this.consultarPixRecebidos(inicio, agora)
      
      // Procurar PIX com valor correspondente
      const pixEncontrado = pixList.find(pix => {
        const valorPix = parseFloat(pix.valor)
        const valorEsperado = valor
        
        // Tolerância de 1 centavo para diferenças de arredondamento
        return Math.abs(valorPix - valorEsperado) < 0.01
      })

      if (pixEncontrado) {
        console.log(`[BACEN] ✅ PIX encontrado:`, pixEncontrado)
        return pixEncontrado
      }

      console.log(`[BACEN] ❌ PIX de R$ ${valor} não encontrado`)
      return null

    } catch (error) {
      console.error('[BACEN] Erro ao verificar pagamento:', error)
      throw error
    }
  }
}

// Função auxiliar para verificar se as credenciais estão configuradas
export function isBacenConfigured(): boolean {
  return !!(
    process.env.BACEN_CLIENT_ID &&
    process.env.BACEN_CLIENT_SECRET &&
    process.env.BACEN_CERTIFICATE
  )
}

// Instância singleton
export const bacenPixAPI = new BacenPixAPI()