// Script para verificar se o cliente tem foto
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:postgres123@localhost:5433/tapago"
    }
  }
});

async function checkCustomerPhoto() {
  try {
    console.log('🔍 Verificando fotos dos clientes...');

    // Buscar todos os clientes
    const clientes = await prisma.customer.findMany({
      select: {
        id: true,
        nomeCompleto: true,
        foto: true,
        user: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`📊 Total de clientes: ${clientes.length}`);
    console.log('');

    clientes.forEach((cliente, index) => {
      console.log(`${index + 1}. ${cliente.nomeCompleto} (${cliente.user.name})`);
      console.log(`   ID: ${cliente.id}`);
      console.log(`   Foto: ${cliente.foto || 'NENHUMA'}`);
      console.log(`   URL de edição: http://localhost:3000/dashboard/clientes/${cliente.id}/editar`);
      console.log('');
    });

    // Atualizar um cliente com foto de teste se não tiver
    const clienteSemFoto = clientes.find(c => !c.foto);
    if (clienteSemFoto) {
      console.log(`🔧 Adicionando foto de teste ao cliente: ${clienteSemFoto.nomeCompleto}`);
      
      await prisma.customer.update({
        where: { id: clienteSemFoto.id },
        data: {
          foto: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
        }
      });
      
      console.log('✅ Foto de teste adicionada!');
      console.log(`🔗 Teste em: http://localhost:3000/dashboard/clientes/${clienteSemFoto.id}/editar`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomerPhoto();