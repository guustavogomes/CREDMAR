import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

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


    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

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
        loan: { userId: user.id },
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
        loan: { userId: user.id },
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
        loan: { userId: user.id },
        dueDate: { lt: startOfToday },
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

    // Próximos vencimentos (próximos 7 dias)
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    
    const upcomingDues = await db.installment.findMany({
      where: {
        loan: { userId: user.id },
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

    // Filtrar apenas parcelas pendentes (não pagas) que vencem hoje
    const duesTodayPending = duesToday.filter(inst => inst.status === 'PENDING' || inst.status === 'OVERDUE')

    const stats = {
      duesToday: {
        count: duesTodayPending.length, // Apenas parcelas pendentes
        amount: duesTodayPending.reduce((sum: number, inst: any) => sum + inst.amount, 0),
        items: duesTodayPending
      },
      duesThisWeek: {
        count: duesThisWeek.length,
        amount: duesThisWeek.reduce((sum: number, inst: any) => sum + inst.amount, 0),
        items: duesThisWeek
      },
      duesThisMonth: {
        count: duesThisMonth.length,
        amount: duesThisMonth.reduce((sum: number, inst: any) => sum + inst.amount, 0),
        items: duesThisMonth
      },
      overdue: {
        count: overdueInstallments.length,
        amount: overdueInstallments.reduce((sum: number, inst: any) => sum + inst.amount, 0),
        items: overdueInstallments
      },
      totalReceivedThisMonth: totalReceivedThisMonth._sum.paidAmount || 0,
      activeLoans,
      uniqueCustomers: uniqueCustomers.length,
      defaultRate: Math.round(defaultRate * 100) / 100,
      upcomingDues
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