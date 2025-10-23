import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { parseBrazilDateString, brazilDateTimeToDate } from '@/lib/brazil-date'
import { calculateLoanSimulation } from '@/lib/loan-calculations'
import type { LoanType } from '@/types/loan-simulation'

const paymentSchema = z.object({
  amount: z.number().positive(),
  fineAmount: z.number().min(0).optional(),
  paymentDate: z.string()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; installmentId: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = paymentSchema.parse(body)

    // Verificar se a parcela pertence ao usuário
    const installment = await db.installment.findFirst({
      where: {
        id: params.installmentId,
        loanId: params.id,
        loan: {
          user: {
            email: session.user.email
          }
        }
      }
    })

    if (!installment) {
      return NextResponse.json(
        { error: 'Parcela não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar a parcela
    const updatedInstallment = await db.installment.update({
      where: { id: params.installmentId },
      data: {
        paidAmount: validatedData.amount,
        fineAmount: validatedData.fineAmount || 0,
        status: 'PAID',
        paidAt: brazilDateTimeToDate(parseBrazilDateString(validatedData.paymentDate))
      },
      include: {
        loan: {
          include: {
            customer: {
              include: {
                route: true
              }
            },
            creditor: true,
            user: true
          }
        }
      }
    })

    // Buscar credor gestor
    const managerCreditor = await db.creditor.findFirst({
      where: {
        isManager: true,
        userId: updatedInstallment.loan.user.id
      }
    })

    // Lógica de distribuição de comissões
    const installmentAmount = updatedInstallment.amount
    const creditorReturn = installmentAmount * 0.5 // 50% retorna para o credor do empréstimo
    
    let principalAmount = 0
    let intermediatorCommission = 0
    let creditorCommission = 0
    let managerCommission = 0
    
    try {
      if (updatedInstallment.loan.loanType === 'SIMPLE_INTEREST' || updatedInstallment.loan.loanType === 'RECURRING_SIMPLE_INTEREST') {
        // JUROS SIMPLES: Comissão sobre a parcela (lógica dos 50%)
        const commissionPool = installmentAmount * 0.5
        let remainingCommission = commissionPool
        
        // Comissão do Intermediador
        if (updatedInstallment.loan.commission && updatedInstallment.loan.customer?.route) {
          intermediatorCommission = (installmentAmount * updatedInstallment.loan.commission) / 100
          remainingCommission -= intermediatorCommission
        }
        
        // Comissão do Credor
        if (updatedInstallment.loan.creditorCommission && updatedInstallment.loan.creditor) {
          creditorCommission = (installmentAmount * updatedInstallment.loan.creditorCommission) / 100
          remainingCommission -= creditorCommission
        }
        
        // Restante para o credor gestor
        managerCommission = remainingCommission
        
      } else {
        // OUTROS TIPOS: Ratear a taxa de juros entre as partes sobre o principal
        const simulation = calculateLoanSimulation({
          loanType: updatedInstallment.loan.loanType as LoanType,
          periodicityId: updatedInstallment.loan.periodicityId,
          requestedAmount: updatedInstallment.loan.totalAmount,
          installments: updatedInstallment.loan.installments,
          interestRate: updatedInstallment.loan.interestRate
        })
        
        // Encontrar a parcela correspondente na simulação
        const simulatedInstallment = simulation.installments.find(
          inst => inst.number === updatedInstallment.installmentNumber
        )
        
        if (simulatedInstallment) {
          principalAmount = simulatedInstallment.principalAmount
          
          // Usar as comissões informadas na tela e calcular o restante para o credor gestor
          const totalInterestRate = updatedInstallment.loan.interestRate
          const intermediatorRate = updatedInstallment.loan.commission || 0  // Comissão informada na tela
          const creditorRate = updatedInstallment.loan.creditorCommission || 0  // Comissão informada na tela
          const managerRate = totalInterestRate - intermediatorRate - creditorRate  // Restante dos juros
          
          // Aplicar as taxas sobre o principal
          if (updatedInstallment.loan.commission && updatedInstallment.loan.customer?.route) {
            intermediatorCommission = (principalAmount * intermediatorRate) / 100
          }
          
          if (updatedInstallment.loan.creditorCommission && updatedInstallment.loan.creditor) {
            creditorCommission = (principalAmount * creditorRate) / 100
          }
          
          if (managerRate > 0) {
            managerCommission = (principalAmount * managerRate) / 100
          }
        }
      }
      
      // 1. Comissão do Intermediador (se houver)
      if (intermediatorCommission > 0) {
        const creditorIdForDebit = managerCreditor?.id || updatedInstallment.loan.creditor?.id
        if (creditorIdForDebit) {
          // Lançar DÉBITO no fluxo de caixa para o intermediador
          await db.cashFlow.create({
            data: {
              creditorId: creditorIdForDebit,
            type: 'DEBIT',
            category: 'INTERMEDIATOR_COMMISSION',
            amount: intermediatorCommission,
            description: `Comissão intermediador (${updatedInstallment.loan.commission}%) - Parcela ${updatedInstallment.installmentNumber} - ${updatedInstallment.loan.customer?.nomeCompleto} - ${updatedInstallment.loan.customer?.route?.description} - Base: ${updatedInstallment.loan.loanType === 'SIMPLE_INTEREST' || updatedInstallment.loan.loanType === 'RECURRING_SIMPLE_INTEREST' ? 'Parcela' : 'Principal'}`,
            loanId: updatedInstallment.loan.id,
            installmentId: updatedInstallment.id,
            userId: updatedInstallment.loan.user.id
          }
        })
        }
      }

      // 2. Comissão do Credor (se houver)
      if (creditorCommission > 0 && updatedInstallment.loan.creditor) {
        // Lançar CRÉDITO no fluxo de caixa para o credor
        await db.cashFlow.create({
          data: {
            creditorId: updatedInstallment.loan.creditor.id,
            type: 'CREDIT',
            category: 'COMMISSION',
            amount: creditorCommission,
            description: `Comissão credor (${updatedInstallment.loan.creditorCommission}%) - Parcela ${updatedInstallment.installmentNumber} - ${updatedInstallment.loan.customer?.nomeCompleto} - Base: ${updatedInstallment.loan.loanType === 'SIMPLE_INTEREST' || updatedInstallment.loan.loanType === 'RECURRING_SIMPLE_INTEREST' ? 'Parcela' : 'Principal'}`,
            loanId: updatedInstallment.loan.id,
            installmentId: updatedInstallment.id,
            userId: updatedInstallment.loan.user.id
          }
        })
      }

      // 3. Comissão do credor gestor
      if (managerCommission > 0 && managerCreditor) {
        await db.cashFlow.create({
          data: {
            creditorId: managerCreditor.id,
            type: 'CREDIT',
            category: 'MANAGER_COMMISSION',
            amount: managerCommission,
            description: `Comissão gestor - Parcela ${updatedInstallment.installmentNumber} - ${updatedInstallment.loan.customer?.nomeCompleto} - Taxa: ${updatedInstallment.loan.loanType === 'SIMPLE_INTEREST' || updatedInstallment.loan.loanType === 'RECURRING_SIMPLE_INTEREST' ? 'Restante 50%' : `${updatedInstallment.loan.interestRate - (updatedInstallment.loan.commission || 0) - (updatedInstallment.loan.creditorCommission || 0)}%`}`,
            loanId: updatedInstallment.loan.id,
            installmentId: updatedInstallment.id,
            userId: updatedInstallment.loan.user.id
          }
        })
      }

      // 4. Retorno de 50% para o credor do empréstimo
      if (updatedInstallment.loan.creditor) {
        await db.cashFlow.create({
          data: {
            creditorId: updatedInstallment.loan.creditor.id,
            type: 'CREDIT',
            category: 'LOAN_RETURN',
            amount: creditorReturn,
            description: `Retorno empréstimo (50%) - Parcela ${updatedInstallment.installmentNumber} - ${updatedInstallment.loan.customer?.nomeCompleto}`,
            loanId: updatedInstallment.loan.id,
            installmentId: updatedInstallment.id,
            userId: updatedInstallment.loan.user.id
          }
        })
      }

    } catch (error) {
      console.error('Erro ao criar movimentações de comissão:', error)
      // Não bloqueia o pagamento, apenas loga o erro
    }

    return NextResponse.json(updatedInstallment)
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}