import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"
import { Resend } from "resend"

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
      // Por segurança, não revelamos se o email existe ou não
      return NextResponse.json(
        { message: "Se o email existir, você receberá um link de recuperação" },
        { status: 200 }
      )
    }

    // Gerar token de recuperação
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hora

    // Salvar token no banco
    await db.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Configurar Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    // URL de reset
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

    // Enviar email usando Resend
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'TaPago <noreply@tapago.com>',
      to: email,
      subject: 'TaPago - Recuperação de Senha',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">TaPago</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Sistema de Gestão de Empréstimos</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">🔐 Recuperação de Senha</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
              Olá,<br><br>
              Você solicitou a recuperação de senha para sua conta no <strong>TaPago</strong>.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetUrl}" 
                 style="background: #667eea; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                🔄 Redefinir Senha
              </a>
            </div>
            
            <!-- Important Info -->
            <div style="background: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
              <p style="color: #333; margin: 0; font-size: 14px; line-height: 1.5;">
                <strong>⚠️ Importante:</strong><br>
                • Este link expira em <strong>1 hora</strong><br>
                • Se você não solicitou esta recuperação, ignore este email<br>
                • Por segurança, não compartilhe este link com ninguém
              </p>
            </div>
            
            <!-- Alternative Link -->
            <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin-top: 25px;">
              <p style="color: #666; font-size: 12px; margin: 0; text-align: center;">
                Se o botão não funcionar, copie e cole este link no seu navegador:
              </p>
              <p style="color: #667eea; font-size: 12px; margin: 5px 0 0 0; text-align: center; word-break: break-all;">
                <a href="${resetUrl}" style="color: #667eea; text-decoration: none;">${resetUrl}</a>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #2d3748; color: #a0aec0; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} TaPago - Sistema de Gestão de Empréstimos
            </p>
            <p style="margin: 5px 0 0 0; font-size: 11px; opacity: 0.8;">
              Este é um email automático, não responda a esta mensagem.
            </p>
          </div>
        </div>
      `
    })

    return NextResponse.json(
      { message: "Email de recuperação enviado com sucesso" },
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