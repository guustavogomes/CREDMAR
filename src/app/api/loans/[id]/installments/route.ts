import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

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

    return NextResponse.json(installments)
  } catch (error) {
    console.error('Erro ao buscar parcelas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}