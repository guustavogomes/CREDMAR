import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    // Buscar pagamento pelo ID
    const payment = await db.payment.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!payment) {
      return new NextResponse(JSON.stringify({ error: "Pagamento não encontrado" }), {
        status: 404,
      })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Erro ao buscar detalhes do pagamento:", error)
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
    })
  }
}