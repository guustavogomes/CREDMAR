import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateLoanSchema = z.object({
  totalAmount: z.number().positive(),
  advanceAmount: z.number().min(0),
  periodicityId: z.string().min(1),
  installments: z.number().int().positive(),
  installmentValue: z.number().positive(),
  nextPaymentDate: z.string()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
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
        }
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

    return NextResponse.json(loan)
  } catch (error) {
    console.error('Erro ao buscar empréstimo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateLoanSchema.parse(body)

    // Verificar se o empréstimo pertence ao usuário
    const existingLoan = await db.loan.findFirst({
      where: {
        id: params.id,
        user: {
          email: session.user.email
        }
      }
    })

    if (!existingLoan) {
      return NextResponse.json(
        { error: 'Empréstimo não encontrado' },
        { status: 404 }
      )
    }

    const updatedLoan = await db.loan.update({
      where: { id: params.id },
      data: {
        totalAmount: validatedData.totalAmount,
        advanceAmount: validatedData.advanceAmount,
        periodicityId: validatedData.periodicityId,
        installments: validatedData.installments,
        installmentValue: validatedData.installmentValue,
        nextPaymentDate: new Date(validatedData.nextPaymentDate)
      },
      include: {
        customer: true,
        periodicity: true
      }
    })

    return NextResponse.json(updatedLoan)
  } catch (error) {
    console.error('Erro ao atualizar empréstimo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}