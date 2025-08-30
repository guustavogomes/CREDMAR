// Atualizar o pagamento para usar a imagem SVG criada
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updatePaymentImage() {
  console.log('🔄 Atualizando imagem do pagamento de teste...');

  try {
    // Buscar o pagamento do usuário de teste
    const payment = await prisma.payment.findFirst({
      where: {
        user: {
          email: 'organizaemprestimos40@gmail.com'
        },
        status: 'PENDING'
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

    if (!payment) {
      console.log('❌ Pagamento de teste não encontrado');
      return;
    }

    console.log('✅ Pagamento encontrado:', payment.id);
    console.log('👤 Usuário:', payment.user.email);

    // Atualizar para usar a imagem SVG
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        proofImage: '/uploads/proofs/test-comprovante-email.svg'
      }
    });

    console.log('✅ Imagem do pagamento atualizada');
    console.log('🖼️ Nova URL:', updatedPayment.proofImage);

    console.log('\n🎯 Agora:');
    console.log('1. Atualize a página no navegador (F5)');
    console.log('2. A imagem do comprovante deve aparecer');
    console.log('3. Clique em "Aprovar" para testar o email');

  } catch (error) {
    console.error('❌ Erro ao atualizar pagamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
updatePaymentImage().catch(console.error);