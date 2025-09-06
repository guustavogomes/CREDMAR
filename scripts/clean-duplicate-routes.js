const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanDuplicateRoutes() {
  console.log('🔍 Iniciando limpeza de rotas duplicadas...')
  
  try {
    // Buscar todas as rotas agrupadas por descrição
    const routeGroups = await prisma.route.groupBy({
      by: ['description'],
      _count: {
        id: true
      },
      having: {
        id: {
          _count: {
            gt: 1
          }
        }
      }
    })

    console.log(`📊 Encontrados ${routeGroups.length} grupos de rotas duplicadas`)

    if (routeGroups.length === 0) {
      console.log('✅ Nenhuma rota duplicada encontrada!')
      return
    }

    let totalRemoved = 0

    for (const group of routeGroups) {
      console.log(`\n🔄 Processando rotas com descrição: "${group.description}"`)
      
      // Buscar todas as rotas com esta descrição, incluindo contagem de clientes
      const duplicateRoutes = await prisma.route.findMany({
        where: {
          description: group.description
        },
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
          }
        },
        orderBy: {
          createdAt: 'asc' // Manter a mais antiga
        }
      })

      console.log(`   📋 Encontradas ${duplicateRoutes.length} rotas duplicadas`)

      // Identificar a rota a ser mantida (com mais clientes ou a mais antiga)
      const routeToKeep = duplicateRoutes.reduce((best, current) => {
        const bestClientCount = best._count.customers
        const currentClientCount = current._count.customers
        
        if (currentClientCount > bestClientCount) {
          return current
        } else if (currentClientCount === bestClientCount) {
          // Se igual número de clientes, manter a mais antiga
          return best.createdAt <= current.createdAt ? best : current
        }
        return best
      })

      console.log(`   ✅ Mantendo rota ID: ${routeToKeep.id} (${routeToKeep._count.customers} clientes)`)

      // Remover as outras rotas
      const routesToRemove = duplicateRoutes.filter(route => route.id !== routeToKeep.id)
      
      for (const routeToRemove of routesToRemove) {
        if (routeToRemove._count.customers > 0) {
          console.log(`   🔄 Transferindo ${routeToRemove._count.customers} clientes da rota ${routeToRemove.id} para ${routeToKeep.id}`)
          
          // Transferir clientes para a rota que será mantida
          await prisma.customer.updateMany({
            where: {
              routeId: routeToRemove.id
            },
            data: {
              routeId: routeToKeep.id
            }
          })
        }

        console.log(`   🗑️ Removendo rota ID: ${routeToRemove.id}`)
        await prisma.route.delete({
          where: {
            id: routeToRemove.id
          }
        })
        totalRemoved++
      }
    }

    console.log(`\n🎉 Limpeza concluída! ${totalRemoved} rotas duplicadas removidas.`)
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  cleanDuplicateRoutes()
}

module.exports = { cleanDuplicateRoutes }