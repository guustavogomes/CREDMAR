import { LoanType, LoanSimulationInput, LoanSimulationResult, InstallmentDetail } from '@/types/loan-simulation'

export function calculateLoanSimulation(input: LoanSimulationInput): LoanSimulationResult {
  const { loanType, requestedAmount, installments, interestRate } = input
  const monthlyRate = interestRate / 100

  switch (loanType) {
    case 'PRICE':
      return calculatePrice(requestedAmount, installments, monthlyRate)
    case 'SAC':
      return calculateSAC(requestedAmount, installments, monthlyRate)
    case 'SIMPLE_INTEREST':
      return calculateSimpleInterest(requestedAmount, installments, monthlyRate)
    case 'RECURRING_SIMPLE_INTEREST':
      return calculateRecurringSimpleInterest(requestedAmount, installments, monthlyRate)
    case 'INTEREST_ONLY':
      return calculateInterestOnly(requestedAmount, installments, monthlyRate)
    default:
      throw new Error('Tipo de empréstimo não suportado')
  }
}

// Sistema PRICE (Prestações fixas)
function calculatePrice(principal: number, installments: number, monthlyRate: number): LoanSimulationResult {
  const installmentValue = principal * (monthlyRate * Math.pow(1 + monthlyRate, installments)) / 
                          (Math.pow(1 + monthlyRate, installments) - 1)
  
  const details: InstallmentDetail[] = []
  let remainingBalance = principal
  
  for (let i = 1; i <= installments; i++) {
    const interestAmount = remainingBalance * monthlyRate
    const principalAmount = installmentValue - interestAmount
    remainingBalance -= principalAmount
    
    details.push({
      number: i,
      dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000), // Aproximação mensal
      principalAmount,
      interestAmount,
      totalAmount: installmentValue,
      remainingBalance: Math.max(0, remainingBalance)
    })
  }
  
  const totalAmount = installmentValue * installments
  const totalInterest = totalAmount - principal
  
  return {
    totalAmount,
    totalInterest,
    installmentValue,
    effectiveRate: (totalAmount / principal - 1) * 100,
    installments: details
  }
}

// Sistema SAC (Sistema de Amortização Constante)
function calculateSAC(principal: number, installments: number, monthlyRate: number): LoanSimulationResult {
  const principalAmortization = principal / installments
  const details: InstallmentDetail[] = []
  let remainingBalance = principal
  let totalAmount = 0
  
  for (let i = 1; i <= installments; i++) {
    const interestAmount = remainingBalance * monthlyRate
    const installmentValue = principalAmortization + interestAmount
    remainingBalance -= principalAmortization
    totalAmount += installmentValue
    
    details.push({
      number: i,
      dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
      principalAmount: principalAmortization,
      interestAmount,
      totalAmount: installmentValue,
      remainingBalance: Math.max(0, remainingBalance)
    })
  }
  
  const totalInterest = totalAmount - principal
  
  return {
    totalAmount,
    totalInterest,
    installmentValue: details[0].totalAmount, // Primeira parcela (maior)
    effectiveRate: (totalAmount / principal - 1) * 100,
    installments: details
  }
}

// Juros Simples
function calculateSimpleInterest(principal: number, installments: number, monthlyRate: number): LoanSimulationResult {
  const totalInterest = principal * monthlyRate * installments
  const totalAmount = principal + totalInterest
  const installmentValue = totalAmount / installments
  
  const details: InstallmentDetail[] = []
  
  for (let i = 1; i <= installments; i++) {
    details.push({
      number: i,
      dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
      principalAmount: principal / installments,
      interestAmount: totalInterest / installments,
      totalAmount: installmentValue,
      remainingBalance: principal - (principal / installments * i)
    })
  }
  
  return {
    totalAmount,
    totalInterest,
    installmentValue,
    effectiveRate: monthlyRate * installments * 100,
    installments: details
  }
}

// Juros Simples Recorrente
function calculateRecurringSimpleInterest(principal: number, installments: number, monthlyRate: number): LoanSimulationResult {
  const details: InstallmentDetail[] = []
  let remainingBalance = principal
  let totalAmount = 0
  
  for (let i = 1; i <= installments; i++) {
    const interestAmount = principal * monthlyRate // Juros sempre sobre o valor original
    const principalAmount = principal / installments
    const installmentValue = principalAmount + interestAmount
    remainingBalance -= principalAmount
    totalAmount += installmentValue
    
    details.push({
      number: i,
      dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
      principalAmount,
      interestAmount,
      totalAmount: installmentValue,
      remainingBalance: Math.max(0, remainingBalance)
    })
  }
  
  const totalInterest = totalAmount - principal
  
  return {
    totalAmount,
    totalInterest,
    installmentValue: details[0].totalAmount,
    effectiveRate: (totalAmount / principal - 1) * 100,
    installments: details
  }
}

// Só Juros (Capital no final)
function calculateInterestOnly(principal: number, installments: number, monthlyRate: number): LoanSimulationResult {
  const monthlyInterest = principal * monthlyRate
  const details: InstallmentDetail[] = []
  
  // Parcelas mensais só com juros
  for (let i = 1; i < installments; i++) {
    details.push({
      number: i,
      dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
      principalAmount: 0,
      interestAmount: monthlyInterest,
      totalAmount: monthlyInterest,
      remainingBalance: principal
    })
  }
  
  // Última parcela com capital + juros
  details.push({
    number: installments,
    dueDate: new Date(Date.now() + installments * 30 * 24 * 60 * 60 * 1000),
    principalAmount: principal,
    interestAmount: monthlyInterest,
    totalAmount: principal + monthlyInterest,
    remainingBalance: 0
  })
  
  const totalInterest = monthlyInterest * installments
  const totalAmount = principal + totalInterest
  
  return {
    totalAmount,
    totalInterest,
    installmentValue: monthlyInterest, // Valor das parcelas mensais
    effectiveRate: (totalAmount / principal - 1) * 100,
    installments: details
  }
}

export const loanTypeLabels: Record<LoanType, string> = {
  PRICE: 'PRICE - Prestações Fixas',
  SAC: 'SAC - Sistema de Amortização Constante',
  SIMPLE_INTEREST: 'Juros Simples',
  RECURRING_SIMPLE_INTEREST: 'Juros Simples Recorrente',
  INTEREST_ONLY: 'Só Juros - Capital no Final'
}