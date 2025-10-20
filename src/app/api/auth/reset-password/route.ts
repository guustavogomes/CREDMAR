import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, resetCode, password } = await request.json()

    if (!email || !resetCode || !password) {
      return NextResponse.json(
        { error: "Email, código e senha são obrigatórios" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Verificar se o código existe e não expirou
    const user = await db.user.findFirst({
      where: {
        email: email,
        resetToken: resetCode,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Código inválido, expirado ou email incorreto" },
        { status: 400 }
      )
    }

    console.log(`[RESET PASSWORD] Redefinindo senha para ${email} com código ${resetCode}`)

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Atualizar senha e limpar código de reset
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    })

    console.log(`[RESET PASSWORD] ✅ Senha redefinida com sucesso para ${email}`)

    return NextResponse.json(
      { message: "Senha redefinida com sucesso" },
      { status: 200 }
    )

  } catch (error) {
    console.error("Erro ao redefinir senha:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}