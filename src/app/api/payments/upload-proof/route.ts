import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { writeFile } from "fs/promises"
import path from "path"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const formData = await request.formData()
  const paymentId = formData.get("paymentId") as string
  const file = formData.get("file") as File

  if (!paymentId || !file) {
    return NextResponse.json({ error: "Dados insuficientes" }, { status: 400 })
  }

  // Buscar pagamento e validar usuário
  const payment = await db.payment.findUnique({ where: { id: paymentId } })
  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
  }

  // Salvar arquivo localmente (ou usar storage externo se preferir)
  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = `${uuidv4()}_${file.name}`
  const uploadDir = path.join(process.cwd(), "public", "uploads", "proofs")
  await writeFile(path.join(uploadDir, fileName), buffer)
  const proofUrl = `/uploads/proofs/${fileName}`

  // Atualizar pagamento
  await db.payment.update({
    where: { id: paymentId },
    data: {
      proofImage: proofUrl,
      status: "PENDING",
      rejectedAt: null,
      rejectionReason: null
    }
  })

  return NextResponse.json({ success: true, proofImage: proofUrl })
}
