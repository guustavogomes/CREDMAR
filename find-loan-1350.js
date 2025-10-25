/**
 * Script para encontrar o empréstimo de R$ 1.350 e suas parcelas pagas
 */

const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function findLoan1350() {
  try {
    console.log('🔍 Procurando empréstimo de R$ 1.350...\n')

    // Buscar empréstimos com totalAmount = 1350
    const loans = await db.loan.findMany({
      where: {
        totalAmount: 1350
      },
      include: {
        customer: true,
        creditor: true,
        installments: {
          orderBy: {
            installmentNumber: 'asc'
          }
        }
      }
    })

    if (loans.length === 0) {
      console.log('❌ Nenhum empréstimo de R$ 1.350 encontrado')
      return
    }

    console.log(`✅ Encontrado(s) ${loans.length} empréstimo(s) de R$ 1.350:\n`)

    for (const loan of loans) {
      console.log(`📋 EMPRÉSTIMO ID: ${loan.id}`)
      console.log(`   Cliente: ${loan.customer?.nomeCompleto}`)
      console.log(`   Credor: ${loan.creditor?.name}`)
      console.log(`   Valor: R$ ${loan.totalAmount.toFixed(2)}`)
      console.log(`   Tipo: ${loan.loanType}`)
      console.log(`   Taxa: ${loan.interestRate}%`)
      console.log(`   Parcelas: ${loan.installments}`)
      console.log(`   Comissão Intermediador: ${loan.commission}%`)
      console.log(`   Comissão Credor: ${loan.creditorCommission}%`)

      console.log(`\n   📊 PARCELAS:`)
      
      let hasPaidInstallments = false
      
      for (const installment of loan.installments) {
        const status = installment.status === 'PAID' ? '✅ PAGA' : '⏳ PENDENTE'
        console.log(`      ${installment.installmentNumber}. R$ ${installment.amount.toFixed(2)} - ${status}`)
        
        if (installment.status === 'PAID') {
          hasPaidInstallments = true
          console.log(`         ID: ${installment.id}`)
          console.log(`         Pago: R$ ${installment.paidAmount?.toFixed(2) || '0.00'}`)
          console.log(`         Data: ${installment.paidAt?.toLocaleDateString('pt-BR') || 'N/A'}`)
          
          // Verificar movimentações no fluxo de caixa
          const cashFlowMovements = await db.cashFlow.findMany({
            where: {
              installmentId: installment.id
            },
            include: {
              creditor: true
            }
          })
          
          if (cashFlowMovements.length > 0) {
            console.log(`         💰 Movimentações no fluxo (${cashFlowMovements.length}):`)
            cashFlowMovements.forEach((mov, index) => {
              console.log(`            ${index + 1}. ${mov.type} - ${mov.category} - R$ ${mov.amount.toFixed(2)} - ${mov.creditor?.name}`)
            })
          }
        }
      }

      if (hasPaidInstallments) {
        console.log(`\n   🔄 Para estornar, use os IDs das parcelas pagas acima`)
        console.log(`   Exemplo de comando para estornar parcela:`)
        const firstPaidInstallment = loan.installments.find(i => i.status === 'PAID')
        if (firstPaidInstallment) {
          console.log(`   POST /api/loans/${loan.id}/installments/${firstPaidInstallment.id}/reverse`)
        }
      } else {
        console.log(`\n   ℹ️  Nenhuma parcela paga para estornar`)
      }

      console.log('\n' + '='.repeat(60) + '\n')
    }

  } catch (error) {
    console.error('❌ Erro ao buscar empréstimo:', error)
  } finally {
    await db.$disconnect()
  }
}

// Executar a busca
findLoan1350()