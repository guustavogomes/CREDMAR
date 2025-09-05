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
    console.log('[REGISTER API] === INICIANDO REGISTRO ===')
    
    const body = await request.json()
    console.log('[REGISTER API] Dados recebidos:', { 
      name: body.name, 
      email: body.email, 
      hasPassword: !!body.password 
    })
    
    // Validar os dados recebidos
    console.log('[REGISTER API] Validando dados...')
    const validationResult = userSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.log('[REGISTER API] ❌ Validação falhou:', validationResult.error.issues)
      return NextResponse.json(
        { error: "Dados inválidos", issues: validationResult.error.issues },
        { status: 400 }
      )
    }
    
    console.log('[REGISTER API] ✅ Dados válidos')
    const { name, email, password } = validationResult.data
    
    // Verificar se o email já está em uso
    console.log('[REGISTER API] Verificando se email já existe...')
    const existingUser = await db.user.findUnique({
      where: { email }
    })
    console.log('[REGISTER API] Email já existe?', !!existingUser)
    
    if (existingUser) {
      console.log('[REGISTER API] ❌ Email já está em uso:', email)
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 409 }
      )
    }
    
    // Hash da senha
    console.log('[REGISTER API] Gerando hash da senha...')
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log('[REGISTER API] ✅ Hash gerado com sucesso')
    
    // Criar o usuário
    console.log('[REGISTER API] Criando usuário no banco...')
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
        status: "PENDING_PAYMENT"
      }
    })
    console.log('[REGISTER API] ✅ Usuário criado no banco com ID:', user.id)
    
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
    console.error('[REGISTER API] ❌ ERRO GERAL:', error)
    console.error('[REGISTER API] Stack trace:', error instanceof Error ? error.stack : 'N/A')
    console.error('[REGISTER API] Tipo do erro:', typeof error)
    
    return NextResponse.json(
      { 
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}