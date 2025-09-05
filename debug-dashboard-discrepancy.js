// Script para investigar discrepância entre dashboard e banco
const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Carregar variáveis de ambiente do arquivo de produção
require('dotenv').config({ path: path.join(__dirname, '.env.production'), override: true });

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function debugDashboardDiscrepancy() {
  try {
    console.log('🔍 DEBUG: Discrepância Dashboard vs Banco');
    console.log('⚠️  MODO SOMENTE LEITURA - Nenhuma alteração será feita\n');

    // Testar conexão primeiro
    console.log('🔌 Testando conexão com o banco...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Data de hoje
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log(`📅 Data de hoje: ${today.toLocaleDateString('pt-BR')}`);
    console.log(`   Início do dia: ${startOfToday.toISOString()}`);
    console.log(`   Fim do dia: ${endOfToday.toISOString()}\n`);

    // Buscar usuário
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }

    console.log(`👤 Usuário: ${user.email}\n`);

    // 1. CONSULTA EXATA DA API DO DASHBOARD
    console.log('1️⃣ CONSULTA EXATA DA API DO DASHBOARD:');
    console.log('─'.repeat(60));

    const duesToday = await prisma.installment.findMany({
      where: {
        loan: { userId: user.id },
        dueDate: {
          gte: startOfToday,
          lt: endOfToday
        }
      },
      include: {
        loan: {
          include: { customer: true }
        }
      }
    });

    console.log(`   Total de parcelas encontradas: ${duesToday.length}`);

    // Separar por status
    const duesTodayPending = duesToday.filter(inst => inst.status === 'PENDING' || inst.status === 'OVERDUE');
    const duesTodayPaid = duesToday.filter(inst => inst.status === 'PAID');

    console.log(`   Parcelas pendentes: ${duesTodayPending.length}`);
    console.log(`   Parcelas pagas: ${duesTodayPaid.length}`);

    // 2. CONSULTA MAIS AMPLA - TODAS AS PARCELAS DE HOJE (SEM FILTRO DE USUÁRIO)
    console.log('\n2️⃣ CONSULTA MAIS AMPLA - TODAS AS PARCELAS DE HOJE:');
    console.log('─'.repeat(60));

    const allTodayInstallments = await prisma.installment.findMany({
      where: {
        dueDate: {
          gte: startOfToday,
          lt: endOfToday
        }
      },
      include: {
        loan: {
          include: { 
            customer: true,
            user: true
          }
        }
      },
      orderBy: { installmentNumber: 'asc' }
    });

    console.log(`   Total de parcelas de hoje (todos os usuários): ${allTodayInstallments.length}`);

    // Agrupar por usuário
    const byUser = allTodayInstallments.reduce((acc, inst) => {
      const userId = inst.loan.userId;
      if (!acc[userId]) {
        acc[userId] = {
          userEmail: inst.loan.user.email,
          installments: []
        };
      }
      acc[userId].installments.push(inst);
      return acc;
    }, {});

    console.log('\n   Distribuição por usuário:');
    Object.entries(byUser).forEach(([userId, data]) => {
      const pending = data.installments.filter(inst => inst.status === 'PENDING' || inst.status === 'OVERDUE').length;
      const paid = data.installments.filter(inst => inst.status === 'PAID').length;
      console.log(`      ${data.userEmail}: ${data.installments.length} parcelas (${pending} pendentes, ${paid} pagas)`);
    });

    // 3. VERIFICAR SE HÁ PROBLEMA DE FUSO HORÁRIO
    console.log('\n3️⃣ VERIFICAÇÃO DE FUSO HORÁRIO:');
    console.log('─'.repeat(60));

    console.log(`   Data atual do servidor: ${today.toISOString()}`);
    console.log(`   Fuso horário: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    console.log(`   Offset UTC: ${today.getTimezoneOffset()} minutos`);

    // Verificar parcelas com datas próximas
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);
    
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1);

    const yesterdayCount = await prisma.installment.count({
      where: {
        loan: { userId: user.id },
        dueDate: {
          gte: yesterdayStart,
          lt: yesterdayEnd
        }
      }
    });

    const tomorrowCount = await prisma.installment.count({
      where: {
        loan: { userId: user.id },
        dueDate: {
          gte: tomorrowStart,
          lt: tomorrowEnd
        }
      }
    });

    console.log(`   Parcelas de ontem: ${yesterdayCount}`);
    console.log(`   Parcelas de amanhã: ${tomorrowCount}`);

    // 4. VERIFICAR SE HÁ PARCELAS COM DATAS DIFERENTES
    console.log('\n4️⃣ ANÁLISE DETALHADA DAS DATAS:');
    console.log('─'.repeat(60));

    if (allTodayInstallments.length > 0) {
      console.log('   Primeiras 10 parcelas de hoje:');
      allTodayInstallments.slice(0, 10).forEach((inst, index) => {
        const dueDate = new Date(inst.dueDate);
        const dueDateStr = dueDate.toLocaleDateString('pt-BR');
        const dueDateISO = dueDate.toISOString();
        const statusEmoji = inst.status === 'PAID' ? '✅' : inst.status === 'PENDING' ? '⏳' : '❌';
        
        console.log(`      ${index + 1}. ${statusEmoji} ${inst.loan.customer.nomeCompleto} (${inst.loan.user.email})`);
        console.log(`         Parcela ${inst.installmentNumber} • ${dueDateStr} • ${dueDateISO} • R$ ${inst.amount.toFixed(2)} • ${inst.status}`);
      });

      if (allTodayInstallments.length > 10) {
        console.log(`      ... e mais ${allTodayInstallments.length - 10} parcelas`);
      }
    }

    // 5. VERIFICAR SE HÁ PROBLEMA COM MÚLTIPLOS USUÁRIOS
    console.log('\n5️⃣ VERIFICAÇÃO DE MÚLTIPLOS USUÁRIOS:');
    console.log('─'.repeat(60));

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    console.log(`   Total de usuários no sistema: ${allUsers.length}`);
    allUsers.forEach((u, index) => {
      console.log(`      ${index + 1}. ${u.email} (${u.name || 'Sem nome'})`);
    });

    // 6. COMPARAÇÃO FINAL
    console.log('\n6️⃣ COMPARAÇÃO FINAL:');
    console.log('─'.repeat(60));

    console.log(`   Dashboard mostra: ${duesTodayPending.length} parcelas pendentes`);
    console.log(`   Total no banco (usuário atual): ${duesToday.length} parcelas`);
    console.log(`   Total no banco (todos os usuários): ${allTodayInstallments.length} parcelas`);

    if (allTodayInstallments.length > duesToday.length) {
      console.log('\n   ⚠️  POSSÍVEL PROBLEMA DETECTADO!');
      console.log(`   Existem ${allTodayInstallments.length - duesToday.length} parcelas de outros usuários que vencem hoje.`);
      console.log('   Isso pode indicar que:');
      console.log('   1. O usuário logado não tem acesso a todas as parcelas');
      console.log('   2. Há parcelas de outros usuários no sistema');
      console.log('   3. O filtro de usuário está funcionando corretamente');
    } else if (duesToday.length !== 16) {
      console.log('\n   ⚠️  DISCREPÂNCIA DETECTADA!');
      console.log(`   Esperado: 16 parcelas`);
      console.log(`   Encontrado: ${duesToday.length} parcelas`);
      console.log('   Possíveis causas:');
      console.log('   1. Problema de fuso horário');
      console.log('   2. Parcelas com datas diferentes');
      console.log('   3. Filtros incorretos na consulta');
    } else {
      console.log('\n   ✅ Dados estão corretos!');
    }

    console.log('\n✅ Debug da discrepância concluído!');

  } catch (error) {
    console.error('❌ Erro no debug:', error);
    if (error.code) {
      console.error('   Código do erro:', error.code);
    }
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexão com banco de dados fechada.');
  }
}

// Executar debug
debugDashboardDiscrepancy();
