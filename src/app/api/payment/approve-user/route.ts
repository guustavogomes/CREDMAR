import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// API temporária para aprovar usuário diretamente
export async function POST(request: NextRequest) {
  try {
    console.log('[APPROVE USER] === APROVAÇÃO DIRETA INICIADA ===')
    
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

    console.log('[APPROVE USER] Status atual:', currentUser.status)

    if (currentUser.status === 'ACTIVE') {
      console.log('[APPROVE USER] ✅ Usuário já está ativo')
      return NextResponse.json({
        message: 'Usuário já está ativo',
        status: 'ACTIVE'
      })
    }

    // Buscar ou criar pagamento pendente
    let payment = await db.payment.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!payment) {
      console.log('[APPROVE USER] Criando pagamento fictício...')
      // Criar pagamento fictício para manter consistência
      payment = await db.payment.create({
        data: {
          userId: session.user.id,
          amount: 0.01,
          method: 'PIX',
          status: 'PENDING',
          description: 'APROVACAO TEMPORARIA'
        }
      })
    }

    console.log('[APPROVE USER] Aprovando pagamento ID:', payment.id)

    // Aprovar pagamento
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        transactionId: `TEMP_APPROVAL_${Date.now()}`
      }
    })

    // Ativar usuário
    await db.user.update({
      where: { id: session.user.id },
      data: {
        status: 'ACTIVE',
        activatedAt: new Date()
      }
    })

    console.log('[APPROVE USER] ✅ Usuário ativado com sucesso!')

    return NextResponse.json({
      message: 'Usuário aprovado com sucesso',
      userId: session.user.id,
      paymentId: payment.id,
      status: 'ACTIVE',
      approvedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('[APPROVE USER] ❌ ERRO:', error)
    console.error('[APPROVE USER] Stack trace:', error instanceof Error ? error.stack : 'N/A')
    
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