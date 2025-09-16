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

  // TODO: Comentado temporariamente - voltar quando conta Asaas estiver funcionando
  // Gerar pagamento PIX
  // const generatePayment = async () => {
  //   
  //   if (!cpf || cpf.length < 11) {
  //     toast({
  //       title: 'Erro',
  //       description: 'Por favor, informe um CPF válido',
  //       variant: 'destructive'
  //     })
  //     return
  //   }

  //   setIsLoading(true)
  //   try {
  //     const requestBody = {
  //       amount: 100,
  //       method: 'PIX',
  //       cpf: cpf.replace(/\D/g, ''),
  //       description: isRenewal ? 'TaPago - Renovação de Assinatura' : 'TaPago - Acesso ao Sistema'
  //     }
  //        
  //     // Usar API de renovação se for renovação, senão usar API normal
  //     const apiEndpoint = isRenewal ? '/api/subscription/renew' : '/api/payment/asaas/create'
  //     
  //     const response = await fetch(apiEndpoint, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(requestBody)
  //     })

  //     if (response.ok) {
  //       const data = await response.json()
  //       // Usar os dados da API Asaas diretamente
  //       setPaymentData(data.payment)
  //       toast({
  //         title: 'Sucesso',
  //         description: 'Pagamento PIX gerado com sucesso!'
  //       })
  //     } else {
  //       const error = await response.json()
  //       toast({
  //         title: 'Erro',
  //         description: error.error || 'Erro ao gerar pagamento',
  //         variant: 'destructive'
  //       })
  //     }
  //   } catch (error) {
  //     toast({
  //       title: 'Erro',
  //       description: 'Erro ao gerar pagamento. Tente novamente.',
  //       variant: 'destructive'
  //     })
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  // TODO: Comentado temporariamente - voltar quando conta Asaas estiver funcionando
  // Verificar status do pagamento
  // const checkPaymentStatus = async () => {
  //   if (!paymentData?.id) return

  //   setIsCheckingPayment(true)
  //   try {
  //     const response = await fetch(`/api/payment/asaas/status`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         paymentId: paymentData.id
  //       })
  //     })

  //     if (response.ok) {
  //       const data = await response.json()
  //       if (data.status === 'APPROVED' || data.status === 'RECEIVED') {
  //         toast({
  //           title: 'Pagamento Confirmado!',
  //           description: 'Seu acesso foi liberado com sucesso!'
  //         })
  //         onPaymentSuccess()
  //       } else {
  //         toast({
  //           title: 'Pagamento Pendente',
  //           description: 'Aguardando confirmação do pagamento...'
  //         })
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Erro ao verificar pagamento:', error)
  //   } finally {
  //     setIsCheckingPayment(false)
  //   }
  // }

  // TODO: Comentado temporariamente - voltar quando conta Asaas estiver funcionando
  // Verificar pagamento automaticamente a cada 10 segundos
  // useEffect(() => {
  //   if (paymentData?.id && paymentData.status === 'PENDING') {
  //     const interval = setInterval(checkPaymentStatus, 10000)
  //     return () => clearInterval(interval)
  //   }
  // }, [paymentData])

  // TODO: Comentado temporariamente - voltar quando conta Asaas estiver funcionando
  // const formatCPF = (value: string) => {
  //   const numbers = value.replace(/\D/g, '')
  //   return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  // }

  // const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const formatted = formatCPF(e.target.value)
  //   setCpf(formatted)
  // }

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

        <div className="space-y-4">
          {/* Aviso sobre pagamento via WhatsApp */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-orange-100 rounded-full">
                <MessageCircle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Pagamento via WhatsApp
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Para realizar o pagamento e liberar seu acesso, entre em contato conosco pelo WhatsApp.
                Nossa equipe irá te ajudar com o processo de pagamento.
              </p>
            </div>

            {/* Botão principal do WhatsApp */}
            <Button
              onClick={handleWhatsAppSupport}
              size="lg"
              className="w-full bg-green-500 hover:bg-green-600 text-white text-base font-medium py-3"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Falar no WhatsApp - (12) 3197-4950
            </Button>
          </div>

          {/* Informações importantes */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Como funciona:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Clique no botão acima para abrir o WhatsApp</li>
                  <li>• Informe que deseja fazer o pagamento do TaPago</li>
                  <li>• Nossa equipe irá te orientar sobre o pagamento</li>
                  <li>• Após o pagamento, seu acesso será liberado imediatamente</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <MessageCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Horário de Atendimento:</p>
                <p className="text-xs">Segunda a Sexta: 8h às 18h</p>
                <p className="text-xs">Sábado: 8h às 12h</p>
              </div>
            </div>
          </div>

          {/* Botão de cancelar */}
          <div className="flex justify-center pt-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="text-sm"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
