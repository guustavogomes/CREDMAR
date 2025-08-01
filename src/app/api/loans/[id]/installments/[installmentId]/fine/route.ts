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

    const { fineAmount, reason } = await request.json()

    if (!fineAmount || fineAmount <= 0) {
      return NextResponse.json(
        { error: 'Valor da multa deve ser maior que zero' },
        { status: 400 }
      )
    }

    // Verificar se o empréstimo pertence ao usuário
    const loan = await db.loan.findFirst({
      where: {
        id: params.id,
        user: {
          email: session.user.email
        }
      }
    })

    if (!loan) {
      return NextResponse.json(
        { error: 'Empréstimo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se a parcela existe e pertence ao empréstimo
    const installment = await db.installment.findFirst({
      where: {
        id: params.installmentId,
        loanId: params.id
      }
    })

    if (!installment) {
      return NextResponse.json(
        { error: 'Parcela não encontrada' },
        { status: 404 }
      )
    }

    if (installment.status === 'PAID') {
      return NextResponse.json(
        { error: 'Não é possível adicionar multa a uma parcela já paga' },
        { status: 400 }
      )
    }

    // Atualizar a parcela com a multa (somando ao valor existente)
    const updatedInstallment = await db.installment.update({
      where: { id: params.installmentId },
      data: {
        fineAmount: {
          increment: parseFloat(fineAmount) // Soma ao valor existente
        }
      }
    })

    return NextResponse.json({
      message: 'Multa adicionada com sucesso',
      installment: updatedInstallment
    })
  } catch (error) {
    console.error('Erro ao adicionar multa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}