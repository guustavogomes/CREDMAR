import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { InstallmentStatus } from '@prisma/client'
import { generatePaymentSchedule } from '@/lib/periodicity-utils'
import { parseBrazilDateString, formatBrazilDateToString } from '@/lib/timezone-utils'

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
    // Converter a data usando timezone do Brasil
    const nextPaymentDate = parseBrazilDateString(validatedData.nextPaymentDate)
    
    const newLoan = await db.loan.create({
      data: {
        customerId: validatedData.customerId,
        transactionDate: new Date(),
        totalAmount: validatedData.totalAmount,
        advanceAmount: validatedData.advanceAmount,
        periodicityId: validatedData.periodicityId,
        installments: validatedData.installments,
        installmentValue: validatedData.installmentValue,
        nextPaymentDate: nextPaymentDate,
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
    const createResult = await db.installment.createMany({
      data: installmentsData
    })

    console.log('Parcelas criadas com sucesso:', createResult.count)

    // VERIFICAÇÃO AUTOMÁTICA: Conferir se o número de parcelas criadas corresponde ao configurado
    const actualInstallments = await db.installment.count({
      where: { loanId: newLoan.id }
    })

    console.log(`Verificação: ${actualInstallments} parcelas criadas de ${validatedData.installments} configuradas`)

    if (actualInstallments !== validatedData.installments) {
      console.error(`ERRO: Inconsistência detectada! Configurado: ${validatedData.installments}, Criado: ${actualInstallments}`)
      
      // Log detalhado para debug
      const createdInstallments = await db.installment.findMany({
        where: { loanId: newLoan.id },
        orderBy: { installmentNumber: 'asc' }
      })
      
      console.log('Parcelas criadas:', createdInstallments.map(inst => ({
        number: inst.installmentNumber,
        dueDate: inst.dueDate,
        amount: inst.amount
      })))
    } else {
      console.log('✅ Verificação OK: Número de parcelas correto')
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

    // Corrigir as datas usando timezone do Brasil
    const correctedLoans = loans.map(loan => ({
      ...loan,
      transactionDate: formatBrazilDateToString(loan.transactionDate),
      nextPaymentDate: formatBrazilDateToString(loan.nextPaymentDate),
      createdAt: formatBrazilDateToString(loan.createdAt),
      updatedAt: formatBrazilDateToString(loan.updatedAt)
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




