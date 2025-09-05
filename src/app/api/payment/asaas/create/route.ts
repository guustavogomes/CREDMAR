import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { asaasAPI } from '@/lib/asaas-api'
import { PAYMENT_CONFIG } from '@/lib/payment-config'
import { z } from 'zod'

const createAsaasPaymentSchema = z.object({
  amount: z.number().min(0.01),
  method: z.literal('PIX'), // Apenas PIX
  description: z.string().optional(),
  month: z.string().optional(), // YYYY-MM format
  cpf: z.string().min(1, 'CPF é obrigatório') // CPF obrigatório para PIX
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createAsaasPaymentSchema.parse(body)

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

    const asaasCustomer = await asaasAPI.createOrUpdateCustomer(customerData)

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
    console.error('Erro ao criar pagamento no Asaas:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
