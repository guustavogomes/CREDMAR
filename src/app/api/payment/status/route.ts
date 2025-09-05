import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// Prevent static generation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Buscar usuário
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        payments: {
          where: {
            status: {
              in: ["PENDING", "APPROVED", "REJECTED"]
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const latestPayment = user.payments[0] || null

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        role: user.role
      },
      payment: latestPayment ? {
        id: latestPayment.id,
        status: latestPayment.status,
        amount: latestPayment.amount,
        method: latestPayment.method,
        description: latestPayment.description,
        createdAt: latestPayment.createdAt,
        updatedAt: latestPayment.updatedAt
      } : null,
      hasSubmittedProof: !!latestPayment
    })

  } catch (error) {
    console.error("Erro ao buscar status do pagamento:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}