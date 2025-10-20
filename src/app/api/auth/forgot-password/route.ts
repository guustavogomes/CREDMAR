import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"

// Sistema simplificado sem dependência do Resend
// Gera códigos que podem ser usados diretamente ou enviados por qualquer meio

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Email não encontrado no sistema" },
        { status: 404 }
      )
    }

    // Gerar código de recuperação simples (6 dígitos)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hora

    // Salvar código no banco
    await db.user.update({
      where: { email },
      data: {
        resetToken: resetCode,
        resetTokenExpiry
      }
    })

    console.log(`[RESET PASSWORD] Código gerado para ${email}: ${resetCode}`)
    console.log(`[RESET PASSWORD] Código expira em: ${resetTokenExpiry.toLocaleString('pt-BR')}`)

    // Retornar o código diretamente (para desenvolvimento/sistema sem email)
    return NextResponse.json(
      { 
        message: "Código de recuperação gerado com sucesso",
        resetCode: resetCode, // Em produção, remover esta linha
        email: email,
        expiresAt: resetTokenExpiry.toISOString(),
        instructions: "Use este código na página de redefinição de senha"
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Erro ao processar recuperação de senha:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}