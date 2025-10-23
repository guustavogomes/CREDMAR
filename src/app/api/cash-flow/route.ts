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
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      userId: session.user.id
    }

    if (creditorId) {
      where.creditorId = creditorId
    }

    if (type && (type === 'CREDIT' || type === 'DEBIT')) {
      where.type = type
    }

    const cashFlows = await prisma.cashFlow.findMany({
      where,
      include: {
        creditor: {
          select: {
            id: true,
            nome: true,
            cpf: true
          }
        },
        loan: {
          select: {
            id: true,
            customer: {
              select: {
                nomeCompleto: true
              }
            }
          }
        },
        installment: {
          select: {
            id: true,
            installmentNumber: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    return NextResponse.json(cashFlows)
  } catch (error) {
    console.error('Erro ao buscar fluxo de caixa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { creditorId, type, category, amount, description } = body

    // Validações
    if (!creditorId || !type || !category || !amount) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: creditorId, type, category, amount' },
        { status: 400 }
      )
    }

    if (!['CREDIT', 'DEBIT'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo deve ser CREDIT ou DEBIT' },
        { status: 400 }
      )
    }

    if (!['DEPOSIT', 'WITHDRAWAL', 'COMMISSION', 'LOAN_DISBURSEMENT'].includes(category)) {
      return NextResponse.json(
        { error: 'Categoria inválida' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Valor deve ser maior que zero' },
        { status: 400 }
      )
    }

    // Verificar se o credor existe e pertence ao usuário
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

    // Criar a movimentação
    const cashFlow = await prisma.cashFlow.create({
      data: {
        creditorId,
        type,
        category,
        amount: parseFloat(amount),
        description: description || null,
        userId: session.user.id
      },
      include: {
        creditor: {
          select: {
            id: true,
            nome: true,
            cpf: true
          }
        }
      }
    })

    return NextResponse.json(cashFlow, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar movimentação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}