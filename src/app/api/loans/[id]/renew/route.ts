import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { generatePaymentSchedule } from '@/lib/periodicity-utils'
import { InstallmentStatus } from '@prisma/client'
import { z } from 'zod'

const renewLoanSchema = z.object({
  nextPaymentDate: z.string().min(1, 'Data do próximo pagamento é obrigatória')
})

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

    const body = await request.json()
    const validatedData = renewLoanSchema.parse(body)

    // Buscar o empréstimo original
    const originalLoan = await db.loan.findFirst({
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

    if (!originalLoan) {
      return NextResponse.json(
        { error: 'Empréstimo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o empréstimo está concluído
    if (originalLoan.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Apenas empréstimos concluídos podem ser renovados' },
        { status: 400 }
      )
    }

    // Converter a data para o fuso horário local para evitar problemas de UTC
    const nextPaymentDate = new Date(validatedData.nextPaymentDate + 'T00:00:00')

    // Criar o novo empréstimo com os mesmos dados
    const newLoan = await db.loan.create({
      data: {
        customerId: originalLoan.customerId,
        transactionDate: new Date(),
        totalAmount: originalLoan.totalAmount,
        amountWithoutInterest: originalLoan.amountWithoutInterest,
        periodicityId: originalLoan.periodicityId,
        installments: originalLoan.installments,
        installmentValue: originalLoan.installmentValue,
        nextPaymentDate: nextPaymentDate,
        userId: originalLoan.userId,
        status: 'ACTIVE'
      },
      include: {
        customer: true,
        periodicity: true
      }
    })

    // Configurar a periodicidade para usar na geração das parcelas
    const periodicityConfig = {
      intervalType: originalLoan.periodicity.intervalType,
      intervalValue: originalLoan.periodicity.intervalValue,
      allowedWeekdays: originalLoan.periodicity.allowedWeekdays ? JSON.parse(originalLoan.periodicity.allowedWeekdays) : null,
      allowedMonthDays: originalLoan.periodicity.allowedMonthDays ? JSON.parse(originalLoan.periodicity.allowedMonthDays) : null,
      allowedMonths: originalLoan.periodicity.allowedMonths ? JSON.parse(originalLoan.periodicity.allowedMonths) : null
    }

    // Gerar as datas das parcelas usando a função utilitária
    const paymentDates = generatePaymentSchedule(
      validatedData.nextPaymentDate,
      originalLoan.installments,
      periodicityConfig
    )

    // Criar as parcelas com as datas corretas
    const installmentsData = paymentDates.map((date, index) => ({
      loanId: newLoan.id,
      installmentNumber: index + 1,
      dueDate: date,
      amount: originalLoan.installmentValue,
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


    if (actualInstallments !== originalLoan.installments) {
      console.error(`ERRO RENOVAÇÃO: Inconsistência detectada! Configurado: ${originalLoan.installments}, Criado: ${actualInstallments}`)
      
      // Log detalhado para debug
      const createdInstallments = await db.installment.findMany({
        where: { loanId: newLoan.id },
        orderBy: { installmentNumber: 'asc' }
      })
      
    } 

    return NextResponse.json({
      message: 'Empréstimo renovado com sucesso',
      newLoan: {
        id: newLoan.id,
        customer: newLoan.customer,
        periodicity: newLoan.periodicity,
        totalAmount: newLoan.totalAmount,
        amountWithoutInterest: newLoan.amountWithoutInterest,
        installments: newLoan.installments,
        installmentValue: newLoan.installmentValue,
        nextPaymentDate: newLoan.nextPaymentDate
      }
    })

  } catch (error) {
    console.error('Erro ao renovar empréstimo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
