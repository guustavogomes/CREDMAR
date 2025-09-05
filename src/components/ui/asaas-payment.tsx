'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QrCode, Copy, Check, CreditCard, FileText, Smartphone, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AsaasPaymentProps {
  valor?: number
  onPaymentCreated?: (payment: any) => void
  onPaymentStatusChange?: (status: string) => void
  customerData?: any
}

interface PaymentData {
  id: string
  amount: number
  method: string
  status: string
  description: string
  month: string
  asaasPaymentId: string
  pixQrCode?: string
  pixPayload?: string
  dueDate?: string
  netValue?: number
  originalValue?: number
  interestValue?: number
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

export function AsaasPayment({ valor = 100, onPaymentCreated, onPaymentStatusChange, customerData }: AsaasPaymentProps) {
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [method, setMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX')
  const { toast } = useToast()

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (payment && payment.status === 'PENDING') {
      const interval = setInterval(async () => {
        await checkPaymentStatus()
      }, 10000) // Verificar a cada 10 segundos

      return () => clearInterval(interval)
    }
  }, [payment])

  const createPayment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/payment/asaas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: valor,
          method: method,
          description: `TaPago - Mensalidade ${new Date().toISOString().slice(0, 7)}`,
          customerData: customerData
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar pagamento')
      }

      setPayment(data.payment)
      onPaymentCreated?.(data.payment)
      
      toast({
        title: "Pagamento criado!",
        description: "Seu pagamento foi criado com sucesso. Use o QR Code ou copie o código PIX.",
      })
    } catch (error) {
      console.error('Erro ao criar pagamento:', error)
      toast({
        title: "Erro ao criar pagamento",
        description: error instanceof Error ? error.message : "Erro interno do servidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (!payment) return

    try {
      const response = await fetch('/api/payment/asaas/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id
        }),
      })

      const data = await response.json()

      if (response.ok && data.payment) {
        const newStatus = data.payment.status
        if (newStatus !== payment.status) {
          setPayment(data.payment)
          onPaymentStatusChange?.(newStatus)
          
          if (newStatus === 'APPROVED') {
            toast({
              title: "Pagamento aprovado!",
              description: "Seu pagamento foi confirmado e sua conta foi ativada.",
            })
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência.",
      })
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Aprovado'
      case 'REJECTED':
        return 'Rejeitado'
      case 'PENDING':
        return 'Pendente'
      default:
        return 'Desconhecido'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!payment) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Pagamento TaPago
          </CardTitle>
          <CardDescription>
            Escolha a forma de pagamento e crie sua cobrança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor</label>
            <div className="text-2xl font-bold text-green-600">
              R$ {valor.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Forma de Pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={method === 'PIX' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMethod('PIX')}
                className="flex items-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                PIX
              </Button>
              <Button
                variant={method === 'CREDIT_CARD' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMethod('CREDIT_CARD')}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Cartão
              </Button>
            </div>
          </div>

          <Button
            onClick={createPayment}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Criando pagamento...' : 'Criar Pagamento'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Pagamento TaPago
          </span>
          <Badge className={getStatusColor(payment.status)}>
            <span className="flex items-center gap-1">
              {getStatusIcon(payment.status)}
              {getStatusText(payment.status)}
            </span>
          </Badge>
        </CardTitle>
        <CardDescription>
          {payment.method === 'PIX' && 'Escaneie o QR Code ou copie o código PIX'}
          {payment.method === 'CREDIT_CARD' && 'Use o link de pagamento com cartão'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Valor</label>
          <div className="text-2xl font-bold text-green-600">
            R$ {payment.amount.toFixed(2).replace('.', ',')}
          </div>
        </div>

        {payment.method === 'PIX' && payment.pixQrCode && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                <img
                  src={payment.pixQrCode}
                  alt="QR Code PIX"
                  className="w-48 h-48"
                />
              </div>
            </div>

            {payment.pixPayload && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Código PIX</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={payment.pixPayload}
                    readOnly
                    className="flex-1 p-2 border rounded-md text-xs font-mono bg-gray-50"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(payment.pixPayload!)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {payment.dueDate && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Vencimento</label>
            <div className="text-sm text-gray-600">
              {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
            </div>
          </div>
        )}

        {payment.status === 'PENDING' && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              Aguardando confirmação do pagamento. Verificamos automaticamente a cada 10 segundos.
            </p>
          </div>
        )}

        {payment.status === 'APPROVED' && (
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-800">
              Pagamento confirmado! Sua conta foi ativada com sucesso.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={checkPaymentStatus}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Verificar Status'}
          </Button>
          <Button
            onClick={() => setPayment(null)}
            variant="outline"
            className="flex-1"
          >
            Novo Pagamento
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
