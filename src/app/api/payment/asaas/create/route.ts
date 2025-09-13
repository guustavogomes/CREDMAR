import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { asaasAPI } from '@/lib/asaas-api'
// import { PAYMENT_CONFIG } from '@/lib/payment-config' // Removido pois não está sendo usado
import { z } from 'zod'

// Função para validar CPF
function validateCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, '')
  
  if (numbers.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false
  
  // Verifica CPFs inválidos conhecidos
  const invalidCPFs = ['00000000000', '11111111111', '22222222222', '33333333333', 
                      '44444444444', '55555555555', '66666666666', '77777777777', 
                      '88888888888', '99999999999', '11144477735']
  if (invalidCPFs.includes(numbers)) return false
  
  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit > 9) digit = 0
  if (digit !== parseInt(numbers.charAt(9))) return false
  
  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit > 9) digit = 0
  if (digit !== parseInt(numbers.charAt(10))) return false
  
  return true
}

const createAsaasPaymentSchema = z.object({
  amount: z.number().min(0.01),
  method: z.literal('PIX'), // Apenas PIX
  description: z.string().optional(),
  month: z.string().optional(), // YYYY-MM format
  cpf: z.string().min(1, 'CPF é obrigatório').refine(validateCPF, 'CPF inválido') // CPF obrigatório e válido
})

export async function POST(request: NextRequest) {
  console.log('🚀 API ROUTE START - ANTES DO TRY')
  
  try {
    console.log('✅ DENTRO DO TRY - API FUNCIONANDO')
    console.log('=== INÍCIO DA CRIAÇÃO DE PAGAMENTO ===')
    
    // Debug das variáveis de ambiente
    console.log('=== VARIÁVEIS DE AMBIENTE ===')
    console.log('ASAAS_API_KEY configurada:', !!process.env.ASAAS_API_KEY)
    console.log('ASAAS_API_KEY (primeiros 20 chars):', process.env.ASAAS_API_KEY ? process.env.ASAAS_API_KEY.substring(0, 20) + '...' : 'NÃO CONFIGURADA')
    console.log('ASAAS_ENVIRONMENT:', process.env.ASAAS_ENVIRONMENT)
    console.log('ASAAS_CUSTOMER_ID:', process.env.ASAAS_CUSTOMER_ID)
    console.log('Base URL calculada:', process.env.ASAAS_ENVIRONMENT === 'production' ? 'https://api.asaas.com' : 'https://api-sandbox.asaas.com')
    console.log('========================')
    
    const session = await getServerSession(authOptions)
    console.log('Sessão:', session ? 'Ativa' : 'Não encontrada')
    
    if (!session?.user?.id) {
      console.log('❌ Usuário não autorizado')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Dados recebidos:', body)
    
    const validatedData = createAsaasPaymentSchema.parse(body)
    console.log('Dados validados:', validatedData)

    // Verificar se o usuário existe
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Gerar mês atual se não fornecido
    const currentMonth = validatedData.month || new Date().toISOString().slice(0, 7)

    // Verificar se já existe pagamento para este mês
    const existingPayment = await db.payment.findFirst({
      where: {
        userId: session.user.id,
        month: currentMonth,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    })

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Já existe um pagamento pendente ou aprovado para este mês' },
        { status: 409 }
      )
    }

    // Criar ou atualizar cliente no Asaas
    // Preparar dados do cliente
    const customerData: any = {
      name: user.name || 'Cliente',
      email: user.email
    }

    // Adicionar CPF (obrigatório para PIX)
    customerData.cpfCnpj = validatedData.cpf.replace(/\D/g, '') // Remove formatação
    console.log('Dados do cliente para Asaas:', customerData)

    console.log('Criando/atualizando cliente no Asaas...')
    const asaasCustomer = await asaasAPI.createOrUpdateCustomer(customerData)
    console.log('Cliente Asaas criado:', asaasCustomer.id)

    // Calcular data de vencimento (30 dias a partir de hoje)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    // Criar cobrança no Asaas
    const asaasPayment = await asaasAPI.createPayment({
      customer: asaasCustomer.id!,
      billingType: 'PIX', // Sempre PIX
      value: validatedData.amount,
      dueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD format
      description: validatedData.description || `TaPago - Mensalidade ${currentMonth}`,
      externalReference: `tapago_${session.user.id}_${currentMonth}`,
    })

    // Buscar dados PIX (sempre necessário)
    let pixQrCode = null
    let pixPayload = null
    
    if (asaasPayment.id) {
      try {
        const pixData = await asaasAPI.getPixData(asaasPayment.id)
        pixPayload = pixData.payload
        
        // Converter Base64 para Data URL para exibir o QR Code
        if (pixData.encodedImage) {
          pixQrCode = `data:image/png;base64,${pixData.encodedImage}`
        }
        
        console.log('Dados PIX obtidos:', { 
          qrCode: !!pixQrCode, 
          payload: !!pixPayload,
          encodedImageLength: pixData.encodedImage?.length || 0
        })
      } catch (error) {
        console.error('Erro ao buscar dados PIX:', error)
        // Continua sem os dados PIX, mas loga o erro
      }
    }

    // Criar pagamento no banco de dados local
    const newPayment = await db.payment.create({
      data: {
        userId: session.user.id,
        amount: validatedData.amount,
        method: 'PIX',
        status: 'PENDING',
        description: validatedData.description || `TaPago - Mensalidade ${currentMonth}`,
        month: currentMonth,
        
        // Campos específicos do Asaas
        asaasPaymentId: asaasPayment.id,
        asaasCustomerId: asaasCustomer.id,
        asaasExternalReference: asaasPayment.externalReference,
        asaasPixQrCode: pixQrCode,
        asaasPixPayload: pixPayload,
        asaasDueDate: dueDate,
        asaasOriginalValue: validatedData.amount,
      }
    })

    return NextResponse.json({
      success: true,
      payment: {
        id: newPayment.id,
        amount: newPayment.amount,
        method: 'PIX',
        status: newPayment.status,
        description: newPayment.description,
        month: newPayment.month,
        asaasPaymentId: newPayment.asaasPaymentId,
        pixQrCode: pixQrCode,
        pixPayload: pixPayload,
        dueDate: newPayment.asaasDueDate,
        createdAt: newPayment.createdAt,
      }
    })

  } catch (error) {
    console.log('❌ ERRO CAPTURADO NO CATCH PRINCIPAL:')
    console.log('Tipo do erro:', typeof error)
    console.log('Erro completo:', error)
    console.log('Stack trace:', error instanceof Error ? error.stack : 'N/A')
    console.error('Erro ao criar pagamento no Asaas:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      let message = 'Dados inválidos'
      
      // Mensagens específicas para erros comuns
      if (firstError.path[0] === 'cpf') {
        message = firstError.message || 'CPF inválido'
      } else if (firstError.path[0] === 'amount') {
        message = 'Valor inválido'
      }
      
      return NextResponse.json(
        { error: message, details: error.errors },
        { status: 400 }
      )
    }

    // Tratar erros específicos da API Asaas
    if (error instanceof Error) {
      if (error.message.includes('CPF') || error.message.includes('cpf')) {
        return NextResponse.json(
          { error: 'CPF inválido ou não aceito pelo gateway de pagamento' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erro ao processar pagamento. Por favor, tente novamente.' },
      { status: 500 }
    )
  }
}
