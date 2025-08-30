// Script para verificar e corrigir URLs fake no banco
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFakeUrls() {
  console.log('🔍 Verificando URLs fake no banco...');

  try {
    // Buscar pagamentos com URLs fake
    const paymentsWithFakeUrls = await prisma.payment.findMany({
      where: {
        proofImage: {
          startsWith: 'https://example.com'
        }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    console.log(`📊 Encontrados ${paymentsWithFakeUrls.length} pagamentos com URLs fake`);

    if (paymentsWithFakeUrls.length > 0) {
      console.log('\n📋 Lista de pagamentos com URLs fake:');
      paymentsWithFakeUrls.forEach((payment, index) => {
        console.log(`${index + 1}. ID: ${payment.id}`);
        console.log(`   Usuário: ${payment.user.email} (${payment.user.name})`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   URL: ${payment.proofImage}`);
        console.log(`   Data: ${payment.createdAt.toLocaleDateString()}`);
        console.log('');
      });

      // Perguntar se quer limpar
      console.log('💡 Para corrigir, você pode:');
      console.log('1. Remover esses pagamentos fake');
      console.log('2. Permitir que os usuários enviem novos comprovantes');
    }

    // Verificar installments também
    const installmentsWithFakeUrls = await prisma.installment.findMany({
      where: {
        proofImage: {
          startsWith: 'https://example.com'
        }
      },
      include: {
        loan: {
          include: {
            customer: {
              select: {
                nomeCompleto: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 Encontradas ${installmentsWithFakeUrls.length} parcelas com URLs fake`);

    if (installmentsWithFakeUrls.length > 0) {
      console.log('\n📋 Lista de parcelas com URLs fake:');
      installmentsWithFakeUrls.forEach((installment, index) => {
        console.log(`${index + 1}. ID: ${installment.id}`);
        console.log(`   Cliente: ${installment.loan.customer.nomeCompleto}`);
        console.log(`   Status: ${installment.status}`);
        console.log(`   URL: ${installment.proofImage}`);
        console.log(`   Vencimento: ${installment.dueDate.toLocaleDateString()}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erro ao verificar URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
checkFakeUrls().catch(console.error);