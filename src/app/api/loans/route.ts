import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { InstallmentStatus } from '@prisma/client'
import { generatePaymentSchedule } from '@/lib/periodicity-utils'

const loanSchema = z.object({
  customerId: z.string().min(1),
  totalAmount: z.number().positive(),
  advanceAmount: z.number().min(0),
  periodicityId: z.string().min(1),
  installments: z.number().int().positive(),
  installmentValue: z.number().positive(),
  nextPaymentDate: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Dados recebidos:', body)
    
    const validatedData = loanSchema.parse(body)
    console.log('Dados validados:', validatedData)

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Buscar a periodicidade para usar na geração das parcelas
    const periodicity = await db.periodicity.findUnique({
      where: { id: validatedData.periodicityId }
    })

    if (!periodicity) {
      return NextResponse.json(
        { error: 'Periodicidade não encontrada' },
        { status: 404 }
      )
    }

    // Criar o empréstimo
    const newLoan = await db.loan.create({
      data: {
        customerId: validatedData.customerId,
        transactionDate: new Date(),
        totalAmount: validatedData.totalAmount,
        advanceAmount: validatedData.advanceAmount,
        periodicityId: validatedData.periodicityId,
        installments: validatedData.installments,
        installmentValue: validatedData.installmentValue,
        nextPaymentDate: new Date(validatedData.nextPaymentDate),
        userId: user.id,
        status: 'ACTIVE'
      },
      include: {
        customer: true,
        periodicity: true
      }
    })

    console.log('Empréstimo criado:', newLoan)

    // Configurar a periodicidade para usar na geração das parcelas
    const periodicityConfig = {
      intervalType: periodicity.intervalType,
      intervalValue: periodicity.intervalValue,
      allowedWeekdays: periodicity.allowedWeekdays ? JSON.parse(periodicity.allowedWeekdays) : null,
      allowedMonthDays: periodicity.allowedMonthDays ? JSON.parse(periodicity.allowedMonthDays) : null,
      allowedMonths: periodicity.allowedMonths ? JSON.parse(periodicity.allowedMonths) : null
    }

    console.log('Configuração de periodicidade:', periodicityConfig)

    // Gerar as datas das parcelas usando a função utilitária
    const paymentDates = generatePaymentSchedule(
      validatedData.nextPaymentDate, // Passar a string diretamente
      validatedData.installments,
      periodicityConfig
    )

    console.log('Datas geradas:', paymentDates)

    // Criar as parcelas com as datas corretas
    const installmentsData = paymentDates.map((date, index) => ({
      loanId: newLoan.id,
      installmentNumber: index + 1,
      dueDate: date,
      amount: validatedData.installmentValue,
      paidAmount: 0,
      fineAmount: 0,
      status: 'PENDING' as InstallmentStatus
    }))

    console.log('Parcelas a serem criadas:', installmentsData.length)

    // Criar todas as parcelas
    await db.installment.createMany({
      data: installmentsData
    })

    console.log('Parcelas criadas com sucesso')

    return NextResponse.json(newLoan, { status: 201 })
  } catch (error) {
    console.error('Erro detalhado ao criar empréstimo:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const loans = await db.loan.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
      include: {
        customer: true,
        periodicity: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(loans)
  } catch (error) {
    console.error('Erro ao buscar empréstimos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}




