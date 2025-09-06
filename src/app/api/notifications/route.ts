import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getBrazilStartOfDay, getBrazilEndOfDay, addBrazilDays } from '@/lib/timezone-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const notifications = []
    const today = getBrazilStartOfDay()
    const tomorrow = addBrazilDays(today, 1)
    const in3Days = addBrazilDays(today, 3)
    const in7Days = addBrazilDays(today, 7)

    // 1. Vencimentos de hoje
    const duesToday = await db.installment.count({
      where: {
        loan: { userId: user.id },
        dueDate: {
          gte: today,
          lt: getBrazilEndOfDay()
        },
        status: { in: ['PENDING', 'OVERDUE'] }
      }
    })

    if (duesToday > 0) {
      notifications.push({
        id: 'dues-today',
        type: 'urgent',
        icon: '🚨',
        title: 'Vencimentos Hoje',
        message: `${duesToday} parcela(s) vencem hoje`,
        action: '/dashboard/vencimentos/hoje',
        priority: 1
      })
    }

    // 2. Vencimentos amanhã
    const duesTomorrow = await db.installment.count({
      where: {
        loan: { userId: user.id },
        dueDate: {
          gte: tomorrow,
          lt: addBrazilDays(tomorrow, 1)
        },
        status: { in: ['PENDING', 'OVERDUE'] }
      }
    })

    if (duesTomorrow > 0) {
      notifications.push({
        id: 'dues-tomorrow',
        type: 'warning',
        icon: '⚠️',
        title: 'Vencimentos Amanhã',
        message: `${duesTomorrow} parcela(s) vencem amanhã`,
        action: '/dashboard/vencimentos/semana',
        priority: 2
      })
    }

    // 3. Parcelas em atraso
    const overdue = await db.installment.count({
      where: {
        loan: { userId: user.id },
        dueDate: { lt: today },
        status: { in: ['PENDING', 'OVERDUE'] }
      }
    })

    if (overdue > 0) {
      notifications.push({
        id: 'overdue',
        type: 'error',
        icon: '📅',
        title: 'Parcelas em Atraso',
        message: `${overdue} parcela(s) em atraso precisam de atenção`,
        action: '/dashboard/emprestimos',
        priority: 1
      })
    }

    // 4. Vencimentos nos próximos 3 dias
    const duesIn3Days = await db.installment.count({
      where: {
        loan: { userId: user.id },
        dueDate: {
          gte: addBrazilDays(today, 2),
          lt: in3Days
        },
        status: { in: ['PENDING', 'OVERDUE'] }
      }
    })

    if (duesIn3Days > 0) {
      notifications.push({
        id: 'dues-3days',
        type: 'info',
        icon: '📆',
        title: 'Próximos Vencimentos',
        message: `${duesIn3Days} parcela(s) vencem nos próximos 3 dias`,
        action: '/dashboard/vencimentos/semana',
        priority: 3
      })
    }

    // 5. Empréstimos sem parcelas (erro de sistema)
    const loansWithoutInstallments = await db.loan.count({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        installments: {
          none: {}
        }
      }
    })

    if (loansWithoutInstallments > 0) {
      notifications.push({
        id: 'loans-no-installments',
        type: 'error',
        icon: '🔧',
        title: 'Erro nos Empréstimos',
        message: `${loansWithoutInstallments} empréstimo(s) sem parcelas geradas`,
        action: '/dashboard/emprestimos',
        priority: 1
      })
    }

    // 6. Resumo semanal (apenas às segundas-feiras)
    const isMonday = today.getDay() === 1
    if (isMonday) {
      const weeklyDues = await db.installment.count({
        where: {
          loan: { userId: user.id },
          dueDate: {
            gte: today,
            lt: in7Days
          },
          status: { in: ['PENDING', 'OVERDUE'] }
        }
      })

      if (weeklyDues > 0) {
        notifications.push({
          id: 'weekly-summary',
          type: 'info',
          icon: '📊',
          title: 'Resumo da Semana',
          message: `${weeklyDues} parcela(s) vencem esta semana`,
          action: '/dashboard/vencimentos/semana',
          priority: 4
        })
      }
    }

    // 7. Clientes sem empréstimos ativos (possíveis novos empréstimos)
    const customersWithoutActiveLoans = await db.customer.count({
      where: {
        user: { email: session.user.email },
        loans: {
          none: {
            status: 'ACTIVE'
          }
        }
      }
    })

    if (customersWithoutActiveLoans > 3) {
      notifications.push({
        id: 'customers-no-loans',
        type: 'success',
        icon: '💰',
        title: 'Oportunidades',
        message: `${customersWithoutActiveLoans} clientes podem precisar de novos empréstimos`,
        action: '/dashboard/clientes',
        priority: 5
      })
    }

    // Ordenar por prioridade
    notifications.sort((a, b) => a.priority - b.priority)

    return NextResponse.json({
      notifications,
      total: notifications.length,
      unread: notifications.filter(n => n.priority <= 2).length
    })

  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}