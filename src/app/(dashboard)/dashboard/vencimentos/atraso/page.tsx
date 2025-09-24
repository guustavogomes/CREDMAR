"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ArrowLeft, Phone, Mail, MapPin, TrendingDown, DollarSign } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDate as formatDateUtil } from "@/lib/date-utils"
import { getBrazilStartOfDay, parseBrazilDateString } from "@/lib/timezone-utils"

interface InstallmentWithLoan {
  id: string
  installmentNumber: number
  dueDate: string
  amount: number
  fineAmount: number
  status: string
  loan: {
    id: string
    customer: {
      id: string
      nomeCompleto: string
      celular: string
      endereco: string
      cidade: string
      estado: string
      bairro: string
    }
  }
}

export default function VencimentosAtrasoPage() {
  const [installments, setInstallments] = useState<InstallmentWithLoan[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchOverdueDues()
  }, [])

  const fetchOverdueDues = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setInstallments(data.overdue.items)
      }
    } catch (error) {
      console.error("Erro ao buscar vencimentos:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return formatDateUtil(dateString)
  }

  const handleApplyFine = async (installmentId: string, loanId: string) => {
    try {
      const fineAmount = prompt('Digite o valor da multa:')
      if (!fineAmount || isNaN(Number(fineAmount))) return

      const response = await fetch(`/api/loans/${loanId}/installments/${installmentId}/fine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fineAmount: parseFloat(fineAmount),
          reason: 'Atraso no pagamento'
        })
      })

      if (response.ok) {
        alert('Multa aplicada com sucesso!')
        fetchOverdueDues() // Recarregar dados
      } else {
        const error = await response.json()
        alert(`Erro ao aplicar multa: ${error.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao aplicar multa:', error)
      alert('Erro ao aplicar multa')
    }
  }

  const handleMarkAsPaid = async (installmentId: string, loanId: string, amount: number, fineAmount: number) => {
    try {
      const confirmPayment = confirm(`Confirmar pagamento de ${formatCurrency(amount + fineAmount)}?`)
      if (!confirmPayment) return

      const today = new Date().toISOString().split('T')[0]

      const response = await fetch(`/api/loans/${loanId}/installments/${installmentId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount + fineAmount,
          fineAmount: fineAmount,
          paymentDate: today
        })
      })

      if (response.ok) {
        alert('Pagamento registrado com sucesso!')
        fetchOverdueDues() // Recarregar dados
      } else {
        const error = await response.json()
        alert(`Erro ao registrar pagamento: ${error.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error)
      alert('Erro ao registrar pagamento')
    }
  }

  const getDaysOverdue = (dueDate: string) => {
    const today = getBrazilStartOfDay() // Usar timezone do Brasil
    const due = getBrazilStartOfDay(parseBrazilDateString(dueDate)) // Parse correto da data
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const totalAmount = installments.reduce((sum, inst) => sum + inst.amount + inst.fineAmount, 0)

  // Sort by days overdue (most overdue first)
  const sortedInstallments = [...installments].sort((a, b) => 
    getDaysOverdue(b.dueDate) - getDaysOverdue(a.dueDate)
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto px-4 lg:px-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start lg:items-center flex-col lg:flex-row lg:space-x-4 space-y-2 lg:space-y-0">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center space-x-2 self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Parcelas em Atraso</h1>
            <p className="text-slate-600 mt-1 text-sm lg:text-base">
              {installments.length} parcelas em atraso • {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 self-start lg:self-center">
          <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 text-red-600" />
          <span className="text-red-700 font-medium text-sm lg:text-base">Ação Urgente</span>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-red-50 via-red-50 to-red-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-red-800">Situação de Inadimplência</CardTitle>
                <CardDescription className="text-red-600">
                  Parcelas que já passaram do vencimento
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-700">{installments.length}</div>
              <div className="text-sm text-red-600">parcelas</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overdue Installments */}
      {installments.length === 0 ? (
        <Card className="border-0 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhuma parcela em atraso!</h3>
            <p className="text-slate-500 max-w-md">
              Parabéns! Todos os seus clientes estão em dia com os pagamentos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedInstallments.map((installment) => {
            const daysOverdue = getDaysOverdue(installment.dueDate)
            return (
              <Card key={installment.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group border-l-4 border-l-red-500 overflow-hidden">
                <CardContent className="p-4 lg:p-6 overflow-hidden">
                  {/* Mobile Layout */}
                  <div className="block lg:hidden w-full max-w-full">
                    <div className="flex items-start gap-3 mb-4 w-full">
                      <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 max-w-full">
                        <div className="flex items-start justify-between gap-2 mb-2 w-full">
                          <h3 className="text-lg font-bold text-slate-800 truncate flex-1 min-w-0">
                            {installment.loan.customer.nomeCompleto}
                          </h3>
                          <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 text-xs whitespace-nowrap flex-shrink-0">
                            {daysOverdue} dias
                          </Badge>
                        </div>
                        
                        <div className="text-xl font-bold text-red-700 mb-1">
                          {formatCurrency(installment.amount + installment.fineAmount)}
                        </div>
                        <div className="text-sm text-red-600 mb-3">
                          Principal: {formatCurrency(installment.amount)}
                          {installment.fineAmount > 0 && (
                            <span className="block">+ Multa: {formatCurrency(installment.fineAmount)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4 text-sm w-full max-w-full">
                      <div className="flex items-center gap-2 text-slate-600 w-full">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <a href={`tel:${installment.loan.customer.celular}`} className="text-blue-600 hover:underline truncate">
                          {installment.loan.customer.celular}
                        </a>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600 w-full">
                        <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span className="break-words flex-1 min-w-0">
                          {installment.loan.customer.endereco}, {installment.loan.customer.bairro} - {installment.loan.customer.cidade}/{installment.loan.customer.estado}
                        </span>
                      </div>
                      <div className="text-slate-500 w-full">
                        Parcela {installment.installmentNumber} • Venceu: {formatDate(installment.dueDate)}
                      </div>
                      <div className="text-red-600 font-medium w-full">
                        {daysOverdue} dias de atraso
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full max-w-full">
                      <Link href={`/dashboard/emprestimos/${installment.loan.id}/parcelas`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 max-w-full">
                          Ver Detalhes
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        className="w-full bg-orange-600 hover:bg-orange-700 max-w-full"
                        onClick={() => handleApplyFine(installment.id, installment.loan.id)}
                      >
                        Aplicar Multa
                      </Button>
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 max-w-full"
                        onClick={() => handleMarkAsPaid(installment.id, installment.loan.id, installment.amount, installment.fineAmount)}
                      >
                        Marcar como Pago
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:block">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <AlertTriangle className="h-6 w-6 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xl font-bold text-slate-800">
                              {installment.loan.customer.nomeCompleto}
                            </h3>
                            <div className="flex items-center space-x-3">
                              <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                                {daysOverdue} dias em atraso
                              </Badge>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-red-700">
                                  {formatCurrency(installment.amount + installment.fineAmount)}
                                </div>
                                <div className="text-sm text-red-600">
                                  Principal: {formatCurrency(installment.amount)}
                                  {installment.fineAmount > 0 && (
                                    <span> + Multa: {formatCurrency(installment.fineAmount)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center space-x-2 text-slate-600">
                              <Phone className="h-4 w-4" />
                              <span className="text-sm">{installment.loan.customer.celular}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-slate-600">
                              <MapPin className="h-4 w-4" />
                              <span className="text-sm">
                                {installment.loan.customer.endereco}, {installment.loan.customer.bairro} - {installment.loan.customer.cidade}/{installment.loan.customer.estado}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-slate-500">
                              <span>Parcela {installment.installmentNumber}</span>
                              <span>•</span>
                              <span>Venceu em: {formatDate(installment.dueDate)}</span>
                              <span>•</span>
                              <span className="text-red-600 font-medium">{daysOverdue} dias de atraso</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Link href={`/dashboard/emprestimos/${installment.loan.id}/parcelas`}>
                                <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                                  Ver Detalhes
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700"
                                onClick={() => handleApplyFine(installment.id, installment.loan.id)}
                              >
                                Aplicar Multa
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleMarkAsPaid(installment.id, installment.loan.id, installment.amount, installment.fineAmount)}
                              >
                                Marcar como Pago
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}