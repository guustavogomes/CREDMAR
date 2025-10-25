import { calculateLoanSimulation } from '@/lib/loan-calculations'
import type { LoanType } from '@/types/loan-simulation'

interface LoanPDFData {
  id: string
  totalAmount: number
  loanType: string
  interestRate: number
  installments: number
  installmentValue: number
  nextPaymentDate: string
  startDate: string
  observation?: string
  commission?: number
  creditorCommission?: number
  customer: {
    nomeCompleto: string
    cpf: string
    telefone?: string
    endereco?: string
    route?: {
      description: string
    }
  }
  creditor?: {
    nome: string
    cpf: string
  }
  periodicity: {
    name: string
  }
  installmentDetails?: Array<{
    number: number
    dueDate: string
    principalAmount: number
    interestAmount: number
    totalAmount: number
    remainingBalance: number
  }>
}

export const generateLoanPDF = async (loanData: LoanPDFData) => {
  try {
    // Debug: verificar dados de comissão
    console.log('🔍 DEBUG PDF - Dados de comissão:', {
      commission: loanData.commission,
      creditorCommission: loanData.creditorCommission,
      hasCustomerRoute: !!loanData.customer?.route,
      hasCreditor: !!loanData.creditor,
      customerRoute: loanData.customer?.route?.description,
      creditorName: loanData.creditor?.nome
    })
    
    // Importações dinâmicas para evitar problemas de SSR
    const jsPDF = (await import('jspdf')).default
    const html2canvas = (await import('html2canvas')).default

    // Função para formatar moeda
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    }

    // Função para formatar data
    const formatDate = (dateString: string | undefined | null) => {
      if (!dateString) {
        console.warn('Data não fornecida, usando data atual')
        return new Date().toLocaleDateString('pt-BR')
      }
      
      // Tentar diferentes formatos de data
      let date: Date
      
      // Se já é uma string de data ISO
      if (typeof dateString === 'string' && dateString.includes('T')) {
        date = new Date(dateString)
      }
      // Se é uma string de data simples (YYYY-MM-DD)
      else if (typeof dateString === 'string' && dateString.includes('-')) {
        date = new Date(dateString + 'T00:00:00')
      }
      // Outros formatos
      else {
        date = new Date(dateString)
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Data inválida recebida:', dateString, 'usando data atual')
        return new Date().toLocaleDateString('pt-BR')
      }
      
      return date.toLocaleDateString('pt-BR')
    }

    // Função para obter nome do tipo de empréstimo
    const getLoanTypeName = (type: string) => {
      const types: { [key: string]: string } = {
        'PRICE': 'PRICE - Prestações Fixas',
        'SAC': 'SAC - Sistema de Amortização Constante',
        'SIMPLE_INTEREST': 'Juros Simples',
        'RECURRING_SIMPLE_INTEREST': 'Juros Simples Recorrente',
        'INTEREST_ONLY': 'Apenas Juros'
      }
      return types[type] || type
    }

    // Calcular valores
    const totalInterest = (loanData.installmentValue * loanData.installments) - loanData.totalAmount
    const totalToPay = loanData.installmentValue * loanData.installments

    // Gerar cronograma de parcelas se não fornecido
    const generateInstallmentSchedule = () => {
      console.log('🔍 DEBUG PDF - Cronograma:', {
        hasInstallmentDetails: !!loanData.installmentDetails,
        installmentDetailsLength: loanData.installmentDetails?.length,
        expectedInstallments: loanData.installments
      })
      
      if (loanData.installmentDetails && loanData.installmentDetails.length > 0) {
        console.log('📋 Usando installmentDetails fornecidos:', loanData.installmentDetails.length, 'parcelas')
        return loanData.installmentDetails
      }

      console.log('📋 Gerando cronograma completo para', loanData.installments, 'parcelas')
      
      // Usar simulação correta baseada no tipo de empréstimo
      try {
        const simulation = calculateLoanSimulation({
          loanType: loanData.loanType as LoanType,
          periodicityId: loanData.periodicity?.id || 'monthly',
          requestedAmount: loanData.totalAmount,
          installments: loanData.installments,
          interestRate: loanData.interestRate
        })
        
        console.log('📊 Simulação gerada com', simulation.installments.length, 'parcelas')
        
        // Converter simulação para formato do PDF
        const schedule = simulation.installments.map(inst => ({
          number: inst.number,
          dueDate: inst.dueDate.toISOString().split('T')[0],
          principalAmount: inst.principalAmount,
          interestAmount: inst.interestAmount,
          totalAmount: inst.totalAmount,
          remainingBalance: inst.remainingBalance
        }))
        
        return schedule
        
      } catch (error) {
        console.warn('Erro na simulação, usando cálculo básico:', error)
        
        // Fallback para cálculo básico
        const schedule = []
        const startDate = new Date(loanData.nextPaymentDate)
        
        for (let i = 1; i <= loanData.installments; i++) {
          const dueDate = new Date(startDate)
          dueDate.setMonth(dueDate.getMonth() + (i - 1))
          
          const principalAmount = loanData.totalAmount / loanData.installments
          const interestAmount = loanData.installmentValue - principalAmount
          const remainingBalance = loanData.totalAmount - (principalAmount * i)
          
          schedule.push({
            number: i,
            dueDate: dueDate.toISOString().split('T')[0],
            principalAmount,
            interestAmount,
            totalAmount: loanData.installmentValue,
            remainingBalance: Math.max(0, remainingBalance)
          })
        }
        
        return schedule
      }
    }

    const installmentSchedule = generateInstallmentSchedule()
    
    console.log('📊 DEBUG PDF - Cronograma final:', {
      scheduleLength: installmentSchedule.length,
      expectedInstallments: loanData.installments,
      firstInstallment: installmentSchedule[0],
      lastInstallment: installmentSchedule[installmentSchedule.length - 1]
    })

    // Criar elemento temporário com o conteúdo do empréstimo
    const element = document.createElement('div')
    element.style.padding = '20px'
    element.style.backgroundColor = 'white'
    element.style.fontFamily = 'Arial, sans-serif'
    element.style.width = '800px'
    
    element.innerHTML = `
      <!-- Cabeçalho Compacto -->
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;"><span style="color: #dc2626;">CRED</span><span style="color: #1e40af;">MAR</span></h1>
        <p style="color: #666; margin: 2px 0; font-size: 10px; font-style: italic;">Seu Crédito, Sua Força!</p>
        <h2 style="color: #1e40af; margin: 10px 0 5px 0; font-size: 18px;">Contrato de Empréstimo</h2>
        <p style="color: #666; margin: 0; font-size: 10px;">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <!-- Seção Unificada: Dados Principais -->
      <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          
          <!-- Coluna 1: Cliente e Credor -->
          <div>
            <h3 style="color: #1e40af; margin: 0 0 8px 0; font-size: 14px;">👤 Dados do Cliente</h3>
            <div style="font-size: 10px; margin-bottom: 12px;">
              <div style="margin-bottom: 3px;"><strong>Nome:</strong> ${loanData.customer.nomeCompleto}</div>
              <div style="margin-bottom: 3px;"><strong>CPF:</strong> ${loanData.customer.cpf}</div>
              ${loanData.customer.telefone ? `<div style="margin-bottom: 3px;"><strong>Telefone:</strong> ${loanData.customer.telefone}</div>` : ''}
              <div><strong>Intermediador:</strong> ${loanData.customer.route ? loanData.customer.route.description : 'Capital Próprio'}</div>
            </div>
            
            ${loanData.creditor ? `
              <h3 style="color: #059669; margin: 0 0 8px 0; font-size: 14px;">🏦 Dados do Credor</h3>
              <div style="font-size: 10px;">
                <div style="margin-bottom: 3px;"><strong>Nome:</strong> ${loanData.creditor.nome}</div>
                <div><strong>CPF:</strong> ${loanData.creditor.cpf}</div>
              </div>
            ` : ''}
          </div>
          
          <!-- Coluna 2: Empréstimo e Resumo -->
          <div>
            <h3 style="color: #1e40af; margin: 0 0 8px 0; font-size: 14px;">📋 Dados do Empréstimo</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10px; margin-bottom: 12px;">
              <div><strong>Contrato:</strong><br>#${loanData.id.slice(-8)}</div>
              <div><strong>Data:</strong><br>${formatDate(loanData.startDate || loanData.nextPaymentDate || new Date().toISOString())}</div>
              <div><strong>Tipo:</strong><br>${getLoanTypeName(loanData.loanType)}</div>
              <div><strong>Periodicidade:</strong><br>${loanData.periodicity.name}</div>
              <div><strong>Valor:</strong><br>${formatCurrency(loanData.totalAmount)}</div>
              <div><strong>Parcelas:</strong><br>${loanData.installments}x</div>
              <div><strong>Taxa:</strong><br>${loanData.interestRate}% a.m.</div>
              <div><strong>1º Vencimento:</strong><br>${formatDate(loanData.nextPaymentDate)}</div>
            </div>
            
            <h3 style="color: #059669; margin: 0 0 8px 0; font-size: 14px;">💰 Resumo Financeiro</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 10px;">
              <div><strong style="color: #059669;">Valor da Parcela:</strong><br><span style="color: #059669; font-size: 14px; font-weight: bold;">${formatCurrency(loanData.installmentValue)}</span></div>
              <div><strong style="color: #ea580c;">Total de Juros:</strong><br><span style="color: #ea580c; font-size: 14px; font-weight: bold;">${formatCurrency(totalInterest)}</span></div>
              <div><strong style="color: #1e40af;">Total a Pagar:</strong><br><span style="color: #1e40af; font-size: 14px; font-weight: bold;">${formatCurrency(totalToPay)}</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Seção de Comissões Compacta -->
      ${(loanData.commission || loanData.creditorCommission) ? `
        <div style="background: #fef3c7; padding: 8px; border-radius: 6px; margin-bottom: 12px;">
          <h3 style="color: #d97706; margin: 0 0 6px 0; font-size: 12px;">💼 Comissões sobre Valor Emprestado</h3>
          <div style="display: flex; gap: 20px; font-size: 9px;">
            ${loanData.commission && loanData.customer.route ? `
              <div style="flex: 1;">
                <span style="font-weight: bold; color: #d97706;">Intermediador (${loanData.commission}%):</span>
                <span style="color: #d97706; font-weight: bold; margin-left: 8px;">${formatCurrency((loanData.totalAmount * loanData.commission) / 100)}</span>
                <div style="color: #666; font-size: 8px;">${loanData.customer.route.description}</div>
              </div>
            ` : ''}
            ${loanData.creditorCommission && loanData.creditor ? `
              <div style="flex: 1;">
                <span style="font-weight: bold; color: #059669;">Credor (${loanData.creditorCommission}%):</span>
                <span style="color: #059669; font-weight: bold; margin-left: 8px;">${formatCurrency((loanData.totalAmount * loanData.creditorCommission) / 100)}</span>
                <div style="color: #666; font-size: 8px;">${loanData.creditor.nome}</div>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Cronograma de Pagamentos -->
      <div style="background: #f8fafc; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
        <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 14px;">📅 Cronograma de Pagamentos</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 9px; background: white; border-radius: 4px; overflow: hidden;">
            <thead>
              <tr style="background: #1e40af; color: white;">
                <th style="padding: 6px; text-align: center; border: 1px solid #1e40af; font-size: 9px;">Parcela</th>
                <th style="padding: 6px; text-align: center; border: 1px solid #1e40af; font-size: 9px;">Vencimento</th>
                <th style="padding: 6px; text-align: right; border: 1px solid #1e40af; font-size: 9px;">Principal</th>
                <th style="padding: 6px; text-align: right; border: 1px solid #1e40af; font-size: 9px;">Juros</th>
                <th style="padding: 6px; text-align: right; border: 1px solid #1e40af; font-size: 9px;">Valor Total</th>
                <th style="padding: 6px; text-align: right; border: 1px solid #1e40af; font-size: 9px;">Saldo Devedor</th>
              </tr>
            </thead>
            <tbody>
              ${installmentSchedule.slice(0, 15).map((installment, index) => `
                <tr style="background: ${index % 2 === 0 ? '#f8fafc' : 'white'};">
                  <td style="padding: 4px; text-align: center; border: 1px solid #e2e8f0; font-size: 9px;">${installment.number}</td>
                  <td style="padding: 4px; text-align: center; border: 1px solid #e2e8f0; font-size: 9px;">${formatDate(installment.dueDate)}</td>
                  <td style="padding: 4px; text-align: right; border: 1px solid #e2e8f0; font-size: 9px;">${formatCurrency(installment.principalAmount)}</td>
                  <td style="padding: 4px; text-align: right; border: 1px solid #e2e8f0; font-size: 9px;">${formatCurrency(installment.interestAmount)}</td>
                  <td style="padding: 4px; text-align: right; border: 1px solid #e2e8f0; font-weight: bold; font-size: 9px;">${formatCurrency(installment.totalAmount)}</td>
                  <td style="padding: 4px; text-align: right; border: 1px solid #e2e8f0; font-size: 9px;">${formatCurrency(installment.remainingBalance)}</td>
                </tr>
              `).join('')}
              ${installmentSchedule.length > 15 ? `
                <tr>
                  <td colspan="6" style="padding: 6px; text-align: center; font-style: italic; color: #666; border: 1px solid #e2e8f0; background: #f1f5f9; font-size: 8px;">
                    ... e mais ${installmentSchedule.length - 15} parcelas (cronograma completo disponível no sistema)
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
        <div style="margin-top: 8px; font-size: 9px; color: #666; text-align: center;">
          <strong>Resumo:</strong> ${loanData.installments} parcelas de ${formatCurrency(loanData.installmentValue)} • 
          Total de Juros: ${formatCurrency(totalInterest)} • 
          Total a Pagar: ${formatCurrency(totalToPay)}
        </div>
      </div>

      ${loanData.observation ? `
        <div style="background: #f1f5f9; padding: 8px; border-radius: 6px; margin-bottom: 10px;">
          <h3 style="color: #475569; margin: 0 0 6px 0; font-size: 12px;">📝 Observações</h3>
          <p style="margin: 0; font-size: 10px; line-height: 1.3;">${loanData.observation}</p>
        </div>
      ` : ''}

      <!-- Assinaturas Compactas -->
      <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
          <div style="text-align: center; width: 180px;">
            <div style="border-bottom: 1px solid #000; margin-bottom: 4px; height: 1px;"></div>
            <p style="margin: 0; font-size: 10px; font-weight: bold;">Cliente</p>
            <p style="margin: 0; font-size: 8px;">${loanData.customer.nomeCompleto}</p>
          </div>
          <div style="text-align: center; width: 180px;">
            <div style="border-bottom: 1px solid #000; margin-bottom: 4px; height: 1px;"></div>
            <p style="margin: 0; font-size: 10px; font-weight: bold;">CREDMAR</p>
            <p style="margin: 0; font-size: 8px;">Sistema de Gestão</p>
          </div>
        </div>
        <p style="color: #666; margin: 0; font-size: 8px;">
          Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} • CREDMAR - Sistema de Gestão de Empréstimos
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
    
    // Gerar nome do arquivo
    const fileName = `emprestimo_${loanData.customer.nomeCompleto.replace(/\s+/g, '_')}_${loanData.id.slice(-8)}.pdf`
    
    // Fazer download do PDF
    pdf.save(fileName)
    
    return pdf
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    throw error
  }
}