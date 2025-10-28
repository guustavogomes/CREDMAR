/**
 * Script para recriar periodicidades básicas após limpeza do banco
 */

const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function seedPeriodicities() {
  try {
    console.log('🌱 Criando periodicidades básicas...\n')

    const periodicities = [
      {
        name: 'Diário',
        description: 'Pagamento diário',
        intervalType: 'DAYS',
        intervalValue: 1
      },
      {
        name: 'Semanal',
        description: 'Pagamento semanal',
        intervalType: 'DAYS',
        intervalValue: 7
      },
      {
        name: 'Quinzenal',
        description: 'Pagamento quinzenal',
        intervalType: 'DAYS',
        intervalValue: 15
      },
      {
        name: 'Mensal',
        description: 'Pagamento mensal',
        intervalType: 'MONTHS',
        intervalValue: 1
      },
      {
        name: 'Bimestral',
        description: 'Pagamento bimestral',
        intervalType: 'MONTHS',
        intervalValue: 2
      },
      {
        name: 'Trimestral',
        description: 'Pagamento trimestral',
        intervalType: 'MONTHS',
        intervalValue: 3
      },
      {
        name: 'Semestral',
        description: 'Pagamento semestral',
        intervalType: 'MONTHS',
        intervalValue: 6
      },
      {
        name: 'Anual',
        description: 'Pagamento anual',
        intervalType: 'YEARS',
        intervalValue: 1
      }
    ]

    for (const periodicity of periodicities) {
      const created = await db.periodicity.create({
        data: periodicity
      })
      console.log(`✅ Criada: ${created.name} (${created.intervalValue} ${created.intervalType})`)
    }

    console.log(`\n🎉 ${periodicities.length} periodicidades criadas com sucesso!`)

  } catch (error) {
    console.error('❌ Erro ao criar periodicidades:', error)
  } finally {
    await db.$disconnect()
  }
}

// Executar o seed
seedPeriodicities()