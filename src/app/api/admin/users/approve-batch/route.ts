import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { userIds } = await request.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "IDs de usuários são obrigatórios" }, { status: 400 })
    }

    // Aprovar usuários em lote
    const updatedUsers = await db.user.updateMany({
      where: {
        id: { in: userIds },
        status: "PENDING_APPROVAL"
      },
      data: {
        status: "ACTIVE"
      }
    })

    return NextResponse.json({ 
      message: `${updatedUsers.count} usuários aprovados com sucesso`,
      count: updatedUsers.count
    })
  } catch (error) {
    console.error("Erro ao aprovar usuários:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}