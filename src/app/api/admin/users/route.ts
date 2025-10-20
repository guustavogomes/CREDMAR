import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  status: z.enum(['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED']).default('ACTIVE')
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário é administrador
    const adminUser = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem visualizar usuários.' },
        { status: 403 }
      )
    }

    // Obter filtro da query string
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'

    // Construir where clause baseado no filtro
    let whereClause: any = {}
    
    switch (filter) {
      case 'pending':
        whereClause.status = 'PENDING_APPROVAL'
        break
      case 'active':
        whereClause.status = 'ACTIVE'
        break
      case 'suspended':
        whereClause.status = 'SUSPENDED'
        break
      case 'suspended':
        whereClause.status = 'SUSPENDED'
        break
      case 'all':
      default:
        // Sem filtro, retorna todos
        break
    }

    // Buscar usuários
    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        activatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)

  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário é administrador
    const adminUser = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem criar usuários.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Verificar se o email já existe
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 400 }
      )
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Criar o usuário
    const newUser = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        status: validatedData.status,
        // Se o status for ACTIVE, definir como ativado
        activatedAt: validatedData.status === 'ACTIVE' ? new Date() : null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        activatedAt: true
      }
    })

    console.log(`✅ Usuário criado pelo admin: ${newUser.email} (${newUser.role})`)

    return NextResponse.json({
      message: 'Usuário criado com sucesso',
      user: newUser
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}