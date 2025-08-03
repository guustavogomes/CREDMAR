import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import bcrypt from "bcryptjs"

const userSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar os dados recebidos
    const validationResult = userSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: validationResult.error.issues },
        { status: 400 }
      )
    }
    
    const { name, email, password } = validationResult.data
    
    // Verificar se o email já está em uso
    const existingUser = await db.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 409 }
      )
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Criar o usuário
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
        status: "PENDING_PAYMENT"
      }
    })
    
    console.log(`[REGISTER API] Usuário criado: ${user.email} com status ${user.status} e role ${user.role}`)
    console.log(`[REGISTER API] Dados completos do usuário:`, {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    })
    
    // Retornar resposta sem a senha
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    })
    
  } catch (error) {
    console.error("Erro ao registrar usuário:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}