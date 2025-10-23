import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { DateTime } from 'luxon'

export const dynamic = 'force-dynamic'

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
    
    // Criar strings de data para comparação simples
    const now = new Date()
    const brazilToday = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    
    const todayString = `${brazilToday.getFullYear()}-${String(brazilToday.getMonth() + 1).padStart(2, '0')}-${String(brazilToday.getDate()).padStart(2, '0')}`
    
    const tomorrowDate = new Date(brazilToday)
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    const tomorrowString = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`
    
    const in3DaysDate = new Date(brazilToday)
    in3DaysDate.setDate(in3DaysDate.getDate() + 3)
    const in3DaysString = `${in3DaysDate.getFullYear()}-${String(in3DaysDate.getMonth() + 1).padStart(2, '0')}-${String(in3DaysDate.getDate()).padStart(2, '0')}`
    
    const in7DaysDate = new Date(brazilToday)
    in7DaysDate.setDate(in7DaysDate.getDate() + 7)
    const in7DaysString = `${in7DaysDate.getFullYear()}-${String(in7DaysDate.getMonth() + 1).padStart(2, '0')}-${String(in7DaysDate.getDate()).padStart(2, '0')}`

    // Buscar todas as parcelas ativas para filtrar por data
    const allInstallments = await db.installment.findMany({
      where: {
        loan: { 
          userId: user.id,
          status: 'ACTIVE',
          deletedAt: null
        },
        status: { in: ['PENDING', 'OVERDUE'] }
      }
    })
    
    // 1. Vencimentos de hoje
    const duesToday = allInstallments.filter(installment => {
      const dueDate = DateTime.fromJSDate(installment.dueDate, { zone: 'UTC' }).toFormat('yyyy-MM-dd')
      return dueDate === todayString
    }).length

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
    const duesTomorrow = allInstallments.filter(installment => {
      const dueDate = DateTime.fromJSDate(installment.dueDate, { zone: 'UTC' }).toFormat('yyyy-MM-dd')
      return dueDate === tomorrowString
    }).length

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

    // 3. Parcelas em atraso (data anterior a hoje)
    const overdue = allInstallments.filter(installment => {
      const dueDate = DateTime.fromJSDate(installment.dueDate, { zone: 'UTC' }).toFormat('yyyy-MM-dd')
      return dueDate < todayString
    }).length

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

    // 4. Vencimentos nos próximos 3 dias (dia 2 e dia 3)
    const duesIn3Days = allInstallments.filter(installment => {
      const dueDate = DateTime.fromJSDate(installment.dueDate, { zone: 'UTC' }).toFormat('yyyy-MM-dd')
      return dueDate > tomorrowString && dueDate <= in3DaysString
    }).length

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
    const loansWithInstallments = await db.loan.count({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        installmentRecords: {
          some: {}
        }
      }
    })
    
    const totalActiveLoans = await db.loan.count({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      }
    })
    
    const loansWithoutInstallments = totalActiveLoans - loansWithInstallments

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
    const isMonday = brazilToday.getDay() === 1
    if (isMonday) {
      const weeklyDues = allInstallments.filter(installment => {
        const dueDate = DateTime.fromJSDate(installment.dueDate, { zone: 'UTC' }).toFormat('yyyy-MM-dd')
        return dueDate >= todayString && dueDate <= in7DaysString
      }).length

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
    const customersWithActiveLoans = await db.customer.count({
      where: {
        user: { email: session.user.email },
        loans: {
          some: {
            status: 'ACTIVE'
          }
        }
      }
    })
    
    const totalCustomers = await db.customer.count({
      where: {
        user: { email: session.user.email }
      }
    })
    
    const customersWithoutActiveLoans = totalCustomers - customersWithActiveLoans

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