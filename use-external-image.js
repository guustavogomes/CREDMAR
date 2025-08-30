// Usar uma imagem externa para testar o sistema
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function useExternalImage() {
  console.log('🌐 Usando imagem externa para teste...');

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

    // Usar uma imagem de exemplo que sempre funciona
    const externalImageUrl = 'https://via.placeholder.com/400x300/007bff/ffffff?text=COMPROVANTE+PIX+R$+100,00';

    await prisma.payment.update({
      where: { id: payment.id },
      data: { proofImage: externalImageUrl }
    });

    console.log('✅ Atualizado para imagem externa');
    console.log('🖼️ URL:', externalImageUrl);
    console.log('🔄 Atualize a página no navegador');
    console.log('📧 Agora você pode testar o email clicando em "Aprovar"');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

useExternalImage().catch(console.error);