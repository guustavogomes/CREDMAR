// Teste completo da funcionalidade de recuperação de senha
const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const crypto = require('crypto');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY || 're_asJE7vxn_4EpnCXDRNucjSJGgjvzhe8Ye');

async function testCompletePasswordReset() {
  console.log('🔐 Teste Completo de Recuperação de Senha');
  console.log('=' * 50);

  try {
    // 1. Buscar usuário admin
    const user = await prisma.user.findUnique({
      where: { email: 'admin@tapago.com' }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', user.email);

    // 2. Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

    console.log('🔑 Token gerado:', resetToken.substring(0, 16) + '...');
    console.log('⏰ Expira em:', resetTokenExpiry.toLocaleString());

    // 3. Salvar token no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetToken,
        resetTokenExpiry: resetTokenExpiry
      }
    });

    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token: resetToken,
        expires: resetTokenExpiry
      }
    });

    console.log('✅ Token salvo no banco de dados');

    // 4. Enviar email de recuperação
    console.log('📧 Enviando email de recuperação...');
    
    const emailResult = await resend.emails.send({
      from: 'TaPago <onboarding@resend.dev>',
      to: 'organizaemprestimos40@gmail.com', // Email verificado
      subject: 'TaPago - Recuperação de Senha',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">TaPago</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Sistema de Gestão de Empréstimos</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">🔐 Recuperação de Senha</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
              Olá <strong>${user.name}</strong>,
            </p>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
              Recebemos uma solicitação para redefinir a senha da sua conta no TaPago. 
              Se você não fez esta solicitação, pode ignorar este email com segurança.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetUrl}" 
                 style="background: #667eea; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                🔄 Redefinir Senha
              </a>
            </div>
            
            <!-- Security Info -->
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;">
                <strong>🔒 Informações de Segurança:</strong><br>
                • Este link expira em 1 hora<br>
                • Use apenas se você solicitou a recuperação<br>
                • Nunca compartilhe este link com terceiros
              </p>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <span style="word-break: break-all;">${resetUrl}</span>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #2d3748; color: #a0aec0; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} TaPago - Sistema de Gestão de Empréstimos
            </p>
            <p style="margin: 5px 0 0 0; font-size: 11px; opacity: 0.8;">
              Este email foi enviado para ${user.email}
            </p>
          </div>
        </div>
      `
    });

    if (emailResult.error) {
      console.log('❌ Erro ao enviar email:', emailResult.error);
      return;
    }

    console.log('✅ Email enviado com sucesso!');
    console.log('📊 ID do email:', emailResult.data.id);

    // 5. Simular validação do token
    console.log('\n🔍 Simulando validação do token...');
    
    const foundToken = await prisma.passwordResetToken.findUnique({
      where: { token: resetToken },
      include: { user: true }
    });

    if (foundToken && foundToken.expires > new Date()) {
      console.log('✅ Token válido encontrado');
      console.log('👤 Usuário:', foundToken.user.email);
      console.log('⏰ Expira em:', foundToken.expires.toLocaleString());
    } else {
      console.log('❌ Token inválido ou expirado');
    }

    // 6. Simular reset da senha
    console.log('\n🔄 Simulando reset da senha...');
    
    const newPassword = 'nova-senha-123'; // Em produção, seria hasheada
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newPassword, // Em produção: await bcrypt.hash(newPassword, 10)
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    // Remover token usado
    await prisma.passwordResetToken.delete({
      where: { token: resetToken }
    });

    console.log('✅ Senha redefinida com sucesso');
    console.log('🧹 Token removido do banco');

    // 7. Verificar se o reset funcionou
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        email: true,
        resetToken: true,
        resetTokenExpiry: true,
        passwordResetTokens: true
      }
    });

    console.log('\n📊 Verificação final:');
    console.log('  - Reset Token:', updatedUser.resetToken || 'Removido ✅');
    console.log('  - Token Expiry:', updatedUser.resetTokenExpiry || 'Removido ✅');
    console.log('  - Tokens ativos:', updatedUser.passwordResetTokens.length);

    console.log('\n🎉 Teste completo finalizado com sucesso!');
    console.log('📧 Verifique o email em organizaemprestimos40@gmail.com');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testCompletePasswordReset().catch(console.error);