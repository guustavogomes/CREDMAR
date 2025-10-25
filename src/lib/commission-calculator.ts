/**
 * Sistema de cálculo de comissões seguindo princípios SOLID
 */

import { calculateLoanSimulation } from '@/lib/loan-calculations'
import type { LoanType } from '@/types/loan-simulation'

// Interfaces
interface LoanData {
  id: string
  loanType: string
  totalAmount: number
  installments: number
  interestRate: number
  commission?: number
  creditorCommission?: number
  periodicityId: string
}

interface InstallmentData {
  id: string
  installmentNumber: number
  amount: number
}

interface CommissionResult {
  intermediatorCommission: number
  creditorCommission: number
  managerCommission: number
  creditorReturn: number
  calculationBase: number
  calculationMethod: string
}

// Classe base abstrata
abstract class CommissionCalculator {
  protected loan: LoanData
  protected installment: InstallmentData

  constructor(loan: LoanData, installment: InstallmentData) {
    this.loan = loan
    this.installment = installment
  }

  abstract calculate(): CommissionResult
}

// Calculadora para juros simples
class SimpleInterestCommissionCalculator extends CommissionCalculator {
  calculate(): CommissionResult {
    const installmentAmount = this.installment.amount
    const intermediatorRate = this.loan.commission || 0
    const creditorRate = this.loan.creditorCommission || 0
    const totalInterestRate = this.loan.interestRate
    const managerRate = totalInterestRate - intermediatorRate - creditorRate

    const calculationBase = installmentAmount

    const intermediatorCommission = (calculationBase * intermediatorRate) / 100
    const creditorCommission = (calculationBase * creditorRate) / 100
    const managerCommission = (calculationBase * managerRate) / 100
    const creditorReturn = installmentAmount - intermediatorCommission - creditorCommission - managerCommission

    console.log(`💰 JUROS SIMPLES - Base: R$ ${calculationBase.toFixed(2)} (Valor da Parcela)`)

    return {
      intermediatorCommission,
      creditorCommission,
      managerCommission,
      creditorReturn,
      calculationBase,
      calculationMethod: 'Valor da Parcela'
    }
  }
}

// Calculadora para SAC e outros tipos
class AmortizationCommissionCalculator extends CommissionCalculator {
  private getOriginalLoanAmount(): number {
    console.log(`🔍 Analisando totalAmount: R$ ${this.loan.totalAmount}`)
    
    // Para SAC/PRICE, o totalAmount geralmente é o valor emprestado
    // Vamos fazer uma simulação para confirmar
    const testSimulation = calculateLoanSimulation({
      loanType: this.loan.loanType as LoanType,
      periodicityId: this.loan.periodicityId,
      requestedAmount: this.loan.totalAmount,
      installments: this.loan.installments,
      interestRate: this.loan.interestRate
    })
    
    console.log(`   Simulação com totalAmount como input: R$ ${testSimulation.totalAmount.toFixed(2)}`)
    
    // Se a diferença for grande, totalAmount é o valor emprestado
    const difference = Math.abs(testSimulation.totalAmount - this.loan.totalAmount)
    console.log(`   Diferença: R$ ${difference.toFixed(2)}`)
    
    if (difference > 50) {
      console.log(`   ✅ totalAmount é o valor emprestado`)
      return this.loan.totalAmount
    }
    
    // Se não, calcular o valor principal através de busca binária
    console.log(`   🔄 Calculando valor principal...`)
    let min = this.loan.totalAmount * 0.6
    let max = this.loan.totalAmount * 0.9
    let best = this.loan.totalAmount * 0.74 // Aproximação inicial (1350 * 0.74 ≈ 1000)
    
    for (let i = 0; i < 15; i++) {
      const test = (min + max) / 2
      
      const sim = calculateLoanSimulation({
        loanType: this.loan.loanType as LoanType,
        periodicityId: this.loan.periodicityId,
        requestedAmount: test,
        installments: this.loan.installments,
        interestRate: this.loan.interestRate
      })
      
      const diff = sim.totalAmount - this.loan.totalAmount
      
      if (Math.abs(diff) < 1) {
        best = test
        break
      }
      
      if (diff > 0) {
        max = test
      } else {
        min = test
      }
      
      best = test
    }
    
    console.log(`   📊 Valor principal calculado: R$ ${best.toFixed(2)}`)
    return best
  }

  calculate(): CommissionResult {
    const originalLoanAmount = this.getOriginalLoanAmount()
    
    let calculationBase: number
    let calculationMethod: string
    
    if (this.installment.installmentNumber === 1) {
      // Primeira parcela: comissão sobre o valor emprestado
      calculationBase = originalLoanAmount
      calculationMethod = `Valor Empréstimo (R$ ${originalLoanAmount.toFixed(2)})`
      console.log(`📋 PRIMEIRA PARCELA - Base: R$ ${calculationBase.toFixed(2)}`)
    } else {
      // Demais parcelas: calcular saldo devedor
      const simulation = calculateLoanSimulation({
        loanType: this.loan.loanType as LoanType,
        periodicityId: this.loan.periodicityId,
        requestedAmount: originalLoanAmount,
        installments: this.loan.installments,
        interestRate: this.loan.interestRate
      })

      // Calcular amortização acumulada até a parcela anterior
      const previousInstallments = simulation.installments.filter(
        inst => inst.number < this.installment.installmentNumber
      )
      
      const totalAmortizationPaid = previousInstallments.reduce(
        (sum, inst) => sum + inst.principalAmount, 0
      )
      
      calculationBase = originalLoanAmount - totalAmortizationPaid
      calculationMethod = `Saldo Devedor (R$ ${calculationBase.toFixed(2)})`
      
      console.log(`📋 PARCELA ${this.installment.installmentNumber} - Amortização acumulada: R$ ${totalAmortizationPaid.toFixed(2)}`)
      console.log(`📋 PARCELA ${this.installment.installmentNumber} - Saldo devedor: R$ ${calculationBase.toFixed(2)}`)
    }

    // Calcular comissões
    const intermediatorRate = this.loan.commission || 0
    const creditorRate = this.loan.creditorCommission || 0
    const totalInterestRate = this.loan.interestRate
    const managerRate = totalInterestRate - intermediatorRate - creditorRate

    const intermediatorCommission = (calculationBase * intermediatorRate) / 100
    const creditorCommission = (calculationBase * creditorRate) / 100
    const managerCommission = (calculationBase * managerRate) / 100
    const creditorReturn = this.installment.amount - intermediatorCommission - creditorCommission - managerCommission

    console.log(`💰 Comissões calculadas sobre R$ ${calculationBase.toFixed(2)}:`)
    console.log(`   Intermediador (${intermediatorRate}%): R$ ${intermediatorCommission.toFixed(2)}`)
    console.log(`   Credor (${creditorRate}%): R$ ${creditorCommission.toFixed(2)}`)
    console.log(`   Gestor (${managerRate}%): R$ ${managerCommission.toFixed(2)}`)
    console.log(`   Retorno: R$ ${creditorReturn.toFixed(2)}`)

    return {
      intermediatorCommission,
      creditorCommission,
      managerCommission,
      creditorReturn,
      calculationBase,
      calculationMethod
    }
  }
}

// Factory
export class CommissionCalculatorFactory {
  static create(loan: LoanData, installment: InstallmentData): CommissionCalculator {
    const isSimpleInterest = loan.loanType === 'SIMPLE_INTEREST' || 
                            loan.loanType === 'RECURRING_SIMPLE_INTEREST'
    
    console.log(`🏭 Criando calculador para: ${loan.loanType} (${isSimpleInterest ? 'Juros Simples' : 'Amortização'})`)
    
    if (isSimpleInterest) {
      return new SimpleInterestCommissionCalculator(loan, installment)
    } else {
      return new AmortizationCommissionCalculator(loan, installment)
    }
  }
}

// Builder para movimentações
export interface CashFlowMovement {
  creditorId: string
  type: 'CREDIT' | 'DEBIT'
  category: string
  amount: number
  description: string
  loanId: string
  installmentId: string
  userId: string
}

export class CashFlowMovementBuilder {
  private loan: LoanData
  private installment: InstallmentData
  private commissionResult: CommissionResult
  private customerName: string
  private routeDescription?: string

  constructor(
    loan: LoanData, 
    installment: InstallmentData, 
    commissionResult: CommissionResult,
    customerName: string,
    routeDescription?: string
  ) {
    this.loan = loan
    this.installment = installment
    this.commissionResult = commissionResult
    this.customerName = customerName
    this.routeDescription = routeDescription
  }

  buildIntermediatorCommission(creditorId: string, userId: string): CashFlowMovement | null {
    if (this.commissionResult.intermediatorCommission <= 0) return null

    return {
      creditorId,
      type: 'DEBIT',
      category: 'INTERMEDIATOR_COMMISSION',
      amount: this.commissionResult.intermediatorCommission,
      description: `Comissão intermediador (${this.loan.commission}%) - Parcela ${this.installment.installmentNumber} - ${this.customerName}${this.routeDescription ? ` - ${this.routeDescription}` : ''} - Base: ${this.commissionResult.calculationMethod}`,
      loanId: this.loan.id,
      installmentId: this.installment.id,
      userId
    }
  }

  buildCreditorCommission(creditorId: string, userId: string): CashFlowMovement | null {
    if (this.commissionResult.creditorCommission <= 0) return null

    return {
      creditorId,
      type: 'CREDIT',
      category: 'COMMISSION',
      amount: this.commissionResult.creditorCommission,
      description: `Comissão credor (${this.loan.creditorCommission}%) - Parcela ${this.installment.installmentNumber} - ${this.customerName} - Base: ${this.commissionResult.calculationMethod}`,
      loanId: this.loan.id,
      installmentId: this.installment.id,
      userId
    }
  }

  buildManagerCommission(creditorId: string, userId: string): CashFlowMovement | null {
    if (this.commissionResult.managerCommission <= 0) return null

    const managerRate = this.loan.interestRate - (this.loan.commission || 0) - (this.loan.creditorCommission || 0)

    return {
      creditorId,
      type: 'CREDIT',
      category: 'MANAGER_COMMISSION',
      amount: this.commissionResult.managerCommission,
      description: `Comissão gestor (${managerRate.toFixed(2)}%) - Parcela ${this.installment.installmentNumber} - ${this.customerName} - Base: ${this.commissionResult.calculationMethod}`,
      loanId: this.loan.id,
      installmentId: this.installment.id,
      userId
    }
  }

  buildLoanReturn(creditorId: string, userId: string): CashFlowMovement {
    return {
      creditorId,
      type: 'CREDIT',
      category: 'LOAN_RETURN',
      amount: this.commissionResult.creditorReturn,
      description: `Retorno empréstimo - Parcela ${this.installment.installmentNumber} - ${this.customerName}`,
      loanId: this.loan.id,
      installmentId: this.installment.id,
      userId
    }
  }
}