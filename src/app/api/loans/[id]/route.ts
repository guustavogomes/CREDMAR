import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatBrazilDateToString, parseBrazilDateString } from '@/lib/timezone-utils'
import { z } from 'zod'
import { generatePaymentSchedule } from '@/lib/periodicity-utils'
import { InstallmentStatus } from '@prisma/client'

const updateLoanSchema = z.object({
  totalAmount: z.number().positive(),
  amountWithoutInterest: z.number().positive(),
  periodicityId: z.string().min(1),
  installments: z.number().int().positive(),
  installmentValue: z.number().positive(),
  nextPaymentDate: z.string(),
  transactionDate: z.string().optional(), // Data do empréstimo - editável apenas sem parcelas pagas
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
        periodicity: true,
        installmentRecords: {
          select: {
            id: true,
            status: true,
            paidAt: true,
            installmentNumber: true
          }
        }
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
      },
      include: {
        installmentRecords: {
          select: {
            id: true,
            status: true,
            paidAt: true,
            installmentNumber: true
          }
        }
      }
    })

    if (!existingLoan) {
      return NextResponse.json(
        { error: 'Empréstimo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se há parcelas já pagas
    const paidInstallments = existingLoan.installmentRecords.filter(
      inst => inst.status === 'PAID'
    )
    const hasPaidInstallments = paidInstallments.length > 0

    // Se há parcelas pagas, apenas alguns campos podem ser editados
    if (hasPaidInstallments) {
      // Verificar se estão tentando alterar campos críticos
      const transactionDateChanged = validatedData.transactionDate && 
        validatedData.transactionDate !== existingLoan.transactionDate.toISOString().split('T')[0]
      
      const criticalFieldsChanged = (
        validatedData.totalAmount !== existingLoan.totalAmount ||
        validatedData.amountWithoutInterest !== existingLoan.amountWithoutInterest ||
        validatedData.installments !== existingLoan.installments ||
        validatedData.installmentValue !== existingLoan.installmentValue ||
        validatedData.periodicityId !== existingLoan.periodicityId ||
        transactionDateChanged
      )

      if (criticalFieldsChanged) {
        return NextResponse.json(
          { 
            error: 'Não é possível alterar valores, parcelas, periodicidade ou data do empréstimo quando há parcelas já pagas',
            details: `${paidInstallments.length} parcela(s) já foram pagas`
          },
          { status: 400 }
        )
      }
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
    
    // Validar se a nova data de pagamento não conflita com parcelas já pagas
    if (hasPaidInstallments) {
      const latestPaidInstallment = paidInstallments.sort(
        (a, b) => b.installmentNumber - a.installmentNumber
      )[0]
      
      // A próxima data não pode ser anterior ao empréstimo
      const loanDate = existingLoan.transactionDate
      if (nextPaymentDate < loanDate) {
        return NextResponse.json(
          { 
            error: 'A data do próximo pagamento não pode ser anterior à data do empréstimo',
            details: `Data do empréstimo: ${loanDate.toISOString().split('T')[0]}`
          },
          { status: 400 }
        )
      }
    }
    
    // Preparar dados para atualização
    const updateData: any = {
      totalAmount: validatedData.totalAmount,
      amountWithoutInterest: validatedData.amountWithoutInterest,
      periodicityId: validatedData.periodicityId,
      installments: validatedData.installments,
      installmentValue: validatedData.installmentValue,
      nextPaymentDate: nextPaymentDate,
      observation: validatedData.observation || null
    }
    
    // Incluir transactionDate apenas se fornecida
    if (validatedData.transactionDate) {
      updateData.transactionDate = parseBrazilDateString(validatedData.transactionDate)
    }
    
    // Atualizar o empréstimo
    const updatedLoan = await db.loan.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
        periodicity: true
      }
    })

    // **REGENERAÇÃO DE PARCELAS INTELIGENTE** 
    // Se não há parcelas pagas, regenerar todas as parcelas para manter consistência
    if (!hasPaidInstallments) {
      console.log('🔄 Regenerando parcelas - nenhuma parcela paga encontrada')
      
      // 1. Remover todas as parcelas pendentes existentes
      await db.installment.deleteMany({
        where: {
          loanId: params.id,
          status: { in: ['PENDING', 'OVERDUE'] }
        }
      })
      
      // 2. Buscar a periodicidade atualizada
      const updatedPeriodicity = await db.periodicity.findUnique({
        where: { id: validatedData.periodicityId }
      })
      
      if (updatedPeriodicity) {
        // 3. Configurar periodicidade
        const periodicityConfig = {
          intervalType: updatedPeriodicity.intervalType,
          intervalValue: updatedPeriodicity.intervalValue,
          allowedWeekdays: updatedPeriodicity.allowedWeekdays ? JSON.parse(updatedPeriodicity.allowedWeekdays) : null,
          allowedMonthDays: updatedPeriodicity.allowedMonthDays ? JSON.parse(updatedPeriodicity.allowedMonthDays) : null,
          allowedMonths: updatedPeriodicity.allowedMonths ? JSON.parse(updatedPeriodicity.allowedMonths) : null
        }
        
        // 4. Gerar novas datas das parcelas
        const paymentDates = generatePaymentSchedule(
          validatedData.nextPaymentDate,
          validatedData.installments,
          periodicityConfig
        )
        
        // 5. Criar novas parcelas
        const installmentsData = paymentDates.map((date, index) => ({
          loanId: params.id,
          installmentNumber: index + 1,
          dueDate: date,
          amount: validatedData.installmentValue,
          paidAmount: 0,
          fineAmount: 0,
          status: 'PENDING' as InstallmentStatus
        }))
        
        // 6. Inserir as novas parcelas
        await db.installment.createMany({
          data: installmentsData
        })
        
        console.log(`✅ Parcelas regeneradas: ${installmentsData.length} parcelas criadas`)
      }
    } else {
      console.log(`⚠️ Parcelas não regeneradas - ${paidInstallments.length} parcela(s) já paga(s)`)
    }

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