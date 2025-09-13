import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Nenhuma sessão ativa encontrada',
        session: null
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sessão ativa encontrada',
      session: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      }
    })
    
  } catch (error) {
    console.error('Erro no teste de sessão:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro interno',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
