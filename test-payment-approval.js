// Teste da funcionalidade de aprovação de pagamento com email
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPaymentApproval() {
  console.log('🎯 Testando funcionalidade de aprovação de pagamento...');

  try {
    // 1. Criar um usuário de teste
    const testUser = await prisma.user.upsert({
      where: { email: 'teste.aprovacao@gmail.com' },
      update: {
        status: 'PENDING_APPROVAL'
      },
      create: {
        email: 'teste.aprovacao@gmail.com',
        name: 'Usuário Teste Aprovação',
        password: 'senha123',
        role: 'USER',
        status: 'PENDING_APPROVAL'
      }
    });

    console.log('✅ Usuário de teste criado/atualizado:', testUser.email);

    // 2. Criar um pagamento pendente
    const testPayment = await prisma.payment.create({
      data: {
        userId: testUser.id,
        amount: 100.00,
        method: 'PIX',
        status: 'PENDING',
        description: 'Mensalidade TaPago - Teste',
        proofImage: '/uploads/proofs/test-comprovante.jpg'
      }
    });

    console.log('✅ Pagamento de teste criado:', testPayment.id);

    // 3. Verificar se existe admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@tapago.com' }
    });

    if (!admin) {
      console.log('❌ Admin não encontrado');
      return;
    }

    console.log('✅ Admin encontrado:', admin.email);

    // 4. Simular aprovação do pagamento
    console.log('🔄 Simulando aprovação do pagamento...');

    const approvedPayment = await prisma.payment.update({
      where: { id: testPayment.id },
      data: {
        status: 'APPROVED',
        approvedBy: admin.id,
        approvedAt: new Date()
      }
    });

    // 5. Atualizar status do usuário
    const activatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: { status: 'ACTIVE' }
    });

    console.log('✅ Pagamento aprovado:', approvedPayment.status);
    console.log('✅ Usuário ativado:', activatedUser.status);

    // 6. Verificar dados finais
    const finalPayment = await prisma.payment.findUnique({
      where: { id: testPayment.id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            status: true
          }
        }
      }
    });

    console.log('\n📊 Resultado final:');
    console.log('  - Pagamento ID:', finalPayment.id);
    console.log('  - Status do pagamento:', finalPayment.status);
    console.log('  - Aprovado por:', finalPayment.approvedBy);
    console.log('  - Data de aprovação:', finalPayment.approvedAt?.toLocaleString());
    console.log('  - Usuário:', finalPayment.user.email);
    console.log('  - Status do usuário:', finalPayment.user.status);

    console.log('\n💡 Para testar o email:');
    console.log('1. Inicie o servidor: npm run dev');
    console.log('2. Faça login como admin');
    console.log('3. Acesse: http://localhost:3000/payments/proofs-pending');
    console.log('4. Clique em "Aprovar" em um comprovante');
    console.log('5. Verifique o email enviado');

    // 7. Limpeza (opcional)
    console.log('\n🧹 Limpando dados de teste...');
    await prisma.payment.delete({ where: { id: testPayment.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ Dados de teste removidos');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testPaymentApproval().catch(console.error);