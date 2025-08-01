import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Verificar se já existe um admin
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (existingAdmin) {
    console.log('✅ Usuário admin já existe:', existingAdmin.email)
    return
  }

  // Criar usuário admin padrão
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@tapago.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  })

  console.log('✅ Usuário admin criado com sucesso!')
  console.log('📧 Email:', adminUser.email)
  console.log('🔑 Senha: admin123')
  console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!')

  // Criar algumas periodicidades padrão
  const periodicities = [
    {
      name: 'Diário',
      description: 'Pagamento diário',
      intervalType: 'DAILY',
      intervalValue: 1
    },
    {
      name: 'Semanal',
      description: 'Pagamento semanal',
      intervalType: 'WEEKLY',
      intervalValue: 1
    },
    {
      name: 'Quinzenal',
      description: 'Pagamento quinzenal',
      intervalType: 'DAILY',
      intervalValue: 15
    },
    {
      name: 'Mensal',
      description: 'Pagamento mensal',
      intervalType: 'MONTHLY',
      intervalValue: 1
    }
  ]

  for (const periodicity of periodicities) {
    const existing = await prisma.periodicity.findUnique({
      where: { name: periodicity.name }
    })

    if (!existing) {
      await prisma.periodicity.create({
        data: periodicity
      })
      console.log(`✅ Periodicidade criada: ${periodicity.name}`)
    }
  }

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })