import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Webhook do Asaas para receber confirmações de pagamento
export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBHOOK ASAAS RECEBIDO ===')
    
    const body = await request.json()
    console.log('Webhook payload:', JSON.stringify(body, null, 2))

    // Verificar se é um evento de pagamento
    if (!body.event || !body.payment) {
      console.log('Webhook não é de pagamento')
      return NextResponse.json({ message: 'Evento ignorado' })
    }

    const { event, payment } = body

    // Processar apenas eventos de pagamento confirmado
    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      console.log('Evento ignorado:', event)
      return NextResponse.json({ message: 'Evento ignorado' })
    }

    const asaasPaymentId = payment.id
    const asaasStatus = payment.status

    console.log('Processando pagamento:', asaasPaymentId, 'Status:', asaasStatus)

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
      console.log('Pagamento local não encontrado para Asaas ID:', asaasPaymentId)
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

    // Se foi aprovado, ativar o usuário
    if (localStatus === 'APPROVED') {
      await db.user.update({
        where: { id: localPayment.userId },
        data: {
          status: 'ACTIVE',
          activatedAt: new Date()
        }
      })

      console.log(`✅ Usuário ${localPayment.user.email} ativado automaticamente!`)
      console.log(`💰 Pagamento de R$ ${payment.value} aprovado`)
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
