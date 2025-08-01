import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

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

    // Verificar se a parcela está paga
    if (installment.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Só é possível estornar parcelas que estão pagas' },
        { status: 400 }
      )
    }

    // Reverter o pagamento
    const updatedInstallment = await db.installment.update({
      where: { id: params.installmentId },
      data: {
        paidAmount: 0,
        status: 'PENDING',
        paidAt: null
        // Mantém a fineAmount caso tenha sido aplicada
      }
    })

    return NextResponse.json(updatedInstallment)
  } catch (error) {
    console.error('Erro ao estornar pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}