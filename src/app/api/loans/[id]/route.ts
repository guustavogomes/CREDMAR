import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatBrazilDateToString, parseBrazilDateString } from '@/lib/timezone-utils'
import { z } from 'zod'

const updateLoanSchema = z.object({
  totalAmount: z.number().positive(),
  amountWithoutInterest: z.number().positive(),
  periodicityId: z.string().min(1),
  installments: z.number().int().positive(),
  installmentValue: z.number().positive(),
  nextPaymentDate: z.string(),
  observation: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const loan = await db.loan.findFirst({
      where: {
        id: params.id,
        user: {
          email: session.user.email
        },
        deletedAt: null
      },
      include: {
        customer: true,
        periodicity: true
      }
    })

    if (!loan) {
      return NextResponse.json(
        { error: 'Empréstimo não encontrado' },
        { status: 404 }
      )
    }

    // Corrigir as datas usando timezone do Brasil
    const correctedLoan = {
      ...loan,
      transactionDate: formatBrazilDateToString(loan.transactionDate),
      nextPaymentDate: formatBrazilDateToString(loan.nextPaymentDate),
      createdAt: formatBrazilDateToString(loan.createdAt),
      updatedAt: formatBrazilDateToString(loan.updatedAt)
    }

    return NextResponse.json(correctedLoan)
  } catch (error) {
    console.error('Erro ao buscar empréstimo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = params

    // Verificar se o empréstimo existe e pertence ao usuário
    const loan = await db.loan.findFirst({
      where: {
        id,
        userId: session.user.id,
        deletedAt: null
      }
    })

    if (!loan) {
      return NextResponse.json(
        { error: 'Empréstimo não encontrado' },
        { status: 404 }
      )
    }

    // Soft delete - apenas marca como deletado
    await db.loan.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'CANCELLED'
      }
    })

    return NextResponse.json(
      { message: 'Empréstimo excluído com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao excluir empréstimo:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir empréstimo' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateLoanSchema.parse(body)

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o empréstimo existe e pertence ao usuário
    const existingLoan = await db.loan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        deletedAt: null
      }
    })

    if (!existingLoan) {
      return NextResponse.json(
        { error: 'Empréstimo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se a periodicidade existe
    const periodicity = await db.periodicity.findUnique({
      where: { id: validatedData.periodicityId }
    })

    if (!periodicity) {
      return NextResponse.json(
        { error: 'Periodicidade não encontrada' },
        { status: 404 }
      )
    }

    // Converter a data de pagamento
    const nextPaymentDate = parseBrazilDateString(validatedData.nextPaymentDate)
    
    // Atualizar o empréstimo
    const updatedLoan = await db.loan.update({
      where: { id: params.id },
      data: {
        totalAmount: validatedData.totalAmount,
        amountWithoutInterest: validatedData.amountWithoutInterest,
        periodicityId: validatedData.periodicityId,
        installments: validatedData.installments,
        installmentValue: validatedData.installmentValue,
        nextPaymentDate: nextPaymentDate,
        observation: validatedData.observation || null
      },
      include: {
        customer: true,
        periodicity: true
      }
    })

    return NextResponse.json(updatedLoan)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erro ao atualizar empréstimo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}