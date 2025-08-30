// Criar um novo pagamento fresco para teste
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createFreshPayment() {
  console.log('🆕 Criando novo pagamento para teste...');

  try {
    // Resetar o usuário para PENDING_APPROVAL
    const user = await prisma.user.update({
      where: { email: 'organizaemprestimos40@gmail.com' },
      data: { status: 'PENDING_APPROVAL' }
    });

    console.log('✅ Usuário resetado:', user.status);

    // Criar novo pagamento
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: 100.00,
        method: 'PIX',
        status: 'PENDING',
        description: 'Mensalidade TaPago - Teste Novo',
        proofImage: 'https://via.placeholder.com/400x300/28a745/ffffff?text=COMPROVANTE+PIX+APROVADO+R$+100,00'
      }
    });

    console.log('✅ Novo pagamento criado:', payment.id);
    console.log('🖼️ Imagem:', payment.proofImage);
    console.log('💰 Valor: R$', payment.amount.toFixed(2));

    console.log('\n🎯 Agora teste:');
    console.log('1. Atualize a página: http://localhost:3000/payments/proofs-pending');
    console.log('2. Deve aparecer um comprovante verde');
    console.log('3. Clique em "Aprovar"');
    console.log('4. Deve mostrar alert de sucesso');
    console.log('5. Verifique email em organizaemprestimos40@gmail.com');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createFreshPayment().catch(console.error);