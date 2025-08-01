import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateCustomerSchema = z.object({
  cpf: z.string().min(11).max(11),
  nomeCompleto: z.string().min(1),
  celular: z.string().min(1),
  cep: z.string().regex(/^\d{8}$/),
  endereco: z.string().min(1),
  cidade: z.string().min(1),
  estado: z.string().min(1),
  bairro: z.string().min(1),
  referencia: z.string().optional().nullable(),
  routeId: z.string().optional().nullable(),
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
        userId: session.user.id
      },
      include: {
        route: true
      }
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
        userId: session.user.id
      }
    })
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }
    
    // Se routeId foi fornecido, verificar se existe
    if (validatedData.routeId) {
      const route = await db.route.findUnique({
        where: { id: validatedData.routeId }
      })
      
      if (!route) {
        return NextResponse.json(
          { error: 'Rota não encontrada' },
          { status: 400 }
        )
      }
    }
    
    // Atualizar cliente
    const updatedCustomer = await db.customer.update({
      where: {
        id: params.id
      },
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
        routeId: validatedData.routeId || null,
        foto: validatedData.foto || null
      },
      include: {
        route: true
      }
    })
    
    return NextResponse.json(updatedCustomer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erro ao atualizar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir cliente
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
        userId: session.user.id
      }
    })
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }
    
    // Excluir cliente
    await db.customer.delete({
      where: {
        id: params.id
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



