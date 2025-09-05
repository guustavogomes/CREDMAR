// Script para analisar empréstimo do cliente com CPF 00141891602 via API
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

async function analyzeLoanByCPF() {
  try {
    console.log('🔍 Analisando empréstimo do cliente CPF: 00141891602 via API\n');

    // Primeiro, vamos tentar buscar via API de score de clientes
    const response = await fetch(`${BASE_URL}/api/customers/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Nota: Esta API requer autenticação, então pode não funcionar sem login
      },
      body: JSON.stringify({
        cpf: '00141891602'
      })
    });

    if (!response.ok) {
      console.log('❌ Erro ao buscar dados via API:', response.status, response.statusText);
      console.log('💡 Dica: Execute o servidor local (npm run dev) e faça login primeiro');
      return;
    }

    const data = await response.json();
    
    if (!data.found) {
      console.log('❌ Cliente não encontrado com CPF: 00141891602');
      return;
    }

    console.log('👤 DADOS DO CLIENTE:');
    console.log(`   Nome: ${data.customer.nomeCompleto}`);
    console.log(`   CPF: ${data.customer.cpf}`);
    console.log(`   Celular: ${data.customer.celular}`);
    console.log(`   Empresa: ${data.customer.user.name} (${data.customer.user.email})`);
    console.log(`   Endereço: ${data.customer.endereco}, ${data.customer.bairro} - ${data.customer.cidade}/${data.customer.estado}`);
    console.log(`   CEP: ${data.customer.cep}`);
    console.log('');

    console.log(`📊 TOTAL DE EMPRÉSTIMOS: ${data.loans.length}\n`);

    // Analisar cada empréstimo
    data.loans.forEach((loan, index) => {
      console.log(`🏦 EMPRÉSTIMO ${index + 1}:`);
      console.log(`   ID: ${loan.id}`);
      console.log(`   Status: ${loan.status}`);
      console.log(`   Valor Total: R$ ${loan.totalAmount.toFixed(2)}`);
      console.log(`   Valor Antecipado: R$ ${loan.advanceAmount.toFixed(2)}`);
      console.log(`   Valor da Parcela: R$ ${loan.installmentValue.toFixed(2)}`);
      console.log(`   Número de Parcelas: ${loan.installments}`);
      console.log(`   Data de Criação: ${new Date(loan.createdAt).toLocaleDateString('pt-BR')}`);
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

    // Mostrar score do cliente
    if (data.score) {
      console.log('📈 SCORE DO CLIENTE:');
      console.log(`   Score: ${data.score.score}`);
      console.log(`   Recomendação: ${data.score.recommendation}`);
      console.log(`   Total de Empréstimos: ${data.score.totalLoans}`);
      console.log(`   Empréstimos Ativos: ${data.score.activeLoans}`);
      console.log(`   Empréstimos Concluídos: ${data.score.completedLoans}`);
      console.log(`   Taxa de Inadimplência: ${data.score.defaultRate}%`);
    }

  } catch (error) {
    console.error('❌ Erro ao analisar empréstimo:', error.message);
    console.log('\n💡 Para executar esta análise:');
    console.log('   1. Execute o servidor: npm run dev');
    console.log('   2. Faça login no sistema');
    console.log('   3. Execute este script novamente');
  }
}

// Executar análise
analyzeLoanByCPF();
