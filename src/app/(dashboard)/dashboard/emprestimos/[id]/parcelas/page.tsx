'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle, Plus, X, CreditCard, RotateCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatCurrency, isOverdue } from '@/lib/date-utils'
import { getBrazilTodayString } from '@/lib/timezone-utils'

type Installment = {
  id: string
  loanId: string
  installmentNumber: number
  dueDate: string
  amount: number
  paidAmount: number
  fineAmount: number
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  paidAt: string | null
  createdAt: string
}

type Loan = {
  id: string
  totalAmount: number
  installments: number
  installmentValue: number
  customer: {
    nomeCompleto: string
    cpf: string
  }
}

export default function InstallmentsPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loan, setLoan] = useState<Loan | null>(null)
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null)
  const [paymentData, setPaymentData] = useState({
    amount: '',
    fineAmount: '',
    paymentDate: getBrazilTodayString()
  })
  const [showFineDialog, setShowFineDialog] = useState(false)
  const [selectedInstallmentForFine, setSelectedInstallmentForFine] = useState<any>(null)
  const [fineData, setFineData] = useState({
    amount: '',
    reason: ''
  })
  // Adicionar estes novos estados:
  const [showReverseDialog, setShowReverseDialog] = useState(false)
  const [selectedInstallmentForReverse, setSelectedInstallmentForReverse] = useState<Installment | null>(null)
  
  // Estados para quitação total e renovação
  const [showPayAllDialog, setShowPayAllDialog] = useState(false)
  const [showRenewDialog, setShowRenewDialog] = useState(false)
  const [renewData, setRenewData] = useState({
    nextPaymentDate: ''
  })
  const [payAllData, setPayAllData] = useState<any>(null)
  const [isProcessingPayAll, setIsProcessingPayAll] = useState(false)

  useEffect(() => {
    fetchLoanAndInstallments()
  }, [params.id])

  const fetchLoanAndInstallments = async () => {
    try {
      const [loanResponse, installmentsResponse] = await Promise.all([
        fetch(`/api/loans/${params.id}`),
        fetch(`/api/loans/${params.id}/installments`)
      ])

      if (loanResponse.ok && installmentsResponse.ok) {
        const loanData = await loanResponse.json()
        const installmentsData = await installmentsResponse.json()
        
        setLoan(loanData)
        setInstallments(installmentsData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do empréstimo',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!selectedInstallment) return

    try {
      const response = await fetch(`/api/loans/${params.id}/installments/${selectedInstallment.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(paymentData.amount),
          fineAmount: parseFloat(paymentData.fineAmount || '0'),
          paymentDate: paymentData.paymentDate
        })
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Pagamento registrado com sucesso'
        })
        setShowPaymentDialog(false)
        setSelectedInstallment(null)
        setPaymentData({
          amount: '',
          fineAmount: '',
          paymentDate: getBrazilTodayString()
        })
        fetchLoanAndInstallments()
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao registrar pagamento',
        variant: 'destructive'
      })
    }
  }

  const openPaymentDialog = (installment: Installment) => {
    setSelectedInstallment(installment)
    setPaymentData({
      amount: installment.amount.toString(),
      fineAmount: installment.fineAmount.toString(),
      paymentDate: getBrazilTodayString()
    })
    setShowPaymentDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>
      case 'OVERDUE':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Vencido</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>
    }
  }




  const openFineDialog = (installment: any) => {
    setSelectedInstallmentForFine(installment)
    setFineData({
      amount: '',
      reason: ''
    })
    setShowFineDialog(true)
  }

  const handleAddFine = async () => {
    if (!selectedInstallmentForFine || !fineData.amount) {
      toast({
        title: 'Erro',
        description: 'Preencha o valor da multa',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch(`/api/loans/${params.id}/installments/${selectedInstallmentForFine.id}/fine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fineAmount: parseFloat(fineData.amount),
          reason: fineData.reason
        })
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Multa adicionada com sucesso'
        })
        setShowFineDialog(false)
        setSelectedInstallmentForFine(null)
        setFineData({ amount: '', reason: '' })
        fetchLoanAndInstallments()
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao adicionar multa',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar multa',
        variant: 'destructive'
      })
    }
  }

  const handleReverse = async () => {
    if (!selectedInstallmentForReverse) return

    try {
      const response = await fetch(`/api/loans/${params.id}/installments/${selectedInstallmentForReverse.id}/reverse`, {
        method: 'POST'
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Pagamento estornado com sucesso'
        })
        setShowReverseDialog(false)
        setSelectedInstallmentForReverse(null)
        fetchLoanAndInstallments()
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao estornar pagamento',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao estornar pagamento',
        variant: 'destructive'
      })
    }
  }

  const openReverseDialog = (installment: Installment) => {
    setSelectedInstallmentForReverse(installment)
    setShowReverseDialog(true)
  }

  // Função para quitação total
  const handlePayAll = async () => {
    try {
      setIsProcessingPayAll(true)
      const response = await fetch(`/api/loans/${params.id}/pay-all`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setPayAllData(data)
        setShowPayAllDialog(false)
        setShowRenewDialog(true)
        
        toast({
          title: 'Sucesso',
          description: 'Empréstimo quitado com sucesso!'
        })
        
        fetchLoanAndInstallments()
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao quitar empréstimo',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao quitar empréstimo',
        variant: 'destructive'
      })
    } finally {
      setIsProcessingPayAll(false)
    }
  }

  // Função para renovação
  const handleRenew = () => {
    if (!renewData.nextPaymentDate) {
      toast({
        title: 'Erro',
        description: 'Selecione a data do próximo pagamento',
        variant: 'destructive'
      })
      return
    }

    if (!payAllData?.loan) {
      toast({
        title: 'Erro',
        description: 'Dados do empréstimo não encontrados',
        variant: 'destructive'
      })
      return
    }

    // Preparar os dados para a tela de criação
    const loanData = {
      customerId: payAllData.loan.customer.id,
      requestedAmount: payAllData.loan.totalAmount,
      loanType: payAllData.loan.loanType,
      interestRate: payAllData.loan.interestRate,
      periodicityId: payAllData.loan.periodicity.id,
      installments: payAllData.loan.installments,
      installmentValue: payAllData.loan.installmentValue,
      nextPaymentDate: renewData.nextPaymentDate,
      isRenewal: true,
      originalLoanId: params.id
    }

    // Codificar os dados para passar via URL
    const encodedData = encodeURIComponent(JSON.stringify(loanData))
    
    setShowRenewDialog(false)
    setRenewData({ nextPaymentDate: '' })
    setPayAllData(null)
    
    // Redirecionar para a tela de criação com dados preenchidos
    router.push(`/dashboard/emprestimos/novo?data=${encodedData}`)
  }

  // Função para cancelar renovação
  const handleCancelRenew = () => {
    setShowRenewDialog(false)
    setRenewData({ nextPaymentDate: '' })
    setPayAllData(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-credmar-red"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/emprestimos')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
              Gerenciar Parcelas
            </h1>
            {loan && (
              <p className="text-slate-600">
                {loan.customer.nomeCompleto} - {formatCurrency(loan.totalAmount)} em {loan.installments}x
              </p>
            )}
          </div>
        </div>
        
        {/* Botão de Quitação Total */}
        {installments.length > 0 && installments.some(inst => inst.status === 'PENDING' || inst.status === 'OVERDUE') && (
          <Button 
            onClick={() => setShowPayAllDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Quitar Total
          </Button>
        )}
      </div>

      {/* Installments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Parcelas do Empréstimo</CardTitle>
        </CardHeader>
        <CardContent>
          {installments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Erro ao carregar parcelas
              </h3>
              <p className="text-gray-500 mb-4">
                Não foi possível carregar as parcelas deste empréstimo. As parcelas devem ser geradas automaticamente na criação do empréstimo.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Multa</TableHead>
                  <TableHead>Total Pago</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.map((installment) => {
                  const overdueClass = isOverdue(installment.dueDate, installment.status) 
                    ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-300' 
                    : ''
                  
                  return (
                    <TableRow key={installment.id} className={overdueClass}>
                      <TableCell className="font-medium">
                        {installment.installmentNumber}ª
                      </TableCell>
                      <TableCell>
                        <span className={isOverdue(installment.dueDate, installment.status) ? 'text-red-700 font-medium' : ''}>
                          {formatDate(installment.dueDate)}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(installment.amount)}</TableCell>
                      <TableCell>
                        {installment.fineAmount > 0 ? (
                          <span className="text-red-600 font-medium">
                            {formatCurrency(installment.fineAmount)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {installment.paidAmount > 0 ? formatCurrency(installment.paidAmount) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(installment.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {(installment.status === 'PENDING' || installment.status === 'OVERDUE') && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openPaymentDialog(installment)}
                                className={installment.status === 'OVERDUE' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Pagar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openFineDialog(installment)}
                                className="border-orange-300 text-orange-600 hover:bg-orange-50"
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                {installment.fineAmount > 0 ? 'Adicionar Multa' : 'Multa'}
                              </Button>
                            </>
                          )}
                          {installment.status === 'PAID' && (
                            <div className="flex space-x-2">
                              <span className="text-green-600 font-medium">Pago</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openReverseDialog(installment)}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Estornar
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Valor Pago *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label htmlFor="fineAmount">Multa</Label>
              <Input
                id="fineAmount"
                type="number"
                step="0.01"
                value={paymentData.fineAmount}
                onChange={(e) => setPaymentData(prev => ({ ...prev, fineAmount: e.target.value }))}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label htmlFor="paymentDate">Data do Pagamento *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData(prev => ({ ...prev, paymentDate: e.target.value }))}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePayment}>
                Confirmar Pagamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fine Dialog */}
      <Dialog open={showFineDialog} onOpenChange={setShowFineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar Multa</DialogTitle>
            <DialogDescription>
              {selectedInstallmentForFine?.fineAmount > 0 && (
                <span className="text-sm text-gray-600">
                  Multa atual: {formatCurrency(selectedInstallmentForFine.fineAmount)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fineAmount">Valor da Multa a Adicionar *</Label>
              <Input
                id="fineAmount"
                type="number"
                step="0.01"
                value={fineData.amount}
                onChange={(e) => setFineData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label htmlFor="fineReason">Motivo da Multa</Label>
              <Input
                id="fineReason"
                value={fineData.reason}
                onChange={(e) => setFineData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Ex: Atraso no pagamento"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowFineDialog(false)
                setSelectedInstallmentForFine(null)
                setFineData({ amount: '', reason: '' })
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddFine} className="bg-orange-600 hover:bg-orange-700">
              Aplicar Multa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reverse Payment Dialog */}
      <Dialog open={showReverseDialog} onOpenChange={setShowReverseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Confirmar Estorno
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja estornar o pagamento da {selectedInstallmentForReverse?.installmentNumber}ª parcela?
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                Esta ação irá:
              </span>
              <ul className="text-sm text-gray-600 mt-1 ml-4 list-disc">
                <li>Reverter o status para "Pendente"</li>
                <li>Zerar o valor pago</li>
                <li>Remover a data de pagamento</li>
                <li>Manter a multa aplicada (se houver)</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowReverseDialog(false)
                setSelectedInstallmentForReverse(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReverse}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar Estorno
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay All Dialog */}
      <Dialog open={showPayAllDialog} onOpenChange={setShowPayAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Confirmar Quitação Total
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja quitar todas as parcelas pendentes deste empréstimo?
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                Esta ação irá:
              </span>
              <ul className="text-sm text-gray-600 mt-1 ml-4 list-disc">
                <li>Marcar todas as parcelas pendentes como pagas</li>
                <li>Incluir multas aplicadas no valor total</li>
                <li>Marcar o empréstimo como concluído</li>
                <li>Oferecer opção de renovação</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowPayAllDialog(false)}
              disabled={isProcessingPayAll}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePayAll}
              className="bg-green-600 hover:bg-green-700"
              disabled={isProcessingPayAll}
            >
              {isProcessingPayAll ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processando...
                </>
              ) : (
                'Confirmar Quitação'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Renew Dialog */}
      <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-600" />
              Renovar Empréstimo
            </DialogTitle>
            <DialogDescription>
              Empréstimo quitado com sucesso! Deseja renovar o empréstimo?
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                Você será redirecionado para a tela de criação com os dados preenchidos:
              </span>
              <ul className="text-sm text-gray-600 mt-1 ml-4 list-disc">
                <li>Cliente: {payAllData?.loan?.customer?.nomeCompleto}</li>
                <li>Valor: {payAllData?.loan && formatCurrency(payAllData.loan.totalAmount)}</li>
                <li>Parcelas: {payAllData?.loan?.installments}x</li>
                <li>Valor por parcela: {payAllData?.loan && formatCurrency(payAllData.loan.installmentValue)}</li>
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
              onClick={handleCancelRenew}
            >
              Não Renovar
            </Button>
            <Button
              onClick={handleRenew}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!renewData.nextPaymentDate}
            >
              Ir para Criação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}






