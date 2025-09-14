import { db } from '@/lib/db'
import { PAYMENT_CONFIG } from '@/lib/payment-config'
import { addDays, format, isAfter, isBefore, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Utilitários para gerenciar assinaturas mensais
 */

export interface SubscriptionInfo {
  isActive: boolean
  expiresAt: Date | null
  daysUntilExpiry: number
  isExpired: boolean
  isExpiringSoon: boolean // Expira em 7 dias ou menos
  lastPaymentDate: Date | null
  nextPaymentDue: Date | null
}

/**
 * Calcula informações da assinatura do usuário
 */
export function calculateSubscriptionInfo(
  subscriptionExpiresAt: Date | null,
  lastPaymentDate: Date | null
): SubscriptionInfo {
  const now = new Date()
  const expiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null
  
  const daysUntilExpiry = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
  
  return {
    isActive: expiresAt ? isAfter(expiresAt, now) : false,
    expiresAt,
    daysUntilExpiry: Math.max(0, daysUntilExpiry),
    isExpired: expiresAt ? isBefore(expiresAt, now) : true,
    isExpiringSoon: daysUntilExpiry <= 7 && daysUntilExpiry > 0,
    lastPaymentDate: lastPaymentDate ? new Date(lastPaymentDate) : null,
    nextPaymentDue: expiresAt ? new Date(expiresAt) : null
  }
}

/**
 * Estende a assinatura por 30 dias a partir da data de pagamento
 */
export function extendSubscriptionBy30Days(paymentDate: Date = new Date()): Date {
  return addDays(paymentDate, 30)
}

/**
 * Gera o período da assinatura no formato YYYY-MM
 */
export function generateSubscriptionPeriod(date: Date = new Date()): string {
  return format(date, 'yyyy-MM')
}

/**
 * Verifica se o usuário precisa renovar a assinatura
 */
export function needsSubscriptionRenewal(subscriptionInfo: SubscriptionInfo): boolean {
  return subscriptionInfo.isExpired || subscriptionInfo.isExpiringSoon
}

/**
 * Atualiza a assinatura do usuário após pagamento aprovado
 */
export async function updateUserSubscription(
  userId: string,
  paymentDate: Date = new Date()
): Promise<void> {
  const newExpiryDate = extendSubscriptionBy30Days(paymentDate)
  const subscriptionPeriod = generateSubscriptionPeriod(paymentDate)
  
  await db.user.update({
    where: { id: userId },
    data: {
      subscriptionExpiresAt: newExpiryDate,
      lastPaymentDate: paymentDate,
      status: 'ACTIVE'
    }
  })
  
  // Atualizar o pagamento com informações de assinatura
  await db.payment.updateMany({
    where: {
      userId,
      status: 'APPROVED',
      approvedAt: {
        gte: subDays(paymentDate, 1) // Pagamentos aprovados nas últimas 24h
      }
    },
    data: {
      isSubscriptionPayment: true,
      subscriptionPeriod
    }
  })
}

/**
 * Suspende usuários com assinatura expirada
 */
export async function suspendExpiredSubscriptions(): Promise<number> {
  const now = new Date()
  
  const result = await db.user.updateMany({
    where: {
      status: 'ACTIVE',
      subscriptionExpiresAt: {
        lt: now
      }
    },
    data: {
      status: 'SUSPENDED'
    }
  })
  
  return result.count
}

/**
 * Busca usuários com assinatura expirando em breve
 */
export async function getUsersWithExpiringSubscriptions(daysAhead: number = 7) {
  const futureDate = addDays(new Date(), daysAhead)
  
  return await db.user.findMany({
    where: {
      status: 'ACTIVE',
      subscriptionExpiresAt: {
        lte: futureDate,
        gte: new Date()
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      subscriptionExpiresAt: true,
      lastPaymentDate: true
    }
  })
}

/**
 * Formata a data de vencimento para exibição
 */
export function formatExpiryDate(date: Date | null): string {
  if (!date) return 'Não definida'
  
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

/**
 * Gera mensagem de status da assinatura
 */
export function getSubscriptionStatusMessage(subscriptionInfo: SubscriptionInfo): string {
  if (subscriptionInfo.isExpired) {
    return 'Sua assinatura expirou. Renove para continuar usando o sistema.'
  }
  
  if (subscriptionInfo.isExpiringSoon) {
    return `Sua assinatura expira em ${subscriptionInfo.daysUntilExpiry} dias. Renove agora para não perder o acesso.`
  }
  
  if (subscriptionInfo.isActive) {
    return `Sua assinatura está ativa até ${formatExpiryDate(subscriptionInfo.expiresAt)}.`
  }
  
  return 'Assinatura não ativa.'
}
