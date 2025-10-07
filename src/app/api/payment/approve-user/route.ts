import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// API para aprovar usuário diretamente (permite aprovação mesmo com pagamento pendente)
export async function POST(request: NextRequest) {
  try {
    console.log('[APPROVE USER] === APROVAÇÃO MANUAL INICIADA ===')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('[APPROVE USER] ❌ Usuário não autorizado')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.log('[APPROVE USER] Aprovando usuário:', session.user.email)

    // Verificar status atual do usuário
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser) {
      console.log('[APPROVE USER] ❌ Usuário não encontrado')
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    console.log('[APPROVE USER] Status atual do usuário:', currentUser.status)

    // Se já estiver ativo, retornar sucesso
    if (currentUser.status === 'ACTIVE') {
      console.log('[APPROVE USER] ✅ Usuário já está ativo')
      return NextResponse.json({
        message: 'Usuário já está ativo',
        status: 'ACTIVE',
        alreadyActive: true
      })
    }

    // Buscar pagamento pendente (qualquer status)
    let payment = await db.payment.findFirst({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Se não tiver pagamento, criar um para aprovação manual
    if (!payment) {
      console.log('[APPROVE USER] Criando pagamento para aprovação manual...')
      payment = await db.payment.create({
        data: {
          userId: session.user.id,
          amount: 29.90, // Valor real do sistema
          method: 'PIX',
          status: 'PENDING',
          description: 'APROVACAO MANUAL - WHATSAPP'
        }
      })
    }

    console.log('[APPROVE USER] Pagamento encontrado/criado:', {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      method: payment.method
    })

    // SEMPRE aprovar o pagamento, independente do status atual
    const updatedPayment = await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        transactionId: `MANUAL_APPROVAL_${Date.now()}`,
        method: 'PIX', // Usar PIX temporariamente
        description: payment.description + ' - APROVADO MANUALMENTE'
      }
    })

    console.log('[APPROVE USER] Pagamento aprovado:', updatedPayment.id)

    // SEMPRE ativar o usuário
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        status: 'ACTIVE',
        activatedAt: new Date()
      }
    })

    console.log('[APPROVE USER] ✅ Usuário ativado com sucesso!')
    console.log('[APPROVE USER] Novo status:', updatedUser.status)

    return NextResponse.json({
      message: 'Usuário aprovado com sucesso via aprovação manual',
      userId: session.user.id,
      paymentId: payment.id,
      status: 'ACTIVE',
      approvedAt: new Date().toISOString(),
      method: 'PIX',
      previousPaymentStatus: payment.status,
      newPaymentStatus: 'APPROVED'
    })

  } catch (error) {
    console.error('[APPROVE USER] ❌ ERRO CRÍTICO:', error)
    console.error('[APPROVE USER] Stack trace:', error instanceof Error ? error.stack : 'N/A')
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
        action: 'approve-user-manual'
      },
      { status: 500 }
    )
  }
}