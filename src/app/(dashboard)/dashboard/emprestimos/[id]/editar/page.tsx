'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Calculator, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { calculateLoanSimulation } from '@/lib/loan-calculations'
import type { LoanType } from '@/types/loan-simulation'

interface Customer {
  id: string
  nomeCompleto: string
  cpf: string
}

interface Periodicity {
  id: string
  name: string
}

interface Loan {
  id: string
  customerId: string
  totalAmount: number
  loanType: string
  interestRate: number
  periodicityId: string
  installments: number
  installmentValue: number
  nextPaymentDate: string
  transactionDate: string
  observation?: string | null
  customer: Customer
  periodicity: Periodicity
  installmentRecords?: Array<{
    id: string
    status: string
    paidAt: string | null
    installmentNumber: number
  }>
}

export default function EditarEmprestimoPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loan, setLoan] = useState<Loan | null>(null)
  const [periodicities, setPeriodicities] = useState<Periodicity[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const [formData, setFormData] = useState({
    totalAmount: '',
    loanType: 'PRICE',
    interestRate: '2.5',
    periodicityId: '',
    installments: '',
    nextPaymentDate: '',
    transactionDate: '',
    observation: ''
  })

  const [calculatedValues, setCalculatedValues] = useState({
    installmentValue: 0,
    totalAmount: 0,
    totalInterest: 0,
    effectiveRate: 0,
    showCalculation: false
  })
  
  // Estado para controlar se há parcelas pagas (restringe edições)
  const [hasPaidInstallments, setHasPaidInstallments] = useState(false)
  const [paidInstallmentsCount, setPaidInstallmentsCount] = useState(0)

  useEffect(() => {
    fetchLoan()
    fetchPeriodicities()
  }, [params.id])

  useEffect(() => {
    calculateInstallmentValue()
  }, [formData.totalAmount, formData.installments])

  const fetchLoan = async () => {
    try {
      const response = await fetch(`/api/loans/${params.id}`)
      if (response.ok) {
        const data: Loan = await response.json()
        setLoan(data)
        
        // Verificar se há parcelas pagas
        const paidInstallments = data.installmentRecords?.filter(
          inst => inst.status === 'PAID'
        ) || []
        setHasPaidInstallments(paidInstallments.length > 0)
        setPaidInstallmentsCount(paidInstallments.length)
        
        setFormData({
          totalAmount: data.totalAmount.toString(),
          loanType: data.loanType || 'PRICE',
          interestRate: data.interestRate?.toString() || '2.5',
          periodicityId: data.periodicityId,
          installments: data.installments.toString(),
          nextPaymentDate: data.nextPaymentDate.split('T')[0],
          transactionDate: data.transactionDate.split('T')[0],
          observation: data.observation || ''
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Empréstimo não encontrado',
          variant: 'destructive'
        })
        router.push('/dashboard/emprestimos')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar empréstimo',
        variant: 'destructive'
      })
    } finally {
      setInitialLoading(false)
    }
  }

  const fetchPeriodicities = async () => {
    try {
      const response = await fetch('/api/periodicities')
      if (response.ok) {
        const data = await response.json()
        setPeriodicities(data)
      }
    } catch (error) {
      console.error('Erro ao carregar periodicidades:', error)
    }
  }

  const calculateInstallmentValue = () => {
    const requestedAmount = parseFloat(formData.totalAmount) || 0
    const installments = parseInt(formData.installments) || 1
    const interestRate = parseFloat(formData.interestRate) || 0
    
    if (requestedAmount > 0 && installments > 0 && interestRate >= 0 && formData.periodicityId) {
      try {
        const simulation = calculateLoanSimulation({
          loanType: formData.loanType as LoanType,
          periodicityId: formData.periodicityId,
          requestedAmount,
          installments,
          interestRate
        })
        
        setCalculatedValues({
          installmentValue: simulation.installmentValue,
          totalAmount: simulation.totalAmount,
          totalInterest: simulation.totalInterest,
          effectiveRate: simulation.effectiveRate,
          showCalculation: true
        })
      } catch (error) {
        setCalculatedValues({
          installmentValue: 0,
          totalAmount: 0,
          totalInterest: 0,
          effectiveRate: 0,
          showCalculation: false
        })
      }
    } else {
      setCalculatedValues({
        installmentValue: 0,
        totalAmount: 0,
        totalInterest: 0,
        effectiveRate: 0,
        showCalculation: false
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`/api/loans/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          totalAmount: parseFloat(formData.totalAmount),
          loanType: formData.loanType,
          interestRate: parseFloat(formData.interestRate),
          installments: parseInt(formData.installments),
          installmentValue: calculatedValues.installmentValue,
          transactionDate: formData.transactionDate,
          observation: formData.observation
        })
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Empréstimo atualizado com sucesso'
        })
        router.push('/dashboard/emprestimos')
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao atualizar empréstimo',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar empréstimo',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!loan) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Empréstimo não encontrado</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/emprestimos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">Editar Empréstimo</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Empréstimo</CardTitle>
              {hasPaidInstallments && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Atenção - Edição Restrita</AlertTitle>
                  <AlertDescription>
                    Este empréstimo possui <strong>{paidInstallmentsCount} parcela(s) já paga(s)</strong>. 
                    Para manter a integridade dos dados, apenas observações e data do próximo pagamento podem ser alteradas.
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Cliente</Label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{loan.customer.nomeCompleto}</p>
                    <p className="text-sm text-gray-600">{loan.customer.cpf}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="transactionDate">
                    Data do Empréstimo *
                    {hasPaidInstallments && <span className="text-amber-600 text-xs ml-2">(Não editável)</span>}
                  </Label>
                  <Input
                    id="transactionDate"
                    type="date"
                    value={formData.transactionDate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      transactionDate: e.target.value 
                    }))}
                    disabled={hasPaidInstallments}
                    className={hasPaidInstallments ? "bg-gray-100 text-gray-500" : ""}
                    required
                  />
                  {!hasPaidInstallments && (
                    <p className="text-xs text-gray-500 mt-1">
                      Data em que o empréstimo foi realizado
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalAmount">
                      Valor Total *
                      {hasPaidInstallments && <span className="text-amber-600 text-xs ml-2">(Não editável)</span>}
                    </Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      step="0.01"
                      placeholder="1000.00"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        totalAmount: e.target.value 
                      }))}
                      disabled={hasPaidInstallments}
                      className={hasPaidInstallments ? "bg-gray-100 text-gray-500" : ""}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="loanType">
                      Tipo de Cobrança *
                      {hasPaidInstallments && <span className="text-amber-600 text-xs ml-2">(Não editável)</span>}
                    </Label>
                    <Select 
                      value={formData.loanType} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        loanType: value
                      }))}
                      disabled={hasPaidInstallments}
                    >
                      <SelectTrigger className={hasPaidInstallments ? "bg-gray-100 text-gray-500" : ""}>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRICE">PRICE - Prestações Fixas</SelectItem>
                        <SelectItem value="SAC">SAC - Sistema de Amortização Constante</SelectItem>
                        <SelectItem value="SIMPLE_INTEREST">Juros Simples</SelectItem>
                        <SelectItem value="RECURRING_SIMPLE_INTEREST">Juros Simples Recorrente</SelectItem>
                        <SelectItem value="INTEREST_ONLY">Apenas Juros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="interestRate">
                      Taxa de Juros (% ao mês) *
                      {hasPaidInstallments && <span className="text-amber-600 text-xs ml-2">(Não editável)</span>}
                    </Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="2.50"
                      value={formData.interestRate}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        interestRate: e.target.value 
                      }))}
                      disabled={hasPaidInstallments}
                      className={hasPaidInstallments ? "bg-gray-100 text-gray-500" : ""}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="periodicityId">
                      Periodicidade *
                      {hasPaidInstallments && <span className="text-amber-600 text-xs ml-2">(Não editável)</span>}
                    </Label>
                    <Select
                      value={formData.periodicityId}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        periodicityId: value 
                      }))}
                      disabled={hasPaidInstallments}
                    >
                      <SelectTrigger className={hasPaidInstallments ? "bg-gray-100 text-gray-500" : ""}>
                        <SelectValue placeholder="Selecione a periodicidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodicities.map((periodicity) => (
                          <SelectItem key={periodicity.id} value={periodicity.id}>
                            {periodicity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="installments">
                      Quantidade de Parcelas *
                      {hasPaidInstallments && <span className="text-amber-600 text-xs ml-2">(Não editável)</span>}
                    </Label>
                    <Input
                      id="installments"
                      type="number"
                      min="1"
                      placeholder="12"
                      value={formData.installments}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        installments: e.target.value 
                      }))}
                      disabled={hasPaidInstallments}
                      className={hasPaidInstallments ? "bg-gray-100 text-gray-500" : ""}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="nextPaymentDate">Próxima Data de Pagamento *</Label>
                  <Input
                    id="nextPaymentDate"
                    type="date"
                    value={formData.nextPaymentDate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      nextPaymentDate: e.target.value 
                    }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="observation">Observação</Label>
                  <Textarea
                    id="observation"
                    placeholder="Adicione observações sobre este empréstimo (opcional)"
                    value={formData.observation}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      observation: e.target.value 
                    }))}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Campo opcional para anotações adicionais
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Cálculo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {calculatedValues.showCalculation ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Valor Total:</span>
                    <span className="font-medium">
                      R$ {parseFloat(formData.totalAmount || '0').toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parcelas:</span>
                    <span className="font-medium">{formData.installments}x</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Valor/Parcela:</span>
                    <span className="text-green-600">
                      R$ {calculatedValues.installmentValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center">
                  Preencha o valor total e quantidade de parcelas para ver o cálculo
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}