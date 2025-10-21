const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createUsers() {
  console.log('🔧 Criando usuários no CREDMAR...')

  try {
    // Criar usuário comum
    console.log('\n👤 Criando usuário comum...')
    const userPassword = await bcrypt.hash('credmar123', 12)
    
    const user = await prisma.user.create({
      data: {
        email: 'mrclpedro1@gmail.com',
        name: 'Marcelo Pedro',
        password: userPassword,
        role: 'USER',
        status: 'ACTIVE'
      }
    })
    
    console.log('✅ Usuário criado:')
    console.log(`   📧 Email: ${user.email}`)
    console.log(`   👤 Nome: ${user.name}`)
    console.log(`   🔑 Role: ${user.role}`)
    console.log(`   📊 Status: ${user.status}`)

    // Criar usuário admin
    console.log('\n👨‍💼 Criando usuário admin...')
    const adminPassword = await bcrypt.hash('senha123senha!@', 12)
    
    const admin = await prisma.user.create({
      data: {
        email: 'guustavogomes@gmail.com',
        name: 'Gustavo Gomes',
        password: adminPassword,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    })
    
    console.log('✅ Admin criado:')
    console.log(`   📧 Email: ${admin.email}`)
    console.log(`   👤 Nome: ${admin.name}`)
    console.log(`   🔑 Role: ${admin.role}`)
    console.log(`   📊 Status: ${admin.status}`)

    console.log('\n🎉 Usuários criados com sucesso!')
    console.log('\n📋 Credenciais de acesso:')
    console.log('👤 Usuário:')
    console.log('   Email: mrclpedro1@gmail.com')
    console.log('   Senha: credmar123')
    console.log('\n👨‍💼 Admin:')
    console.log('   Email: guustavogomes@gmail.com')
    console.log('   Senha: senha123senha!@')
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️ Usuário já existe no banco de dados')
    } else {
      console.error('❌ Erro ao criar usuários:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createUsers().catch(console.error)