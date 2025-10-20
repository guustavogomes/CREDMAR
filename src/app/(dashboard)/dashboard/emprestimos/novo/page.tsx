'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Calculator, Search, X, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { getBrazilTodayString } from '@/lib/timezone-utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { calculateLoanSimulation } from '@/lib/loan-calculations'
import type { LoanType } from '@/types/loan-simulation'

interface Customer {
  id: string
  nomeCompleto: string
  cpf: string
  route?: {
    id: string
    description: string
  }
}

interface Periodicity {
  id: string
  name: string
  description?: string
}

export default function NovoEmprestimoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [periodicities, setPeriodicities] = useState<Periodicity[]>([])
  const [loading, setLoading] = useState(false)
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')

  const [formData, setFormData] = useState({
    customerId: '',
    totalAmount: '',
    loanType: 'PRICE' as const,
    interestRate: '2.5',
    periodicityId: '',
    installments: '',
    nextPaymentDate: '',
    startDate: getBrazilTodayString(), // Data atual do Brasil como padrão
    observation: '', // Campo de observação
    commission: '' // Campo de comissão em %
  })

  const [calculatedValues, setCalculatedValues] = useState({
    installmentValue: 0,
    totalAmount: 0,
    totalInterest: 0,
    effectiveRate: 0,
    showCalculation: false
  })
  const [isRenewal, setIsRenewal] = useState(false)

  // Filtrar clientes baseado na pesquisa
  const filteredCustomers = customers.filter(customer =>
    customer.nomeCompleto.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.cpf.includes(customerSearch)
  )

  const selectedCustomer = customers.find(c => c.id === formData.customerId)

  useEffect(() => {
    fetchCustomers()
    fetchPeriodicities()
    
    // Verificar se há dados de renovação na URL
    const renewalData = searchParams.get('data')
    if (renewalData) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(renewalData))
        if (decodedData.isRenewal) {
          setIsRenewal(true)
          setFormData({
            customerId: decodedData.customerId || '',
            totalAmount: decodedData.requestedAmount?.toString() || '',
            loanType: (decodedData.loanType as LoanType) || 'PRICE',
            interestRate: decodedData.interestRate?.toString() || '2.5',
            periodicityId: decodedData.periodicityId || '',
            installments: decodedData.installments?.toString() || '',
            nextPaymentDate: decodedData.nextPaymentDate || '',
            startDate: getBrazilTodayString(),
            observation: decodedData.observation || '',
            commission: decodedData.commission?.toString() || ''
          })
        }
      } catch (error) {
        console.error('Erro ao processar dados de renovação:', error)
      }
    } else {
      // Verificar se há um customerId na URL (comportamento original)
      const preSelectedCustomerId = searchParams.get('customerId')
      if (preSelectedCustomerId) {
        setFormData(prev => ({ ...prev, customerId: preSelectedCustomerId }))
      }
    }
  }, [searchParams])

  useEffect(() => {
    calculateInstallmentValue()
  }, [formData.totalAmount, formData.installments])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
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
      console.error('Erro ao buscar periodicidades:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar periodicidades',
        variant: 'destructive'
      })
    }
  }

  const calculateInstallmentValue = () => {
    const requestedAmount = parseFloat(formData.totalAmount) || 0
    const installments = parseInt(formData.installments) || 0
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
    
    if (!formData.customerId || !formData.totalAmount || !formData.loanType || !formData.interestRate ||
        !formData.periodicityId || !formData.installments || !formData.nextPaymentDate || !formData.startDate) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    // Validar se a data do primeiro pagamento não é anterior à data do empréstimo
    const startDate = new Date(formData.startDate)
    const paymentDate = new Date(formData.nextPaymentDate)
    
    if (paymentDate < startDate) {
      toast({
        title: 'Erro',
        description: 'A data do primeiro pagamento não pode ser anterior à data do empréstimo',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    
    const requestData = {
      ...formData,
      totalAmount: calculatedValues.totalAmount,
      loanType: formData.loanType,
      interestRate: parseFloat(formData.interestRate),
      installments: parseInt(formData.installments),
      installmentValue: calculatedValues.installmentValue,
      startDate: formData.startDate, // Incluir data de início
      observation: formData.observation, // Incluir observação
      commission: formData.commission ? parseFloat(formData.commission) : null // Incluir comissão
    }
    
    
    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })


      if (response.ok) {
        const result = await response.json()
        
        toast({
          title: 'Sucesso',
          description: 'Empréstimo cadastrado com sucesso'
        })
        router.push('/dashboard/emprestimos')
      } else {
        const error = await response.json()
        console.error('Erro na resposta:', error)
        
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao cadastrar empréstimo',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro no catch:', error)
      
      toast({
        title: 'Erro',
        description: 'Erro ao cadastrar empréstimo',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.relative')) {
        setCustomerSearchOpen(false)
      }
    }

    if (customerSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [customerSearchOpen])

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/dashboard/emprestimos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold ml-4">
            {isRenewal ? 'Renovar Empréstimo' : 'Novo Empréstimo'}
          </h1>
        </div>
        {isRenewal && (
          <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <RotateCcw className="h-4 w-4 text-blue-600" />
            <span className="text-blue-700 font-medium text-sm">Renovação</span>
          </div>
        )}
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
                  <Label htmlFor="customerId">Cliente *</Label>
                  <div className="relative">
                    <Input
                      placeholder="Pesquisar cliente por nome ou CPF..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onFocus={() => setCustomerSearchOpen(true)}
                      className="pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    
                    {customerSearchOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">
                            Nenhum cliente encontrado
                          </div>
                        ) : (
                          filteredCustomers.map((customer) => (
                            <div
                              key={customer.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  customerId: customer.id,
                                  // Limpar comissão se o cliente não tem rota
                                  commission: customer.route ? prev.commission : ''
                                }))
                                setCustomerSearch(`${customer.nomeCompleto} - ${customer.cpf}`)
                                setCustomerSearchOpen(false)
                              }}
                            >
                              <div className="font-medium text-sm">{customer.nomeCompleto}</div>
                              <div className="text-xs text-gray-500">{customer.cpf}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  
                  {selectedCustomer && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-blue-900">
                              {selectedCustomer.nomeCompleto}
                            </span>
                            <span className="text-xs text-blue-700">
                              {selectedCustomer.cpf}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-600 font-medium">Rota:</span>
                            <span className="text-xs bg-credmar-blue/10 text-credmar-blue px-2 py-1 rounded-full border border-credmar-blue/20 font-medium">
                              {selectedCustomer.route?.description || 'Capital Próprio'}
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({ 
                              ...prev, 
                              customerId: '',
                              commission: '' // Limpar comissão ao remover cliente
                            }))
                            setCustomerSearch('')
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalAmount">Valor do Empréstimo *</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        totalAmount: e.target.value 
                      }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="loanType">Tipo de Cobrança *</Label>
                    <Select 
                      value={formData.loanType} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        loanType: value as LoanType
                      }))}
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="interestRate">Taxa de Juros (% ao mês) *</Label>
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
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="installments">Número de Parcelas *</Label>
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

                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={calculateInstallmentValue}
                    className="flex items-center gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    Calcular Parcelas
                  </Button>
                </div>

                <div>
                  <Label htmlFor="commission">
                    Comissão (%)
                    {!selectedCustomer?.route && (
                      <span className="text-sm text-gray-500 ml-2">
                        (Disponível apenas para clientes com rota)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="commission"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                    value={formData.commission}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      commission: e.target.value
                    }))}
                    disabled={!selectedCustomer?.route}
                    className={!selectedCustomer?.route ? 'bg-gray-100 cursor-not-allowed' : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedCustomer?.route 
                      ? `Comissão será calculada sobre o valor total para a rota: ${selectedCustomer.route.description}`
                      : 'Selecione um cliente com rota para habilitar a comissão'
                    }
                  </p>
                </div>

                <div>
                  <Label htmlFor="periodicityId">Periodicidade *</Label>
                    <Select value={formData.periodicityId} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, periodicityId: value }))
                    }>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data do Empréstimo *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        startDate: e.target.value 
                      }))}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Data em que o empréstimo foi/será concedido
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="nextPaymentDate">Primeira Data de Pagamento *</Label>
                    <Input
                      id="nextPaymentDate"
                      type="date"
                      value={formData.nextPaymentDate}
                      min={formData.startDate} // Não pode ser anterior à data do empréstimo
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        nextPaymentDate: e.target.value 
                      }))}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Data do primeiro vencimento (não pode ser anterior à data do empréstimo)
                    </p>
                  </div>
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
                  {loading ? 'Cadastrando...' : 'Cadastrar Empréstimo'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Cálculo das Parcelas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {calculatedValues.showCalculation ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600 mb-1">Valor da Parcela</div>
                      <div className="text-xl font-bold text-green-700">
                        R$ {calculatedValues.installmentValue.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600 mb-1">Valor Total a Receber</div>
                      <div className="text-xl font-bold text-blue-700">
                        R$ {calculatedValues.totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Valor Emprestado:</span>
                      <span>R$ {parseFloat(formData.totalAmount || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total de Juros:</span>
                      <span className="text-orange-600">R$ {calculatedValues.totalInterest.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa Efetiva:</span>
                      <span>{calculatedValues.effectiveRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Parcelas:</span>
                      <span>{formData.installments || 0}x</span>
                    </div>
                    {formData.commission && selectedCustomer?.route && (
                      <div className="flex justify-between text-blue-600">
                        <span>Comissão ({formData.commission}%):</span>
                        <span>R$ {((parseFloat(formData.totalAmount || '0') * parseFloat(formData.commission || '0')) / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <hr />
                    <div className="flex justify-between font-semibold">
                      <span>Valor da Parcela:</span>
                      <span>R$ {calculatedValues.installmentValue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Preencha o valor total e quantidade de parcelas para ver o cálculo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}







