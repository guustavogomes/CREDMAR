import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { 
  getBrazilDateTime,
  getBrazilStartOfDay,
  getBrazilEndOfDay,
  brazilDateTimeToDate,
  formatBrazilDate
} from '@/lib/brazil-date'
import { DateTime } from 'luxon'

const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

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


    // Usar apenas funções do Luxon para datas brasileiras
    const nowBrazil = getBrazilDateTime()
    
    // Usar as funções helper do brazil-date.ts
    const startOfTodayBrazil = getBrazilStartOfDay()
    const endOfTodayBrazil = getBrazilEndOfDay()
    
    // Converter para Date para usar no Prisma (já está em UTC)
    const startOfToday = brazilDateTimeToDate(startOfTodayBrazil)
    const endOfToday = brazilDateTimeToDate(endOfTodayBrazil)
    
    // Semana e mês usando Luxon
    const startOfWeekBrazil = nowBrazil.startOf('week')
    const endOfWeekBrazil = nowBrazil.endOf('week')
    const startOfMonthBrazil = nowBrazil.startOf('month')
    const endOfMonthBrazil = nowBrazil.endOf('month')
    
    const startOfWeek = brazilDateTimeToDate(startOfWeekBrazil)
    const endOfWeek = brazilDateTimeToDate(endOfWeekBrazil)
    const startOfMonth = brazilDateTimeToDate(startOfMonthBrazil)
    const endOfMonth = brazilDateTimeToDate(endOfMonthBrazil)
    
    // Debug logs
    console.log('Now (Brazil):', nowBrazil.toFormat('yyyy-MM-dd HH:mm:ss'))
    console.log('Start of today (Brazil):', startOfTodayBrazil.toFormat('yyyy-MM-dd HH:mm:ss'))
    console.log('End of today (Brazil):', endOfTodayBrazil.toFormat('yyyy-MM-dd HH:mm:ss'))
    console.log('Start of today (UTC for DB):', startOfToday.toISOString())
    console.log('End of today (UTC for DB):', endOfToday.toISOString())

    // Vencimentos de hoje (todas as parcelas, independente do status)
    const duesToday = await db.installment.findMany({
      where: {
        loan: { 
          userId: user.id,
          status: 'ACTIVE', // Apenas empréstimos ativos
          deletedAt: null // Excluir empréstimos deletados (soft delete)
        },
        dueDate: {
          gte: startOfToday,
          lte: endOfToday // Usar lte ao invés de lt para incluir até 23:59:59
        }
      },
      include: {
        loan: {
          include: { customer: true }
        }
      }
    })
    
    // Debug log
    console.log('Parcelas que vencem hoje (raw):', duesToday.map(d => ({
      id: d.id,
      dueDate: d.dueDate.toISOString(),
      dueDateBrazil: DateTime.fromJSDate(d.dueDate, { zone: 'UTC' }).setZone(BRAZIL_TIMEZONE).toFormat('yyyy-MM-dd'),
      status: d.status,
      customerName: d.loan.customer.nomeCompleto
    })))

    // Vencimentos da semana
    const duesThisWeek = await db.installment.findMany({
      where: {
        loan: { 
          userId: user.id,
          status: 'ACTIVE', // Apenas empréstimos ativos
          deletedAt: null // Excluir empréstimos deletados (soft delete)
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
          status: 'ACTIVE', // Apenas empréstimos ativos
          deletedAt: null // Excluir empréstimos deletados (soft delete)
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
          status: 'ACTIVE', // Apenas empréstimos ativos
          deletedAt: null // Excluir empréstimos deletados (soft delete)
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
        loan: { 
          userId: user.id,
          deletedAt: null // Excluir empréstimos deletados (soft delete)
        },
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
        status: 'ACTIVE',
        deletedAt: null // Excluir empréstimos deletados (soft delete)
      }
    })

    // Clientes ativos (todos os clientes cadastrados, não deletados)
    const activeCustomers = await db.customer.count({
      where: {
        userId: user.id,
        deletedAt: null // Excluir clientes deletados (soft delete)
      }
    })

    // Taxa de inadimplência
    const totalInstallments = await db.installment.count({
      where: {
        loan: { 
          userId: user.id,
          deletedAt: null // Excluir empréstimos deletados (soft delete)
        }
      }
    })

    const overdueCount = overdueInstallments.length
    const defaultRate = totalInstallments > 0 ? (overdueCount / totalInstallments) * 100 : 0

    // Próximos vencimentos (próximos 7 dias) usando Luxon
    const nextWeekBrazil = nowBrazil.plus({ days: 7 })
    const nextWeek = brazilDateTimeToDate(nextWeekBrazil)
    
    const upcomingDues = await db.installment.findMany({
      where: {
        loan: { 
          userId: user.id,
          status: 'ACTIVE', // Apenas empréstimos ativos
          deletedAt: null // Excluir empréstimos deletados (soft delete)
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
      return installments.map(installment => {
        // Converter a data UTC do banco para o timezone do Brasil
        const dueDateInBrazil = DateTime.fromJSDate(installment.dueDate, { zone: 'UTC' }).setZone(BRAZIL_TIMEZONE)
        const paidAtInBrazil = installment.paidAt ? DateTime.fromJSDate(installment.paidAt, { zone: 'UTC' }).setZone(BRAZIL_TIMEZONE) : null
        const createdAtInBrazil = DateTime.fromJSDate(installment.createdAt, { zone: 'UTC' }).setZone(BRAZIL_TIMEZONE)
        
        return {
          ...installment,
          dueDate: dueDateInBrazil.toFormat('yyyy-MM-dd'), // Formato da data no timezone do Brasil
          paidAt: paidAtInBrazil ? paidAtInBrazil.toFormat('yyyy-MM-dd') : null,
          createdAt: createdAtInBrazil.toFormat('yyyy-MM-dd')
        }
      })
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
      uniqueCustomers: activeCustomers, // Mudado para contar todos os clientes ativos
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