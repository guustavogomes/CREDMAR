import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('[ADMIN APPROVE] === APROVAÇÃO MANUAL POR ADMIN ===')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('[ADMIN APPROVE] ❌ Usuário não autorizado')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    if (session.user.email !== 'admin@tapago.com' && session.user.role !== 'ADMIN') {
      console.log('[ADMIN APPROVE] ❌ Usuário não é admin')
      return NextResponse.json(
        { error: 'Acesso negado - apenas administradores' },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    console.log('[ADMIN APPROVE] Aprovando usuário:', userId)
    console.log('[ADMIN APPROVE] Admin responsável:', session.user.email)

    // Verificar se o usuário existe
    const targetUser = await db.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      console.log('[ADMIN APPROVE] ❌ Usuário não encontrado')
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    console.log('[ADMIN APPROVE] Status atual do usuário:', targetUser.status)

    // Se já estiver ativo, retornar sucesso
    if (targetUser.status === 'ACTIVE') {
      console.log('[ADMIN APPROVE] ✅ Usuário já está ativo')
      return NextResponse.json({
        message: 'Usuário já está ativo',
        status: 'ACTIVE',
        alreadyActive: true
      })
    }

    // Buscar ou criar pagamento
    let payment = await db.payment.findFirst({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!payment) {
      console.log('[ADMIN APPROVE] Criando pagamento para aprovação manual...')
      payment = await db.payment.create({
        data: {
          userId: userId,
          amount: 29.90,
          method: 'PIX',
          status: 'PENDING',
          description: `APROVACAO MANUAL POR ADMIN - ${session.user.email}`
        }
      })
    }

    console.log('[ADMIN APPROVE] Pagamento ID:', payment.id)

    // Aprovar pagamento
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        transactionId: `ADMIN_APPROVAL_${Date.now()}`,
        method: 'PIX',
        description: `${payment.description} - APROVADO POR ${session.user.email}`
      }
    })

    // Ativar usuário
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        activatedAt: new Date()
      }
    })

    console.log('[ADMIN APPROVE] ✅ Usuário ativado com sucesso!')
    console.log('[ADMIN APPROVE] Usuário:', updatedUser.email)
    console.log('[ADMIN APPROVE] Novo status:', updatedUser.status)

    return NextResponse.json({
      message: 'Usuário aprovado com sucesso pelo administrador',
      userId: userId,
      userEmail: updatedUser.email,
      paymentId: payment.id,
      status: 'ACTIVE',
      approvedAt: new Date().toISOString(),
      approvedBy: session.user.email,
      method: 'PIX'
    })

  } catch (error) {
    console.error('[ADMIN APPROVE] ❌ ERRO CRÍTICO:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}