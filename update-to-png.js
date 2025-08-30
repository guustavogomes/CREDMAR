// Atualizar pagamento para usar PNG
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateToPng() {
  console.log('🔄 Atualizando para PNG...');

  try {
    const payment = await prisma.payment.findFirst({
      where: {
        user: { email: 'organizaemprestimos40@gmail.com' },
        status: 'PENDING'
      }
    });

    if (!payment) {
      console.log('❌ Pagamento não encontrado');
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { proofImage: '/uploads/proofs/test-comprovante-email.png' }
    });

    console.log('✅ Atualizado para PNG');
    console.log('🔄 Atualize a página no navegador');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateToPng().catch(console.error);