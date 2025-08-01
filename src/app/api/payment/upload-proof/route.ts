import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
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

    // Em um ambiente real, você processaria o upload do arquivo aqui
    // e salvaria o URL da imagem no banco de dados
    // Para este exemplo, vamos simular o processo

    // Simular URL do comprovante (em produção, seria o URL real do arquivo)
    const proofImageUrl = `https://example.com/proofs/${user.id}_${Date.now()}.jpg`

    // Criar um novo pagamento com o comprovante
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        amount: 100.00, // Valor fixo da mensalidade
        method: "PIX",
        status: "PENDING",
        description: "Mensalidade TaPago",
        proofImage: proofImageUrl,
      }
    })

    // Atualizar o status do usuário para PENDING_APPROVAL
    if (user.status === "PENDING_PAYMENT") {
      await db.user.update({
        where: { id: user.id },
        data: { status: "PENDING_APPROVAL" }
      })
    }

    return NextResponse.json({
      success: true,
      message: "Comprovante enviado com sucesso",
      paymentId: payment.id
    })

  } catch (error) {
    console.error("Erro ao enviar comprovante:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}