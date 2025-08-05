import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    // Verificar autenticação e permissões
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    
    if (!session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Obter dados do corpo da requisição
    const { paymentId, status, rejectionReason } = await request.json()

    // Validar dados
    if (!paymentId || !status) {
      return new NextResponse(JSON.stringify({ error: "Dados inválidos" }), {
        status: 400,
      })
    }

    // Verificar se o status é válido
    const validStatuses = ["APPROVED", "REJECTED", "PENDING"]
    if (!validStatuses.includes(status)) {
      return new NextResponse(JSON.stringify({ error: "Status inválido" }), {
        status: 400,
      })
    }

    // Atualizar o pagamento
    const updateData: any = {
      status,
    }

    if (status === "APPROVED") {
      updateData.approvedBy = session.user.id
      updateData.approvedAt = new Date()
      
      // Verificar se o usuário está com status PENDING_PAYMENT
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: { user: true },
      })

      if (payment && (payment.user.status === "PENDING_PAYMENT" || payment.user.status === "PENDING_APPROVAL")) {
        // Atualizar o status do usuário para ACTIVE
        await db.user.update({
          where: { id: payment.userId },
          data: { status: "ACTIVE" },
        })
      }
    }

    if (status === "REJECTED") {
      updateData.rejectedAt = new Date()
      updateData.rejectionReason = rejectionReason || "Pagamento rejeitado pelo administrador"
    }

    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: updateData,
    })

    return NextResponse.json(updatedPayment)
  } catch (error) {
    console.error("Erro ao atualizar status do pagamento:", error)
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
    })
  }
}