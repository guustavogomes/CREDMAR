import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar o empréstimo
    const loan = await db.loan.findFirst({
      where: {
        id: params.id,
        user: {
          email: session.user.email
        }
      },
      include: {
        installmentRecords: true,
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

    // Verificar se já existem parcelas
    if (loan.installmentRecords.length === 0) {
      return NextResponse.json(
        { error: 'Este empréstimo não possui parcelas' },
        { status: 400 }
      )
    }

    // Calcular o valor total a ser quitado
    const totalAmount = loan.installmentRecords.reduce((sum, installment) => {
      return sum + installment.amount + installment.fineAmount
    }, 0)

    const totalPaid = loan.installmentRecords.reduce((sum, installment) => {
      return sum + installment.paidAmount
    }, 0)

    const remainingAmount = totalAmount - totalPaid

    // Quitar todas as parcelas pendentes
    const pendingInstallments = await db.installment.findMany({
      where: {
        loanId: params.id,
        status: {
          in: ['PENDING', 'OVERDUE']
        }
      }
    })

    // Atualizar cada parcela individualmente
    for (const installment of pendingInstallments) {
      await db.installment.update({
        where: { id: installment.id },
        data: {
          status: 'PAID',
          paidAmount: installment.amount + installment.fineAmount,
          paidAt: new Date()
        }
      })
    }

    // Marcar o empréstimo como concluído
    await db.loan.update({
      where: { id: params.id },
      data: {
        status: 'COMPLETED'
      }
    })

    return NextResponse.json({
      message: 'Empréstimo quitado com sucesso',
      totalAmount,
      totalPaid,
      remainingAmount,
      loan: {
        id: loan.id,
        customer: loan.customer,
        periodicity: loan.periodicity,
        totalAmount: loan.totalAmount,
        amountWithoutInterest: loan.amountWithoutInterest,
        installments: loan.installments,
        installmentValue: loan.installmentValue
      }
    })

  } catch (error) {
    console.error('Erro ao quitar empréstimo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
