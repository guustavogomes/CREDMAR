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

async function analyzeRoutes() {
  console.log('🔍 Analisando rotas duplicadas (modo simulação)...')
  
  try {
    // Buscar todas as rotas
    const allRoutes = await prisma.route.findMany({
      include: {
        _count: {
          select: {
            customers: true
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

    console.log(`\n⚠️ Encontradas ${duplicates.length} rotas com nomes duplicados:\n`)

    let totalToRemove = 0

    for (const [description, routes] of duplicates) {
      console.log(`📋 Rota: "${description}" (${routes.length} duplicatas)`)
      
      // Ordenar por número de clientes (desc) e depois por data de criação (asc)
      routes.sort((a, b) => {
        if (b._count.customers !== a._count.customers) {
          return b._count.customers - a._count.customers
        }
        return new Date(a.createdAt) - new Date(b.createdAt)
      })

      const routeToKeep = routes[0]
      const routesToRemove = routes.slice(1)

      console.log(`   ✅ MANTER: ID ${routeToKeep.id} | ${routeToKeep._count.customers} clientes | Criada em ${routeToKeep.createdAt.toLocaleDateString()} | Usuário: ${routeToKeep.user.name}`)
      
      for (const route of routesToRemove) {
        console.log(`   🗑️ REMOVER: ID ${route.id} | ${route._count.customers} clientes | Criada em ${route.createdAt.toLocaleDateString()} | Usuário: ${route.user.name}`)
        totalToRemove++
      }
      console.log('')
    }

    console.log(`\n📈 RESUMO:`)
    console.log(`   • Total de rotas: ${allRoutes.length}`)
    console.log(`   • Rotas duplicadas: ${duplicates.length}`)
    console.log(`   • Rotas a serem removidas: ${totalToRemove}`)
    console.log(`   • Rotas após limpeza: ${allRoutes.length - totalToRemove}`)
    
    console.log(`\n💡 Para executar a limpeza real, execute:`)
    console.log(`   node scripts/clean-duplicate-routes-execute.js`)
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  analyzeRoutes()
}

module.exports = { analyzeRoutes }