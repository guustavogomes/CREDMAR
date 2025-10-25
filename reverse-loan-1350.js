/**
 * Script para estornar automaticamente as parcelas pagas do empréstimo de R$ 1.350
 */

const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function reverseLoan1350() {
  try {
    console.log('🔄 Estornando parcelas do empréstimo de R$ 1.350...\n')

    // Buscar empréstimos com totalAmount = 1350 e parcelas pagas
    const loans = await db.loan.findMany({
      where: {
        totalAmount: 1350
      },
      include: {
        customer: true,
        creditor: true,
        user: true,
        installments: {
          where: {
            status: 'PAID'
          },
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

    for (const loan of loans) {
      console.log(`📋 EMPRÉSTIMO: ${loan.customer?.nomeCompleto} - R$ ${loan.totalAmount}`)
      
      if (loan.installments.length === 0) {
        console.log('   ℹ️  Nenhuma parcela paga para estornar\n')
        continue
      }

      console.log(`   📊 Encontradas ${loan.installments.length} parcela(s) paga(s)`)

      for (const installment of loan.installments) {
        console.log(`\n   🔄 Estornando parcela ${installment.installmentNumber}...`)
        console.log(`      ID: ${installment.id}`)
        console.log(`      Valor pago: R$ ${installment.paidAmount?.toFixed(2)}`)

        try {
          // 1. Verificar movimentações no fluxo de caixa ANTES do estorno
          const movementsBefore = await db.cashFlow.findMany({
            where: {
              installmentId: installment.id
            }
          })

          console.log(`      💰 Movimentações a serem removidas: ${movementsBefore.length}`)

          // 2. Estornar a parcela (atualizar status)
          const updatedInstallment = await db.installment.update({
            where: { id: installment.id },
            data: {
              paidAmount: 0,
              status: 'PENDING',
              paidAt: null
            }
          })

          console.log(`      ✅ Parcela estornada: ${updatedInstallment.status}`)

          // 3. Remover TODAS as movimentações do fluxo de caixa
          const deletedMovements = await db.cashFlow.deleteMany({
            where: {
              installmentId: installment.id,
              userId: loan.user.id
            }
          })

          console.log(`      🗑️  Movimentações removidas: ${deletedMovements.count}`)

          // 4. Verificar se foi limpo corretamente
          const movementsAfter = await db.cashFlow.findMany({
            where: {
              installmentId: installment.id
            }
          })

          if (movementsAfter.length === 0) {
            console.log(`      ✅ Fluxo de caixa limpo com sucesso`)
          } else {
            console.log(`      ⚠️  Ainda restam ${movementsAfter.length} movimentações`)
          }

        } catch (error) {
          console.error(`      ❌ Erro ao estornar parcela ${installment.installmentNumber}:`, error.message)
        }
      }

      console.log(`\n   🎯 RESULTADO: Empréstimo pronto para novo teste`)
      console.log(`      - Todas as parcelas estornadas`)
      console.log(`      - Fluxo de caixa limpo`)
      console.log(`      - Pode pagar novamente para testar a nova lógica`)
      
      console.log('\n' + '='.repeat(60))
    }

    console.log('\n✅ Estorno concluído! Agora você pode testar o pagamento com a nova lógica.')

  } catch (error) {
    console.error('❌ Erro durante o estorno:', error)
  } finally {
    await db.$disconnect()
  }
}

// Executar o estorno
reverseLoan1350()