import { NextRequest, NextResponse } from 'next/server'
import { suspendExpiredSubscriptions, getUsersWithExpiringSubscriptions } from '@/lib/subscription-utils'

export async function POST(request: NextRequest) {
  try {
    // Verificar se é uma chamada autorizada (pode ser protegida com API key)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'default-cron-secret'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Suspender assinaturas expiradas
    const suspendedCount = await suspendExpiredSubscriptions()
    
    // Buscar usuários com assinatura expirando em breve (para notificações)
    const expiringUsers = await getUsersWithExpiringSubscriptions(7)

    return NextResponse.json({
      message: 'Processamento de assinaturas concluído',
      suspendedCount,
      expiringUsersCount: expiringUsers.length,
      expiringUsers: expiringUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        expiresAt: user.subscriptionExpiresAt
      }))
    })

  } catch (error) {
    console.error('Erro ao processar assinaturas expiradas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
