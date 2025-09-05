// Script para analisar empréstimo do cliente com CPF 00141891602
const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Carregar variáveis de ambiente do arquivo de produção
require('dotenv').config({ path: path.join(__dirname, '.env.production') });

const prisma = new PrismaClient();

async function analyzeLoanByCPF() {
  try {
    console.log('🔍 Analisando empréstimo do cliente CPF: 00141891602\n');

    // Buscar cliente pelo CPF
    const customer = await prisma.customer.findFirst({
      where: {
        cpf: '00141891602'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        loans: {
          include: {
            periodicity: true,
            installmentRecords: {
              orderBy: {
                installmentNumber: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!customer) {
      console.log('❌ Cliente não encontrado com CPF: 00141891602');
      return;
    }

    console.log('👤 DADOS DO CLIENTE:');
    console.log(`   Nome: ${customer.nomeCompleto}`);
    console.log(`   CPF: ${customer.cpf}`);
    console.log(`   Celular: ${customer.celular}`);
    console.log(`   Empresa: ${customer.user.name} (${customer.user.email})`);
    console.log(`   Endereço: ${customer.endereco}, ${customer.bairro} - ${customer.cidade}/${customer.estado}`);
    console.log(`   CEP: ${customer.cep}`);
    console.log('');

    if (customer.loans.length === 0) {
      console.log('📋 Nenhum empréstimo encontrado para este cliente.');
      return;
    }

    console.log(`📊 TOTAL DE EMPRÉSTIMOS: ${customer.loans.length}\n`);

    // Analisar cada empréstimo
    customer.loans.forEach((loan, index) => {
      console.log(`🏦 EMPRÉSTIMO ${index + 1}:`);
      console.log(`   ID: ${loan.id}`);
      console.log(`   Status: ${loan.status}`);
      console.log(`   Valor Total: R$ ${loan.totalAmount.toFixed(2)}`);
      console.log(`   Valor Antecipado: R$ ${loan.advanceAmount.toFixed(2)}`);
      console.log(`   Valor da Parcela: R$ ${loan.installmentValue.toFixed(2)}`);
      console.log(`   Número de Parcelas: ${loan.installments}`);
      console.log(`   Periodicidade: ${loan.periodicity.name} (${loan.periodicity.description})`);
      console.log(`   Data de Criação: ${loan.createdAt.toLocaleDateString('pt-BR')}`);
      console.log(`   Próximo Pagamento: ${loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString('pt-BR') : 'N/A'}`);
      
      console.log(`\n   📋 PARCELAS GERADAS: ${loan.installmentRecords.length}`);
      
      if (loan.installmentRecords.length > 0) {
        console.log('   ┌─────────────────────────────────────────────────────────────────┐');
        console.log('   │ # │ Vencimento │ Valor    │ Status    │ Pago      │ Multa     │');
        console.log('   ├─────────────────────────────────────────────────────────────────┤');
        
        loan.installmentRecords.forEach(installment => {
          const dueDate = new Date(installment.dueDate).toLocaleDateString('pt-BR');
          const amount = installment.amount.toFixed(2);
          const status = installment.status.padEnd(9);
          const paidAmount = installment.paidAmount ? installment.paidAmount.toFixed(2) : '0,00';
          const fineAmount = installment.fineAmount ? installment.fineAmount.toFixed(2) : '0,00';
          
          console.log(`   │ ${installment.installmentNumber.toString().padStart(2)} │ ${dueDate.padEnd(10)} │ R$ ${amount.padEnd(6)} │ ${status} │ R$ ${paidAmount.padEnd(6)} │ R$ ${fineAmount.padEnd(6)} │`);
        });
        
        console.log('   └─────────────────────────────────────────────────────────────────┘');
        
        // Estatísticas das parcelas
        const paidCount = loan.installmentRecords.filter(i => i.status === 'PAID').length;
        const pendingCount = loan.installmentRecords.filter(i => i.status === 'PENDING').length;
        const overdueCount = loan.installmentRecords.filter(i => i.status === 'OVERDUE').length;
        const totalPaid = loan.installmentRecords.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
        const totalFine = loan.installmentRecords.reduce((sum, i) => sum + (i.fineAmount || 0), 0);
        
        console.log(`\n   📊 ESTATÍSTICAS DAS PARCELAS:`);
        console.log(`      ✅ Pagas: ${paidCount}`);
        console.log(`      ⏳ Pendentes: ${pendingCount}`);
        console.log(`      ⚠️  Atrasadas: ${overdueCount}`);
        console.log(`      💰 Total Pago: R$ ${totalPaid.toFixed(2)}`);
        console.log(`      💸 Total de Multas: R$ ${totalFine.toFixed(2)}`);
      } else {
        console.log('   ⚠️  Nenhuma parcela foi gerada para este empréstimo!');
      }
      
      console.log('\n' + '─'.repeat(80) + '\n');
    });

  } catch (error) {
    console.error('❌ Erro ao analisar empréstimo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar análise
analyzeLoanByCPF();
