import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// Prevent static generation
export const dynamic = 'force-dynamic'

export async function GET() {
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


    // Buscar estatísticas
    const pendingApproval = await db.user.count({
      where: { status: "PENDING_APPROVAL" },
    })

    const activeUsers = await db.user.count({
      where: { status: "ACTIVE" },
    })

    const suspendedUsers = await db.user.count({
      where: { status: "SUSPENDED" },
    })

    const suspendedUsers = await db.user.count({
      where: { status: "SUSPENDED" },
    })

    const stats = {
      pendingApproval,
      activeUsers,
      pendingPayments,
      suspendedUsers,
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Sempre buscar dados atualizados
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
    })
  }
}