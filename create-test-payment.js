// Criar um pagamento de teste para testar o email de aprovação
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestPayment() {
  console.log('📤 Criando pagamento de teste para aprovação...');

  try {
    // Usar o email verificado do Resend para receber o email
    const testEmail = 'organizaemprestimos40@gmail.com';

    // 1. Criar/atualizar usuário de teste
    const testUser = await prisma.user.upsert({
      where: { email: testEmail },
      update: {
        status: 'PENDING_APPROVAL'
      },
      create: {
        email: testEmail,
        name: 'Teste Email Aprovação',
        password: 'senha123',
        role: 'USER',
        status: 'PENDING_APPROVAL'
      }
    });

    console.log('✅ Usuário de teste criado/atualizado:', testUser.email);

    // 2. Verificar se já existe um pagamento pendente
    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId: testUser.id,
        status: 'PENDING'
      }
    });

    if (existingPayment) {
      console.log('✅ Pagamento pendente já existe:', existingPayment.id);
      console.log('📧 Email do usuário:', testUser.email);
      console.log('💰 Valor:', existingPayment.amount);
      console.log('📅 Data:', existingPayment.createdAt.toLocaleDateString());
      return;
    }

    // 3. Criar um pagamento pendente
    const testPayment = await prisma.payment.create({
      data: {
        userId: testUser.id,
        amount: 100.00,
        method: 'PIX',
        status: 'PENDING',
        description: 'Mensalidade TaPago - Teste Email',
        proofImage: '/uploads/proofs/test-comprovante-email.jpg'
      }
    });

    console.log('✅ Pagamento de teste criado:', testPayment.id);
    console.log('📧 Email do usuário:', testUser.email);
    console.log('💰 Valor: R$', testPayment.amount.toFixed(2));
    console.log('📅 Data:', testPayment.createdAt.toLocaleDateString());

    console.log('\n🎯 Próximos passos para testar:');
    console.log('1. Inicie o servidor: npm run dev');
    console.log('2. Faça login como admin@tapago.com');
    console.log('3. Acesse: http://localhost:3000/payments/proofs-pending');
    console.log('4. Encontre o pagamento do usuário "Teste Email Aprovação"');
    console.log('5. Clique em "Aprovar"');
    console.log('6. Verifique o email em organizaemprestimos40@gmail.com');

    console.log('\n📧 O email de aprovação será enviado para:', testEmail);

  } catch (error) {
    console.error('❌ Erro ao criar pagamento de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
createTestPayment().catch(console.error);