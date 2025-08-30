// Teste dos campos de recuperação de senha no banco de dados
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function testPasswordResetFields() {
  console.log('🔐 Testando campos de recuperação de senha no banco...');
  console.log('=' * 60);

  try {
    // 1. Buscar um usuário existente (admin criado no seed)
    const user = await prisma.user.findUnique({
      where: { email: 'admin@tapago.com' }
    });

    if (!user) {
      console.log('❌ Usuário admin não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', user.email);

    // 2. Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    console.log('🔑 Token gerado:', resetToken);
    console.log('⏰ Expira em:', resetTokenExpiry);

    // 3. Atualizar campos resetToken e resetTokenExpiry no usuário
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetToken,
        resetTokenExpiry: resetTokenExpiry
      }
    });

    console.log('✅ Campos resetToken e resetTokenExpiry atualizados no usuário');

    // 4. Criar registro na tabela PasswordResetToken
    const passwordResetToken = await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token: resetToken,
        expires: resetTokenExpiry
      }
    });

    console.log('✅ Registro criado na tabela PasswordResetToken');
    console.log('📊 ID do registro:', passwordResetToken.id);

    // 5. Verificar se conseguimos buscar o token
    const foundToken = await prisma.passwordResetToken.findUnique({
      where: { token: resetToken },
      include: { user: true }
    });

    if (foundToken) {
      console.log('✅ Token encontrado na busca');
      console.log('👤 Usuário associado:', foundToken.user.email);
    }

    // 6. Verificar se o usuário tem os campos atualizados
    const userWithToken = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        email: true,
        resetToken: true,
        resetTokenExpiry: true,
        passwordResetTokens: true
      }
    });

    console.log('✅ Verificação final do usuário:');
    console.log('  - Email:', userWithToken.email);
    console.log('  - Reset Token:', userWithToken.resetToken ? 'Definido' : 'Não definido');
    console.log('  - Token Expiry:', userWithToken.resetTokenExpiry ? 'Definido' : 'Não definido');
    console.log('  - Tokens na tabela:', userWithToken.passwordResetTokens.length);

    // 7. Simular validação de token
    const isValidToken = foundToken && foundToken.expires > new Date();
    console.log('🔍 Token válido:', isValidToken ? 'Sim' : 'Não');

    // 8. Limpeza - remover token após teste
    await prisma.passwordResetToken.delete({
      where: { id: passwordResetToken.id }
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    console.log('🧹 Limpeza realizada - tokens removidos');
    console.log('✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testPasswordResetFields().catch(console.error);