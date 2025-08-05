import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/admin/installments/proofs-pending
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar apenas parcelas que têm comprovante pendente de aprovação
    const installments = await db.installment.findMany({
      where: {
        proofImage: {
          not: null
        },
        proofStatus: 'PENDING'
      },
      include: {
        loan: { 
          include: { 
            customer: true 
          } 
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    return NextResponse.json(installments)
  } catch (error) {
    console.error('Erro ao buscar comprovantes pendentes:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
