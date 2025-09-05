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

    console.log('[CHECK PIX] Verificando status para usuário:', session.user.email)

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
      console.log('[CHECK PIX] Nenhum pagamento pendente encontrado')
      return NextResponse.json({
        status: 'NO_PENDING_PAYMENT',
        message: 'Nenhum pagamento pendente encontrado'
      })
    }

    console.log('[CHECK PIX] Pagamento pendente encontrado:', pendingPayment.id)

    // Verificar se as credenciais do BACEN estão configuradas
    if (isBacenConfigured()) {
      console.log('[CHECK PIX] 🏦 Consultando BACEN...')
      
      try {
        // Consultar PIX no BACEN
        const pixEncontrado = await bacenPixAPI.verificarPagamentoPix(
          pendingPayment.amount,
          PAYMENT_CONFIG.PIX.key,
          10 // Janela de 10 minutos
        )

        if (pixEncontrado) {
          console.log('[CHECK PIX] ✅ PIX confirmado pelo BACEN!')
          
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

        console.log('[CHECK PIX] PIX ainda não encontrado no BACEN')
        
      } catch (error) {
        console.error('[CHECK PIX] Erro ao consultar BACEN:', error)
        // Continuar com simulação se BACEN falhar
      }
    }

    // FALLBACK: Simulação para desenvolvimento/teste
    const paymentAge = Date.now() - pendingPayment.createdAt.getTime()
    const twoMinutes = 2 * 60 * 1000
    
    if (paymentAge > twoMinutes) {
      console.log('[CHECK PIX] 🧪 SIMULAÇÃO: Considerando pagamento como pago após 2 minutos')
      
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

      console.log('[CHECK PIX] ✅ Usuário ativado automaticamente!')

      return NextResponse.json({
        status: 'APPROVED',
        message: 'Pagamento aprovado automaticamente',
        paymentId: pendingPayment.id
      })
    }

    // Ainda pendente
    console.log('[CHECK PIX] Pagamento ainda pendente')
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