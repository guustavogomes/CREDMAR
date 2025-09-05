import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
      })
    }

    const { cpf } = await request.json()

    if (!cpf) {
      return new NextResponse(JSON.stringify({ error: "CPF é obrigatório" }), {
        status: 400,
      })
    }

    // Buscar todos os clientes com esse CPF (de todas as empresas)
    const customers = await db.customer.findMany({
      where: { cpf },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        loans: {
          include: {
            installmentRecords: {
              orderBy: {
                dueDate: 'asc'
              }
            }
          }
        }
      }
    })

    if (customers.length === 0) {
      return NextResponse.json({ 
        found: false, 
        message: "Cliente não encontrado na base de dados" 
      })
    }

    // Calcular estatísticas do score
    const primaryCustomer = customers[0] // Usar o primeiro registro como base
    const allLoans = customers.flatMap(c => c.loans)
    
    // Estatísticas gerais
    const totalLoans = allLoans.length
    const activeLoans = allLoans.filter(loan => loan.status === 'ACTIVE').length
    const completedLoans = allLoans.filter(loan => loan.status === 'COMPLETED').length
    const cancelledLoans = allLoans.filter(loan => loan.status === 'CANCELLED').length

    // Análise de pagamentos
    const allInstallments = allLoans.flatMap(loan => loan.installmentRecords)
    const totalInstallments = allInstallments.length
    const paidInstallments = allInstallments.filter(inst => inst.status === 'PAID').length
    const overdueInstallments = allInstallments.filter(inst => inst.status === 'OVERDUE').length
    const pendingInstallments = allInstallments.filter(inst => inst.status === 'PENDING').length

    // Calcular atrasos
    const overdueDetails = allInstallments
      .filter(inst => inst.status === 'OVERDUE')
      .map(inst => {
        const daysDiff = Math.floor((new Date().getTime() - new Date(inst.dueDate).getTime()) / (1000 * 3600 * 24))
        return daysDiff
      })

    const averageDelayDays = overdueDetails.length > 0 
      ? Math.round(overdueDetails.reduce((sum, days) => sum + days, 0) / overdueDetails.length)
      : 0

    // Calcular score (0-1000)
    let score = 1000 // Começar com score máximo

    // Penalidades
    if (overdueInstallments > 0) {
      score -= (overdueInstallments * 50) // -50 pontos por parcela em atraso
    }
    
    if (cancelledLoans > 0) {
      score -= (cancelledLoans * 100) // -100 pontos por empréstimo cancelado
    }

    if (averageDelayDays > 0) {
      score -= (averageDelayDays * 10) // -10 pontos por dia médio de atraso
    }

    // Bonificações
    if (completedLoans > 0) {
      score += (completedLoans * 25) // +25 pontos por empréstimo concluído
    }

    if (totalInstallments > 0) {
      const paymentRate = (paidInstallments / totalInstallments) * 100
      if (paymentRate > 90) score += 50 // Bônus para alta taxa de pagamento
    }

    // Garantir que o score fique entre 0 e 1000
    score = Math.max(0, Math.min(1000, score))

    // Classificação do score
    let scoreClass = 'EXCELENTE'
    let scoreColor = 'green'
    
    if (score < 300) {
      scoreClass = 'RUIM'
      scoreColor = 'red'
    } else if (score < 500) {
      scoreClass = 'REGULAR'
      scoreColor = 'orange'
    } else if (score < 700) {
      scoreClass = 'BOM'
      scoreColor = 'blue'
    }

    // Empresas que o cliente tem relacionamento
    const companies = customers.map(c => ({
      name: c.user.name,
      email: c.user.email,
      activeLoans: c.loans.filter(l => l.status === 'ACTIVE').length,
      totalLoans: c.loans.length
    }))

    const scoreData = {
      found: true,
      customer: {
        cpf: primaryCustomer.cpf,
        nomeCompleto: primaryCustomer.nomeCompleto,
        celular: primaryCustomer.celular,
        foto: primaryCustomer.foto,
        endereco: `${primaryCustomer.endereco}, ${primaryCustomer.bairro}, ${primaryCustomer.cidade}/${primaryCustomer.estado}`
      },
      score: {
        value: score,
        class: scoreClass,
        color: scoreColor
      },
      statistics: {
        totalLoans,
        activeLoans,
        completedLoans,
        cancelledLoans,
        totalInstallments,
        paidInstallments,
        overdueInstallments,
        pendingInstallments,
        averageDelayDays,
        paymentRate: totalInstallments > 0 ? Math.round((paidInstallments / totalInstallments) * 100) : 0
      },
      companies,
      riskAnalysis: {
        hasOverduePayments: overdueInstallments > 0,
        hasActiveLoans: activeLoans > 0,
        hasCancelledLoans: cancelledLoans > 0,
        averageDelayDays,
        recommendation: score > 700 ? 'BAIXO_RISCO' : score > 400 ? 'MEDIO_RISCO' : 'ALTO_RISCO'
      }
    }

    return NextResponse.json(scoreData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Sempre buscar dados atualizados
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error("Erro ao buscar score do cliente:", error)
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
    })
  }
}