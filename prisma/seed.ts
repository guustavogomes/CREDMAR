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

  // Criar periodicidades conforme a configuração do sistema
  const periodicities = [
    {
      name: 'Diário',
      description: 'Segunda a Domingo',
      intervalType: 'DAILY',
      intervalValue: 1,
      allowedWeekdays: '[1,0,2,3,4,5,6]' // Seg, Dom, Ter, Qua, Qui, Sex, Sáb
    },
    {
      name: 'Diário Segunda a Sábado',
      description: 'Segunda a Sábado',
      intervalType: 'DAILY',
      intervalValue: 1,
      allowedWeekdays: '[1,2,3,4,5,6]' // Seg, Ter, Qua, Qui, Sex, Sáb
    },
    {
      name: 'Diário Segunda a Sexta',
      description: 'Segunda a Sexta',
      intervalType: 'DAILY',
      intervalValue: 1,
      allowedWeekdays: '[1,2,3,4,5]' // Seg, Ter, Qua, Qui, Sex
    },
    {
      name: 'Mensal',
      description: 'Mensal',
      intervalType: 'MONTHLY',
      intervalValue: 1
    },
    {
      name: 'Semanal',
      description: 'Semanal',
      intervalType: 'WEEKLY',
      intervalValue: 1
    },
    {
      name: 'Quinzenal',
      description: 'Quinzenal',
      intervalType: 'WEEKLY',
      intervalValue: 2
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