'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Clock, AlertTriangle, CheckCircle, CreditCard } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import { PaymentGatewayModal } from '@/components/payment-gateway-modal'

interface SubscriptionInfo {
  isActive: boolean
  expiresAt: string | null
  daysUntilExpiry: number
  isExpired: boolean
  isExpiringSoon: boolean
  lastPaymentDate: string | null
  nextPaymentDue: string | null
  statusMessage: string
  lastPayment?: {
    amount: number
    approvedAt: string
    subscriptionPeriod: string
  }
}

export function SubscriptionStatus() {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionInfo(data.subscription)
      }
    } catch (error) {
      console.error('Erro ao buscar status da assinatura:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false)
    fetchSubscriptionStatus() // Recarregar status
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscriptionInfo) {
    return null
  }

  const getStatusIcon = () => {
    if (subscriptionInfo.isExpired) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />
    }
    if (subscriptionInfo.isExpiringSoon) {
      return <Clock className="h-5 w-5 text-orange-500" />
    }
    if (subscriptionInfo.isActive) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    return <AlertTriangle className="h-5 w-5 text-gray-500" />
  }

  const getStatusBadge = () => {
    if (subscriptionInfo.isExpired) {
      return <Badge variant="destructive">Expirada</Badge>
    }
    if (subscriptionInfo.isExpiringSoon) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Expirando</Badge>
    }
    if (subscriptionInfo.isActive) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Ativa</Badge>
    }
    return <Badge variant="outline">Inativa</Badge>
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Status da Assinatura
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            {subscriptionInfo.statusMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionInfo.expiresAt && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                {subscriptionInfo.isExpired ? 'Expirou em' : 'Expira em'}: 
              </span>
              <span className="font-medium">
                {formatDate(subscriptionInfo.expiresAt)}
              </span>
            </div>
          )}

          {subscriptionInfo.lastPayment && (
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Último pagamento:</span>
              <span className="font-medium">
                R$ {subscriptionInfo.lastPayment.amount.toFixed(2)} em {formatDate(subscriptionInfo.lastPayment.approvedAt)}
              </span>
            </div>
          )}

          {(subscriptionInfo.isExpired || subscriptionInfo.isExpiringSoon) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {subscriptionInfo.isExpired 
                  ? 'Sua assinatura expirou. Renove agora para continuar usando o sistema.'
                  : `Sua assinatura expira em ${subscriptionInfo.daysUntilExpiry} dias. Renove para não perder o acesso.`
                }
              </AlertDescription>
            </Alert>
          )}

          {(subscriptionInfo.isExpired || subscriptionInfo.isExpiringSoon) && (
            <Button 
              onClick={() => setShowPaymentModal(true)}
              className="w-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {subscriptionInfo.isExpired ? 'Renovar Assinatura' : 'Renovar Agora'}
            </Button>
          )}
        </CardContent>
      </Card>

      <PaymentGatewayModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        isRenewal={true}
        subscriptionInfo={{
          isExpired: subscriptionInfo.isExpired,
          isExpiringSoon: subscriptionInfo.isExpiringSoon,
          daysUntilExpiry: subscriptionInfo.daysUntilExpiry,
          expiresAt: subscriptionInfo.expiresAt
        }}
      />
    </>
  )
}
