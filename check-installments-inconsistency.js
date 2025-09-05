// Script para verificar inconsistências entre parcelas configuradas e geradas
// APENAS LEITURA - NENHUMA ALTERAÇÃO NO BANCO
const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Carregar variáveis de ambiente do arquivo de produção
require('dotenv').config({ path: path.join(__dirname, '.env.production'), override: true });

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function checkInstallmentsInconsistency() {
  try {
    console.log('🔍 VERIFICAÇÃO DE INCONSISTÊNCIAS - Parcelas vs Configuração');
    console.log('⚠️  MODO SOMENTE LEITURA - Nenhuma alteração será feita\n');

    // Testar conexão primeiro
    console.log('🔌 Testando conexão com o banco...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Buscar todos os empréstimos com suas parcelas
    console.log('📊 Buscando todos os empréstimos...');
    const loans = await prisma.loan.findMany({
      include: {
        customer: {
          select: {
            nomeCompleto: true,
            cpf: true
          }
        },
        periodicity: {
          select: {
            name: true
          }
        },
        installmentRecords: {
          select: {
            installmentNumber: true,
            status: true,
            dueDate: true,
            amount: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📋 Total de empréstimos encontrados: ${loans.length}\n`);

    // Verificar inconsistências
    const inconsistentLoans = [];
    const consistentLoans = [];

    loans.forEach(loan => {
      const configuredInstallments = loan.installments;
      const generatedInstallments = loan.installmentRecords.length;
      
      if (configuredInstallments !== generatedInstallments) {
        inconsistentLoans.push({
          ...loan,
          configuredInstallments,
          generatedInstallments,
          difference: configuredInstallments - generatedInstallments
        });
      } else {
        consistentLoans.push(loan);
      }
    });

    // Exibir resultados
    console.log('📊 RESULTADO DA VERIFICAÇÃO:');
    console.log(`   ✅ Empréstimos consistentes: ${consistentLoans.length}`);
    console.log(`   ⚠️  Empréstimos com inconsistência: ${inconsistentLoans.length}\n`);

    if (inconsistentLoans.length > 0) {
      console.log('🚨 EMPRÉSTIMOS COM INCONSISTÊNCIA:');
      console.log('═'.repeat(100));
      
      inconsistentLoans.forEach((loan, index) => {
        console.log(`\n${index + 1}. EMPRÉSTIMO ID: ${loan.id}`);
        console.log(`   Cliente: ${loan.customer.nomeCompleto} (${loan.customer.cpf})`);
        console.log(`   Status: ${loan.status}`);
        console.log(`   Valor Total: R$ ${loan.totalAmount.toFixed(2)}`);
        console.log(`   Valor da Parcela: R$ ${loan.installmentValue.toFixed(2)}`);
        console.log(`   Periodicidade: ${loan.periodicity.name}`);
        console.log(`   Data de Criação: ${loan.createdAt.toLocaleDateString('pt-BR')}`);
        console.log(`   📊 INCONSISTÊNCIA:`);
        console.log(`      Parcelas Configuradas: ${loan.configuredInstallments}`);
        console.log(`      Parcelas Geradas: ${loan.generatedInstallments}`);
        console.log(`      Diferença: ${loan.difference > 0 ? '+' : ''}${loan.difference} parcelas`);
        
        if (loan.difference > 0) {
          console.log(`      ⚠️  FALTAM ${loan.difference} parcelas!`);
        } else {
          console.log(`      ⚠️  SOBRAM ${Math.abs(loan.difference)} parcelas!`);
        }

        // Mostrar parcelas existentes
        if (loan.installmentRecords.length > 0) {
          console.log(`   📋 Parcelas Existentes:`);
          const statusCount = loan.installmentRecords.reduce((acc, inst) => {
            acc[inst.status] = (acc[inst.status] || 0) + 1;
            return acc;
          }, {});
          
          Object.entries(statusCount).forEach(([status, count]) => {
            console.log(`      ${status}: ${count} parcelas`);
          });

          // Mostrar algumas parcelas como exemplo
          console.log(`   📅 Primeiras parcelas:`);
          loan.installmentRecords.slice(0, 3).forEach(inst => {
            const dueDate = new Date(inst.dueDate).toLocaleDateString('pt-BR');
            console.log(`      Parcela ${inst.installmentNumber}: ${dueDate} - R$ ${inst.amount.toFixed(2)} - ${inst.status}`);
          });
          
          if (loan.installmentRecords.length > 3) {
            console.log(`      ... e mais ${loan.installmentRecords.length - 3} parcelas`);
          }
        } else {
          console.log(`   ⚠️  NENHUMA parcela foi gerada!`);
        }
        
        console.log('─'.repeat(100));
      });

      // Resumo das inconsistências
      console.log('\n📊 RESUMO DAS INCONSISTÊNCIAS:');
      const missingInstallments = inconsistentLoans.filter(loan => loan.difference > 0);
      const extraInstallments = inconsistentLoans.filter(loan => loan.difference < 0);
      const noInstallments = inconsistentLoans.filter(loan => loan.generatedInstallments === 0);

      if (missingInstallments.length > 0) {
        console.log(`\n   ⚠️  EMPRÉSTIMOS COM PARCELAS FALTANTES: ${missingInstallments.length}`);
        missingInstallments.forEach(loan => {
          console.log(`      - ${loan.customer.nomeCompleto} (${loan.customer.cpf}): Faltam ${loan.difference} parcelas`);
        });
      }

      if (extraInstallments.length > 0) {
        console.log(`\n   ⚠️  EMPRÉSTIMOS COM PARCELAS EXTRAS: ${extraInstallments.length}`);
        extraInstallments.forEach(loan => {
          console.log(`      - ${loan.customer.nomeCompleto} (${loan.customer.cpf}): Sobram ${Math.abs(loan.difference)} parcelas`);
        });
      }

      if (noInstallments.length > 0) {
        console.log(`\n   🚨 EMPRÉSTIMOS SEM PARCELAS: ${noInstallments.length}`);
        noInstallments.forEach(loan => {
          console.log(`      - ${loan.customer.nomeCompleto} (${loan.customer.cpf}): ${loan.configuredInstallments} parcelas configuradas, 0 geradas`);
        });
      }

      // Estatísticas gerais
      const totalMissing = missingInstallments.reduce((sum, loan) => sum + loan.difference, 0);
      const totalExtra = extraInstallments.reduce((sum, loan) => sum + Math.abs(loan.difference), 0);
      
      console.log(`\n📈 ESTATÍSTICAS GERAIS:`);
      console.log(`   Total de parcelas faltantes: ${totalMissing}`);
      console.log(`   Total de parcelas extras: ${totalExtra}`);
      console.log(`   Empréstimos afetados: ${inconsistentLoans.length} de ${loans.length}`);

    } else {
      console.log('✅ Nenhuma inconsistência encontrada!');
      console.log('🎉 Todos os empréstimos estão com o número correto de parcelas.');
    }

    console.log('\n✅ Verificação concluída com sucesso!');
    console.log('🔒 Nenhuma alteração foi feita no banco de dados.');

  } catch (error) {
    console.error('❌ Erro ao verificar inconsistências:', error);
    if (error.code) {
      console.error('   Código do erro:', error.code);
    }
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexão com banco de dados fechada.');
  }
}

// Executar verificação
checkInstallmentsInconsistency();
