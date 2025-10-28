// @ts-ignore - Ignorando erro de importação de next/server
import { NextRequest, NextResponse } from 'next/server'
// @ts-ignore - Ignorando erro de importação de next-auth
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
// @ts-ignore - Ignorando erro de importação de zod
import { z } from 'zod'

// Tipos para erros do Prisma
type PrismaError = {
  code: string;
  meta?: {
    target?: string[];
  };
}

const customerSchema = z.object({
  cpf: z.string().min(11).max(11),
  nomeCompleto: z.string().min(1),
  celular: z.string().min(1),
  cep: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  referencia: z.string().optional().nullable(),
  foto: z.string().optional().nullable()
})

// GET - Listar clientes do usuário
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Verificar se o usuário existe - primeiro por ID, depois por email como fallback
    let user = await db.user.findUnique({
      where: { id: session.user.id }
    })
    
    if (!user && session.user.email) {
      user = await db.user.findUnique({
        where: { email: session.user.email }
      })
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    // Buscar clientes do usuário logado (apenas não deletados)
    const customers = await db.customer.findMany({
      where: {
        userId: user.id,
        deletedAt: null
      },
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('🔍 [API Customers POST] Sessão:', session?.user?.email, 'ID:', session?.user?.id)
    
    if (!session?.user?.id) {
      console.log('❌ [API Customers POST] Usuário não autorizado')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    console.log('📋 [API Customers POST] Dados recebidos:', body)
    
    const validatedData = customerSchema.parse(body)
    
    // Verificar se o usuário existe - primeiro por ID, depois por email como fallback
    let user = await db.user.findUnique({
      where: { id: session.user.id }
    })
    
    if (!user && session.user.email) {
      console.log('⚠️ [API Customers POST] Usuário não encontrado por ID, tentando por email')
      user = await db.user.findUnique({
        where: { email: session.user.email }
      })
    }
    
    console.log('👤 [API Customers POST] Usuário encontrado:', !!user, user?.email, 'ID:', user?.id)
    
    if (!user) {
      console.log('❌ [API Customers POST] Usuário não encontrado no banco')
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    // Validação de rota removida - agora a rota é definida no empréstimo
    
    // Criar novo cliente
    const newCustomer = await db.customer.create({
      data: {
        cpf: validatedData.cpf,
        nomeCompleto: validatedData.nomeCompleto,
        celular: validatedData.celular,
        cep: validatedData.cep,
        endereco: validatedData.endereco,
        cidade: validatedData.cidade,
        estado: validatedData.estado,
        bairro: validatedData.bairro,
        referencia: validatedData.referencia || null,
        foto: validatedData.foto || null,
        userId: user.id
      }
    })
    
    return NextResponse.json(newCustomer, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors)
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    // Verificar se é erro de CPF duplicado
    function isPrismaErrorWithCode(err: unknown): err is PrismaError {
      return (
        err !== null &&
        typeof err === 'object' &&
        'code' in err &&
        typeof (err as PrismaError).code === 'string' &&
        (err as PrismaError).code === 'P2002'
      );
    }
    
    if (isPrismaErrorWithCode(error)) {
      const prismaError = error;
      
      // Verificar se a violação é da constraint 'unique_cpf_per_user'
      if (prismaError.meta?.target && 
          Array.isArray(prismaError.meta.target) &&
          prismaError.meta.target.some(field => field.includes('cpf')) && 
          prismaError.meta.target.some(field => field.includes('userId'))) {
        // Se a constraint violada inclui tanto cpf quanto userId,
        // significa que esse usuário específico já cadastrou esse CPF
        return NextResponse.json(
          { error: 'Você já cadastrou um cliente com este CPF' },
          { status: 409 }
        )
      }
    }
    
    console.error('Erro ao criar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}










