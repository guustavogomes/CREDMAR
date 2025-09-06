import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatBrazilDateToString } from '@/lib/timezone-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const loan = await db.loan.findFirst({
      where: {
        id: params.id,
        user: {
          email: session.user.email
        },
        deletedAt: null
      },
      include: {
        customer: true,
        periodicity: true
      }
    })

    if (!loan) {
      return NextResponse.json(
        { error: 'Empréstimo não encontrado' },
        { status: 404 }
      )
    }

    // Corrigir as datas usando timezone do Brasil
    const correctedLoan = {
      ...loan,
      transactionDate: formatBrazilDateToString(loan.transactionDate),
      nextPaymentDate: formatBrazilDateToString(loan.nextPaymentDate),
      createdAt: formatBrazilDateToString(loan.createdAt),
      updatedAt: formatBrazilDateToString(loan.updatedAt)
    }

    return NextResponse.json(correctedLoan)
  } catch (error) {
    console.error('Erro ao buscar empréstimo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = params

    // Verificar se o empréstimo existe e pertence ao usuário
    const loan = await db.loan.findFirst({
      where: {
        id,
        userId: session.user.id,
        deletedAt: null
      }
    })

    if (!loan) {
      return NextResponse.json(
        { error: 'Empréstimo não encontrado' },
        { status: 404 }
      )
    }

    // Soft delete - apenas marca como deletado
    await db.loan.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'CANCELLED'
      }
    })

    return NextResponse.json(
      { message: 'Empréstimo excluído com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao excluir empréstimo:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir empréstimo' },
      { status: 500 }
    )
  }
}