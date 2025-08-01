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

export async function GET() {
  try {
    const periodicities = await db.periodicity.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    return NextResponse.json(periodicities)
  } catch (error) {
    console.error('Erro ao buscar periodicidades:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    
    const periodicity = await db.periodicity.create({
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
    
    return NextResponse.json(periodicity, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar periodicidade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

