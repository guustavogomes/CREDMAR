import { NextRequest, NextResponse } from 'next/server'
import { PAYMENT_CONFIG } from '@/lib/payment-config'
import { db } from '@/lib/db'

// Webhook para receber confirmações de pagamento PIX
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verificar assinatura do webhook (segurança)
    const signature = request.headers.get('x-webhook-signature')
    if (signature !== PAYMENT_CONFIG.WEBHOOK_SECRET) {
      console.log('Webhook signature inválida')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('=== WEBHOOK PAGAMENTO RECEBIDO ===')
    console.log('Body:', JSON.stringify(body, null, 2))

    // Extrair dados do pagamento
    const { 
      pixCode, 
      amount, 
      status, 
      transactionId,
      paidAt 
    } = body

    if (status !== 'PAID' && status !== 'APPROVED') {
      console.log('Status não é de pagamento aprovado:', status)
      return NextResponse.json({ message: 'Status não processado' })
    }

    // Buscar pagamento pelo código PIX
    const payment = await db.payment.findFirst({
      where: {
        pixCode: pixCode,
        status: 'PENDING'
      },
      include: {
        user: true
      }
    })

    if (!payment) {
      console.log('Pagamento não encontrado para PIX:', pixCode)
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    // Verificar se o valor confere
    if (Math.abs(payment.amount - amount) > 0.01) {
      console.log(`Valor não confere. Esperado: ${payment.amount}, Recebido: ${amount}`)
      return NextResponse.json({ error: 'Valor não confere' }, { status: 400 })
    }

    // Atualizar pagamento como aprovado
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(paidAt || new Date()),
        transactionId: transactionId
      }
    })

    // Ativar usuário
    await db.user.update({
      where: { id: payment.userId },
      data: {
        status: 'ACTIVE',
        activatedAt: new Date()
      }
    })

    console.log(`✅ Usuário ${payment.user.email} ativado automaticamente!`)
    console.log(`💰 Pagamento de R$ ${amount} aprovado`)

    return NextResponse.json({ 
      message: 'Pagamento processado com sucesso',
      userId: payment.userId,
      paymentId: payment.id
    })

  } catch (error) {
    console.error('Erro no webhook de pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Endpoint para simular pagamento (apenas para testes)
export async function PUT(request: NextRequest) {
  try {
    const { pixCode } = await request.json()

    if (!pixCode) {
      return NextResponse.json({ error: 'PIX code é obrigatório' }, { status: 400 })
    }

    // Buscar pagamento
    const payment = await db.payment.findFirst({
      where: {
        pixCode: pixCode,
        status: 'PENDING'
      },
      include: {
        user: true
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    // Simular aprovação
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        transactionId: `SIM_${Date.now()}`
      }
    })

    // Ativar usuário
    await db.user.update({
      where: { id: payment.userId },
      data: {
        status: 'ACTIVE',
        activatedAt: new Date()
      }
    })

    console.log(`🧪 SIMULAÇÃO: Usuário ${payment.user.email} ativado!`)

    return NextResponse.json({ 
      message: 'Pagamento simulado com sucesso',
      userId: payment.userId,
      paymentId: payment.id
    })

  } catch (error) {
    console.error('Erro na simulação de pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}