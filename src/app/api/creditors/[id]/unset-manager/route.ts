import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CreditorManagerService } from '@/lib/creditor-manager-service'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const creditorId = params.id

    try {
      await CreditorManagerService.unsetManager(creditorId, session.user.id)
      
      return NextResponse.json({ 
        success: true,
        message: 'Flag de gestor removida com sucesso'
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erro ao remover flag de gestor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}