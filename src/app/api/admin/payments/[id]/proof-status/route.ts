import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se é admin
    const admin = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { status } = await request.json()
    const paymentId = params.id

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 })
    }

    // Buscar o pagamento com dados do usuário
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    // Atualizar o pagamento
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status: status,
        approvedBy: status === 'APPROVED' ? admin.id : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        rejectedAt: status === 'REJECTED' ? new Date() : null,
        rejectionReason: status === 'REJECTED' ? 'Comprovante rejeitado pelo administrador' : null
      }
    })

    // Se aprovado, atualizar status do usuário e enviar email
    if (status === 'APPROVED') {
      // Atualizar status do usuário para ACTIVE
      await db.user.update({
        where: { id: payment.user.id },
        data: { status: 'ACTIVE' }
      })

      // Enviar email de aprovação
      try {
        const emailResult = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'TaPago <onboarding@resend.dev>',
          to: payment.user.email,
          subject: 'TaPago - Pagamento Aprovado! 🎉',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">TaPago</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Sistema de Gestão de Empréstimos</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px; background: #ffffff;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="background: #10b981; color: white; width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 36px; margin-bottom: 20px;">
                    ✅
                  </div>
                  <h2 style="color: #333; margin: 0; font-size: 28px; font-weight: bold;">Pagamento Aprovado!</h2>
                </div>
                
                <p style="color: #666; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                  Olá <strong>${payment.user.name}</strong>,
                </p>
                
                <p style="color: #666; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                  Temos uma ótima notícia! Seu comprovante de pagamento foi <strong style="color: #10b981;">aprovado</strong> 
                  pela nossa equipe. Sua conta no TaPago está agora totalmente ativa e você já pode começar a usar 
                  todas as funcionalidades do sistema.
                </p>
                
                <!-- Payment Details -->
                <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
                  <p style="color: #333; margin: 0; font-size: 14px; line-height: 1.5;">
                    <strong>📊 Detalhes do Pagamento:</strong><br>
                    • Valor: R$ ${payment.amount.toFixed(2)}<br>
                    • Método: ${payment.method}<br>
                    • Data de Aprovação: ${new Date().toLocaleDateString('pt-BR')}<br>
                    • Status: Aprovado ✅
                  </p>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" 
                     style="background: #10b981; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    🚀 Acessar o Sistema
                  </a>
                </div>
                
                <!-- Features -->
                <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0;">
                  <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">🎯 O que você pode fazer agora:</h3>
                  <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Cadastrar clientes e gerenciar informações</li>
                    <li>Criar e acompanhar empréstimos</li>
                    <li>Definir rotas de cobrança</li>
                    <li>Controlar parcelas e vencimentos</li>
                    <li>Gerar relatórios financeiros</li>
                  </ul>
                </div>
                
                <p style="color: #666; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                  Nossa equipe está sempre disponível para ajudar você a aproveitar ao máximo o TaPago. 
                  Seja bem-vindo(a) e muito sucesso em seus negócios!
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #2d3748; color: #a0aec0; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 12px;">
                  © ${new Date().getFullYear()} TaPago - Sistema de Gestão de Empréstimos
                </p>
                <p style="margin: 5px 0 0 0; font-size: 11px; opacity: 0.8;">
                  Este email foi enviado para ${payment.user.email}
                </p>
              </div>
            </div>
          `
        })

        console.log(`✅ Email de aprovação enviado para ${payment.user.email}:`, emailResult.data?.id)
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de aprovação:', emailError)
        // Não falhar a aprovação por causa do email
      }
    }

    // Se rejeitado, enviar email de rejeição
    if (status === 'REJECTED') {
      try {
        const emailResult = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'TaPago <onboarding@resend.dev>',
          to: payment.user.email,
          subject: 'TaPago - Comprovante Rejeitado',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">TaPago</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Sistema de Gestão de Empréstimos</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px; background: #ffffff;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="background: #ef4444; color: white; width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 36px; margin-bottom: 20px;">
                    ❌
                  </div>
                  <h2 style="color: #333; margin: 0; font-size: 24px;">Comprovante Rejeitado</h2>
                </div>
                
                <p style="color: #666; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                  Olá <strong>${payment.user.name}</strong>,
                </p>
                
                <p style="color: #666; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                  Infelizmente, o comprovante de pagamento que você enviou não pôde ser aprovado pela nossa equipe. 
                  Isso pode acontecer por diversos motivos, como qualidade da imagem ou informações não visíveis.
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/pending-payment" 
                     style="background: #3b82f6; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    📤 Enviar Novo Comprovante
                  </a>
                </div>
                
                <!-- Tips -->
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px;">
                  <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                    <strong>💡 Dicas para o próximo envio:</strong><br>
                    • Certifique-se de que a imagem está nítida<br>
                    • Todos os dados devem estar visíveis<br>
                    • Use formatos JPG, PNG ou WebP<br>
                    • Máximo 5MB de tamanho
                  </p>
                </div>
                
                <p style="color: #666; line-height: 1.6; font-size: 16px;">
                  Nossa equipe está disponível para esclarecer dúvidas. Envie um novo comprovante 
                  seguindo as dicas acima e teremos prazer em analisar novamente.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #2d3748; color: #a0aec0; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 12px;">
                  © ${new Date().getFullYear()} TaPago - Sistema de Gestão de Empréstimos
                </p>
                <p style="margin: 5px 0 0 0; font-size: 11px; opacity: 0.8;">
                  Este email foi enviado para ${payment.user.email}
                </p>
              </div>
            </div>
          `
        })

        console.log(`📧 Email de rejeição enviado para ${payment.user.email}:`, emailResult.data?.id)
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de rejeição:', emailError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Pagamento ${status === 'APPROVED' ? 'aprovado' : 'rejeitado'} com sucesso`,
      payment: updatedPayment
    })

  } catch (error) {
    console.error("Erro ao processar status do comprovante:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}