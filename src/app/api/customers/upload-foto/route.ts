import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
      })
    }

    const formData = await request.formData()
    const file = formData.get('foto') as File
    const customerId = formData.get('customerId') as string

    if (!file) {
      return new NextResponse(JSON.stringify({ error: "Nenhum arquivo enviado" }), {
        status: 400,
      })
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return new NextResponse(JSON.stringify({ error: "Apenas imagens são permitidas" }), {
        status: 400,
      })
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new NextResponse(JSON.stringify({ error: "Arquivo muito grande. Máximo 5MB" }), {
        status: 400,
      })
    }

    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'customers')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const fileName = `${customerId}-${timestamp}.${extension}`
    const filePath = join(uploadDir, fileName)

    // Salvar arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Retornar URL da imagem
    const imageUrl = `/uploads/customers/${fileName}`

    return NextResponse.json({ 
      url: imageUrl,
      message: "Foto enviada com sucesso" 
    })

  } catch (error) {
    console.error("Erro no upload da foto:", error)
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
    })
  }
}