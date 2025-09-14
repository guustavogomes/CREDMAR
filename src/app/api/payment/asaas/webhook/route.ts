import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { updateUserSubscription } from '@/lib/subscription-utils'

// Webhook do Asaas para receber confirmações de pagamento
export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json()

    // Verificar se é um evento de pagamento
    if (!body.event || !body.payment) {
      return NextResponse.json({ message: 'Evento ignorado' })
    }

    const { event, payment } = body

    // Processar apenas eventos de pagamento confirmado
    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      return NextResponse.json({ message: 'Evento ignorado' })
    }

    const asaasPaymentId = payment.id
    const asaasStatus = payment.status


    // Mapear status do Asaas para nosso enum
    const mapAsaasStatusToLocal = (asaasStatus: string) => {
      switch (asaasStatus) {
        case 'RECEIVED':
        case 'CONFIRMED':
          return 'APPROVED'
        case 'PENDING':
          return 'PENDING'
        default:
          return 'REJECTED'
      }
    }

    const localStatus = mapAsaasStatusToLocal(asaasStatus)

    // Buscar pagamento local pelo ID do Asaas
    const localPayment = await db.payment.findFirst({
      where: {
        asaasPaymentId: asaasPaymentId
      },
      include: {
        user: true
      }
    })

    if (!localPayment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    // Atualizar status do pagamento
    await db.payment.update({
      where: { id: localPayment.id },
      data: {
        status: localStatus,
        approvedAt: localStatus === 'APPROVED' ? new Date() : null,
      }
    })

    // Se foi aprovado, ativar o usuário e estender assinatura
    if (localStatus === 'APPROVED') {
      await updateUserSubscription(localPayment.userId, new Date())
    }

    return NextResponse.json({ 
      message: 'Webhook processado com sucesso',
      paymentId: localPayment.id,
      status: localStatus
    })

  } catch (error) {
    console.error('Erro no webhook do Asaas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
