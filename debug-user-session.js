/**
 * Script para debuggar problemas de sessão e usuário
 */

const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function debugUserSession() {
  try {
    console.log('🔍 Verificando usuários no banco de dados...\n')

    // 1. Listar todos os usuários
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true
      }
    })

    console.log(`📊 Total de usuários: ${users.length}`)
    console.log('\n👥 Usuários cadastrados:')
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name})`)
      console.log(`      ID: ${user.id}`)
      console.log(`      Role: ${user.role}`)
      console.log(`      Status: ${user.status}`)
      console.log(`      Criado em: ${user.createdAt.toLocaleDateString('pt-BR')}`)
      console.log('')
    })

    // 2. Verificar se há problemas com IDs
    console.log('🔍 Verificando integridade dos IDs...')
    for (const user of users) {
      if (!user.id || user.id.length < 10) {
        console.log(`⚠️  Usuário com ID suspeito: ${user.email} - ID: ${user.id}`)
      }
    }

    // 3. Verificar clientes por usuário
    console.log('\n📋 Clientes por usuário:')
    for (const user of users) {
      const customerCount = await db.customer.count({
        where: {
          userId: user.id,
          deletedAt: null
        }
      })
      console.log(`   ${user.email}: ${customerCount} clientes`)
    }

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error)
  } finally {
    await db.$disconnect()
  }
}

// Executar o debug
debugUserSession()