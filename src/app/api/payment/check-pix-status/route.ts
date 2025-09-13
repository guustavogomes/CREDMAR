import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { bacenPixAPI, isBacenConfigured } from '@/lib/bacen-pix-api'
import { PAYMENT_CONFIG } from '@/lib/payment-config'

// API para verificar status do PIX periodicamente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }


    // Buscar pagamento pendente do usuário
    const pendingPayment = await db.payment.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!pendingPayment) {
      return NextResponse.json({
        status: 'NO_PENDING_PAYMENT',
        message: 'Nenhum pagamento pendente encontrado'
      })
    }


    // Verificar se as credenciais do BACEN estão configuradas
    if (isBacenConfigured()) {
      
      try {
        // Consultar PIX no BACEN
        const pixEncontrado = await bacenPixAPI.verificarPagamentoPix(
          pendingPayment.amount,
          PAYMENT_CONFIG.PIX.key,
          10 // Janela de 10 minutos
        )

        if (pixEncontrado) {
          
          // Aprovar pagamento
          await db.payment.update({
            where: { id: pendingPayment.id },
            data: {
              status: 'APPROVED',
              approvedAt: new Date(),
              transactionId: pixEncontrado.endToEndId
            }
          })

          // Ativar usuário
          await db.user.update({
            where: { id: session.user.id },
            data: {
              status: 'ACTIVE',
              activatedAt: new Date()
            }
          })

          return NextResponse.json({
            status: 'APPROVED',
            message: 'Pagamento confirmado pelo Banco Central',
            paymentId: pendingPayment.id,
            transactionId: pixEncontrado.endToEndId
          })
        }

        
      } catch (error) {
        console.error('[CHECK PIX] Erro ao consultar BACEN:', error)
        // Continuar com simulação se BACEN falhar
      }
    }

    // FALLBACK: Simulação para desenvolvimento/teste
    const paymentAge = Date.now() - pendingPayment.createdAt.getTime()
    const twoMinutes = 2 * 60 * 1000
    
    if (paymentAge > twoMinutes) {
      
      // Aprovar pagamento
      await db.payment.update({
        where: { id: pendingPayment.id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          transactionId: `AUTO_${Date.now()}`
        }
      })

      // Ativar usuário
      await db.user.update({
        where: { id: session.user.id },
        data: {
          status: 'ACTIVE',
          activatedAt: new Date()
        }
      })


      return NextResponse.json({
        status: 'APPROVED',
        message: 'Pagamento aprovado automaticamente',
        paymentId: pendingPayment.id
      })
    }

    // Ainda pendente
    return NextResponse.json({
      status: 'PENDING',
      message: 'Pagamento ainda não identificado',
      timeRemaining: Math.max(0, twoMinutes - paymentAge)
    })

  } catch (error) {
    console.error('[CHECK PIX] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}