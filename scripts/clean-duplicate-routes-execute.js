const { PrismaClient } = require('@prisma/client')

// Usar a URL de produção se disponível
const databaseUrl = process.env.DATABASE_URL || "postgresql://tapago_9e3w_user:nfgPLXXxPaktDTy4cFwzTVwNfo5qp1AK@dpg-d2pgjuv5r7bs739mgg3g-a.oregon-postgres.render.com/tapago_9e3w"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

async function executeCleaning() {
  console.log('🔥 EXECUTANDO limpeza de rotas duplicadas...')
  console.log('⚠️ ATENÇÃO: Esta operação é irreversível!')
  
  try {
    // Buscar todas as rotas
    const allRoutes = await prisma.route.findMany({
      include: {
        _count: {
          select: {
            customers: true
          }
        },
        customers: {
          select: {
            id: true,
            nomeCompleto: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        description: 'asc'
      }
    })

    console.log(`📊 Total de rotas encontradas: ${allRoutes.length}`)

    // Agrupar por descrição
    const routesByDescription = new Map()
    
    for (const route of allRoutes) {
      const description = route.description.toLowerCase().trim()
      if (!routesByDescription.has(description)) {
        routesByDescription.set(description, [])
      }
      routesByDescription.get(description).push(route)
    }

    // Encontrar duplicatas
    const duplicates = Array.from(routesByDescription.entries())
      .filter(([description, routes]) => routes.length > 1)

    if (duplicates.length === 0) {
      console.log('✅ Nenhuma rota duplicada encontrada!')
      return
    }

    let totalRemoved = 0

    for (const [description, routes] of duplicates) {
      console.log(`\n🔄 Processando "${description}" (${routes.length} duplicatas)`)
      
      // Ordenar por número de clientes (desc) e depois por data de criação (asc)
      routes.sort((a, b) => {
        if (b._count.customers !== a._count.customers) {
          return b._count.customers - a._count.customers
        }
        return new Date(a.createdAt) - new Date(b.createdAt)
      })

      const routeToKeep = routes[0]
      const routesToRemove = routes.slice(1)

      console.log(`   ✅ Mantendo: ID ${routeToKeep.id} (${routeToKeep._count.customers} clientes)`)

      for (const routeToRemove of routesToRemove) {
        console.log(`   🔄 Processando rota ID ${routeToRemove.id} (${routeToRemove._count.customers} clientes)`)
        
        if (routeToRemove._count.customers > 0) {
          console.log(`   📦 Transferindo ${routeToRemove._count.customers} clientes para rota ${routeToKeep.id}`)
          
          // Transferir clientes para a rota mantida
          const updateResult = await prisma.customer.updateMany({
            where: {
              routeId: routeToRemove.id
            },
            data: {
              routeId: routeToKeep.id
            }
          })
          
          console.log(`   ✅ ${updateResult.count} clientes transferidos`)
        }

        // Remover a rota duplicada
        await prisma.route.delete({
          where: {
            id: routeToRemove.id
          }
        })
        
        console.log(`   🗑️ Rota ID ${routeToRemove.id} removida`)
        totalRemoved++
      }
    }

    console.log(`\n🎉 Limpeza concluída com sucesso!`)
    console.log(`   • Rotas duplicadas processadas: ${duplicates.length}`)
    console.log(`   • Rotas removidas: ${totalRemoved}`)
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  executeCleaning().catch(console.error)
}

module.exports = { executeCleaning }