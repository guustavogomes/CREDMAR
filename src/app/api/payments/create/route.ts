import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createPaymentSchema = z.object({
  amount: z.number().min(0.01),
  method: z.literal('PIX'), // Apenas PIX
  description: z.string().optional(),
  pixCode: z.string().optional(),
  month: z.string().optional() // YYYY-MM format
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
    const validatedData = createPaymentSchema.parse(body)

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

    // Criar novo pagamento
    const newPayment = await db.payment.create({
      data: {
        userId: session.user.id,
        amount: validatedData.amount,
        method: 'PIX',
        description: validatedData.description || `Pagamento PIX - ${currentMonth}`,
        pixCode: validatedData.pixCode,
        month: currentMonth,
        status: 'PENDING'
      }
    })

    return NextResponse.json(newPayment, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao criar pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}