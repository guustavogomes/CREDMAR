import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { asaasAPI } from '@/lib/asaas-api'
import { db } from '@/lib/db'
import { z } from 'zod'

const statusSchema = z.object({
  paymentId: z.string().min(1, 'ID do pagamento é obrigatório')
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
    const { paymentId } = statusSchema.parse(body)

    // Buscar pagamento no banco local
    const payment = await db.payment.findFirst({
      where: {
        id: paymentId,
        userId: session.user.id
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Se já está aprovado no banco local, retornar
    if (payment.status === 'APPROVED') {
      return NextResponse.json({
        status: 'APPROVED',
        message: 'Pagamento já foi confirmado'
      })
    }

    // Verificar status no Asaas
    if (payment.asaasPaymentId) {
      try {
        const asaasPayment = await asaasAPI.getPayment(payment.asaasPaymentId)
        
        // Atualizar status no banco local se mudou
        if (asaasPayment.status !== payment.status) {
          await db.payment.update({
            where: { id: payment.id },
            data: { 
              status: asaasPayment.status === 'RECEIVED' ? 'APPROVED' : payment.status,
              approvedAt: asaasPayment.status === 'RECEIVED' ? new Date() : payment.approvedAt
            }
          })

          // Se pagamento foi aprovado, ativar usuário
          if (asaasPayment.status === 'RECEIVED') {
            await db.user.update({
              where: { id: session.user.id },
              data: { 
                status: 'ACTIVE',
                activatedAt: new Date()
              }
            })
          }
        }

        return NextResponse.json({
          status: asaasPayment.status === 'RECEIVED' ? 'APPROVED' : asaasPayment.status,
          message: asaasPayment.status === 'RECEIVED' ? 'Pagamento confirmado!' : 'Aguardando pagamento...'
        })

      } catch (error) {
        console.error('Erro ao verificar status no Asaas:', error)
        return NextResponse.json({
          status: payment.status,
          message: 'Erro ao verificar status no gateway'
        })
      }
    }

    return NextResponse.json({
      status: payment.status,
      message: 'Status do pagamento local'
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