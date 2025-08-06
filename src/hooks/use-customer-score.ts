"use client"

import { useState } from "react"

type CustomerScore = {
  found: boolean
  customer?: {
    cpf: string
    nomeCompleto: string
    celular: string
    foto?: string
    endereco: string
  }
  score?: {
    value: number
    class: string
    color: string
  }
  statistics?: {
    totalLoans: number
    activeLoans: number
    completedLoans: number
    cancelledLoans: number
    totalInstallments: number
    paidInstallments: number
    overdueInstallments: number
    pendingInstallments: number
    averageDelayDays: number
    paymentRate: number
  }
  companies?: Array<{
    name: string
    email: string
    activeLoans: number
    totalLoans: number
  }>
  riskAnalysis?: {
    hasOverduePayments: boolean
    hasActiveLoans: boolean
    hasCancelledLoans: boolean
    averageDelayDays: number
    recommendation: string
  }
}

export function useCustomerScore() {
  const [loading, setLoading] = useState(false)
  const [scoreData, setScoreData] = useState<CustomerScore | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchScore = async (cpf: string) => {
    if (!cpf || cpf.length < 11) {
      setScoreData(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/customers/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf }),
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar score do cliente')
      }

      const data = await response.json()
      setScoreData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setScoreData(null)
    } finally {
      setLoading(false)
    }
  }

  const clearScore = () => {
    setScoreData(null)
    setError(null)
  }

  return {
    loading,
    scoreData,
    error,
    fetchScore,
    clearScore
  }
}