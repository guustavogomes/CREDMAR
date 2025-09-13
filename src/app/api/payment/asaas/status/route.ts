import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { asaasAPI } from '@/lib/asaas-api'
import { z } from 'zod'

const checkPaymentStatusSchema = z.object({
  paymentId: z.string().min(1, 'ID do pagamento é obrigatório'),
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
    const validatedData = checkPaymentStatusSchema.parse(body)

    // Buscar o pagamento no Asaas
    const asaasPayment = await asaasAPI.getPayment(validatedData.paymentId)

    // Atualizar o status no banco de dados local
    const localPayment = await db.payment.findFirst({
        where: {
        asaasPaymentId: validatedData.paymentId,
        userId: session.user.id,
      },
    })

    if (localPayment && localPayment.status !== asaasPayment.status) {
      await db.payment.update({
        where: { id: localPayment.id },
        data: { status: asaasPayment.status as any },
      })
    }

    // Se o pagamento foi aprovado, ativar o usuário
    if (asaasPayment.status === 'RECEIVED' || asaasPayment.status === 'CONFIRMED') {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      })

      if (user && user.status !== 'ACTIVE') {
        await db.user.update({
          where: { id: session.user.id },
          data: { status: 'ACTIVE', activatedAt: new Date() },
        })
        
        return NextResponse.json({ 
          status: 'APPROVED', 
          message: 'Pagamento confirmado e usuário ativado.' 
        })
      }
    }

    return NextResponse.json({ status: asaasPayment.status })

  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor ao verificar pagamento.' },
      { status: 500 }
    )
  }
}
