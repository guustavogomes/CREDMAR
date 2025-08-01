import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const paymentSchema = z.object({
  amount: z.number().positive(),
  fineAmount: z.number().min(0).optional(),
  paymentDate: z.string()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; installmentId: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = paymentSchema.parse(body)

    // Verificar se a parcela pertence ao usuário
    const installment = await db.installment.findFirst({
      where: {
        id: params.installmentId,
        loanId: params.id,
        loan: {
          user: {
            email: session.user.email
          }
        }
      }
    })

    if (!installment) {
      return NextResponse.json(
        { error: 'Parcela não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar a parcela
    const updatedInstallment = await db.installment.update({
      where: { id: params.installmentId },
      data: {
        paidAmount: validatedData.amount,
        fineAmount: validatedData.fineAmount || 0,
        status: 'PAID',
        paidAt: new Date(validatedData.paymentDate)
      }
    })

    return NextResponse.json(updatedInstallment)
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}