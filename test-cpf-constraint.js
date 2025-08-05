// Teste para verificar se a constraint do CPF está funcionando
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:postgres123@159.65.225.133:5433/tapago"
    }
  }
});

async function testCpfConstraint() {
  try {
    console.log('🧪 Testando constraint do CPF...');
    
    // Criar dois usuários diferentes
    const user1 = await prisma.user.create({
      data: {
        email: 'teste1@example.com',
        name: 'Usuário Teste 1',
        password: 'senha123'
      }
    });
    
    const user2 = await prisma.user.create({
      data: {
        email: 'teste2@example.com', 
        name: 'Usuário Teste 2',
        password: 'senha123'
      }
    });
    
    console.log('✅ Usuários criados:', user1.id, user2.id);
    
    // Tentar criar cliente com mesmo CPF para usuários diferentes
    const customer1 = await prisma.customer.create({
      data: {
        cpf: '12345678901',
        nomeCompleto: 'Cliente Teste 1',
        celular: '11999999999',
        cep: '01234567',
        endereco: 'Rua Teste 1',
        cidade: 'São Paulo',
        estado: 'SP',
        bairro: 'Centro',
        userId: user1.id
      }
    });
    
    console.log('✅ Cliente 1 criado para usuário 1');
    
    const customer2 = await prisma.customer.create({
      data: {
        cpf: '12345678901', // MESMO CPF
        nomeCompleto: 'Cliente Teste 2',
        celular: '11888888888',
        cep: '01234567',
        endereco: 'Rua Teste 2',
        cidade: 'São Paulo',
        estado: 'SP',
        bairro: 'Centro',
        userId: user2.id // USUÁRIO DIFERENTE
      }
    });
    
    console.log('✅ Cliente 2 criado para usuário 2 com MESMO CPF!');
    console.log('🎉 SUCESSO: Constraint funcionando - mesmo CPF permitido para usuários diferentes');
    
    // Tentar criar cliente com mesmo CPF para o MESMO usuário (deve falhar)
    try {
      await prisma.customer.create({
        data: {
          cpf: '12345678901', // MESMO CPF
          nomeCompleto: 'Cliente Teste 3',
          celular: '11777777777',
          cep: '01234567',
          endereco: 'Rua Teste 3',
          cidade: 'São Paulo',
          estado: 'SP',
          bairro: 'Centro',
          userId: user1.id // MESMO USUÁRIO
        }
      });
      console.log('❌ ERRO: Deveria ter falhado ao criar cliente com mesmo CPF para mesmo usuário');
    } catch (error) {
      console.log('✅ SUCESSO: Constraint funcionando - mesmo CPF rejeitado para mesmo usuário');
    }
    
    // Limpeza
    await prisma.customer.deleteMany({
      where: { cpf: '12345678901' }
    });
    await prisma.user.deleteMany({
      where: { email: { in: ['teste1@example.com', 'teste2@example.com'] } }
    });
    
    console.log('🧹 Dados de teste removidos');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCpfConstraint();