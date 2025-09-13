import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseBrazilDateString } from '@/lib/timezone-utils'
import { z } from 'zod'
import { generatePaymentSchedule } from '@/lib/periodicity-utils'
import { InstallmentStatus } from '@prisma/client'

const addInstallmentsSchema = z.object({
  installmentValue: z.number().positive(),
  installmentsCount: z.number().int().positive().max(60),
  startDate: z.string()
})

export async function POST(
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
    const validatedData = addInstallmentsSchema.parse(body)

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
    const loan = await db.loan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        deletedAt: null,
        status: 'ACTIVE' // Apenas empréstimos ativos
      },
      include: {
        periodicity: true,
        installmentRecords: {
          orderBy: {
            installmentNumber: 'desc'
          },
          take: 1
        }
      }
    })

    if (!loan) {
      return NextResponse.json(
        { error: 'Empréstimo ativo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se a data de início é válida
    const startDate = parseBrazilDateString(validatedData.startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (startDate < today) {
      return NextResponse.json(
        { error: 'A data de início não pode ser anterior a hoje' },
        { status: 400 }
      )
    }

    // Encontrar o próximo número de parcela
    const lastInstallment = loan.installmentRecords[0]
    const nextInstallmentNumber = lastInstallment ? lastInstallment.installmentNumber + 1 : 1

    // Configurar periodicidade
    const periodicityConfig = {
      intervalType: loan.periodicity.intervalType,
      intervalValue: loan.periodicity.intervalValue,
      allowedWeekdays: loan.periodicity.allowedWeekdays ? JSON.parse(loan.periodicity.allowedWeekdays) : null,
      allowedMonthDays: loan.periodicity.allowedMonthDays ? JSON.parse(loan.periodicity.allowedMonthDays) : null,
      allowedMonths: loan.periodicity.allowedMonths ? JSON.parse(loan.periodicity.allowedMonths) : null
    }

    // Gerar datas das novas parcelas
    const paymentDates = generatePaymentSchedule(
      validatedData.startDate,
      validatedData.installmentsCount,
      periodicityConfig
    )

    // Criar as novas parcelas
    const installmentsData = paymentDates.map((date, index) => ({
      loanId: params.id,
      installmentNumber: nextInstallmentNumber + index,
      dueDate: date,
      amount: validatedData.installmentValue,
      paidAmount: 0,
      fineAmount: 0,
      status: 'PENDING' as InstallmentStatus
    }))

    // Inserir as parcelas no banco
    await db.installment.createMany({
      data: installmentsData
    })

    // Atualizar o empréstimo com o novo total de parcelas
    const newTotalInstallments = loan.installments + validatedData.installmentsCount
    const newTotalAmount = loan.totalAmount + (validatedData.installmentValue * validatedData.installmentsCount)
    
    await db.loan.update({
      where: { id: params.id },
      data: {
        installments: newTotalInstallments,
        totalAmount: newTotalAmount
      }
    })

    console.log(`✅ ${validatedData.installmentsCount} parcelas adicionadas ao empréstimo ${params.id}`)
    console.log(`📊 Novo total: ${newTotalInstallments} parcelas, R$ ${newTotalAmount.toFixed(2)}`)

    return NextResponse.json({
      message: `${validatedData.installmentsCount} parcelas adicionadas com sucesso`,
      addedInstallments: validatedData.installmentsCount,
      newTotalInstallments,
      newTotalAmount,
      installments: installmentsData
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erro ao adicionar parcelas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
