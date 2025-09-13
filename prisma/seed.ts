import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {

  // Verificar se já existe um admin
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (existingAdmin) {
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
    }
  }

}

main()
  .catch((e) => {
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })