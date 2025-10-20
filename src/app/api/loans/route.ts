import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { InstallmentStatus } from '@prisma/client'
import { generatePaymentSchedule } from '@/lib/periodicity-utils'
import { parseBrazilDateString, formatBrazilDateToString, formatDateToString } from '@/lib/timezone-utils'
import { parseBrazilDateString as luxonParseBrazilDateString, brazilDateTimeToDate } from '@/lib/brazil-date'

const loanSchema = z.object({
  customerId: z.string().min(1),
  totalAmount: z.number().positive(),
  amountWithoutInterest: z.number().positive(),
  periodicityId: z.string().min(1),
  installments: z.number().int().positive(),
  installmentValue: z.number().positive(),
  nextPaymentDate: z.string(),
  startDate: z.string(), // Nova data de início do empréstimo
  observation: z.string().optional(), // Campo de observação opcional
  commission: z.number().min(0).max(100).optional().nullable() // Campo de comissão em %
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const validatedData = loanSchema.parse(body)

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

    // Validar se a data do primeiro pagamento não é anterior à data do empréstimo
    const startDate = new Date(validatedData.startDate)
    const paymentDate = new Date(validatedData.nextPaymentDate)
    
    if (paymentDate < startDate) {
      return NextResponse.json(
        { error: 'A data do primeiro pagamento não pode ser anterior à data do empréstimo' },
        { status: 400 }
      )
    }
    
    // Criar o empréstimo
    // Converter as datas usando Luxon para maior precisão
    const transactionDate = brazilDateTimeToDate(luxonParseBrazilDateString(validatedData.startDate))
    const nextPaymentDate = brazilDateTimeToDate(luxonParseBrazilDateString(validatedData.nextPaymentDate))
    
    const newLoan = await db.loan.create({
      data: {
        customerId: validatedData.customerId,
        transactionDate: transactionDate, // Data customizada do empréstimo
        totalAmount: validatedData.totalAmount,
        amountWithoutInterest: validatedData.amountWithoutInterest,
        periodicityId: validatedData.periodicityId,
        installments: validatedData.installments,
        installmentValue: validatedData.installmentValue,
        nextPaymentDate: nextPaymentDate,
        userId: user.id,
        status: 'ACTIVE',
        observation: validatedData.observation || null, // Salvar observação se fornecida
        commission: validatedData.commission || null // Salvar comissão se fornecida
      },
      include: {
        customer: true,
        periodicity: true
      }
    })


    // Configurar a periodicidade para usar na geração das parcelas
    const periodicityConfig = {
      intervalType: periodicity.intervalType,
      intervalValue: periodicity.intervalValue,
      allowedWeekdays: periodicity.allowedWeekdays ? JSON.parse(periodicity.allowedWeekdays) : null,
      allowedMonthDays: periodicity.allowedMonthDays ? JSON.parse(periodicity.allowedMonthDays) : null,
      allowedMonths: periodicity.allowedMonths ? JSON.parse(periodicity.allowedMonths) : null
    }


    // Gerar as datas das parcelas usando a função utilitária
    const paymentDates = generatePaymentSchedule(
      validatedData.nextPaymentDate, // Passar a string diretamente
      validatedData.installments,
      periodicityConfig
    )


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


    // Criar todas as parcelas
    const createResult = await db.installment.createMany({
      data: installmentsData
    })


    // VERIFICAÇÃO AUTOMÁTICA: Conferir se o número de parcelas criadas corresponde ao configurado
    const actualInstallments = await db.installment.count({
      where: { loanId: newLoan.id }
    })


    if (actualInstallments !== validatedData.installments) {
      console.error(`ERRO CRÍTICO: Falha na geração automática de parcelas! Configurado: ${validatedData.installments}, Criado: ${actualInstallments}`)
      
      // Remover empréstimo e parcelas criadas para manter consistência
      await db.installment.deleteMany({
        where: { loanId: newLoan.id }
      })
      await db.loan.delete({
        where: { id: newLoan.id }
      })
      
      return NextResponse.json(
        { 
          error: 'Erro na geração automática de parcelas',
          details: `Esperado ${validatedData.installments} parcelas, mas só foram criadas ${actualInstallments}` 
        },
        { status: 500 }
      )
    } 

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
    const session = await getServerSession(authOptions)
    
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
        },
        deletedAt: null
      },
      include: {
        customer: true,
        periodicity: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formatar as datas sem conversão de timezone para evitar regressão de dias
    const correctedLoans = loans.map(loan => ({
      ...loan,
      transactionDate: formatDateToString(loan.transactionDate),
      nextPaymentDate: formatDateToString(loan.nextPaymentDate),
      createdAt: formatDateToString(loan.createdAt),
      updatedAt: formatDateToString(loan.updatedAt)
    }))

    return NextResponse.json(correctedLoans, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Sempre buscar dados atualizados
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Erro ao buscar empréstimos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}




