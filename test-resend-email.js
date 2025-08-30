// Teste da funcionalidade de recuperação de senha com Resend
const { Resend } = require('resend');

async function testResendEmail() {
  console.log('📧 Testando Resend para Recuperação de Senha...');
  console.log('=' * 60);

  try {
    // Configurar Resend
    const resend = new Resend('re_asJE7vxn_4EpnCXDRNucjSJGgjvzhe8Ye');
    
    // Simular dados de recuperação
    const email = 'organizaemprestimos40@gmail.com'; // Email verificado no Resend
    const resetToken = 'test-token-123456';
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    
    console.log('📤 Enviando email de teste...');
    console.log('  - Para:', email);
    console.log('  - Token:', resetToken);
    console.log('  - URL:', resetUrl);
    
    // Enviar email de teste
    const result = await resend.emails.send({
      from: 'TaPago <onboarding@resend.dev>',
      to: email,
      subject: 'TaPago - Teste de Recuperação de Senha',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">TaPago</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Sistema de Gestão de Empréstimos</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">🧪 Teste de Recuperação de Senha</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
              Este é um <strong>email de teste</strong> para verificar se a funcionalidade de recuperação de senha está funcionando corretamente com o Resend.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetUrl}" 
                 style="background: #667eea; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                🔄 Testar Link de Reset
              </a>
            </div>
            
            <!-- Test Info -->
            <div style="background: #f0f8ff; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #333; margin: 0; font-size: 14px; line-height: 1.5;">
                <strong>📊 Informações do Teste:</strong><br>
                • Token: ${resetToken}<br>
                • URL: ${resetUrl}<br>
                • Provedor: Resend<br>
                • Status: Teste bem-sucedido ✅
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #2d3748; color: #a0aec0; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} TaPago - Sistema de Gestão de Empréstimos
            </p>
            <p style="margin: 5px 0 0 0; font-size: 11px; opacity: 0.8;">
              Este é um email de teste automático.
            </p>
          </div>
        </div>
      `
    });
    
    console.log('✅ Email enviado com sucesso!');
    console.log('📊 Resultado:', result);
    console.log('  - ID:', result.data?.id || 'N/A');
    console.log('  - Status:', result.error ? 'Erro' : 'Sucesso');
    
    if (result.error) {
      console.log('❌ Erro:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testResendEmail().catch(console.error);