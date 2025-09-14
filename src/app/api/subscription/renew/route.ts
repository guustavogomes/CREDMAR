import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { AsaasAPI } from '@/lib/asaas-api'
import { PAYMENT_CONFIG } from '@/lib/payment-config'
import { z } from 'zod'
import { addDays, format } from 'date-fns'

const renewSubscriptionSchema = z.object({
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
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
    const validatedData = renewSubscriptionSchema.parse(body)

    // Buscar usuário
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já existe pagamento pendente
    const existingPayment = await db.payment.findFirst({
      where: {
        userId: user.id,
        status: 'PENDING',
        isSubscriptionPayment: true
      }
    })

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Já existe um pagamento de renovação pendente' },
        { status: 400 }
      )
    }

    // Inicializar API do Asaas
    const asaas = new AsaasAPI()

    // Buscar ou criar cliente no Asaas
    let asaasCustomer
    try {
      asaasCustomer = await asaas.findCustomerByCpfCnpj(validatedData.cpf)
      if (!asaasCustomer) {
        // Se não encontrou, criar novo cliente
        asaasCustomer = await asaas.createOrUpdateCustomer({
          name: user.name,
          email: user.email,
          cpfCnpj: validatedData.cpf,
          mobilePhone: user.email // Usar email como telefone temporário
        })
      }
    } catch (error) {
      // Se não encontrou, criar novo cliente
      asaasCustomer = await asaas.createOrUpdateCustomer({
        name: user.name,
        email: user.email,
        cpfCnpj: validatedData.cpf,
        mobilePhone: user.email // Usar email como telefone temporário
      })
    }

    // Calcular data de vencimento (7 dias a partir de hoje)
    const dueDate = addDays(new Date(), 7)
    const subscriptionPeriod = format(new Date(), 'yyyy-MM')

    // Verificar se o cliente foi criado/encontrado
    if (!asaasCustomer.id) {
      return NextResponse.json(
        { error: 'Erro ao criar/encontrar cliente no Asaas' },
        { status: 500 }
      )
    }

    // Criar pagamento no Asaas
    const asaasPayment = await asaas.createPayment({
      customer: asaasCustomer.id,
      billingType: 'PIX',
      value: PAYMENT_CONFIG.MONTHLY_AMOUNT,
      dueDate: dueDate.toISOString().split('T')[0],
      description: `TaPago - Renovação de Assinatura - ${subscriptionPeriod}`,
      externalReference: `renewal_${user.id}_${subscriptionPeriod}`
    })

    // Buscar dados PIX
    let pixQrCode = ''
    let pixPayload = ''
    
    if (asaasPayment.pixTransaction) {
      pixQrCode = asaasPayment.pixTransaction.qrCode || ''
      pixPayload = asaasPayment.pixTransaction.payload || ''
    }

    // Criar pagamento no banco local
    const newPayment = await db.payment.create({
      data: {
        userId: user.id,
        amount: PAYMENT_CONFIG.MONTHLY_AMOUNT,
        method: 'PIX',
        status: 'PENDING',
        description: `TaPago - Renovação de Assinatura - ${subscriptionPeriod}`,
        month: subscriptionPeriod,
        asaasPaymentId: asaasPayment.id,
        asaasCustomerId: asaasCustomer.id,
        asaasDueDate: dueDate,
        pixCode: pixPayload,
        isSubscriptionPayment: true,
        subscriptionPeriod
      }
    })

    return NextResponse.json({
      payment: {
        id: asaasPayment.id,
        amount: PAYMENT_CONFIG.MONTHLY_AMOUNT,
        pixQrCode,
        pixPayload,
        dueDate: dueDate.toISOString(),
        description: `TaPago - Renovação de Assinatura - ${subscriptionPeriod}`,
        subscriptionPeriod
      }
    })

  } catch (error) {
    console.error('Erro ao gerar renovação de assinatura:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao processar renovação. Por favor, tente novamente.' },
      { status: 500 }
    )
  }
}
