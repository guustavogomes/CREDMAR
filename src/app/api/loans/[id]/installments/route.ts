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

          // Corrigir as datas - agora com TZ configurado globalmente
      const correctedInstallments = installments.map(installment => ({
        ...installment,
        dueDate: installment.dueDate.toISOString().split('T')[0], // Já está correto com TZ configurado
        paidAt: installment.paidAt ? installment.paidAt.toISOString().split('T')[0] : null,
        createdAt: installment.createdAt.toISOString().split('T')[0]
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