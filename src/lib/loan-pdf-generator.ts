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
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('pt-BR')
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
      if (loanData.installmentDetails) {
        return loanData.installmentDetails
      }

      const schedule = []
      const startDate = new Date(loanData.nextPaymentDate)
      
      for (let i = 1; i <= loanData.installments; i++) {
        const dueDate = new Date(startDate)
        dueDate.setMonth(dueDate.getMonth() + (i - 1))
        
        // Cálculo básico para quando não temos detalhes específicos
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

    const installmentSchedule = generateInstallmentSchedule()

    // Criar elemento temporário com o conteúdo do empréstimo
    const element = document.createElement('div')
    element.style.padding = '20px'
    element.style.backgroundColor = 'white'
    element.style.fontFamily = 'Arial, sans-serif'
    element.style.width = '800px'
    
    element.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 2px;"><span style="color: #dc2626;">CRED</span><span style="color: #1e40af;">MAR</span></h1>
        <p style="color: #666; margin: 5px 0 0 0; font-size: 11px; font-style: italic;">Seu Crédito, Sua Força!</p>
        <h2 style="color: #1e40af; margin: 20px 0 5px 0; font-size: 20px;">Contrato de Empréstimo</h2>
        <p style="color: #666; margin: 0;">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">Dados do Cliente</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px;">
          <div><strong>Nome:</strong><br>${loanData.customer.nomeCompleto}</div>
          <div><strong>CPF:</strong><br>${loanData.customer.cpf}</div>
          ${loanData.customer.telefone ? `<div><strong>Telefone:</strong><br>${loanData.customer.telefone}</div>` : ''}
          ${loanData.customer.route ? `<div><strong>Intermediador:</strong><br>${loanData.customer.route.description}</div>` : '<div><strong>Intermediador:</strong><br>Capital Próprio</div>'}
        </div>
      </div>

      ${loanData.creditor ? `
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #059669; margin: 0 0 10px 0; font-size: 16px;">Dados do Credor</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px;">
            <div><strong>Nome:</strong><br>${loanData.creditor.nome}</div>
            <div><strong>CPF:</strong><br>${loanData.creditor.cpf}</div>
          </div>
        </div>
      ` : ''}

      <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">Dados do Empréstimo</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; font-size: 11px; margin-bottom: 10px;">
          <div><strong>Contrato:</strong><br>#${loanData.id.slice(-8)}</div>
          <div><strong>Data:</strong><br>${formatDate(loanData.startDate)}</div>
          <div><strong>Tipo:</strong><br>${getLoanTypeName(loanData.loanType)}</div>
          <div><strong>Periodicidade:</strong><br>${loanData.periodicity.name}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; font-size: 11px;">
          <div><strong>Valor:</strong><br>${formatCurrency(loanData.totalAmount)}</div>
          <div><strong>Parcelas:</strong><br>${loanData.installments}x</div>
          <div><strong>Taxa:</strong><br>${loanData.interestRate}% a.m.</div>
          <div><strong>1º Vencimento:</strong><br>${formatDate(loanData.nextPaymentDate)}</div>
        </div>
      </div>

      <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h3 style="color: #059669; margin: 0 0 10px 0; font-size: 16px;">Resumo Financeiro</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; font-size: 11px;">
          <div><strong style="color: #059669;">Valor da Parcela:</strong><br><span style="color: #059669; font-size: 16px; font-weight: bold;">${formatCurrency(loanData.installmentValue)}</span></div>
          <div><strong style="color: #ea580c;">Total de Juros:</strong><br><span style="color: #ea580c; font-size: 16px; font-weight: bold;">${formatCurrency(totalInterest)}</span></div>
          <div><strong style="color: #1e40af;">Total a Pagar:</strong><br><span style="color: #1e40af; font-size: 16px; font-weight: bold;">${formatCurrency(totalToPay)}</span></div>
        </div>
      </div>

      ${(loanData.commission || loanData.creditorCommission) ? `
        <div style="background: #fef3c7; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #d97706; margin: 0 0 8px 0; font-size: 12px;">Comissões sobre Valor Emprestado</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 8px;">
            ${loanData.commission && loanData.customer.route ? `
              <div style="background: #fff; padding: 8px; border-radius: 4px; border-left: 3px solid #d97706;">
                <div style="font-weight: bold; color: #d97706; margin-bottom: 3px; font-size: 9px;">Comissão do Intermediador</div>
                <div style="margin-bottom: 2px;"><strong>Intermediador:</strong> ${loanData.customer.route.description}</div>
                <div style="margin-bottom: 2px;"><strong>Percentual:</strong> ${loanData.commission}%</div>
                <div style="margin-bottom: 2px;"><strong>Base de Cálculo:</strong> ${formatCurrency(loanData.totalAmount)}</div>
                <div style="font-size: 9px; font-weight: bold; color: #d97706;"><strong>Valor da Comissão:</strong> ${formatCurrency((loanData.totalAmount * loanData.commission) / 100)}</div>
              </div>
            ` : ''}
            ${loanData.creditorCommission && loanData.creditor ? `
              <div style="background: #fff; padding: 8px; border-radius: 4px; border-left: 3px solid #059669;">
                <div style="font-weight: bold; color: #059669; margin-bottom: 3px; font-size: 9px;">Comissão do Credor</div>
                <div style="margin-bottom: 2px;"><strong>Credor:</strong> ${loanData.creditor.nome}</div>
                <div style="margin-bottom: 2px;"><strong>Percentual:</strong> ${loanData.creditorCommission}%</div>
                <div style="margin-bottom: 2px;"><strong>Base de Cálculo:</strong> ${formatCurrency(loanData.totalAmount)}</div>
                <div style="font-size: 9px; font-weight: bold; color: #059669;"><strong>Valor da Comissão:</strong> ${formatCurrency((loanData.totalAmount * loanData.creditorCommission) / 100)}</div>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">Cronograma de Pagamentos</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; background: white; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background: #1e40af; color: white;">
                <th style="padding: 8px; text-align: center; border: 1px solid #1e40af;">Parcela</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #1e40af;">Vencimento</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #1e40af;">Principal</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #1e40af;">Juros</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #1e40af;">Valor Total</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #1e40af;">Saldo Devedor</th>
              </tr>
            </thead>
            <tbody>
              ${installmentSchedule.slice(0, 12).map((installment, index) => `
                <tr style="background: ${index % 2 === 0 ? '#f8fafc' : 'white'};">
                  <td style="padding: 6px; text-align: center; border: 1px solid #e2e8f0;">${installment.number}</td>
                  <td style="padding: 6px; text-align: center; border: 1px solid #e2e8f0;">${formatDate(installment.dueDate)}</td>
                  <td style="padding: 6px; text-align: right; border: 1px solid #e2e8f0;">${formatCurrency(installment.principalAmount)}</td>
                  <td style="padding: 6px; text-align: right; border: 1px solid #e2e8f0;">${formatCurrency(installment.interestAmount)}</td>
                  <td style="padding: 6px; text-align: right; border: 1px solid #e2e8f0; font-weight: bold;">${formatCurrency(installment.totalAmount)}</td>
                  <td style="padding: 6px; text-align: right; border: 1px solid #e2e8f0;">${formatCurrency(installment.remainingBalance)}</td>
                </tr>
              `).join('')}
              ${installmentSchedule.length > 12 ? `
                <tr>
                  <td colspan="6" style="padding: 8px; text-align: center; font-style: italic; color: #666; border: 1px solid #e2e8f0; background: #f1f5f9;">
                    ... e mais ${installmentSchedule.length - 12} parcelas (cronograma completo disponível no sistema)
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
        <div style="margin-top: 10px; font-size: 10px; color: #666; text-align: center;">
          <strong>Resumo:</strong> ${loanData.installments} parcelas de ${formatCurrency(loanData.installmentValue)} • 
          Total de Juros: ${formatCurrency(totalInterest)} • 
          Total a Pagar: ${formatCurrency(totalToPay)}
        </div>
      </div>

      ${loanData.observation ? `
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #475569; margin: 0 0 10px 0; font-size: 16px;">Observações</h3>
          <p style="margin: 0; font-size: 12px; line-height: 1.4;">${loanData.observation}</p>
        </div>
      ` : ''}

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div style="text-align: center; width: 200px;">
            <div style="border-bottom: 1px solid #000; margin-bottom: 5px; height: 1px;"></div>
            <p style="margin: 0; font-size: 12px; font-weight: bold;">Cliente</p>
            <p style="margin: 0; font-size: 10px;">${loanData.customer.nomeCompleto}</p>
          </div>
          <div style="text-align: center; width: 200px;">
            <div style="border-bottom: 1px solid #000; margin-bottom: 5px; height: 1px;"></div>
            <p style="margin: 0; font-size: 12px; font-weight: bold;">CREDMAR</p>
            <p style="margin: 0; font-size: 10px;">Sistema de Gestão</p>
          </div>
        </div>
        <p style="color: #666; margin: 0; font-size: 10px;">
          Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}<br>
          CREDMAR - Sistema de Gestão de Empréstimos
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