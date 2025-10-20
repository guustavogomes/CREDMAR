import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Buscar credor por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const creditor = await db.creditor.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null
      },
      include: {
        loans: {
          where: { deletedAt: null },
          include: {
            customer: {
              select: {
                nomeCompleto: true
              }
            },
            installmentRecords: {
              select: {
                status: true,
                amount: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!creditor) {
      return NextResponse.json(
        { error: "Credor não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(creditor)

  } catch (error) {
    console.error("Erro ao buscar credor:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar credor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validar formato do CPF
    const cpfNumbers = cpf.replace(/\D/g, '')
    if (cpfNumbers.length !== 11) {
      return NextResponse.json(
        { error: "CPF deve ter 11 dígitos" },
        { status: 400 }
      )
    }

    // Verificar se o credor existe
    const existingCreditor = await db.creditor.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null
      }
    })

    if (!existingCreditor) {
      return NextResponse.json(
        { error: "Credor não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se CPF já existe para outro credor
    if (cpfNumbers !== existingCreditor.cpf) {
      const duplicateCreditor = await db.creditor.findFirst({
        where: {
          cpf: cpfNumbers,
          userId: session.user.id,
          deletedAt: null,
          id: { not: params.id }
        }
      })

      if (duplicateCreditor) {
        return NextResponse.json(
          { error: "Já existe outro credor com este CPF" },
          { status: 400 }
        )
      }
    }

    // Atualizar credor
    const updatedCreditor = await db.creditor.update({
      where: { id: params.id },
      data: {
        cpf: cpfNumbers,
        nome: nome.trim(),
        telefone: telefone?.trim() || null,
        email: email?.trim() || null,
        endereco: endereco?.trim() || null,
        cidade: cidade?.trim() || null,
        estado: estado?.trim() || null,
        observacoes: observacoes?.trim() || null
      }
    })

    console.log(`[CREDITORS] ✅ Credor atualizado: ${nome} (${cpfNumbers})`)

    return NextResponse.json(updatedCreditor)

  } catch (error) {
    console.error("Erro ao atualizar credor:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Excluir credor (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Verificar se o credor existe
    const creditor = await db.creditor.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null
      },
      include: {
        loans: {
          where: { 
            deletedAt: null,
            status: 'ACTIVE'
          }
        }
      }
    })

    if (!creditor) {
      return NextResponse.json(
        { error: "Credor não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se há empréstimos ativos
    if (creditor.loans.length > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir credor com empréstimos ativos" },
        { status: 400 }
      )
    }

    // Soft delete
    await db.creditor.update({
      where: { id: params.id },
      data: { deletedAt: new Date() }
    })

    console.log(`[CREDITORS] ✅ Credor excluído: ${creditor.nome} (${creditor.cpf})`)

    return NextResponse.json({ message: "Credor excluído com sucesso" })

  } catch (error) {
    console.error("Erro ao excluir credor:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}