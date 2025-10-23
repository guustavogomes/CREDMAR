import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const periodicities = await db.periodicity.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        intervalType: true,
        intervalValue: true
      },
      orderBy: {
        name: 'asc'
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