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


    // Obter data atual no Brasil (sem horário)
    const now = new Date()
    const brazilToday = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    
    // Criar data de hoje como string para comparação direta
    const todayString = `${brazilToday.getFullYear()}-${String(brazilToday.getMonth() + 1).padStart(2, '0')}-${String(brazilToday.getDate()).padStart(2, '0')}`
    
    // Início e fim da semana em UTC
    const startOfWeek = new Date()
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay()) // Domingo
    startOfWeek.setUTCHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 6) // Sábado
    endOfWeek.setUTCHours(23, 59, 59, 999)
    
    // Início e fim do mês em UTC
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    startOfMonth.setUTCHours(0, 0, 0, 0)
    
    const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
    endOfMonth.setUTCHours(23, 59, 59, 999)
    
    // Debug logs
    console.log('Now:', now.toISOString())
    console.log('Brazil today string:', todayString)

    // Buscar todas as parcelas e filtrar por data no JavaScript
    const allInstallments = await db.installment.findMany({
      where: {
        loan: { 
          userId: user.id,
          status: 'ACTIVE',
          deletedAt: null
        }
      },
      include: {
        loan: {
          include: { customer: true }
        }
      }
    })
    
    // Filtrar por data exata
    const duesToday = allInstallments.filter(installment => {
      const dueDate = DateTime.fromJSDate(installment.dueDate, { zone: 'UTC' }).toFormat('yyyy-MM-dd')
      return dueDate === todayString
    })
    
    // Debug log
    console.log('Parcelas que vencem hoje (raw):', duesToday.map(d => ({
      id: d.id,
      dueDate: d.dueDate.toISOString(),
      dueDateFormatted: DateTime.fromJSDate(d.dueDate, { zone: 'UTC' }).toFormat('yyyy-MM-dd'),
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

    // Próximos vencimentos (próximos 7 dias) em UTC
    const nextWeek = new Date()
    nextWeek.setUTCDate(nextWeek.getUTCDate() + 7)
    nextWeek.setUTCHours(23, 59, 59, 999)
    
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
        // As datas já estão corretas no banco, formatar em UTC para manter a data correta
        const dueDate = DateTime.fromJSDate(installment.dueDate, { zone: 'UTC' }).toFormat('yyyy-MM-dd')
        const paidAt = installment.paidAt ? DateTime.fromJSDate(installment.paidAt, { zone: 'UTC' }).toFormat('yyyy-MM-dd') : null
        const createdAt = DateTime.fromJSDate(installment.createdAt, { zone: 'UTC' }).toFormat('yyyy-MM-dd')
        
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