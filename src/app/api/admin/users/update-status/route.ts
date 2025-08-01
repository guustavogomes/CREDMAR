import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const session = await getServerSession()
    
    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
      })
    }
    
    if (session.user.role !== "ADMIN") {
      return new NextResponse(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
      })
    }

    // Obter dados do corpo da requisição
    const body = await request.json()
    const { userId, status } = body

    if (!userId || !status) {
      return new NextResponse(JSON.stringify({ error: "ID do usuário e status são obrigatórios" }), {
        status: 400,
      })
    }

    // Verificar se o status é válido
    const validStatuses = ["PENDING_PAYMENT", "PENDING_APPROVAL", "ACTIVE", "SUSPENDED"]
    if (!validStatuses.includes(status)) {
      return new NextResponse(JSON.stringify({ error: "Status inválido" }), {
        status: 400,
      })
    }

    // Atualizar o status do usuário
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Erro ao atualizar status do usuário:", error)
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
    })
  }
}