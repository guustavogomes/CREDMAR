import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { formatBrazilDateToString } from '@/lib/timezone-utils'

export async function GET(
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

    const installments = await db.installment.findMany({
      where: {
        loanId: params.id,
        loan: {
          user: {
            email: session.user.email
          }
        }
      },
      orderBy: {
        installmentNumber: 'asc'
      }
    })

          // Corrigir as datas usando timezone do Brasil
      const correctedInstallments = installments.map(installment => ({
        ...installment,
        dueDate: formatBrazilDateToString(installment.dueDate), // Converter para YYYY-MM-DD usando timezone do Brasil
        paidAt: installment.paidAt ? formatBrazilDateToString(installment.paidAt) : null,
        createdAt: formatBrazilDateToString(installment.createdAt)
      }))

    return NextResponse.json(correctedInstallments)
  } catch (error) {
    console.error('Erro ao buscar parcelas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}