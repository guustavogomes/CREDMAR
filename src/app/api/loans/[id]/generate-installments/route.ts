import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { generatePaymentSchedule } from '@/lib/periodicity-utils'
import { InstallmentStatus } from '@prisma/client'

export async function POST(
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

    // Buscar o empréstimo com a periodicidade
    const loan = await db.loan.findFirst({
      where: {
        id: params.id,
        user: {
          email: session.user.email
        }
      },
      include: {
        periodicity: true
      }
    })

    if (!loan) {
      return NextResponse.json(
        { error: 'Empréstimo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já existem parcelas
    const existingInstallments = await db.installment.findMany({
      where: { loanId: loan.id }
    })

    if (existingInstallments.length > 0) {
      return NextResponse.json(
        { error: 'Este empréstimo já possui parcelas geradas' },
        { status: 400 }
      )
    }

    // Configurar a periodicidade
    const periodicityConfig = {
      intervalType: loan.periodicity.intervalType,
      intervalValue: loan.periodicity.intervalValue,
      allowedWeekdays: loan.periodicity.allowedWeekdays ? JSON.parse(loan.periodicity.allowedWeekdays) : null,
      allowedMonthDays: loan.periodicity.allowedMonthDays ? JSON.parse(loan.periodicity.allowedMonthDays) : null,
      allowedMonths: loan.periodicity.allowedMonths ? JSON.parse(loan.periodicity.allowedMonths) : null
    }

    console.log('Configuração de periodicidade:', periodicityConfig)

    // Gerar as datas das parcelas
    const paymentDates = generatePaymentSchedule(
      loan.nextPaymentDate, // Usar a data diretamente
      loan.installments,
      periodicityConfig
    )

    console.log('Datas geradas:', paymentDates)

    // Criar as parcelas
    const installmentsData = paymentDates.map((date, index) => ({
      loanId: loan.id,
      installmentNumber: index + 1,
      dueDate: date,
      amount: loan.installmentValue,
      paidAmount: 0,
      fineAmount: 0,
      status: 'PENDING' as InstallmentStatus
    }))

    // Criar todas as parcelas
    await db.installment.createMany({
      data: installmentsData
    })

    return NextResponse.json({ 
      message: 'Parcelas geradas com sucesso',
      count: installmentsData.length 
    })
  } catch (error) {
    console.error('Erro ao gerar parcelas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

