import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { calculateSubscriptionInfo, getSubscriptionStatusMessage } from '@/lib/subscription-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar dados do usuário
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        status: true,
        subscriptionExpiresAt: true,
        lastPaymentDate: true,
        activatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Calcular informações da assinatura
    const subscriptionInfo = calculateSubscriptionInfo(
      user.subscriptionExpiresAt,
      user.lastPaymentDate
    )

    // Buscar último pagamento de assinatura
    const lastSubscriptionPayment = await db.payment.findFirst({
      where: {
        userId: user.id,
        isSubscriptionPayment: true,
        status: 'APPROVED'
      },
      orderBy: {
        approvedAt: 'desc'
      },
      select: {
        amount: true,
        approvedAt: true,
        subscriptionPeriod: true
      }
    })

    return NextResponse.json({
      user: {
        id: user.id,
        status: user.status,
        activatedAt: user.activatedAt
      },
      subscription: {
        ...subscriptionInfo,
        statusMessage: getSubscriptionStatusMessage(subscriptionInfo),
        lastPayment: lastSubscriptionPayment
      }
    })

  } catch (error) {
    console.error('Erro ao buscar status da assinatura:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
