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

    // Calcular atrasos - incluindo histórico de parcelas já pagas que tiveram atraso
    const allDelays: number[] = []
    let totalDelayedInstallments = 0
    let totalDelayDays = 0
    let hasDelayOver5Days = false
    
    // Analisar TODAS as parcelas (pagas, pendentes e em atraso)
    allInstallments.forEach(inst => {
      let delayDays = 0
      
      if (inst.status === 'OVERDUE' || inst.status === 'PENDING') {
        // Parcelas ainda não pagas - calcular atraso até hoje
        const today = new Date()
        const dueDate = new Date(inst.dueDate)
        if (today > dueDate) {
          delayDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24))
        }
      } else if (inst.status === 'PAID' && inst.paidAt) {
        // Parcelas pagas - verificar se foram pagas com atraso
        const paidDate = new Date(inst.paidAt)
        const dueDate = new Date(inst.dueDate)
        if (paidDate > dueDate) {
          delayDays = Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24))
        }
      }
      
      if (delayDays > 0) {
        allDelays.push(delayDays)
        totalDelayedInstallments++
        totalDelayDays += delayDays
        
        // Verificar se tem atraso maior que 5 dias
        if (delayDays > 5) {
          hasDelayOver5Days = true
        }
      }
    })
    
    const overdueDetails = allInstallments
      .filter(inst => inst.status === 'OVERDUE')
      .map(inst => {
        const daysDiff = Math.floor((new Date().getTime() - new Date(inst.dueDate).getTime()) / (1000 * 3600 * 24))
        return daysDiff
      })

    const averageDelayDays = allDelays.length > 0 
      ? Math.round(allDelays.reduce((sum, days) => sum + days, 0) / allDelays.length)
      : 0

    // Calcular score (0-1000)
    let score = 1000 // Começar com score máximo

    // PENALIDADE SEVERA: Se teve algum atraso maior que 5 dias, perde 500 pontos imediatamente
    if (hasDelayOver5Days) {
      score -= 500 // -500 pontos por ter atrasado mais de 5 dias
    }
    
    // Penalidades adicionais
    if (overdueInstallments > 0) {
      score -= (overdueInstallments * 50) // -50 pontos por parcela em atraso atualmente
    }
    
    // Penalidade por CADA parcela que já atrasou (histórico perpétuo)
    if (totalDelayedInstallments > 0) {
      score -= (totalDelayedInstallments * 30) // -30 pontos por cada parcela que já atrasou
    }
    
    if (cancelledLoans > 0) {
      score -= (cancelledLoans * 100) // -100 pontos por empréstimo cancelado
    }

    if (averageDelayDays > 0) {
      score -= (averageDelayDays * 10) // -10 pontos por dia médio de atraso
    }

    // Bonificações - Cliente PODE recuperar o score com bom comportamento
    if (completedLoans > 0) {
      score += (completedLoans * 30) // +30 pontos por empréstimo concluído
    }

    if (totalInstallments > 0) {
      const paymentRate = (paidInstallments / totalInstallments) * 100
      if (paymentRate > 95) {
        score += 100 // +100 pontos por excelente taxa de pagamento
      } else if (paymentRate > 90) {
        score += 50 // +50 pontos por boa taxa de pagamento
      } else if (paymentRate > 80) {
        score += 25 // +25 pontos por taxa de pagamento razoável
      }
    }
    
    // Bônus adicional por recuperação - se tinha atrasos mas melhorou
    if (totalDelayedInstallments > 0 && overdueInstallments === 0) {
      // Cliente tinha atrasos mas atualmente está em dia
      score += 50 // +50 pontos por estar em dia atualmente
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
        paymentRate: totalInstallments > 0 ? Math.round((paidInstallments / totalInstallments) * 100) : 0,
        // NOVOS CAMPOS - Histórico perpétuo de atrasos
        totalDelayedInstallments, // Total de parcelas que já atrasaram (perpétuo)
        totalDelayDays, // Total de dias de atraso acumulados (perpétuo)
        hasDelayOver5Days, // Se já teve atraso maior que 5 dias
        maxDelayDays: allDelays.length > 0 ? Math.max(...allDelays) : 0 // Maior atraso já registrado
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