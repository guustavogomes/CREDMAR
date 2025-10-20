export type LoanType = 
  | 'PRICE'
  | 'SAC'
  | 'SIMPLE_INTEREST'
  | 'RECURRING_SIMPLE_INTEREST'
  | 'INTEREST_ONLY'

export interface LoanSimulationInput {
  loanType: LoanType
  periodicityId: string
  requestedAmount: number
  installments: number
  interestRate: number // Percentual
}

export interface InstallmentDetail {
  number: number
  dueDate: Date
  principalAmount: number
  interestAmount: number
  totalAmount: number
  remainingBalance: number
}

export interface LoanSimulationResult {
  totalAmount: number
  totalInterest: number
  installmentValue: number
  effectiveRate: number
  installments: InstallmentDetail[]
}

export interface Periodicity {
  id: string
  name: string
  description?: string
  intervalType: string
  intervalValue: number
}