import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    console.log("[UPLOAD PROOF] Iniciando processo de upload")
    
    const session = await getServerSession(authOptions)
    
    console.log("[UPLOAD PROOF] Sessão obtida:", {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userId: session?.user?.id
    })
    
    if (!session?.user?.email) {
      console.log("[UPLOAD PROOF] ERRO: Usuário não autenticado")
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Buscar usuário
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    console.log("[UPLOAD PROOF] Usuário encontrado:", {
      found: !!user,
      id: user?.id,
      email: user?.email,
      status: user?.status
    })

    if (!user) {
      console.log("[UPLOAD PROOF] ERRO: Usuário não encontrado no banco")
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    console.log(`[UPLOAD PROOF] Verificando pagamentos existentes para usuário ${user.email} (ID: ${user.id})`)
    
    // Verificar se já existe um comprovante para este usuário
    const existingPayment = await db.payment.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ["PENDING", "APPROVED"] // Verificar se já tem pagamento pendente ou aprovado
        }
      }
    })

    console.log(`[UPLOAD PROOF] Pagamento existente encontrado:`, existingPayment)

    if (existingPayment) {
      console.log(`[UPLOAD PROOF] BLOQUEANDO: Usuário ${user.email} já possui comprovante enviado (ID: ${existingPayment.id}, Status: ${existingPayment.status})`)
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

    console.log(`[UPLOAD PROOF] Processando novo comprovante para usuário ${user.email}`)

    // Processar o arquivo enviado
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("[UPLOAD PROOF] ERRO: Nenhum arquivo enviado")
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      )
    }

    console.log(`[UPLOAD PROOF] Arquivo recebido: ${file.name}, tamanho: ${file.size} bytes`)

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.log(`[UPLOAD PROOF] ERRO: Tipo de arquivo não permitido: ${file.type}`)
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Use apenas JPG, PNG ou WebP." },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.log(`[UPLOAD PROOF] ERRO: Arquivo muito grande: ${file.size} bytes`)
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo 5MB." },
        { status: 400 }
      )
    }

    // Salvar arquivo
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${uuidv4()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const uploadDir = path.join(process.cwd(), "public", "uploads", "proofs")
    
    // Garantir que o diretório existe
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      console.log(`[UPLOAD PROOF] Diretório já existe ou erro ao criar: ${error}`)
    }

    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, buffer)
    
    const proofImageUrl = `/uploads/proofs/${fileName}`
    console.log(`[UPLOAD PROOF] Arquivo salvo em: ${proofImageUrl}`)

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

    console.log(`[UPLOAD PROOF] Pagamento criado com ID: ${payment.id}`)

    // Atualizar o status do usuário para PENDING_APPROVAL
    if (user.status === "PENDING_PAYMENT") {
      await db.user.update({
        where: { id: user.id },
        data: { status: "PENDING_APPROVAL" }
      })
      console.log(`[UPLOAD PROOF] Status do usuário ${user.email} atualizado para PENDING_APPROVAL`)
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