import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// API temporária para aprovar usuário diretamente
export async function POST(request: NextRequest) {
  try {
   
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
     
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

   

    // Verificar status atual do usuário
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser) {
     
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

   

    if (currentUser.status === 'ACTIVE') {
     
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