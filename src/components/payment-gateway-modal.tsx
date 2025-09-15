'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CreditCard, CheckCircle, AlertCircle, Calendar, Clock, MessageCircle } from 'lucide-react'
import QRCode from 'qrcode.react'
import { formatDate } from '@/lib/date-utils'

interface PaymentGatewayModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentSuccess: () => void
  isRenewal?: boolean
  subscriptionInfo?: {
    isExpired: boolean
    isExpiringSoon: boolean
    daysUntilExpiry: number
    expiresAt: string | null
  }
}

export function PaymentGatewayModal({ isOpen, onClose, onPaymentSuccess, isRenewal = false, subscriptionInfo }: PaymentGatewayModalProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<{
    id: string
    amount: number
    pixQrCode: string
    pixPayload: string
    dueDate: string
    status: string
  } | null>(null)
  const [cpf, setCpf] = useState('')
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)

  // Gerar pagamento PIX
  const generatePayment = async () => {
    
    if (!cpf || cpf.length < 11) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe um CPF válido',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      const requestBody = {
        amount: 100,
        method: 'PIX',
        cpf: cpf.replace(/\D/g, ''),
        description: isRenewal ? 'TaPago - Renovação de Assinatura' : 'TaPago - Acesso ao Sistema'
      }
         
      // Usar API de renovação se for renovação, senão usar API normal
      const apiEndpoint = isRenewal ? '/api/subscription/renew' : '/api/payment/asaas/create'
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        // Usar os dados da API Asaas diretamente
        setPaymentData(data.payment)
        toast({
          title: 'Sucesso',
          description: 'Pagamento PIX gerado com sucesso!'
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao gerar pagamento',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar pagamento. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar status do pagamento
  const checkPaymentStatus = async () => {
    if (!paymentData?.id) return

    setIsCheckingPayment(true)
    try {
      const response = await fetch(`/api/payment/asaas/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: paymentData.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === 'APPROVED' || data.status === 'RECEIVED') {
          toast({
            title: 'Pagamento Confirmado!',
            description: 'Seu acesso foi liberado com sucesso!'
          })
          onPaymentSuccess()
        } else {
          toast({
            title: 'Pagamento Pendente',
            description: 'Aguardando confirmação do pagamento...'
          })
        }
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)
    } finally {
      setIsCheckingPayment(false)
    }
  }

  // Verificar pagamento automaticamente a cada 10 segundos
  useEffect(() => {
    if (paymentData?.id && paymentData.status === 'PENDING') {
      const interval = setInterval(checkPaymentStatus, 10000)
      return () => clearInterval(interval)
    }
  }, [paymentData])

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setCpf(formatted)
  }

  const handleWhatsAppSupport = () => {
    const phoneNumber = '551231974950' // Número com código do país (55) + DDD (12) + número
    const message = encodeURIComponent('Olá! Estou com problemas no pagamento da licença do Tapago. Preciso de ajuda!')
    const url = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(url, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            {isRenewal ? 'Renovação de Assinatura' : 'Acesso ao Sistema TaPago'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isRenewal ? (
              <div className="space-y-1">
                <p>Renove sua assinatura para continuar usando o sistema.</p>
                {subscriptionInfo && (
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3 w-3" />
                    {subscriptionInfo.isExpired ? (
                      <span className="text-red-600 font-medium">Assinatura expirada</span>
                    ) : subscriptionInfo.isExpiringSoon ? (
                      <span className="text-orange-600 font-medium">
                        Expira em {subscriptionInfo.daysUntilExpiry} dias
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium">
                        Válida até {subscriptionInfo.expiresAt ? formatDate(subscriptionInfo.expiresAt) : 'N/A'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              'Para acessar todas as funcionalidades, realize o pagamento da mensalidade.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {!paymentData ? (
            // Formulário de CPF
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-sm">CPF</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  maxLength={14}
                  className="text-sm"
                />
              </div>
              
              <Button 
                onClick={generatePayment} 
                disabled={isLoading || cpf.length < 14}
                className="w-full h-10 text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando Pagamento...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Gerar Pagamento PIX
                  </>
                )}
              </Button>
            </div>
          ) : (
            // QR Code e dados do pagamento
            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg">Pagamento PIX</CardTitle>
                  <CardDescription className="text-sm">
                    Escaneie o QR Code ou copie o código PIX
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <div className="inline-block p-2 sm:p-4 bg-white rounded-lg border">
                      {paymentData.pixQrCode && (
                        <QRCode 
                          value={paymentData.pixPayload} 
                          size={window.innerWidth < 640 ? 150 : 200}
                          level="M"
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Código PIX (Copiar e Colar)</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={paymentData.pixPayload} 
                        readOnly 
                        className="font-mono text-xs"
                      />
                      <Button 
                        size="sm" 
                        onClick={() => {
                          navigator.clipboard.writeText(paymentData.pixPayload)
                          toast({
                            title: 'Copiado!',
                            description: 'Código PIX copiado para a área de transferência'
                          })
                        }}
                        className="text-xs px-3"
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      R$ {paymentData.amount.toFixed(2)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      Vencimento: {new Date(paymentData.dueDate).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={checkPaymentStatus} 
                      disabled={isCheckingPayment}
                      className="flex-1 h-9 text-sm"
                    >
                      {isCheckingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-3 w-3" />
                          Verificar Pagamento
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setPaymentData(null)}
                      className="h-9 text-sm px-4"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-0.5" />
                  <div className="text-xs sm:text-sm text-blue-800">
                    <strong>Importante:</strong> Após realizar o pagamento, clique em "Verificar Pagamento" 
                    ou aguarde a confirmação automática. Seu acesso será liberado imediatamente.
                  </div>
                </div>

                {/* Suporte WhatsApp */}
                <div className="flex items-start gap-2 p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs sm:text-sm text-green-800 mb-1 sm:mb-2">
                      <strong>Dúvidas?</strong> Precisa de ajuda com o pagamento? Chame no WhatsApp!
                    </div>
                    <Button
                      onClick={handleWhatsAppSupport}
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white text-xs h-7 px-2"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      (12) 3197-4950
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
