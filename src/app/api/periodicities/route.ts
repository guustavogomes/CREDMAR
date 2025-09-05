import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// Cache de periodicidades em memória
let periodicitiesCache: any[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1 hora

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
    // Verificar cache primeiro
    if (periodicitiesCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(periodicitiesCache, {
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', // 1 hora + 1 dia stale
          'X-Cache': 'HIT'
        }
      })
    }
    
    const periodicities = await db.periodicity.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    // Atualizar cache
    periodicitiesCache = periodicities
    cacheTimestamp = Date.now()
    
    return NextResponse.json(periodicities, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', // 1 hora + 1 dia stale
        'X-Cache': 'MISS'
      }
    })
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
    
    // Invalidar cache
    periodicitiesCache = null
    cacheTimestamp = 0
    
    return NextResponse.json(periodicity, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar periodicidade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

