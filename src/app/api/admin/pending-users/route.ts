import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('[PENDING USERS] === BUSCANDO USUÁRIOS PENDENTES ===')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('[PENDING USERS] ❌ Usuário não autorizado')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é admin (ajuste conforme sua lógica)
    if (session.user.email !== 'admin@tapago.com' && session.user.role !== 'ADMIN') {
      console.log('[PENDING USERS] ❌ Usuário não é admin')
      return NextResponse.json(
        { error: 'Acesso negado - apenas administradores' },
        { status: 403 }
      )
    }

    console.log('[PENDING USERS] Buscando usuários pendentes...')

    // Buscar usuários com status PENDING
    const pendingUsers = await db.user.findMany({
      where: {
        status: 'PENDING_PAYMENT'
      },
      include: {
        payments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('[PENDING USERS] Encontrados:', pendingUsers.length, 'usuários')

    const formattedUsers = pendingUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      payments: user.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
        createdAt: payment.createdAt.toISOString()
      }))
    }))

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[PENDING USERS] ❌ ERRO:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}