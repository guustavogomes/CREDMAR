import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const periodicitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  intervalType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  intervalValue: z.number().int().positive(),
  allowedWeekdays: z.string().nullable().optional(),
  allowedMonthDays: z.string().nullable().optional(),
  allowedMonths: z.string().nullable().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const validatedData = periodicitySchema.parse(body)
    
    const periodicity = await db.periodicity.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        intervalType: validatedData.intervalType,
        intervalValue: validatedData.intervalValue,
        allowedWeekdays: validatedData.allowedWeekdays || null,
        allowedMonthDays: validatedData.allowedMonthDays || null,
        allowedMonths: validatedData.allowedMonths || null
      }
    })
    
    return NextResponse.json(periodicity)
  } catch (error) {
    console.error('Erro ao atualizar periodicidade:', error)
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
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    await db.periodicity.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir periodicidade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
