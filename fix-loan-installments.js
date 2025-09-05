// Script para corrigir as parcelas faltantes do empréstimo
// GERA APENAS AS PARCELAS QUE ESTÃO FALTANDO (3 a 10)
const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Carregar variáveis de ambiente do arquivo de produção
require('dotenv').config({ path: path.join(__dirname, '.env.production'), override: true });

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function fixLoanInstallments() {
  try {
    console.log('🔧 CORREÇÃO DE PARCELAS - Empréstimo ID: cmf46mpbg000lwshb4uknntt1');
    console.log('⚠️  ATENÇÃO: Este script irá INSERIR dados no banco de produção!\n');

    const loanId = 'cmf46mpbg000lwshb4uknntt1';
    const customerCpf = '00141891602';

    // Primeiro, verificar o empréstimo atual
    console.log('🔍 Verificando empréstimo atual...');
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        customer: true,
        periodicity: true,
        installmentRecords: {
          orderBy: { installmentNumber: 'asc' }
        }
      }
    });

    if (!loan) {
      console.log('❌ Empréstimo não encontrado!');
      return;
    }

    console.log('✅ Empréstimo encontrado:');
    console.log(`   Cliente: ${loan.customer.nomeCompleto} (${loan.customer.cpf})`);
    console.log(`   Valor Total: R$ ${loan.totalAmount.toFixed(2)}`);
    console.log(`   Parcelas Configuradas: ${loan.installments}`);
    console.log(`   Parcelas Geradas: ${loan.installmentRecords.length}`);
    console.log(`   Periodicidade: ${loan.periodicity.name}\n`);

    // Verificar quantas parcelas faltam
    const existingNumbers = loan.installmentRecords.map(inst => inst.installmentNumber);
    const missingNumbers = [];
    
    for (let i = 1; i <= loan.installments; i++) {
      if (!existingNumbers.includes(i)) {
        missingNumbers.push(i);
      }
    }

    if (missingNumbers.length === 0) {
      console.log('✅ Todas as parcelas já foram geradas!');
      return;
    }

    console.log(`📋 Parcelas faltantes: ${missingNumbers.join(', ')}`);
    console.log(`📊 Total de parcelas a gerar: ${missingNumbers.length}\n`);

    // Calcular as datas de vencimento baseadas na periodicidade
    console.log('📅 Calculando datas de vencimento...');
    
    // Pegar a última data de vencimento existente
    const lastInstallment = loan.installmentRecords[loan.installmentRecords.length - 1];
    const lastDueDate = new Date(lastInstallment.dueDate);
    
    console.log(`   Última parcela: ${lastDueDate.toLocaleDateString('pt-BR')}`);
    
    // Gerar as parcelas faltantes
    const newInstallments = [];
    let currentDate = new Date(lastDueDate);
    
    for (const installmentNumber of missingNumbers) {
      // Avançar para o próximo dia útil (Segunda a Sábado)
      do {
        currentDate.setDate(currentDate.getDate() + 1);
      } while (currentDate.getDay() === 0); // Pular domingos
      
      newInstallments.push({
        loanId: loanId,
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
      
      console.log(`   Parcela ${installmentNumber}: ${currentDate.toLocaleDateString('pt-BR')} - R$ ${loan.installmentValue.toFixed(2)}`);
    }

    console.log('\n🚀 Inserindo parcelas no banco de dados...');
    
    // Inserir as parcelas em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Inserir todas as parcelas de uma vez
      const createdInstallments = await tx.installment.createMany({
        data: newInstallments,
        skipDuplicates: true
      });
      
      return createdInstallments;
    });

    console.log(`✅ ${result.count} parcelas inseridas com sucesso!`);
    
    // Verificar o resultado final
    console.log('\n🔍 Verificando resultado final...');
    const updatedLoan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        installmentRecords: {
          orderBy: { installmentNumber: 'asc' }
        }
      }
    });

    console.log(`📊 Total de parcelas agora: ${updatedLoan.installmentRecords.length}`);
    console.log(`📋 Status das parcelas:`);
    
    const statusCount = updatedLoan.installmentRecords.reduce((acc, inst) => {
      acc[inst.status] = (acc[inst.status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} parcelas`);
    });

    console.log('\n✅ Correção concluída com sucesso!');
    console.log('🔒 Todas as parcelas foram inseridas corretamente.');

  } catch (error) {
    console.error('❌ Erro ao corrigir parcelas:', error);
    if (error.code) {
      console.error('   Código do erro:', error.code);
    }
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexão com banco de dados fechada.');
  }
}

// Executar correção
fixLoanInstallments();
