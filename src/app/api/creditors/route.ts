import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Listar credores
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Construir filtros de busca
    const where = {
      userId: session.user.id,
      deletedAt: null,
      ...(search && {
        OR: [
          { nome: { contains: search, mode: 'insensitive' as const } },
          { cpf: { contains: search } },
          { telefone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    }

    // Buscar credores
    const [creditors, total] = await Promise.all([
      db.creditor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              loans: {
                where: { deletedAt: null }
              }
            }
          }
        }
      }),
      db.creditor.count({ where })
    ])

    return NextResponse.json({
      creditors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Erro ao buscar credores:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Criar credor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cpf, nome, telefone, email, endereco, cidade, estado, observacoes } = body

    // Validações obrigatórias
    if (!cpf || !nome) {
      return NextResponse.json(
        { error: "CPF e Nome são obrigatórios" },
        { status: 400 }
      )
    }

    // Validar formato do CPF (apenas números)
    const cpfNumbers = cpf.replace(/\D/g, '')
    if (cpfNumbers.length !== 11) {
      return NextResponse.json(
        { error: "CPF deve ter 11 dígitos" },
        { status: 400 }
      )
    }

    // Verificar se CPF já existe para este usuário
    const existingCreditor = await db.creditor.findFirst({
      where: {
        cpf: cpfNumbers,
        userId: session.user.id,
        deletedAt: null
      }
    })

    if (existingCreditor) {
      return NextResponse.json(
        { error: "Já existe um credor com este CPF" },
        { status: 400 }
      )
    }

    // Criar credor
    const creditor = await db.creditor.create({
      data: {
        cpf: cpfNumbers,
        nome: nome.trim(),
        telefone: telefone?.trim() || null,
        email: email?.trim() || null,
        endereco: endereco?.trim() || null,
        cidade: cidade?.trim() || null,
        estado: estado?.trim() || null,
        observacoes: observacoes?.trim() || null,
        userId: session.user.id
      }
    })

    console.log(`[CREDITORS] ✅ Credor criado: ${nome} (${cpfNumbers})`)

    return NextResponse.json(creditor, { status: 201 })

  } catch (error) {
    console.error("Erro ao criar credor:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}