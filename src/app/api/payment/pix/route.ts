import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { z } from "zod"

const pixPaymentSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = pixPaymentSchema.parse(body)

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

    // Gerar código PIX (simulado)
    const pixCode = generatePixCode(validatedData.amount, validatedData.description)
    const qrCodeData = `00020126580014br.gov.bcb.pix0136${user.id}0204${validatedData.description || 'Pagamento'}5303986540${validatedData.amount.toFixed(2)}5802BR5925${user.name}6009SAO PAULO62070503***6304`

    // Salvar pagamento no banco
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        amount: validatedData.amount,
        method: "PIX",
        status: "PENDING",
        description: validatedData.description,
        pixCode: pixCode,
      }
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      pixCode: pixCode,
      qrCodeData: qrCodeData,
      amount: validatedData.amount,
      description: validatedData.description
    })

  } catch (error) {
    console.error("Erro ao gerar PIX:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

function generatePixCode(amount: number, description?: string): string {
  // Simulação de geração de código PIX
  const timestamp = Date.now().toString()
  const randomStr = Math.random().toString(36).substring(2, 15)
  return `${timestamp}${randomStr}`.toUpperCase()
}