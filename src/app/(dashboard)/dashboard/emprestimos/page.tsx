'use client'

import { useState, useEffect } from 'react'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Trash2, DollarSign, Calendar, User, RotateCcw, Info, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatCurrency } from '@/lib/date-utils'
import { getBrazilTodayString } from '@/lib/timezone-utils'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Loan {
  id: string
  totalAmount: number
  amountWithoutInterest: number
  installments: number
  installmentValue: number
  nextPaymentDate: string
  status: string
  transactionDate: string
  observation?: string | null
  customer: {
    [x: string]: string
    id: string
    nomeCompleto: string
    cpf: string
  }
  periodicity: {
    id: string
    name: string
  }
}

interface Route {
  id: string
  description: string
}

export default function EmprestimosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loans, setLoans] = useState<Loan[]>([])
const [routes, setRoutes] = useState<Route[]>([])
const [selectedRoute, setSelectedRoute] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    loanId: '',
    customerName: ''
  })
  const [showRenewDialog, setShowRenewDialog] = useState(false)
  const [renewData, setRenewData] = useState({
    loan: null as Loan | null,
    nextPaymentDate: ''
  })
  const [showAddInstallmentsDialog, setShowAddInstallmentsDialog] = useState(false)
  const [addInstallmentsData, setAddInstallmentsData] = useState({
    loan: null as Loan | null,
    installmentValue: '',
    installmentsCount: '',
    startDate: ''
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    
    if (status === "authenticated") {
      fetchLoans()
      fetchRoutes()
    }
  }, [status, router])

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/routes')
      if (response.ok) {
        const data = await response.json()
        setRoutes(data)
      }
    } catch (error) {
      // erro silencioso
    }
  }

  const fetchLoans = async () => {
    try {
      const response = await fetch('/api/loans')
      if (response.ok) {
        const data = await response.json()
        setLoans(data)
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar empréstimos',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar empréstimos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredLoans = loans.filter(loan => {
    const matchSearch = loan.customer.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.customer.cpf.includes(searchTerm)
    
    let matchRoute = true
    if (selectedRoute === 'all') {
      matchRoute = true // Mostra todos
    } else if (selectedRoute === 'no-route') {
      matchRoute = !loan.customer.routeId // Apenas sem rota
    } else {
      matchRoute = loan.customer.routeId === selectedRoute // Rota específica
    }
    
    return matchSearch && matchRoute
  })

  const handleDelete = (loanId: string, customerName: string) => {
    setConfirmModal({
      isOpen: true,
      loanId,
      customerName
    })
  }

  const handleRenew = (loan: Loan) => {
    setRenewData({ loan, nextPaymentDate: '' })
    setShowRenewDialog(true)
  }

  const handleAddInstallments = (loan: Loan) => {
    setAddInstallmentsData({ 
      loan, 
      installmentValue: loan.installmentValue.toString(),
      installmentsCount: '',
      startDate: ''
    })
    setShowAddInstallmentsDialog(true)
  }

  const confirmRenew = () => {
    if (!renewData.nextPaymentDate) {
      toast({
        title: 'Erro',
        description: 'Selecione a data do próximo pagamento',
        variant: 'destructive'
      })
      return
    }

    if (!renewData.loan) {
      toast({
        title: 'Erro',
        description: 'Dados do empréstimo não encontrados',
        variant: 'destructive'
      })
      return
    }

    // Preparar os dados para a tela de criação
    const loanData = {
      customerId: renewData.loan.customer.id,
      totalAmount: renewData.loan.totalAmount,
      amountWithoutInterest: renewData.loan.amountWithoutInterest,
      periodicityId: renewData.loan.periodicity.id,
      installments: renewData.loan.installments,
      installmentValue: renewData.loan.installmentValue,
      nextPaymentDate: renewData.nextPaymentDate,
      isRenewal: true,
      originalLoanId: renewData.loan.id
    }

    // Codificar os dados para passar via URL
    const encodedData = encodeURIComponent(JSON.stringify(loanData))
    
    setShowRenewDialog(false)
    setRenewData({ loan: null, nextPaymentDate: '' })
    
    // Redirecionar para a tela de criação com dados preenchidos
    router.push(`/dashboard/emprestimos/novo?data=${encodedData}`)
  }

  const confirmAddInstallments = async () => {
    if (!addInstallmentsData.installmentValue || !addInstallmentsData.installmentsCount || !addInstallmentsData.startDate) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    if (!addInstallmentsData.loan) {
      toast({
        title: 'Erro',
        description: 'Dados do empréstimo não encontrados',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch(`/api/loans/${addInstallmentsData.loan.id}/add-installments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installmentValue: parseFloat(addInstallmentsData.installmentValue),
          installmentsCount: parseInt(addInstallmentsData.installmentsCount),
          startDate: addInstallmentsData.startDate
        })
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: `${addInstallmentsData.installmentsCount} parcelas adicionadas com sucesso!`
        })
        setShowAddInstallmentsDialog(false)
        setAddInstallmentsData({ loan: null, installmentValue: '', installmentsCount: '', startDate: '' })
        fetchLoans() // Recarregar a lista
      } else {
        const errorData = await response.json()
        toast({
          title: 'Erro',
          description: errorData.error || 'Erro ao adicionar parcelas',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar parcelas',
        variant: 'destructive'
      })
    }
  }

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/loans/${confirmModal.loanId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setLoans(loans.filter(loan => loan.id !== confirmModal.loanId))
        toast({
          title: 'Sucesso',
          description: 'Empréstimo excluído com sucesso'
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao excluir empréstimo',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir empréstimo',
        variant: 'destructive'
      })
    } finally {
      setConfirmModal({ isOpen: false, loanId: '', customerName: '' })
    }
  }

  // Funções de formatação movidas para @/lib/date-utils

  const getStatusBadge = (status: string) => {
    const statusMap = {
      ACTIVE: { label: 'Ativo', variant: 'default' as const },
      COMPLETED: { label: 'Concluído', variant: 'secondary' as const },
      CANCELLED: { label: 'Cancelado', variant: 'destructive' as const }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'default' as const }
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    )
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Meus Empréstimos</h1>
        <Link href="/dashboard/emprestimos/novo">
          <Button className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Empréstimo
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="mb-6 border-border bg-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por cliente ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border focus:border-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filtro por Rota */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <label className="font-medium text-sm text-muted-foreground">Filtrar por rota:</label>
        <Select value={selectedRoute} onValueChange={setSelectedRoute}>
  <SelectTrigger className="w-64">
    <SelectValue placeholder="Todos os empréstimos" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Todos os empréstimos</SelectItem>
    <SelectItem value="no-route">Clientes sem rota</SelectItem>
    {routes.map((route) => (
      <SelectItem key={route.id} value={route.id}>{route.description}</SelectItem>
    ))}
  </SelectContent>
</Select>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Empréstimos</p>
                <p className="text-2xl font-bold text-foreground">{filteredLoans.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Empréstimos Ativos</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredLoans.filter(loan => loan.status === 'ACTIVE').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total Ativos</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(filteredLoans.filter(loan => loan.status === 'ACTIVE').reduce((sum, loan) => sum + loan.totalAmount, 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-foreground">Lista de Empréstimos</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum empréstimo encontrado' : 'Nenhum empréstimo cadastrado'}
              </p>
              {!searchTerm && (
                <Link href="/dashboard/emprestimos/novo">
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar Primeiro Empréstimo
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data do Empréstimo</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Parcelas</TableHead>
                      <TableHead>Valor/Parcela</TableHead>
                      <TableHead>Próximo Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.map((loan) => (
                      <TableRow key={loan.id} className="hover:bg-muted/30 border-border">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="text-foreground">{loan.customer.nomeCompleto}</div>
                              <div className="text-sm text-muted-foreground">{loan.customer.cpf}</div>
                            </div>
                            {loan.observation && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-4 h-4 text-blue-500 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{loan.observation}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(loan.transactionDate)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatCurrency(loan.totalAmount)}</TableCell>
                        <TableCell className="text-muted-foreground">{loan.installments}x</TableCell>
                        <TableCell className="text-muted-foreground">{formatCurrency(loan.installmentValue)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(loan.nextPaymentDate)}</TableCell>
                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/dashboard/emprestimos/${loan.id}/editar`)}
                              className="hover:bg-primary/10 hover:border-primary/30"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/dashboard/emprestimos/${loan.id}/parcelas`)}
                              className="bg-primary/10 hover:bg-primary/20 border-primary/20"
                            >
                              <Calendar className="w-4 h-4" />
                            </Button>
                            {loan.status === 'ACTIVE' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddInstallments(loan)}
                                className="bg-green-50 hover:bg-green-100 border-green-200 text-green-600"
                                title="Adicionar Parcelas"
                              >
                                <PlusCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {loan.status === 'COMPLETED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRenew(loan)}
                                className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600"
                                title="Renovar Empréstimo"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                            {loan.status === 'ACTIVE' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(loan.id, loan.customer.nomeCompleto)}
                                className="hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 pt-4">
                {filteredLoans.map((loan) => (
                  <Card key={loan.id} className="border-l-4 border-l-green-500 border-border bg-card">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{loan.customer.nomeCompleto}</h3>
                            <p className="text-sm text-muted-foreground">{loan.customer.cpf}</p>
                          </div>
                          {loan.observation && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-4 h-4 text-blue-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{loan.observation}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        {getStatusBadge(loan.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Data do Empréstimo:</span>
                          <div className="font-semibold text-foreground">{formatDate(loan.transactionDate)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor Total:</span>
                          <div className="font-semibold text-foreground">{formatCurrency(loan.totalAmount)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Parcelas:</span>
                          <div className="font-semibold text-foreground">{loan.installments}x de {formatCurrency(loan.installmentValue)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Próximo Pagamento:</span>
                          <div className="font-semibold text-foreground">{formatDate(loan.nextPaymentDate)}</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 mt-4">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 hover:bg-primary/10 hover:border-primary/30"
                            onClick={() => router.push(`/dashboard/emprestimos/${loan.id}/editar`)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 bg-primary/10 hover:bg-primary/20 border-primary/20"
                            onClick={() => router.push(`/dashboard/emprestimos/${loan.id}/parcelas`)}
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            Parcelas
                          </Button>
                        </div>
                        {loan.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddInstallments(loan)}
                            className="w-full bg-green-50 hover:bg-green-100 border-green-200 text-green-600"
                          >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Adicionar Parcelas
                          </Button>
                        )}
                        {loan.status === 'COMPLETED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRenew(loan)}
                            className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Renovar Empréstimo
                          </Button>
                        )}
                        {loan.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(loan.id, loan.customer.nomeCompleto)}
                            className="w-full hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir Empréstimo
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, loanId: '', customerName: '' })}
        onConfirm={confirmDelete}
        title="Excluir Empréstimo"
        description={`Tem certeza que deseja excluir o empréstimo de ${confirmModal.customerName}? Esta ação não poderá ser desfeita e marcará o empréstimo como cancelado.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />

      {/* Modal de Renovação */}
      <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-600" />
              Renovar Empréstimo
            </DialogTitle>
            <DialogDescription>
              Deseja renovar o empréstimo de {renewData.loan?.customer.nomeCompleto}?
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                Você será redirecionado para a tela de criação com os dados preenchidos:
              </span>
              <ul className="text-sm text-gray-600 mt-1 ml-4 list-disc">
                <li>Cliente: {renewData.loan?.customer.nomeCompleto}</li>
                <li>Valor: {renewData.loan && formatCurrency(renewData.loan.totalAmount)}</li>
                <li>Parcelas: {renewData.loan?.installments}x</li>
                <li>Valor por parcela: {renewData.loan && formatCurrency(renewData.loan.installmentValue)}</li>
              </ul>
              <span className="text-sm text-blue-600 mt-2 block">
                Você poderá alterar qualquer informação antes de salvar.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nextPaymentDate">Data do Próximo Pagamento *</Label>
              <Input
                id="nextPaymentDate"
                type="date"
                value={renewData.nextPaymentDate}
                onChange={(e) => setRenewData(prev => ({ ...prev, nextPaymentDate: e.target.value }))}
                min={getBrazilTodayString()}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowRenewDialog(false)
                setRenewData({ loan: null, nextPaymentDate: '' })
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmRenew}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!renewData.nextPaymentDate}
            >
              Ir para Criação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionar Parcelas */}
      <Dialog open={showAddInstallmentsDialog} onOpenChange={setShowAddInstallmentsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-green-600" />
              Adicionar Parcelas
            </DialogTitle>
            <DialogDescription>
              Adicionar novas parcelas ao empréstimo de {addInstallmentsData.loan?.customer.nomeCompleto}
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                As parcelas serão inseridas após a última parcela existente.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="installmentValue">Valor da Parcela *</Label>
              <Input
                id="installmentValue"
                type="number"
                step="0.01"
                min="0.01"
                value={addInstallmentsData.installmentValue}
                onChange={(e) => setAddInstallmentsData(prev => ({ ...prev, installmentValue: e.target.value }))}
                placeholder="Ex: 150.00"
              />
            </div>
            <div>
              <Label htmlFor="installmentsCount">Quantidade de Parcelas *</Label>
              <Input
                id="installmentsCount"
                type="number"
                min="1"
                max="60"
                value={addInstallmentsData.installmentsCount}
                onChange={(e) => setAddInstallmentsData(prev => ({ ...prev, installmentsCount: e.target.value }))}
                placeholder="Ex: 3"
              />
            </div>
            <div>
              <Label htmlFor="startDate">Data da Primeira Parcela *</Label>
              <Input
                id="startDate"
                type="date"
                value={addInstallmentsData.startDate}
                onChange={(e) => setAddInstallmentsData(prev => ({ ...prev, startDate: e.target.value }))}
                min={getBrazilTodayString()}
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Resumo:</strong> {addInstallmentsData.installmentsCount} parcelas de R$ {addInstallmentsData.installmentValue || '0,00'} 
                {addInstallmentsData.installmentsCount && addInstallmentsData.installmentValue && (
                  <span> = R$ {(parseFloat(addInstallmentsData.installmentValue || '0') * parseInt(addInstallmentsData.installmentsCount || '0')).toFixed(2)}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddInstallmentsDialog(false)
                setAddInstallmentsData({ loan: null, installmentValue: '', installmentsCount: '', startDate: '' })
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmAddInstallments}
              className="bg-green-600 hover:bg-green-700"
              disabled={!addInstallmentsData.installmentValue || !addInstallmentsData.installmentsCount || !addInstallmentsData.startDate}
            >
              Adicionar Parcelas
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}



