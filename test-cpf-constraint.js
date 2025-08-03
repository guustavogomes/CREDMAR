const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCpfConstraint() {
  try {
    console.log('🧪 Testando restrição de CPF...');
    
    // Buscar dois usuários diferentes
    const users = await prisma.user.findMany({
      take: 2
    });
    
    if (users.length < 2) {
      console.log('❌ Precisa de pelo menos 2 usuários para testar');
      return;
    }
    
    console.log('👥 Usuários encontrados:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email})`);
    });
    
    const testCpf = '12345678901';
    
    // Tentar criar cliente com mesmo CPF para usuário 1
    console.log('\n📝 Criando cliente para usuário 1...');
    try {
      const customer1 = await prisma.customer.create({
        data: {
          cpf: testCpf,
          nomeCompleto: 'Cliente Teste 1',
          celular: '11999999999',
          cep: '01000000',
          endereco: 'Rua Teste, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          bairro: 'Centro',
          userId: users[0].id
        }
      });
      console.log('✅ Cliente 1 criado com sucesso:', customer1.id);
    } catch (error) {
      console.log('❌ Erro ao criar cliente 1:', error.message);
    }
    
    // Tentar criar cliente com mesmo CPF para usuário 2
    console.log('\n📝 Criando cliente para usuário 2...');
    try {
      const customer2 = await prisma.customer.create({
        data: {
          cpf: testCpf,
          nomeCompleto: 'Cliente Teste 2',
          celular: '11888888888',
          cep: '02000000',
          endereco: 'Rua Teste, 456',
          cidade: 'Rio de Janeiro',
          estado: 'RJ',
          bairro: 'Centro',
          userId: users[1].id
        }
      });
      console.log('✅ Cliente 2 criado com sucesso:', customer2.id);
      console.log('🎉 SUCESSO: Mesmo CPF pode ser usado por usuários diferentes!');
    } catch (error) {
      console.log('❌ Erro ao criar cliente 2:', error.message);
      if (error.message.includes('unique constraint')) {
        console.log('⚠️  A restrição ainda não foi aplicada corretamente');
      }
    }
    
    // Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    await prisma.customer.deleteMany({
      where: { cpf: testCpf }
    });
    console.log('✅ Dados de teste removidos');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCpfConstraint();