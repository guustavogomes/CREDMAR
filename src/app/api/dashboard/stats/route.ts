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

    // Criar strings para semana
    const startOfWeekDate = new Date(brazilToday)
    startOfWeekDate.setDate(startOfWeekDate.getDate() - startOfWeekDate.getDay()) // Domingo
    const startOfWeekString = `${startOfWeekDate.getFullYear()}-${String(startOfWeekDate.getMonth() + 1).padStart(2, '0')}-${String(startOfWeekDate.getDate()).padStart(2, '0')}`
    
    const endOfWeekDate = new Date(startOfWeekDate)
    endOfWeekDate.setDate(endOfWeekDate.getDate() + 6) // Sábado
    const endOfWeekString = `${endOfWeekDate.getFullYear()}-${String(endOfWeekDate.getMonth() + 1).padStart(2, '0')}-${String(endOfWeekDate.getDate()).padStart(2, '0')}`

    // Vencimentos da semana
    const duesThisWeek = allInstallments.filter(installment => {
      const dueDate = DateTime.fromJSDate(installment.dueDate, { zone: 'UTC' }).toFormat('yyyy-MM-dd')
      return dueDate >= startOfWeekString && dueDate <= endOfWeekString && ['PENDING', 'OVERDUE'].includes(installment.status)
    })

    // Criar strings para mês
    const startOfMonthDate = new Date(brazilToday.getFullYear(), brazilToday.getMonth(), 1)
    const startOfMonthString = `${startOfMonthDate.getFullYear()}-${String(startOfMonthDate.getMonth() + 1).padStart(2, '0')}-${String(startOfMonthDate.getDate()).padStart(2, '0')}`
    
    const endOfMonthDate = new Date(brazilToday.getFullYear(), brazilToday.getMonth() + 1, 0)
    const endOfMonthString = `${endOfMonthDate.getFullYear()}-${String(endOfMonthDate.getMonth() + 1).padStart(2, '0')}-${String(endOfMonthDate.getDate()).padStart(2, '0')}`

    // Vencimentos do mês
    const duesThisMonth = allInstallments.filter(installment => {
      const dueDate = DateTime.fromJSDate(installment.dueDate, { zone: 'UTC' }).toFormat('yyyy-MM-dd')
      return dueDate >= startOfMonthString && dueDate <= endOfMonthString && ['PENDING', 'OVERDUE'].includes(installment.status)
    })

    // Parcelas em atraso
    const overdueInstallments = allInstallments.filter(installment => {
      const dueDate = DateTime.fromJSDate(installment.dueDate, { zone: 'UTC' }).toFormat('yyyy-MM-dd')
      return dueDate < todayString && ['PENDING', 'OVERDUE'].includes(installment.status)
    })

    // Total recebido no mês - filtrar por data de pagamento
    const paidThisMonth = allInstallments.filter(installment => {
      if (installment.status !== 'PAID' || !installment.paidAt) return false
      const paidDate = DateTime.fromJSDate(installment.paidAt, { zone: 'UTC' }).toFormat('yyyy-MM-dd')
      return paidDate >= startOfMonthString && paidDate <= endOfMonthString
    })
    const totalReceivedThisMonth = paidThisMonth.reduce((sum, installment) => sum + installment.paidAmount, 0)

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
    const totalInstallments = allInstallments.length

    const overdueCount = overdueInstallments.length
    const defaultRate = totalInstallments > 0 ? (overdueCount / totalInstallments) * 100 : 0

    // Próximos vencimentos (próximos 7 dias)
    const next7DaysDate = new Date(brazilToday)
    next7DaysDate.setDate(next7DaysDate.getDate() + 7)
    const next7DaysString = `${next7DaysDate.getFullYear()}-${String(next7DaysDate.getMonth() + 1).padStart(2, '0')}-${String(next7DaysDate.getDate()).padStart(2, '0')}`
    
    const upcomingDues = allInstallments
      .filter(installment => {
        const dueDate = DateTime.fromJSDate(installment.dueDate, { zone: 'UTC' }).toFormat('yyyy-MM-dd')
        return dueDate > todayString && dueDate <= next7DaysString && installment.status === 'PENDING'
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 10)

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
      totalReceivedThisMonth: totalReceivedThisMonth,
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