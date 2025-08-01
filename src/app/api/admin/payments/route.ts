import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request) {
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

    // Obter parâmetros de consulta
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Construir a consulta
    let whereClause: any = {}
    
    if (status) {
      // Se o status for PENDING, incluir também pagamentos de usuários com status PENDING_APPROVAL
      if (status.toUpperCase() === "PENDING") {
        whereClause = {
          status: "PENDING",
          OR: [
            { user: { status: "PENDING_PAYMENT" } },
            { user: { status: "PENDING_APPROVAL" } }
          ]
        }
      } else {
        whereClause.status = status.toUpperCase()
      }
    }

    // Buscar pagamentos
    const payments = await db.payment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true, // Incluir o status do usuário na resposta
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error)
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
    })
  }
}