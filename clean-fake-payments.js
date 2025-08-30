// Script para limpar pagamentos com URLs fake
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanFakePayments() {
  console.log('🧹 Limpando pagamentos com URLs fake...');

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
            id: true,
            email: true,
            name: true,
            status: true
          }
        }
      }
    });

    console.log(`📊 Encontrados ${paymentsWithFakeUrls.length} pagamentos para limpar`);

    for (const payment of paymentsWithFakeUrls) {
      console.log(`\n🗑️ Removendo pagamento fake do usuário ${payment.user.email}...`);
      
      // Remover o pagamento
      await prisma.payment.delete({
        where: { id: payment.id }
      });

      // Voltar o status do usuário para PENDING_PAYMENT se necessário
      if (payment.user.status === 'PENDING_APPROVAL') {
        await prisma.user.update({
          where: { id: payment.user.id },
          data: { status: 'PENDING_PAYMENT' }
        });
        console.log(`   ↩️ Status do usuário voltou para PENDING_PAYMENT`);
      }

      console.log(`   ✅ Pagamento ${payment.id} removido`);
    }

    // Fazer o mesmo para installments se houver
    const installmentsWithFakeUrls = await prisma.installment.findMany({
      where: {
        proofImage: {
          startsWith: 'https://example.com'
        }
      }
    });

    console.log(`📊 Encontradas ${installmentsWithFakeUrls.length} parcelas para limpar`);

    for (const installment of installmentsWithFakeUrls) {
      console.log(`🗑️ Removendo comprovante fake da parcela ${installment.id}...`);
      
      await prisma.installment.update({
        where: { id: installment.id },
        data: {
          proofImage: null,
          proofStatus: 'PENDING'
        }
      });

      console.log(`   ✅ Comprovante removido da parcela ${installment.id}`);
    }

    console.log('\n🎉 Limpeza concluída! Os usuários agora podem enviar novos comprovantes.');

  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
cleanFakePayments().catch(console.error);