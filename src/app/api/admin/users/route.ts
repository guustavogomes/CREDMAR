import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const session = await getServerSession(authOptions)
    
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

    // Obter parâmetros de filtro
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get("filter") || "all"
    console.log("Filtro aplicado:", filter)

    // Construir a consulta com base no filtro
    let whereClause = {}

    if (filter === "pending") {
      whereClause = { status: "PENDING_APPROVAL" }
    } else if (filter === "active") {
      whereClause = { status: "ACTIVE" }
    } else if (filter === "suspended") {
      whereClause = { status: "SUSPENDED" }
    } else if (filter === "pending_payment") {
      whereClause = { status: "PENDING_PAYMENT" }
    }

    console.log("Cláusula WHERE:", whereClause)

    // Buscar usuários
    const users = await db.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    console.log("Usuários encontrados:", users.length)
    console.log("Dados dos usuários:", users)

    return NextResponse.json(users)
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
    })
  }
}