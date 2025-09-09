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


    // Usar Luxon para maior precisão de timezone (Brasil)
    const now = getBrazilDateTime()
    
    // Para comparar datas corretamente, precisamos considerar que o banco armazena em UTC
    // mas as datas são para o Brasil. Vamos criar o range correto:
    // Se hoje é 09/09 no Brasil, queremos parcelas cujo dueDate seja 09/09 às 00:00 UTC-3
    const todayString = now.toFormat('yyyy-MM-dd') // 2025-09-09
    const startOfToday = DateTime.fromISO(`${todayString}T00:00:00`, { zone: BRAZIL_TIMEZONE }).toUTC().toJSDate()
    const endOfToday = DateTime.fromISO(`${todayString}T23:59:59.999`, { zone: BRAZIL_TIMEZONE }).toUTC().toJSDate()
    
    const startOfWeek = now.startOf('week').toUTC().toJSDate()
    const endOfWeek = now.endOf('week').toUTC().toJSDate()
    const startOfMonth = now.startOf('month').toUTC().toJSDate()
    const endOfMonth = now.endOf('month').toUTC().toJSDate()

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
    const nextWeek = brazilDateTimeToDate(now.plus({ days: 7 }))
    
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