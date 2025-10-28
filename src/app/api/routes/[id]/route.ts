import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// DELETE - Excluir rota
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Buscar o usuário pelo email para obter o ID
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    const { id } = params
    
    // Verificar se a rota existe e pertence ao usuário
    const route = await db.route.findFirst({
      where: {
        id,
        userId: user.id
      }
    })
    
    if (!route) {
      return NextResponse.json(
        { error: 'Rota não encontrada' },
        { status: 404 }
      )
    }
    
    // Verificar se existem empréstimos usando esta rota
    const loansWithRoute = await db.loan.count({
      where: {
        routeId: id,
        deletedAt: null
      }
    })
    
    if (loansWithRoute > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir esta rota. Existem ${loansWithRoute} empréstimo(s) usando ela.` },
        { status: 400 }
      )
    }
    
    // Excluir a rota
    await db.route.delete({
      where: { id }
    })
    
    return NextResponse.json(
      { message: 'Rota excluída com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao excluir rota:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir rota' },
      { status: 500 }
    )
  }
}

// GET - Buscar rota específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Buscar o usuário pelo email para obter o ID
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    const route = await db.route.findFirst({
      where: {
        id: params.id,
        userId: user.id
      },
      include: {
        _count: {
          select: {
            loans: true
          }
        }
      }
    })
    
    if (!route) {
      return NextResponse.json(
        { error: 'Rota não encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(route)
  } catch (error) {
    console.error('Erro ao buscar rota:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar rota' },
      { status: 500 }
    )
  }
}