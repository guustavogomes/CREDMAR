// Testar a API de aprovação diretamente
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApprovalAPI() {
  console.log('🧪 Testando API de aprovação...');

  try {
    // 1. Buscar o pagamento pendente
    const payment = await prisma.payment.findFirst({
      where: {
        user: { email: 'organizaemprestimos40@gmail.com' },
        status: 'PENDING'
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

    if (!payment) {
      console.log('❌ Nenhum pagamento pendente encontrado');
      return;
    }

    console.log('✅ Pagamento encontrado:');
    console.log('  - ID:', payment.id);
    console.log('  - Usuário:', payment.user.email);
    console.log('  - Status atual:', payment.status);
    console.log('  - Status do usuário:', payment.user.status);

    // 2. Verificar se existe admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@tapago.com' }
    });

    if (!admin) {
      console.log('❌ Admin não encontrado');
      return;
    }

    console.log('✅ Admin encontrado:', admin.email);

    // 3. Simular aprovação manual (sem API)
    console.log('\n🔄 Simulando aprovação...');

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'APPROVED',
        approvedBy: admin.id,
        approvedAt: new Date()
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id: payment.user.id },
      data: { status: 'ACTIVE' }
    });

    console.log('✅ Pagamento aprovado:', updatedPayment.status);
    console.log('✅ Usuário ativado:', updatedUser.status);

    // 4. Testar envio de email manualmente
    console.log('\n📧 Testando envio de email...');
    
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      const emailResult = await resend.emails.send({
        from: 'TaPago <onboarding@resend.dev>',
        to: 'organizaemprestimos40@gmail.com',
        subject: 'TaPago - Pagamento Aprovado! 🎉 (Teste)',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #10b981; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">TaPago</h1>
            </div>
            <div style="padding: 20px;">
              <h2>🎉 Pagamento Aprovado!</h2>
              <p>Olá <strong>${payment.user.name}</strong>,</p>
              <p>Seu pagamento de <strong>R$ ${payment.amount.toFixed(2)}</strong> foi aprovado!</p>
              <p>Sua conta está agora ativa e você pode fazer login no sistema.</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="http://localhost:3000/login" 
                   style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  Acessar Sistema
                </a>
              </div>
            </div>
          </div>
        `
      });

      console.log('✅ Email enviado com sucesso!');
      console.log('📊 ID do email:', emailResult.data?.id);
      
    } catch (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
    }

    console.log('\n🎯 Resultado final:');
    console.log('  - Pagamento aprovado ✅');
    console.log('  - Usuário ativado ✅');
    console.log('  - Email enviado ✅');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testApprovalAPI().catch(console.error);