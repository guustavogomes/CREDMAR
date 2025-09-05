import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generatePixQRCode } from '@/lib/pix'
import { z } from 'zod'

const pixRequestSchema = z.object({
  valor: z.number().min(0.01).max(10000),
  identificador: z.string().optional(),
  descricao: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = pixRequestSchema.parse(body)

    // Configurações PIX da empresa (você pode mover isso para variáveis de ambiente)
    const pixConfig = {
      chavePix: process.env.PIX_KEY || '12345678901', // Sua chave PIX
      nomeRecebedor: process.env.PIX_RECEIVER_NAME || 'TAPAGO SISTEMA',
      cidade: process.env.PIX_CITY || 'SAO PAULO',
    }

    // Gerar QR Code PIX
    const qrCodeDataURL = await generatePixQRCode({
      ...pixConfig,
      valor: validatedData.valor,
      identificador: validatedData.identificador || `PAG-${Date.now()}`,
      descricao: validatedData.descricao || 'Pagamento Tapago'
    })

    return NextResponse.json({
      qrCode: qrCodeDataURL,
      valor: validatedData.valor,
      chavePix: pixConfig.chavePix,
      nomeRecebedor: pixConfig.nomeRecebedor
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao gerar PIX:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}