import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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
    console.log("Usuários pendentes de aprovação:", pendingApproval)

    const activeUsers = await db.user.count({
      where: { status: "ACTIVE" },
    })
    console.log("Usuários ativos:", activeUsers)

    const pendingPayments = await db.user.count({
      where: { status: "PENDING_PAYMENT" },
    })
    console.log("Usuários pendentes de pagamento:", pendingPayments)

    const suspendedUsers = await db.user.count({
      where: { status: "SUSPENDED" },
    })
    console.log("Usuários suspensos:", suspendedUsers)

    return NextResponse.json({
      pendingApproval,
      activeUsers,
      pendingPayments,
      suspendedUsers,
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
    })
  }
}