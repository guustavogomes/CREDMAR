import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(request: NextRequest) {
  try {
    console.log('[ADMIN DELETE] === EXCLUSÃO DE USUÁRIO POR ADMIN ===')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('[ADMIN DELETE] ❌ Usuário não autorizado')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    if (session.user.email !== 'admin@tapago.com' && session.user.role !== 'ADMIN') {
      console.log('[ADMIN DELETE] ❌ Usuário não é admin')
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

    console.log('[ADMIN DELETE] Excluindo usuário:', userId)
    console.log('[ADMIN DELETE] Admin responsável:', session.user.email)

    // Verificar se o usuário existe
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      include: {
        payments: true,
        customers: true,
        loans: true,
        routes: true
      }
    })

    if (!targetUser) {
      console.log('[ADMIN DELETE] ❌ Usuário não encontrado')
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    console.log('[ADMIN DELETE] Usuário encontrado:', targetUser.email)
    console.log('[ADMIN DELETE] Dados relacionados:', {
      payments: targetUser.payments.length,
      customers: targetUser.customers.length,
      loans: targetUser.loans.length,
      routes: targetUser.routes.length
    })

    // Verificar se o usuário tem dados importantes (empréstimos ativos)
    const activeLoans = await db.loan.count({
      where: {
        userId: userId,
        status: 'ACTIVE',
        deletedAt: null
      }
    })

    if (activeLoans > 0) {
      console.log('[ADMIN DELETE] ❌ Usuário tem empréstimos ativos')
      return NextResponse.json(
        { 
          error: 'Não é possível excluir usuário com empréstimos ativos',
          activeLoans: activeLoans
        },
        { status: 400 }
      )
    }

    // Excluir usuário (cascade vai excluir dados relacionados)
    const deletedUser = await db.user.delete({
      where: { id: userId }
    })

    console.log('[ADMIN DELETE] ✅ Usuário excluído com sucesso!')
    console.log('[ADMIN DELETE] Email excluído:', deletedUser.email)

    return NextResponse.json({
      message: 'Usuário excluído com sucesso',
      deletedUserId: userId,
      deletedUserEmail: deletedUser.email,
      deletedAt: new Date().toISOString(),
      deletedBy: session.user.email,
      relatedDataDeleted: {
        payments: targetUser.payments.length,
        customers: targetUser.customers.length,
        loans: targetUser.loans.length,
        routes: targetUser.routes.length
      }
    })

  } catch (error) {
    console.error('[ADMIN DELETE] ❌ ERRO CRÍTICO:', error)
    
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