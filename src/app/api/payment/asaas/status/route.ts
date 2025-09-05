import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { asaasAPI } from '@/lib/asaas-api'
import { z } from 'zod'

const checkStatusSchema = z.object({
  paymentId: z.string().optional(),
  asaasPaymentId: z.string().optional(),
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
    const validatedData = checkStatusSchema.parse(body)

    let payment

    // Buscar pagamento por ID local ou ID do Asaas
    if (validatedData.paymentId) {
      payment = await db.payment.findFirst({
        where: {
          id: validatedData.paymentId,
          userId: session.user.id
        }
      })
    } else if (validatedData.asaasPaymentId) {
      payment = await db.payment.findFirst({
        where: {
          asaasPaymentId: validatedData.asaasPaymentId,
          userId: session.user.id
        }
      })
    } else {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      )
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Se o pagamento tem ID do Asaas, verificar status atualizado
    if (payment.asaasPaymentId) {
      try {
        const asaasPayment = await asaasAPI.getPayment(payment.asaasPaymentId)
        
        // Mapear status do Asaas para nosso sistema
        let newStatus = payment.status
        switch (asaasPayment.status) {
          case 'RECEIVED':
          case 'CONFIRMED':
            newStatus = 'APPROVED'
            break
          case 'OVERDUE':
            newStatus = 'PENDING' // Manter como pendente para permitir pagamento
            break
          case 'REFUNDED':
            newStatus = 'REJECTED'
            break
          default:
            newStatus = 'PENDING'
        }

        // Atualizar pagamento se o status mudou
        if (newStatus !== payment.status) {
          payment = await db.payment.update({
            where: { id: payment.id },
            data: {
              status: newStatus,
              asaasNetValue: asaasPayment.netValue,
              asaasOriginalValue: asaasPayment.originalValue,
              asaasInterestValue: asaasPayment.interestValue,
              ...(newStatus === 'APPROVED' && {
                approvedAt: new Date(),
                approvedBy: 'ASAAS_WEBHOOK'
              })
            }
          })
        }
      } catch (error) {
        console.error('Erro ao verificar status no Asaas:', error)
        // Continuar com o status local se houver erro na API
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        description: payment.description,
        month: payment.month,
        asaasPaymentId: payment.asaasPaymentId,
        pixQrCode: payment.asaasPixQrCode,
        pixPayload: payment.asaasPixPayload,
        dueDate: payment.asaasDueDate,
        netValue: payment.asaasNetValue,
        originalValue: payment.asaasOriginalValue,
        interestValue: payment.asaasInterestValue,
        approvedAt: payment.approvedAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      }
    })

  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error)
    
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
