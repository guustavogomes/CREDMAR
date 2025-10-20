// Script para restaurar a senha padrão do admin
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  console.log('🔐 Restaurando senha padrão do admin...');

  try {
    // Buscar o usuário admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@credmar.com.br' }
    });

    if (!admin) {
      console.log('❌ Usuário admin não encontrado');
      return;
    }

    console.log('✅ Usuário admin encontrado:', admin.email);

    // Hash da senha padrão
    const hashedPassword = await bcrypt.hash('credmar123!@', 12);

    // Atualizar a senha
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    console.log('✅ Senha restaurada com sucesso!');
    console.log('📧 Email: admin@credmar.com.br');
    console.log('🔑 Senha: credmar123!@');
    console.log('🧹 Tokens de reset removidos');

  } catch (error) {
    console.error('❌ Erro ao restaurar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
resetAdminPassword().catch(console.error);