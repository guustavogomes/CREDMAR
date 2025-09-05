// Script para corrigir TODOS os empréstimos com parcelas faltantes
// GERA APENAS AS PARCELAS QUE ESTÃO FALTANDO
const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Carregar variáveis de ambiente do arquivo de produção
require('dotenv').config({ path: path.join(__dirname, '.env.production'), override: true });

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function fixAllMissingInstallments() {
  try {
    console.log('🔧 CORREÇÃO AUTOMÁTICA - Todas as parcelas faltantes');
    console.log('⚠️  ATENÇÃO: Este script irá INSERIR dados no banco de produção!\n');

    // Testar conexão primeiro
    console.log('🔌 Testando conexão com o banco...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Buscar todos os empréstimos com suas parcelas
    console.log('📊 Buscando empréstimos com inconsistências...');
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
            name: true,
            intervalType: true,
            intervalValue: true
          }
        },
        installmentRecords: {
          select: {
            installmentNumber: true,
            status: true,
            dueDate: true,
            amount: true
          },
          orderBy: { installmentNumber: 'asc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filtrar apenas empréstimos com inconsistências
    const inconsistentLoans = loans.filter(loan => {
      const configuredInstallments = loan.installments;
      const generatedInstallments = loan.installmentRecords.length;
      return configuredInstallments !== generatedInstallments && configuredInstallments > generatedInstallments;
    });

    console.log(`📋 Empréstimos com parcelas faltantes: ${inconsistentLoans.length}\n`);

    if (inconsistentLoans.length === 0) {
      console.log('✅ Nenhum empréstimo com parcelas faltantes encontrado!');
      return;
    }

    // Processar cada empréstimo
    let totalFixed = 0;
    let totalInstallmentsCreated = 0;

    for (const loan of inconsistentLoans) {
      console.log(`\n🔧 Processando: ${loan.customer.nomeCompleto} (${loan.customer.cpf})`);
      console.log(`   Empréstimo ID: ${loan.id}`);
      console.log(`   Status: ${loan.status}`);
      console.log(`   Configurado: ${loan.installments} parcelas`);
      console.log(`   Geradas: ${loan.installmentRecords.length} parcelas`);
      
      const missingCount = loan.installments - loan.installmentRecords.length;
      console.log(`   Faltam: ${missingCount} parcelas`);

      try {
        // Calcular parcelas faltantes
        const existingNumbers = loan.installmentRecords.map(inst => inst.installmentNumber);
        const missingNumbers = [];
        
        for (let i = 1; i <= loan.installments; i++) {
          if (!existingNumbers.includes(i)) {
            missingNumbers.push(i);
          }
        }

        console.log(`   📋 Parcelas a gerar: ${missingNumbers.join(', ')}`);

        // Calcular datas de vencimento baseadas na periodicidade
        const lastInstallment = loan.installmentRecords[loan.installmentRecords.length - 1];
        const lastDueDate = new Date(lastInstallment.dueDate);
        
        console.log(`   📅 Última parcela: ${lastDueDate.toLocaleDateString('pt-BR')}`);
        
        // Gerar as parcelas faltantes
        const newInstallments = [];
        let currentDate = new Date(lastDueDate);
        
        for (const installmentNumber of missingNumbers) {
          // Avançar baseado na periodicidade
          if (loan.periodicity.intervalType === 'DAILY') {
            // Para diário, avançar dia por dia (pulando domingos se necessário)
            do {
              currentDate.setDate(currentDate.getDate() + 1);
            } while (currentDate.getDay() === 0); // Pular domingos
          } else if (loan.periodicity.intervalType === 'WEEKLY') {
            // Para semanal, avançar por semanas
            currentDate.setDate(currentDate.getDate() + (7 * loan.periodicity.intervalValue));
          } else if (loan.periodicity.intervalType === 'MONTHLY') {
            // Para mensal, avançar por meses
            currentDate.setMonth(currentDate.getMonth() + loan.periodicity.intervalValue);
          } else {
            // Fallback: avançar por dias
            currentDate.setDate(currentDate.getDate() + loan.periodicity.intervalValue);
          }
          
          newInstallments.push({
            loanId: loan.id,
            installmentNumber: installmentNumber,
            dueDate: new Date(currentDate),
            amount: loan.installmentValue,
            paidAmount: 0,
            fineAmount: 0,
            status: 'PENDING',
            proofImage: null,
            proofStatus: 'PENDING',
            paidAt: null
          });
          
          console.log(`      Parcela ${installmentNumber}: ${currentDate.toLocaleDateString('pt-BR')} - R$ ${loan.installmentValue.toFixed(2)}`);
        }

        // Inserir as parcelas em uma transação
        const result = await prisma.$transaction(async (tx) => {
          const createdInstallments = await tx.installment.createMany({
            data: newInstallments,
            skipDuplicates: true
          });
          
          return createdInstallments;
        });

        console.log(`   ✅ ${result.count} parcelas inseridas com sucesso!`);
        totalFixed++;
        totalInstallmentsCreated += result.count;

      } catch (error) {
        console.error(`   ❌ Erro ao processar empréstimo ${loan.id}:`, error.message);
        continue;
      }
    }

    // Resumo final
    console.log('\n' + '═'.repeat(80));
    console.log('📊 RESUMO DA CORREÇÃO:');
    console.log(`   ✅ Empréstimos corrigidos: ${totalFixed} de ${inconsistentLoans.length}`);
    console.log(`   📋 Total de parcelas criadas: ${totalInstallmentsCreated}`);
    
    if (totalFixed === inconsistentLoans.length) {
      console.log('🎉 Todos os empréstimos foram corrigidos com sucesso!');
    } else {
      console.log(`⚠️  ${inconsistentLoans.length - totalFixed} empréstimos não puderam ser corrigidos.`);
    }

    console.log('\n✅ Correção automática concluída!');
    console.log('🔒 Todas as parcelas foram inseridas em transações seguras.');

  } catch (error) {
    console.error('❌ Erro na correção automática:', error);
    if (error.code) {
      console.error('   Código do erro:', error.code);
    }
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexão com banco de dados fechada.');
  }
}

// Executar correção automática
fixAllMissingInstallments();
