"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowLeft, Phone, Mail, MapPin, TrendingUp, DollarSign } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDate as formatDateUtil } from "@/lib/date-utils"
import { getBrazilStartOfDay } from "@/lib/timezone-utils"

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

export default function VencimentosSemanaPage() {
  const [installments, setInstallments] = useState<InstallmentWithLoan[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchWeekDues()
  }, [])

  const fetchWeekDues = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setInstallments(data.duesThisWeek.items)
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

  const getDaysUntilDue = (dueDate: string) => {
    const today = getBrazilStartOfDay() // Usar timezone do Brasil
    const due = getBrazilStartOfDay(new Date(dueDate)) // Usar timezone do Brasil
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const totalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0)

  // Group by days until due
  const groupedInstallments = installments.reduce((groups, installment) => {
    const daysUntil = getDaysUntilDue(installment.dueDate)
    const key = daysUntil === 0 ? 'Hoje' : daysUntil === 1 ? 'Amanhã' : `${daysUntil} dias`
    if (!groups[key]) groups[key] = []
    groups[key].push(installment)
    return groups
  }, {} as Record<string, InstallmentWithLoan[]>)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Vencimentos da Semana</h1>
            <p className="text-slate-600 mt-1">
              {installments.length} parcelas vencem esta semana • {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          <TrendingUp className="h-5 w-5 text-amber-600" />
          <span className="text-amber-700 font-medium">Planejamento Semanal</span>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-amber-800">Resumo da Semana</CardTitle>
                <CardDescription className="text-amber-600">
                  Parcelas que vencem nos próximos 7 dias
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-amber-700">{installments.length}</div>
              <div className="text-sm text-amber-600">parcelas</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grouped Installments */}
      {installments.length === 0 ? (
        <Card className="border-0 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum vencimento esta semana!</h3>
            <p className="text-slate-500 max-w-md">
              Não há parcelas vencendo nos próximos 7 dias.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedInstallments).map(([period, periodInstallments]) => (
            <div key={period}>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                <span>{period}</span>
                <Badge variant="outline" className="border-amber-200 text-amber-700">
                  {periodInstallments.length} parcelas
                </Badge>
              </h2>
              
              <div className="grid gap-4">
                {periodInstallments.map((installment) => (
                  <Card key={installment.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <DollarSign className="h-6 w-6 text-white" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-xl font-bold text-slate-800">
                                {installment.loan.customer.nomeCompleto}
                              </h3>
                              <div className="flex items-center space-x-3">
                                <Badge variant="outline" className="border-amber-200 text-amber-700">
                                  {formatDate(installment.dueDate)}
                                </Badge>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-amber-700">
                                    {formatCurrency(installment.amount)}
                                  </div>
                                  {installment.fineAmount > 0 && (
                                    <div className="text-sm text-amber-600">
                                      + {formatCurrency(installment.fineAmount)} multa
                                    </div>
                                  )}
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
                                <span>Vencimento: {formatDate(installment.dueDate)}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Link href={`/dashboard/emprestimos/${installment.loan.id}/parcelas`}>
                                  <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                                    Ver Detalhes
                                  </Button>
                                </Link>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  Marcar como Pago
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}