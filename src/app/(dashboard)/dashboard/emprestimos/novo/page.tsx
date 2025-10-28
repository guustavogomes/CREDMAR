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
import { PDFConfirmationModal } from '@/components/ui/pdf-confirmation-modal'
import { generateLoanPDF } from '@/lib/loan-pdf-generator'
import { ManagerBadge } from '@/components/ui/manager-badge'

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

interface Creditor {
  id: string
  nome: string
  cpf: string
  isManager: boolean
}

export default function NovoEmprestimoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [creditors, setCreditors] = useState<Creditor[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [periodicities, setPeriodicities] = useState<Periodicity[]>([])
  const [loading, setLoading] = useState(false)
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [creditorSearchOpen, setCreditorSearchOpen] = useState(false)
  const [creditorSearch, setCreditorSearch] = useState('')

  const [formData, setFormData] = useState({
    customerId: '',
    creditorId: '',
    routeId: '', // Rota/Intermediador do empréstimo
    totalAmount: '',
    loanType: 'PRICE' as LoanType,
    interestRate: '2.5',
    periodicityId: '',
    installments: '',
    nextPaymentDate: '',
    startDate: getBrazilTodayString(), // Data atual do Brasil como padrão
    observation: '', // Campo de observação
    commission: '', // Campo de comissão do intermediador em %
    creditorCommission: '' // Campo de comissão do credor em %
  })

  const [calculatedValues, setCalculatedValues] = useState({
    installmentValue: 0,
    totalAmount: 0,
    totalInterest: 0,
    effectiveRate: 0,
    showCalculation: false
  })
  const [isRenewal, setIsRenewal] = useState(false)
  const [creditorBalance, setCreditorBalance] = useState<number | null>(null)
  const [hasInsufficientBalance, setHasInsufficientBalance] = useState(false)

  // Estados para o modal de PDF
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [savedLoanData, setSavedLoanData] = useState<any>(null)

  // Função para resetar cálculo quando campos importantes mudam
  const resetCalculation = () => {
    setCalculatedValues(prev => ({
      ...prev,
      showCalculation: false
    }))
  }

  // Função para gerar PDF
  const handleGeneratePDF = async () => {
    if (savedLoanData) {
      try {
        await generateLoanPDF(savedLoanData)
        toast({
          title: 'PDF Gerado',
          description: 'O arquivo PDF foi baixado com sucesso',
          variant: 'default'
        })
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao gerar PDF',
          variant: 'destructive'
        })
      }
    }
  }

  // Função para fechar modal e redirecionar
  const handleClosePDFModal = () => {
    setShowPDFModal(false)
    setSavedLoanData(null)
    router.push('/dashboard/emprestimos')
  }

  // Filtrar clientes baseado na pesquisa
  const filteredCustomers = Array.isArray(customers) ? customers.filter(customer =>
    customer.nomeCompleto.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.cpf.includes(customerSearch)
  ) : []

  // Filtrar credores baseado na pesquisa
  const filteredCreditors = Array.isArray(creditors) ? creditors.filter(creditor =>
    creditor.nome.toLowerCase().includes(creditorSearch.toLowerCase()) ||
    creditor.cpf.includes(creditorSearch)
  ) : []

  const selectedCustomer = Array.isArray(customers) ? customers.find(c => c.id === formData.customerId) : null
  const selectedCreditor = Array.isArray(creditors) ? creditors.find(c => c.id === formData.creditorId) : null
  const selectedRoute = Array.isArray(routes) ? routes.find(r => r.id === formData.routeId) : null

  useEffect(() => {
    fetchCustomers()
    fetchCreditors()
    fetchRoutes()
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
            creditorId: decodedData.creditorId || '',
            totalAmount: decodedData.requestedAmount?.toString() || '',
            loanType: (decodedData.loanType as LoanType) || 'PRICE',
            interestRate: decodedData.interestRate?.toString() || '2.5',
            periodicityId: decodedData.periodicityId || '',
            installments: decodedData.installments?.toString() || '',
            nextPaymentDate: decodedData.nextPaymentDate || '',
            startDate: getBrazilTodayString(),
            observation: decodedData.observation || '',
            commission: decodedData.commission?.toString() || '',
            creditorCommission: decodedData.creditorCommission?.toString() || ''
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

  // Verificar saldo do credor sempre que credor ou valor mudarem
  useEffect(() => {
    checkCreditorBalance()
  }, [formData.creditorId, formData.totalAmount])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(Array.isArray(data) ? data : [])
      } else {
        setCustomers([])
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      setCustomers([])
    }
  }

  const fetchCreditors = async () => {
    try {
      const response = await fetch('/api/creditors')
      if (response.ok) {
        const data = await response.json()
        // A API retorna { creditors: [...], pagination: {...} }
        const creditorsList = Array.isArray(data.creditors) ? data.creditors : []
        setCreditors(creditorsList)
      } else {
        setCreditors([])
      }
    } catch (error) {
      console.error('Erro ao buscar credores:', error)
      setCreditors([])
    }
  }

  const fetchRoutes = async () => {
    try {
      console.log('🔍 Buscando rotas...')
      const response = await fetch('/api/routes')
      console.log('📡 Resposta da API de rotas:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📋 Rotas recebidas:', data)
        setRoutes(Array.isArray(data) ? data : [])
      } else {
        console.error('❌ Erro na resposta de rotas:', response.status, response.statusText)
        setRoutes([])
      }
    } catch (error) {
      console.error('❌ Erro ao buscar rotas:', error)
      setRoutes([])
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

  const checkCreditorBalance = async () => {
    if (!formData.creditorId || !formData.totalAmount) {
      setCreditorBalance(null)
      setHasInsufficientBalance(false)
      return
    }

    const requestedAmount = parseFloat(formData.totalAmount)
    if (requestedAmount <= 0) {
      setCreditorBalance(null)
      setHasInsufficientBalance(false)
      return
    }

    try {
      const response = await fetch(`/api/creditors/balance?creditorId=${formData.creditorId}`)
      if (response.ok) {
        const data = await response.json()
        const balance = data.balance || 0
        setCreditorBalance(balance)
        setHasInsufficientBalance(balance < requestedAmount)
      } else {
        setCreditorBalance(null)
        setHasInsufficientBalance(false)
      }
    } catch (error) {
      console.error('Erro ao verificar saldo do credor:', error)
      setCreditorBalance(null)
      setHasInsufficientBalance(false)
    }
  }

  const calculateInstallmentValue = async () => {
    // Validar se o credor foi selecionado (agora obrigatório)
    if (!formData.creditorId) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione um credor para o empréstimo',
        variant: 'destructive'
      })
      return
    }

    // Validar campos obrigatórios para o cálculo
    if (!formData.totalAmount) {
      const field = document.getElementById('totalAmount')
      field?.focus()
      toast({
        title: 'Campo obrigatório',
        description: 'Preencha o valor do empréstimo para calcular as parcelas',
        variant: 'destructive'
      })
      return
    }

    if (!formData.interestRate) {
      const field = document.getElementById('interestRate')
      field?.focus()
      toast({
        title: 'Campo obrigatório',
        description: 'Preencha a taxa de juros para calcular as parcelas',
        variant: 'destructive'
      })
      return
    }

    if (!formData.installments) {
      const field = document.getElementById('installments')
      field?.focus()
      toast({
        title: 'Campo obrigatório',
        description: 'Preencha o número de parcelas para calcular',
        variant: 'destructive'
      })
      return
    }

    if (!formData.periodicityId) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione a periodicidade para calcular as parcelas',
        variant: 'destructive'
      })
      return
    }

    const requestedAmount = parseFloat(formData.totalAmount)
    const installments = parseInt(formData.installments)
    const interestRate = parseFloat(formData.interestRate)
    
    // Validar valores numéricos
    if (requestedAmount <= 0) {
      const field = document.getElementById('totalAmount')
      field?.focus()
      toast({
        title: 'Valor inválido',
        description: 'O valor do empréstimo deve ser maior que zero',
        variant: 'destructive'
      })
      return
    }

    if (installments <= 0) {
      const field = document.getElementById('installments')
      field?.focus()
      toast({
        title: 'Valor inválido',
        description: 'O número de parcelas deve ser maior que zero',
        variant: 'destructive'
      })
      return
    }

    if (interestRate < 0) {
      const field = document.getElementById('interestRate')
      field?.focus()
      toast({
        title: 'Valor inválido',
        description: 'A taxa de juros não pode ser negativa',
        variant: 'destructive'
      })
      return
    }

    // Realizar o cálculo
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

      toast({
        title: 'Cálculo realizado',
        description: 'Parcelas calculadas com sucesso!',
        variant: 'default'
      })
    } catch (error) {
      toast({
        title: 'Erro no cálculo',
        description: 'Não foi possível calcular as parcelas. Verifique os dados informados.',
        variant: 'destructive'
      })
      
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
      customerId: formData.customerId,
      totalAmount: calculatedValues.totalAmount,
      loanType: formData.loanType,
      interestRate: parseFloat(formData.interestRate),
      periodicityId: formData.periodicityId,
      installments: parseInt(formData.installments),
      installmentValue: calculatedValues.installmentValue,
      nextPaymentDate: formData.nextPaymentDate,
      startDate: formData.startDate,
      observation: formData.observation || undefined,
      commission: formData.commission && formData.commission.trim() !== '' ? parseFloat(formData.commission) : null,
      creditorId: formData.creditorId && formData.creditorId.trim() !== '' ? formData.creditorId : null,
      creditorCommission: formData.creditorCommission && formData.creditorCommission.trim() !== '' ? parseFloat(formData.creditorCommission) : null,
      routeId: formData.routeId && formData.routeId.trim() !== '' && formData.routeId !== 'none' ? formData.routeId : null
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
        
        // Criar movimentação de débito no fluxo de caixa se há credor
        if (formData.creditorId) {
          try {
            await fetch('/api/cash-flow', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                creditorId: formData.creditorId,
                type: 'DEBIT',
                category: 'LOAN_DISBURSEMENT',
                amount: parseFloat(formData.totalAmount),
                description: `Desembolso empréstimo - ${selectedCustomer?.nomeCompleto}`,
                loanId: result.id
              })
            })
          } catch (error) {
            console.error('Erro ao criar movimentação no fluxo de caixa:', error)
            // Não bloqueia o fluxo, apenas loga o erro
          }
        }
        
        // Gerar detalhes das parcelas usando a simulação
        const simulationData = calculateLoanSimulation({
          loanType: formData.loanType as LoanType,
          periodicityId: formData.periodicityId,
          requestedAmount: parseFloat(formData.totalAmount),
          installments: parseInt(formData.installments),
          interestRate: parseFloat(formData.interestRate)
        })

        // Preparar dados para o PDF
        const loanDataForPDF = {
          ...result,
          customer: selectedCustomer,
          creditor: selectedCreditor,
          periodicity: periodicities.find(p => p.id === formData.periodicityId),
          totalAmount: parseFloat(formData.totalAmount),
          interestRate: parseFloat(formData.interestRate),
          installments: parseInt(formData.installments),
          installmentValue: calculatedValues.installmentValue,
          startDate: formData.startDate,
          nextPaymentDate: formData.nextPaymentDate,
          observation: formData.observation,
          commission: formData.commission ? parseFloat(formData.commission) : undefined,
          creditorCommission: formData.creditorCommission ? parseFloat(formData.creditorCommission) : undefined,
          loanType: formData.loanType,
          installmentDetails: simulationData.installments.map(inst => ({
            number: inst.number,
            dueDate: inst.dueDate.toISOString().split('T')[0],
            principalAmount: inst.principalAmount,
            interestAmount: inst.interestAmount,
            totalAmount: inst.totalAmount,
            remainingBalance: inst.remainingBalance
          }))
        }
        
        setSavedLoanData(loanDataForPDF)
        setShowPDFModal(true)
        
        toast({
          title: 'Sucesso',
          description: 'Empréstimo cadastrado com sucesso'
        })
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
                                  customerId: customer.id
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
                            <span className="text-xs text-blue-600 font-medium">Intermediador:</span>
                            <span className="text-xs bg-credmar-blue/10 text-credmar-blue px-2 py-1 rounded-full border border-credmar-blue/20 font-medium">
                              {selectedRoute?.description || 'Capital Próprio'}
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

                <div>
                  <Label htmlFor="routeId">Intermediador/Rota (Opcional)</Label>
                  <Select 
                    value={formData.routeId || 'none'} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      routeId: value === 'none' ? '' : value,
                      // Limpar comissão se não há intermediador selecionado
                      commission: value !== 'none' ? prev.commission : ''
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um intermediador (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Capital Próprio (sem intermediador)</SelectItem>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecione um intermediador para habilitar comissões ou deixe em branco para capital próprio
                  </p>
                </div>

                <div>
                  <Label htmlFor="creditorId">Credor *</Label>
                  <div className="relative">
                    <Input
                      placeholder="Pesquisar credor por nome ou CPF..."
                      value={creditorSearch}
                      onChange={(e) => setCreditorSearch(e.target.value)}
                      onFocus={() => setCreditorSearchOpen(true)}
                      className="pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    
                    {creditorSearchOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredCreditors.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">
                            Nenhum credor encontrado
                          </div>
                        ) : (
                          filteredCreditors.map((creditor) => (
                            <div
                              key={creditor.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  creditorId: creditor.id
                                }))
                                setCreditorSearch(`${creditor.nome} - ${creditor.cpf}`)
                                setCreditorSearchOpen(false)
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm">{creditor.nome}</div>
                                  <div className="text-xs text-gray-500">{creditor.cpf}</div>
                                </div>
                                <ManagerBadge isManager={creditor.isManager} size="sm" />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  
                  {selectedCreditor && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-green-900">
                              {selectedCreditor.nome}
                            </span>
                            <span className="text-xs text-green-700">
                              {selectedCreditor.cpf}
                            </span>
                            <ManagerBadge isManager={selectedCreditor.isManager} size="sm" />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({ 
                              ...prev, 
                              creditorId: '',
                              creditorCommission: '' // Limpar comissão ao remover credor
                            }))
                            setCreditorSearch('')
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
                      onChange={(e) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          totalAmount: e.target.value 
                        }))
                        resetCalculation()
                      }}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="loanType">Tipo de Cobrança *</Label>
                    <Select 
                      value={formData.loanType} 
                      onValueChange={(value) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          loanType: value as LoanType
                        }))
                        resetCalculation()
                      }}
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
                      onChange={(e) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          interestRate: e.target.value
                        }))
                        resetCalculation()
                      }}
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
                      onChange={(e) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          installments: e.target.value
                        }))
                        resetCalculation()
                      }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="commission">
                    {selectedRoute ? 'Comissão do Intermediador (%)' : 'Comissão (%)'}
                    {!selectedRoute && (
                      <span className="text-sm text-gray-500 ml-2">
                        (Disponível apenas quando intermediador for selecionado)
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
                    disabled={!selectedRoute}
                    className={!selectedRoute ? 'bg-gray-100 cursor-not-allowed' : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedRoute 
                      ? `Comissão do intermediador será calculada sobre o valor total para: ${selectedRoute.description}`
                      : 'Selecione um intermediador para habilitar a comissão'
                    }
                  </p>
                </div>

                <div>
                  <Label htmlFor="creditorCommission">
                    Comissão do Credor (%)
                    {!selectedCreditor && (
                      <span className="text-sm text-gray-500 ml-2">
                        (Disponível apenas quando um credor for selecionado)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="creditorCommission"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                    value={formData.creditorCommission}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      creditorCommission: e.target.value
                    }))}
                    disabled={!selectedCreditor}
                    className={!selectedCreditor ? 'bg-gray-100 cursor-not-allowed' : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedCreditor 
                      ? `Comissão do credor será calculada sobre o valor total para: ${selectedCreditor.nome}`
                      : 'Selecione um credor para habilitar a comissão do credor'
                    }
                  </p>
                </div>

                <div>
                  <Label htmlFor="periodicityId">Periodicidade *</Label>
                    <Select value={formData.periodicityId} onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, periodicityId: value }))
                      resetCalculation()
                    }}>
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

                <Button 
                  type="submit" 
                  disabled={loading || hasInsufficientBalance || !calculatedValues.showCalculation} 
                  className="w-full"
                >
                  {loading ? 'Cadastrando...' : 
                   !calculatedValues.showCalculation ? 'Calcule as Parcelas Primeiro' : 
                   'Cadastrar Empréstimo'}
                </Button>
                
                {!calculatedValues.showCalculation && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                      <strong>Atenção:</strong> Você precisa clicar em "Calcular Parcelas" antes de cadastrar o empréstimo.
                    </p>
                  </div>
                )}
                
                {hasInsufficientBalance && creditorBalance !== null && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">
                      <strong>Saldo Insuficiente:</strong> O credor possui saldo de{' '}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(creditorBalance)}, mas o empréstimo é de{' '}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(parseFloat(formData.totalAmount) || 0)}
                    </p>
                  </div>
                )}
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
                    {/* Seção de Comissões */}
                    {(formData.commission || formData.creditorCommission || parseFloat(formData.interestRate || '0') > 0) && (
                      <>
                        <hr className="border-gray-200" />
                        <div className="text-sm font-medium text-gray-700 mb-2">💰 Distribuição de Comissões:</div>
                        
                        {formData.commission && selectedRoute && (
                          <div className="flex justify-between text-blue-600 ml-4">
                            <span>• Intermediador ({formData.commission}%):</span>
                            <span>R$ {((parseFloat(formData.totalAmount || '0') * parseFloat(formData.commission || '0')) / 100).toFixed(2)}</span>
                          </div>
                        )}
                        
                        {formData.creditorCommission && selectedCreditor && (
                          <div className="flex justify-between text-green-600 ml-4">
                            <span>• Credor ({formData.creditorCommission}%):</span>
                            <span>R$ {((parseFloat(formData.totalAmount || '0') * parseFloat(formData.creditorCommission || '0')) / 100).toFixed(2)}</span>
                          </div>
                        )}
                        
                        {(() => {
                          const intermediatorRate = parseFloat(formData.commission || '0')
                          const creditorRate = parseFloat(formData.creditorCommission || '0')
                          const totalRate = parseFloat(formData.interestRate || '0')
                          const managerRate = totalRate - intermediatorRate - creditorRate
                          
                          return managerRate > 0 ? (
                            <div className="flex justify-between text-purple-600 ml-4">
                              <span>• Gestor ({managerRate.toFixed(2)}%):</span>
                              <span>R$ {((parseFloat(formData.totalAmount || '0') * managerRate) / 100).toFixed(2)}</span>
                            </div>
                          ) : null
                        })()}
                        
                        {/* Total das Comissões */}
                        {(() => {
                          const totalCommissionRate = (parseFloat(formData.commission || '0') + 
                                                     parseFloat(formData.creditorCommission || '0') + 
                                                     (parseFloat(formData.interestRate || '0') - 
                                                      parseFloat(formData.commission || '0') - 
                                                      parseFloat(formData.creditorCommission || '0')))
                          const totalCommissionValue = (parseFloat(formData.totalAmount || '0') * totalCommissionRate) / 100
                          
                          return totalCommissionRate > 0 ? (
                            <div className="flex justify-between font-medium text-gray-700 ml-4 pt-1 border-t border-gray-200">
                              <span>Total Comissões ({totalCommissionRate.toFixed(2)}%):</span>
                              <span>R$ {totalCommissionValue.toFixed(2)}</span>
                            </div>
                          ) : null
                        })()}
                      </>
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

      {/* Modal de confirmação para gerar PDF */}
      <PDFConfirmationModal
        isOpen={showPDFModal}
        onClose={handleClosePDFModal}
        onConfirm={handleGeneratePDF}
        customerName={savedLoanData?.customer?.nomeCompleto || ''}
        loanId={savedLoanData?.id || ''}
      />
    </div>
  )
}







