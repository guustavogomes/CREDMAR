import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { asaasAPI } from '@/lib/asaas-api'
import { PAYMENT_CONFIG, AsaasWebhookData } from '@/lib/payment-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    
    // Debug: logs para entender como o Asaas envia os headers
    console.log('=== WEBHOOK DEBUG ===')
    console.log('Headers recebidos:', Object.fromEntries(request.headers.entries()))
    console.log('PAYMENT_CONFIG.ASAAS.webhookToken:', PAYMENT_CONFIG.ASAAS.webhookToken)
    
    // Tentar diferentes possíveis headers do token
    const possibleTokenHeaders = [
      'asaas-access-token',
      'x-asaas-token', 
      'authorization',
      'access_token',
      'webhook-token'
    ]
    
    let receivedToken = null
    for (const header of possibleTokenHeaders) {
      const token = request.headers.get(header)
      if (token) {
        console.log(`Token encontrado no header "${header}": ${token}`)
        receivedToken = token
        break
      }
    }
    
    // Temporariamente permitir todos os webhooks do Asaas para debug
    console.log('🔓 Validação de token desabilitada temporariamente para debug')
    
    // TODO: Implementar validação correta do webhook do Asaas
    // Conforme documentação: https://asaas.com/docs/api/#webhook

    const webhookData: AsaasWebhookData = JSON.parse(body)
    console.log('Webhook recebido do Asaas:', webhookData)

    // Processar webhook
    await asaasAPI.processWebhook(webhookData)

    // Buscar pagamento no banco local
    const payment = await db.payment.findFirst({
      where: {
        asaasPaymentId: webhookData.payment.id
      },
      include: {
        user: true
      }
    })

    if (!payment) {
      console.warn('Pagamento não encontrado no banco local (pode ser de testes antigos):', webhookData.payment.id)
      // Retorna sucesso para evitar reenvios do webhook
      return NextResponse.json(
        { success: true, message: 'Pagamento não encontrado (ignorado)' },
        { status: 200 }
      )
    }

    // Mapear status do Asaas para nosso sistema
    let newStatus = payment.status
    let approvedBy = payment.approvedBy
    let approvedAt = payment.approvedAt
    let rejectedAt = payment.rejectedAt
    let rejectionReason = payment.rejectionReason

    switch (webhookData.event) {
      case 'PAYMENT_RECEIVED':
        newStatus = 'APPROVED'
        approvedBy = 'ASAAS_WEBHOOK'
        approvedAt = new Date()
        break

      case 'PAYMENT_OVERDUE':
        newStatus = 'PENDING' // Manter como pendente para permitir pagamento
        break

      case 'PAYMENT_REFUNDED':
        newStatus = 'REJECTED'
        rejectedAt = new Date()
        rejectionReason = 'Pagamento estornado'
        break

      case 'PAYMENT_DELETED':
        newStatus = 'REJECTED'
        rejectedAt = new Date()
        rejectionReason = 'Cobrança cancelada'
        break

      default:
        console.log(`Evento não tratado: ${webhookData.event}`)
        return NextResponse.json({ success: true })
    }

    // Atualizar pagamento no banco
    const updatedPayment = await db.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        approvedBy,
        approvedAt,
        rejectedAt,
        rejectionReason,
        asaasNetValue: webhookData.payment.netValue,
        asaasOriginalValue: webhookData.payment.originalValue,
        asaasInterestValue: webhookData.payment.interestValue,
      }
    })

    // Se o pagamento foi aprovado, ativar o usuário
    if (newStatus === 'APPROVED' && payment.user) {
      await db.user.update({
        where: { id: payment.user.id },
        data: {
          status: 'ACTIVE',
          activatedAt: new Date()
        }
      })

      console.log(`Usuário ${payment.user.email} ativado via webhook do Asaas`)
    }

    console.log(`Pagamento ${payment.id} atualizado para status: ${newStatus}`)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao processar webhook do Asaas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Endpoint para configurar webhook (apenas para desenvolvimento/testes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'setup') {
      // Configurar webhook no Asaas
      const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/payment/asaas/webhook`
      
      const webhook = await asaasAPI.createWebhook(webhookUrl, [
        'PAYMENT_CREATED',
        'PAYMENT_AWAITING_PAYMENT',
        'PAYMENT_RECEIVED',
        'PAYMENT_OVERDUE',
        'PAYMENT_DELETED',
        'PAYMENT_RESTORED',
        'PAYMENT_REFUNDED',
        'PAYMENT_RECEIVED_IN_CASH_UNDONE',
        'PAYMENT_CHARGEBACK_REQUESTED',
        'PAYMENT_CHARGEBACK_DISPUTE',
        'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
        'PAYMENT_DUNNING_RECEIVED',
        'PAYMENT_DUNNING_REQUESTED',
        'PAYMENT_BANK_SLIP_VIEWED',
        'PAYMENT_CHECKOUT_VIEWED'
      ])

      return NextResponse.json({
        success: true,
        webhook,
        message: 'Webhook configurado com sucesso'
      })
    }

    if (action === 'list') {
      // Listar webhooks existentes
      const webhooks = await asaasAPI.listWebhooks()
      return NextResponse.json({
        success: true,
        webhooks
      })
    }

    return NextResponse.json({
      error: 'Ação não especificada. Use ?action=setup ou ?action=list'
    }, { status: 400 })

  } catch (error) {
    console.error('Erro ao configurar webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
