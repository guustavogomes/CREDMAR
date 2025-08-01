'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Calculator } from 'lucide-react'
import Link from 'next/link'

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
  advanceAmount: number
  periodicityId: string
  installments: number
  installmentValue: number
  nextPaymentDate: string
  customer: Customer
  periodicity: Periodicity
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
    advanceAmount: '',
    periodicityId: '',
    installments: '',
    nextPaymentDate: ''
  })

  const [calculatedValues, setCalculatedValues] = useState({
    installmentValue: 0,
    showCalculation: false
  })

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
        setFormData({
          totalAmount: data.totalAmount.toString(),
          advanceAmount: data.advanceAmount.toString(),
          periodicityId: data.periodicityId,
          installments: data.installments.toString(),
          nextPaymentDate: data.nextPaymentDate.split('T')[0]
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
    const total = parseFloat(formData.totalAmount) || 0
    const installments = parseInt(formData.installments) || 1
    
    if (total > 0 && installments > 0) {
      const value = total / installments
      setCalculatedValues({
        installmentValue: value,
        showCalculation: true
      })
    } else {
      setCalculatedValues({
        installmentValue: 0,
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
          advanceAmount: parseFloat(formData.advanceAmount) || 0,
          installments: parseInt(formData.installments),
          installmentValue: calculatedValues.installmentValue
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalAmount">Valor Total *</Label>
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
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="advanceAmount">Valor Adiantado</Label>
                    <Input
                      id="advanceAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.advanceAmount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        advanceAmount: e.target.value 
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="periodicityId">Periodicidade *</Label>
                    <Select
                      value={formData.periodicityId}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        periodicityId: value 
                      }))}
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="installments">Quantidade de Parcelas *</Label>
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