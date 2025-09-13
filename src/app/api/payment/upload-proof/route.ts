import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"


export async function POST(request: NextRequest) {
  try {
    
    const session = await getServerSession(authOptions)
    
    
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

    
    // Verificar se já existe um comprovante para este usuário
    const existingPayment = await db.payment.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ["PENDING", "APPROVED"] // Verificar se já tem pagamento pendente ou aprovado
        }
      }
    })


    if (existingPayment) {
      return NextResponse.json({
        error: "ALREADY_SUBMITTED",
        message: "Você já enviou um comprovante de pagamento. Aguarde a análise da nossa equipe.",
        existingPayment: {
          id: existingPayment.id,
          status: existingPayment.status,
          createdAt: existingPayment.createdAt
        }
      }, { status: 409 })
    }


    // Processar o arquivo enviado
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      )
    }


    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Use apenas JPG, PNG ou WebP." },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo 5MB." },
        { status: 400 }
      )
    }

    // Converter arquivo para base64 (Vercel não permite escrita no filesystem)
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64String = `data:${file.type};base64,${buffer.toString('base64')}`
    

    // Criar um novo pagamento com o comprovante
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        amount: 100.00, // Valor fixo da mensalidade
        method: "PIX",
        status: "PENDING",
        description: "Mensalidade TaPago",
        proofImage: base64String,
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