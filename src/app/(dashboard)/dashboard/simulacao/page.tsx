'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Calculator, DollarSign, Calendar, Percent, Share, MessageCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { LoanType, LoanSimulationInput, LoanSimulationResult, Periodicity } from '@/types/loan-simulation'
import { calculateLoanSimulation, loanTypeLabels } from '@/lib/loan-calculations'

export default function SimulacaoPage() {
  const { toast } = useToast()
  const [periodicities, setPeriodicities] = useState<Periodicity[]>([])
  const [loading, setLoading] = useState(false)
  const [simulation, setSimulation] = useState<LoanSimulationResult | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  
  const [formData, setFormData] = useState<LoanSimulationInput>({
    loanType: 'PRICE',
    periodicityId: '',
    requestedAmount: 0,
    installments: 12,
    interestRate: 2.5
  })

  useEffect(() => {
    fetchPeriodicities()
  }, [])

  const fetchPeriodicities = async () => {
    try {
      const response = await fetch('/api/periodicities')
      if (response.ok) {
        const data = await response.json()
        setPeriodicities(data)
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, periodicityId: data[0].id }))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar periodicidades:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de cobrança",
        variant: "destructive"
      })
    }
  }

  const handleCalculate = () => {
    if (!formData.periodicityId) {
      toast({
        title: "Erro",
        description: "Selecione um tipo de cobrança",
        variant: "destructive"
      })
      return
    }

    if (formData.requestedAmount <= 0) {
      toast({
        title: "Erro",
        description: "Valor solicitado deve ser maior que zero",
        variant: "destructive"
      })
      return
    }

    if (formData.installments <= 0) {
      toast({
        title: "Erro",
        description: "Número de prestações deve ser maior que zero",
        variant: "destructive"
      })
      return
    }

    if (formData.interestRate < 0) {
      toast({
        title: "Erro",
        description: "Taxa de juros não pode ser negativa",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      const result = calculateLoanSimulation(formData)
      setSimulation(result)
      toast({
        title: "Sucesso",
        description: "Simulação calculada com sucesso!"
      })
    } catch (error) {
      console.error('Erro no cálculo:', error)
      toast({
        title: "Erro",
        description: "Erro ao calcular simulação",
        variant: "destructive"
      })
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date)
  }

  const generatePDF = async () => {
    if (!simulation) return null

    setGeneratingPdf(true)
    
    try {
      // Importações dinâmicas para evitar problemas de SSR
      const jsPDF = (await import('jspdf')).default
      const html2canvas = (await import('html2canvas')).default

      // Criar elemento temporário com o conteúdo da simulação
      const element = document.createElement('div')
      element.style.padding = '20px'
      element.style.backgroundColor = 'white'
      element.style.fontFamily = 'Arial, sans-serif'
      element.style.width = '800px'
      
      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 2px;"><span style="color: #dc2626;">CRED</span><span style="color: #1e40af;">MAR</span></h1>
          <p style="color: #666; margin: 5px 0 0 0; font-size: 11px; font-style: italic;">Seu Crédito, Sua Força!</p>
          <h2 style="color: #1e40af; margin: 20px 0 5px 0; font-size: 20px;">Simulação de Empréstimo</h2>
          <p style="color: #666; margin: 0;">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; font-size: 11px;">
            <div><strong style="color: #1e40af;">Tipo:</strong><br>${loanTypeLabels[formData.loanType]}</div>
            <div><strong style="color: #1e40af;">Valor:</strong><br>${formatCurrency(formData.requestedAmount)}</div>
            <div><strong style="color: #1e40af;">Parcelas:</strong><br>${formData.installments}x</div>
            <div><strong style="color: #1e40af;">Taxa:</strong><br>${formData.interestRate}% a.m.</div>
          </div>
        </div>

        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; font-size: 11px;">
            <div><strong style="color: #059669;">Valor da Parcela:</strong><br><span style="color: #059669; font-size: 16px; font-weight: bold;">${formatCurrency(simulation.installmentValue)}</span></div>
            <div><strong style="color: #ea580c;">Total de Juros:</strong><br><span style="color: #ea580c; font-size: 16px; font-weight: bold;">${formatCurrency(simulation.totalInterest)}</span></div>
            <div><strong style="color: #1e40af;">Taxa Efetiva:</strong><br><span style="color: #1e40af; font-size: 16px; font-weight: bold;">${simulation.effectiveRate.toFixed(2)}%</span></div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #1e40af; margin-bottom: 15px;">Cronograma de Pagamentos</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Parcela</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Vencimento</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Principal</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Juros</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Parcela a Pagar</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Saldo Devedor</th>
              </tr>
            </thead>
            <tbody>
              ${simulation.installments.slice(0, 12).map(installment => `
                <tr>
                  <td style="border: 1px solid #cbd5e1; padding: 6px;">${installment.number}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px;">${formatDate(installment.dueDate)}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">${formatCurrency(installment.principalAmount)}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">${formatCurrency(installment.interestAmount)}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">${formatCurrency(installment.totalAmount)}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">${formatCurrency(installment.remainingBalance)}</td>
                </tr>
              `).join('')}
              ${simulation.installments.length > 12 ? `
                <tr>
                  <td colspan="6" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-style: italic; color: #666;">
                    ... e mais ${simulation.installments.length - 12} parcelas
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>

        <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px solid #e2e8f0;">
          <p style="color: #666; margin: 0; font-size: 10px;">
            Simulação gerada pelo sistema CREDMAR<br>
            Esta é apenas uma simulação. Os valores podem variar conforme as condições finais do empréstimo.
          </p>
        </div>
      `

      // Adicionar elemento temporariamente ao DOM
      document.body.appendChild(element)

      // Gerar canvas do elemento
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })

      // Remover elemento temporário
      document.body.removeChild(element)

      // Criar PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      
      return pdf
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF da simulação",
        variant: "destructive"
      })
      return null
    } finally {
      setGeneratingPdf(false)
    }
  }

  const shareWhatsApp = async () => {
    if (!simulation) {
      toast({
        title: "Erro",
        description: "Execute uma simulação primeiro",
        variant: "destructive"
      })
      return
    }

    const pdf = await generatePDF()
    if (!pdf) return

    // Gerar nome do arquivo
    const fileName = `simulacao-credmar-${new Date().toISOString().split('T')[0]}.pdf`
    
    // Fazer download do PDF
    pdf.save(fileName)

    // Preparar mensagem para WhatsApp
    const message = `*CREDMAR - Simulacao de Emprestimo*

*RESUMO DA SIMULACAO:*

*Valor Solicitado:* ${formatCurrency(formData.requestedAmount)}
*Valor da Parcela:* ${formatCurrency(simulation.installmentValue)}
*Numero de Parcelas:* ${formData.installments}x
*Taxa de Juros:* ${formData.interestRate}% ao mes

*Tipo:* ${loanTypeLabels[formData.loanType]}

O PDF com todos os detalhes foi baixado no seu dispositivo.

Entre em contato para mais informacoes!`

    // Abrir WhatsApp com a mensagem
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')

    toast({
      title: "Sucesso",
      description: "PDF gerado e WhatsApp aberto para compartilhamento!"
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Simulação de Empréstimos</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Simulação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Dados da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loanType">Tipo de Empréstimo</Label>
              <Select
                value={formData.loanType}
                onValueChange={(value: LoanType) => 
                  setFormData(prev => ({ ...prev, loanType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(loanTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodicityId">Tipo de Cobrança</Label>
              <Select
                value={formData.periodicityId}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, periodicityId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a periodicidade" />
                </SelectTrigger>
                <SelectContent>
                  {periodicities.map((periodicity) => (
                    <SelectItem key={periodicity.id} value={periodicity.id}>
                      {periodicity.name}
                      {periodicity.description && ` - ${periodicity.description}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestedAmount">Valor Solicitado (R$)</Label>
              <Input
                id="requestedAmount"
                type="number"
                step="0.01"
                min="0"
                value={formData.requestedAmount || ''}
                onChange={(e) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    requestedAmount: parseFloat(e.target.value) || 0 
                  }))
                }
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installments">Número de Prestações</Label>
              <Input
                id="installments"
                type="number"
                min="1"
                value={formData.installments || ''}
                onChange={(e) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    installments: parseInt(e.target.value) || 1 
                  }))
                }
                placeholder="12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestRate">Taxa de Juros (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                min="0"
                value={formData.interestRate || ''}
                onChange={(e) => 
                  setFormData(prev => ({ 
                    ...prev, 
                    interestRate: parseFloat(e.target.value) || 0 
                  }))
                }
                placeholder="2,50"
              />
            </div>

            <Button 
              onClick={handleCalculate} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Calculando...' : 'Calcular Empréstimo'}
            </Button>
          </CardContent>
        </Card>

        {/* Resumo da Simulação */}
        {simulation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Resumo da Simulação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Valor Solicitado</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(formData.requestedAmount)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(simulation.totalAmount)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total de Juros</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {formatCurrency(simulation.totalInterest)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Taxa Efetiva</p>
                  <p className="text-lg font-semibold">
                    {simulation.effectiveRate.toFixed(2)}%
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {formData.loanType === 'INTEREST_ONLY' 
                      ? 'Parcela Mensal (só juros)' 
                      : formData.loanType === 'SAC'
                      ? 'Primeira Parcela'
                      : 'Valor da Parcela'
                    }
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(simulation.installmentValue)}
                  </p>
                </div>
              </div>

              <Badge variant="outline" className="w-full justify-center">
                {loanTypeLabels[formData.loanType]}
              </Badge>

              <div className="pt-4 border-t">
                <Button
                  onClick={shareWhatsApp}
                  disabled={generatingPdf}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  {generatingPdf ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Compartilhar no WhatsApp
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Gera PDF e abre WhatsApp para compartilhar
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabela de Parcelas */}
      {simulation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Detalhamento das Parcelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Juros</TableHead>
                    <TableHead>Parcela a Pagar</TableHead>
                    <TableHead>Saldo Devedor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simulation.installments.map((installment) => (
                    <TableRow key={installment.number}>
                      <TableCell className="font-medium">
                        {installment.number}
                      </TableCell>
                      <TableCell>
                        {formatDate(installment.dueDate)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(installment.principalAmount)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(installment.interestAmount)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(installment.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(installment.remainingBalance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}