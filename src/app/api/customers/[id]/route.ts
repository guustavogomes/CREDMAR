import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateCustomerSchema = z.object({
  cpf: z.string().min(11).max(11),
  nomeCompleto: z.string().min(1),
  celular: z.string().min(1),
  cep: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  referencia: z.string().optional().nullable(),
  // routeId removido - agora é definido no empréstimo
  foto: z.string().optional().nullable()
})

// GET - Buscar cliente específico
export async function GET(
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
    
    const customer = await db.customer.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null
      }
      // include de route removido - agora é definido no empréstimo
    })
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(customer)
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar cliente
export async function PUT(
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
    
    const body = await request.json()
    const validatedData = updateCustomerSchema.parse(body)
    
    // Verificar se o cliente existe e pertence ao usuário
    const existingCustomer = await db.customer.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null
      }
    })
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }
    
    // Validação de rota removida - agora é definida no empréstimo
    
    // Atualizar cliente
    const updatedCustomer = await db.customer.update({
      where: {
        id: params.id
      },
      data: {
        cpf: validatedData.cpf,
        nomeCompleto: validatedData.nomeCompleto,
        celular: validatedData.celular,
        cep: validatedData.cep || null,
        endereco: validatedData.endereco || null,
        cidade: validatedData.cidade || null,
        estado: validatedData.estado || null,
        bairro: validatedData.bairro || null,
        referencia: validatedData.referencia || null,
        foto: validatedData.foto || null
      }
      // include de route removido
    })
    
    return NextResponse.json(updatedCustomer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    // Verificar se é erro de CPF duplicado
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const prismaError = error as any
      
      // Verificar se a violação é da constraint 'unique_cpf_per_user'
      if (prismaError.meta?.target?.includes('cpf') && 
          prismaError.meta?.target?.includes('userId')) {
        // Se a constraint violada inclui tanto cpf quanto userId,
        // significa que esse usuário específico já cadastrou esse CPF
        return NextResponse.json(
          { error: 'Você já cadastrou um cliente com este CPF' },
          { status: 409 }
        )
      }
    }
    
    console.error('Erro ao atualizar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir cliente (soft delete)
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
    
    // Verificar se o cliente existe e pertence ao usuário
    const existingCustomer = await db.customer.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null
      }
    })
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o cliente possui empréstimos ativos
    const activeLoans = await db.loan.count({
      where: {
        customerId: params.id,
        status: 'ACTIVE',
        deletedAt: null
      }
    })

    if (activeLoans > 0) {
      return NextResponse.json(
        { 
          error: `Não é possível excluir este cliente porque ele possui ${activeLoans} empréstimo(s) ativo(s). Para excluir o cliente, primeiro cancele ou finalize todos os empréstimos.` 
        },
        { status: 400 }
      )
    }
    
    // Soft delete - apenas marca como deletado
    await db.customer.update({
      where: {
        id: params.id
      },
      data: {
        deletedAt: new Date()
      }
    })
    
    return NextResponse.json({ message: 'Cliente excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}



