import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const creditorId = searchParams.get('creditorId')

    if (creditorId) {
      // Buscar saldo de um credor específico
      const creditor = await prisma.creditor.findFirst({
        where: {
          id: creditorId,
          userId: session.user.id,
          deletedAt: null
        }
      })

      if (!creditor) {
        return NextResponse.json(
          { error: 'Credor não encontrado' },
          { status: 404 }
        )
      }

      const cashFlows = await prisma.cashFlow.findMany({
        where: {
          creditorId,
          userId: session.user.id
        },
        select: {
          type: true,
          amount: true
        }
      })

      const balance = cashFlows.reduce((acc, flow) => {
        return flow.type === 'CREDIT' ? acc + flow.amount : acc - flow.amount
      }, 0)

      return NextResponse.json({
        creditorId,
        balance
      })
    } else {
      // Buscar saldos de todos os credores
      const creditors = await prisma.creditor.findMany({
        where: {
          userId: session.user.id,
          deletedAt: null
        },
        select: {
          id: true,
          nome: true,
          cpf: true
        }
      })

      const balances = await Promise.all(
        creditors.map(async (creditor) => {
          const cashFlows = await prisma.cashFlow.findMany({
            where: {
              creditorId: creditor.id,
              userId: session.user.id
            },
            select: {
              type: true,
              amount: true
            }
          })

          const balance = cashFlows.reduce((acc, flow) => {
            return flow.type === 'CREDIT' ? acc + flow.amount : acc - flow.amount
          }, 0)

          return {
            ...creditor,
            balance
          }
        })
      )

      return NextResponse.json(balances)
    }
  } catch (error) {
    console.error('Erro ao buscar saldos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}