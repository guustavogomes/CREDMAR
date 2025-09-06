import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Role } from '@prisma/client'

const routeSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').transform(val => val.trim())
})

// GET - Listar rotas do usuário
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // If user is admin, get all routes, otherwise only get user's routes
    const isAdmin = session.user.role === 'ADMIN'
    
    const routes = await db.route.findMany({
      where: isAdmin ? {} : { userId: session.user.id },
      orderBy: { description: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            customers: true
          }
        }
      }
    })
    
    return NextResponse.json(routes)
  } catch (error) {
    console.error('Erro ao buscar rotas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova rota
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const validatedData = routeSchema.parse(body)
    
    // Check if route with same description exists for this user (case-insensitive)
    const existingRoute = await db.route.findFirst({
      where: {
        description: {
          equals: validatedData.description,
          mode: 'insensitive'
        },
        userId: session.user.id
      }
    })
    
    if (existingRoute) {
      return NextResponse.json(
        { error: 'Rota já existe' },
        { status: 400 }
      )
    }
    
    const route = await db.route.create({
      data: {
        description: validatedData.description,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    return NextResponse.json(route, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erro ao criar rota:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}