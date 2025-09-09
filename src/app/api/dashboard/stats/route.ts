import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { 
  getBrazilStartOfDay, 
  getBrazilEndOfDay, 
  getBrazilStartOfWeek, 
  getBrazilEndOfWeek,
  getBrazilStartOfMonth,
  getBrazilEndOfMonth,
  formatBrazilDateToString,
  addBrazilDays
} from '@/lib/timezone-utils'
import { 
  getBrazilDateTime,
  getBrazilStartOfDay as luxonGetBrazilStartOfDay,
  getBrazilEndOfDay as luxonGetBrazilEndOfDay,
  brazilDateTimeToDate,
  formatBrazilDate
} from '@/lib/brazil-date'

// Prevent static generation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
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


    // Usar Luxon para maior precisão de timezone (Brasil)
    const now = getBrazilDateTime()
    const startOfToday = brazilDateTimeToDate(luxonGetBrazilStartOfDay(now))
    const endOfToday = brazilDateTimeToDate(luxonGetBrazilEndOfDay(now))
    const startOfWeek = brazilDateTimeToDate(now.startOf('week'))
    const endOfWeek = brazilDateTimeToDate(now.endOf('week'))
    const startOfMonth = brazilDateTimeToDate(now.startOf('month'))
    const endOfMonth = brazilDateTimeToDate(now.endOf('month'))

    // Vencimentos de hoje (todas as parcelas, independente do status)
    const duesToday = await db.installment.findMany({
      where: {
        loan: { userId: user.id },
        dueDate: {
          gte: startOfToday,
          lt: endOfToday
        }
      },
      include: {
        loan: {
          include: { customer: true }
        }
      }
    })

    // Vencimentos da semana
    const duesThisWeek = await db.installment.findMany({
      where: {
        loan: { 
          userId: user.id,
          status: 'ACTIVE' // Apenas empréstimos ativos
        },
        dueDate: {
          gte: startOfWeek,
          lt: endOfWeek
        },
        status: { in: ['PENDING', 'OVERDUE'] }
      },
      include: {
        loan: {
          include: { customer: true }
        }
      }
    })

    // Vencimentos do mês
    const duesThisMonth = await db.installment.findMany({
      where: {
        loan: { 
          userId: user.id,
          status: 'ACTIVE' // Apenas empréstimos ativos
        },
        dueDate: {
          gte: startOfMonth,
          lt: endOfMonth
        },
        status: { in: ['PENDING', 'OVERDUE'] }
      },
      include: {
        loan: {
          include: { customer: true }
        }
      }
    })

    // Parcelas em atraso
    const overdueInstallments = await db.installment.findMany({
      where: {
        loan: { 
          userId: user.id,
          status: 'ACTIVE' // Apenas empréstimos ativos
        },
        dueDate: { lt: startOfToday }, // Usar startOfToday que já está em UTC
        status: { in: ['PENDING', 'OVERDUE'] }
      },
      include: {
        loan: {
          include: { customer: true }
        }
      }
    })

    // Total recebido no mês
    const totalReceivedThisMonth = await db.installment.aggregate({
      where: {
        loan: { userId: user.id },
        status: 'PAID',
        paidAt: {
          gte: startOfMonth,
          lt: endOfMonth
        }
      },
      _sum: {
        paidAmount: true
      }
    })

    // Total de empréstimos ativos
    const activeLoans = await db.loan.count({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      }
    })

    // Clientes únicos
    const uniqueCustomers = await db.loan.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      },
      select: {
        customerId: true
      },
      distinct: ['customerId']
    })

    // Taxa de inadimplência
    const totalInstallments = await db.installment.count({
      where: {
        loan: { userId: user.id }
      }
    })

    const overdueCount = overdueInstallments.length
    const defaultRate = totalInstallments > 0 ? (overdueCount / totalInstallments) * 100 : 0

    // Próximos vencimentos (próximos 7 dias) usando Luxon
    const nextWeek = brazilDateTimeToDate(now.plus({ days: 7 }))
    
    const upcomingDues = await db.installment.findMany({
      where: {
        loan: { 
          userId: user.id,
          status: 'ACTIVE' // Apenas empréstimos ativos
        },
        dueDate: {
          gte: endOfToday,
          lt: nextWeek
        },
        status: { in: ['PENDING'] }
      },
      include: {
        loan: {
          include: { customer: true }
        }
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: 10
    })

    // Função para corrigir datas das parcelas usando Luxon
    const correctInstallmentDates = (installments: any[]) => {
      return installments.map(installment => ({
        ...installment,
        dueDate: installment.dueDate.toISOString().split('T')[0], // Já está correto com TZ configurado
        paidAt: installment.paidAt ? installment.paidAt.toISOString().split('T')[0] : null,
        createdAt: installment.createdAt.toISOString().split('T')[0]
      }))
    }

    // Filtrar apenas parcelas pendentes (não pagas) que vencem hoje
    const duesTodayPending = duesToday.filter(inst => inst.status === 'PENDING' || inst.status === 'OVERDUE')

    const stats = {
      duesToday: {
        count: duesTodayPending.length, // Apenas parcelas pendentes
        amount: duesTodayPending.reduce((sum: number, inst: any) => sum + inst.amount, 0),
        items: correctInstallmentDates(duesTodayPending)
      },
      duesThisWeek: {
        count: duesThisWeek.length,
        amount: duesThisWeek.reduce((sum: number, inst: any) => sum + inst.amount, 0),
        items: correctInstallmentDates(duesThisWeek)
      },
      duesThisMonth: {
        count: duesThisMonth.length,
        amount: duesThisMonth.reduce((sum: number, inst: any) => sum + inst.amount, 0),
        items: correctInstallmentDates(duesThisMonth)
      },
      overdue: {
        count: overdueInstallments.length,
        amount: overdueInstallments.reduce((sum: number, inst: any) => sum + inst.amount, 0),
        items: correctInstallmentDates(overdueInstallments)
      },
      totalReceivedThisMonth: totalReceivedThisMonth._sum.paidAmount || 0,
      activeLoans,
      uniqueCustomers: uniqueCustomers.length,
      defaultRate: Math.round(defaultRate * 100) / 100,
      upcomingDues: correctInstallmentDates(upcomingDues)
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Sempre buscar dados atualizados
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}