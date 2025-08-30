// Corrigir imagem para Docker
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixImage() {
  console.log('🐳 Corrigindo imagem para Docker...');

  try {
    // Imagem base64 pequena (pixel verde)
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

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
      data: { proofImage: base64Image }
    });

    console.log('✅ Imagem base64 definida');
    console.log('🔄 Atualize a página');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixImage().catch(console.error);