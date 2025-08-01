import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"

// Prevent static generation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Buscar usuário
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Buscar pagamentos do usuário
    const payments = await db.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Calcular estatísticas
    const stats = {
      totalReceived: payments
        .filter(p => p.status === 'APPROVED')
        .reduce((sum, p) => sum + p.amount, 0),
      totalPending: payments
        .filter(p => p.status === 'PENDING')
        .reduce((sum, p) => sum + p.amount, 0),
      totalRejected: payments
        .filter(p => p.status === 'REJECTED')
        .reduce((sum, p) => sum + p.amount, 0),
      totalPayments: payments.length
    }

    return NextResponse.json({
      success: true,
      payments: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        description: payment.description,
        createdAt: payment.createdAt.toISOString()
      })),
      stats
    })

  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}