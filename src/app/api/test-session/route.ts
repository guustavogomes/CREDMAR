import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TESTE DE SESSÃO ===')
    
    const session = await getServerSession(authOptions)
    console.log('Sessão encontrada:', !!session)
    console.log('User ID:', session?.user?.id)
    console.log('User email:', session?.user?.email)
    console.log('User name:', session?.user?.name)
    
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
