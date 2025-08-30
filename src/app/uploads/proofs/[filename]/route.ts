import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'proofs', filename)
    
    // Ler o arquivo
    const fileBuffer = await readFile(filePath)
    
    // Determinar o tipo de conteúdo baseado na extensão
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.svg':
        contentType = 'image/svg+xml'
        break
      case '.webp':
        contentType = 'image/webp'
        break
    }
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Erro ao servir arquivo:', error)
    return new NextResponse('Arquivo não encontrado', { status: 404 })
  }
}