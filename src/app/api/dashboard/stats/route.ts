import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { DateTime } from 'luxon'

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


    // Criar datas simples sem conversão de timezone
    const now = new Date()
    
    // Início e fim do dia de hoje (00:00:00 e 23:59:59)
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)
    
    // Início e fim da semana
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()) // Domingo
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6) // Sábado
    endOfWeek.setHours(23, 59, 59, 999)
    
    // Início e fim do mês
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    endOfMonth.setHours(23, 59, 59, 999)
    
    // Debug logs
    console.log('Now:', now.toISOString())
    console.log('Start of today:', startOfToday.toISOString())
    console.log('End of today:', endOfToday.toISOString())

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
      dueDateFormatted: DateTime.fromJSDate(d.dueDate).toFormat('yyyy-MM-dd'),
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

    // Próximos vencimentos (próximos 7 dias)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    nextWeek.setHours(23, 59, 59, 999)
    
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

    // Função para formatar datas das parcelas SEM conversão de timezone
    const formatInstallmentDates = (installments: any[]) => {
      return installments.map(installment => {
        // As datas já estão corretas no banco, apenas formatar sem converter
        const dueDate = DateTime.fromJSDate(installment.dueDate).toFormat('yyyy-MM-dd')
        const paidAt = installment.paidAt ? DateTime.fromJSDate(installment.paidAt).toFormat('yyyy-MM-dd') : null
        const createdAt = DateTime.fromJSDate(installment.createdAt).toFormat('yyyy-MM-dd')
        
        return {
          ...installment,
          dueDate,
          paidAt,
          createdAt
        }
      })
    }

    // Filtrar apenas parcelas pendentes (não pagas) que vencem hoje
    const duesTodayPending = duesToday.filter(inst => inst.status === 'PENDING' || inst.status === 'OVERDUE')

    const stats = {
      duesToday: {
        count: duesTodayPending.length, // Apenas parcelas pendentes
        amount: duesTodayPending.reduce((sum: number, inst: any) => sum + inst.amount, 0),
        items: formatInstallmentDates(duesTodayPending)
      },
      duesThisWeek: {
        count: duesThisWeek.length,
        amount: duesThisWeek.reduce((sum: number, inst: any) => sum + inst.amount, 0),
        items: formatInstallmentDates(duesThisWeek)
      },
      duesThisMonth: {
        count: duesThisMonth.length,
        amount: duesThisMonth.reduce((sum: number, inst: any) => sum + inst.amount, 0),
        items: formatInstallmentDates(duesThisMonth)
      },
      overdue: {
        count: overdueInstallments.length,
        amount: overdueInstallments.reduce((sum: number, inst: any) => sum + inst.amount, 0),
        items: formatInstallmentDates(overdueInstallments)
      },
      totalReceivedThisMonth: totalReceivedThisMonth._sum.paidAmount || 0,
      activeLoans,
      uniqueCustomers: activeCustomers, // Mudado para contar todos os clientes ativos
      defaultRate: Math.round(defaultRate * 100) / 100,
      upcomingDues: formatInstallmentDates(upcomingDues)
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